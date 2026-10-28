/**
 * CABECERAS: recorre el sitio compilado con las cabeceras de seguridad de
 * `public/_headers` puestas, como lo servirá Cloudflare Pages en el dominio
 * propio, y cuenta lo que la política de contenido (CSP) bloquea. GitHub Pages
 * ignora ese fichero y ninguna otra auditoría lo aplica, así que un script,
 * una fuente o una conexión nueva fuera de la lista se vería bien en todas
 * partes y fallaría por primera vez el día del lanzamiento, en público.
 *
 * Aplica las cabeceras del bloque `/*` a todas las respuestas, abre cada
 * página del export (más la 404) en los dos temas, recorre las pestañas de la
 * demo y escucha el evento `securitypolicyviolation` y la consola. Así mide a
 * la vez la política de cabecera (dominio propio) y la de la `<meta>` de cada
 * página (la única que tiene GitHub Pages): el navegador aplica las dos. Si la
 * compilación lleva clave de Turnstile, empieza a rellenar /beta para que se
 * cargue el widget. Falla si `_headers` no declara una CSP o si alguna página
 * dispara un bloqueo.
 *
 * Uso:  node scripts/cabeceras.mjs --serve out
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, normalize, relative } from "node:path";

const args = process.argv.slice(2);
const i = args.indexOf("--serve");
const RAIZ = i >= 0 && args[i + 1] ? args[i + 1] : "out";
const PREFIJO = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

if (!existsSync(join(RAIZ, "_headers"))) {
  console.log(`[cabeceras] no encuentro ${RAIZ}/_headers. ¿Falta compilar el sitio?`);
  process.exit(1);
}

/** Cabeceras del bloque `/*`: líneas sangradas «Nombre: valor», sin comentarios. */
function cabecerasGenerales(texto) {
  const cabeceras = {};
  let enBloque = false;
  for (const linea of texto.split("\n")) {
    if (/^\S/.test(linea) && !linea.startsWith("#")) {
      enBloque = linea.trim() === "/*";
      continue;
    }
    const m = enBloque && linea.match(/^\s+([A-Za-z-]+):\s*(.+?)\s*$/);
    if (m) cabeceras[m[1]] = m[2];
  }
  return cabeceras;
}

const CABECERAS = cabecerasGenerales(readFileSync(join(RAIZ, "_headers"), "utf8"));
if (!CABECERAS["Content-Security-Policy"]) {
  console.log("[cabeceras] FALLO — `_headers` no declara Content-Security-Policy para /*");
  process.exit(1);
}

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

function fichero(ruta) {
  let pedida = decodeURIComponent(ruta.split("?")[0]);
  if (PREFIJO && (pedida === PREFIJO || pedida.startsWith(`${PREFIJO}/`))) {
    pedida = pedida.slice(PREFIJO.length) || "/";
  }
  const limpia = normalize(pedida).replace(/^(\.\.[/\\])+/, "");
  for (const c of [join(RAIZ, limpia), join(RAIZ, limpia, "index.html")]) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

const servidor = createServer((req, res) => {
  const f = fichero(req.url || "/");
  const destino = f ?? join(RAIZ, "404.html");
  res.writeHead(f ? 200 : 404, {
    ...CABECERAS,
    "content-type": TIPOS[extname(destino).toLowerCase()] || "application/octet-stream",
  });
  res.end(readFileSync(destino));
});
await new Promise((ok) => servidor.listen(0, "127.0.0.1", ok));
const BASE = `http://127.0.0.1:${servidor.address().port}${PREFIJO}`;

const paginas = [];
(function recorrer(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory() && e.name !== "_next") recorrer(join(dir, e.name));
    else if (e.name === "index.html") {
      const r = relative(RAIZ, dir).replace(/\\/g, "/");
      paginas.push(r ? `/${r}/` : "/");
    }
  }
})(RAIZ);
paginas.push("/no-existe/");

const TURNSTILE = /challenges\.cloudflare\.com/.test(CABECERAS["Content-Security-Policy"]);
const TEMAS = ["light", "dark"];
const cola = TEMAS.flatMap((tema) => paginas.map((ruta) => [ruta, tema]));

const navegador = await chromium.launch();
const bloqueos = [];
let siguiente = 0;
let demoRecorrida = 0;
let turnstileCargado = false;

await Promise.all(
  Array.from({ length: 6 }, async () => {
    const contextos = {};
    for (const tema of TEMAS) {
      const ctx = (contextos[tema] = await navegador.newContext({ colorScheme: tema }));
      await ctx.addInitScript((t) => {
        try {
          localStorage.setItem("tj-theme", t);
        } catch {}
        document.addEventListener("securitypolicyviolation", (e) => {
          (window.__bloqueos ??= []).push(`${e.violatedDirective} ${e.blockedURI}`);
        });
      }, tema);
    }
    while (siguiente < cola.length) {
      const [ruta, tema] = cola[siguiente++];
      const pagina = await contextos[tema].newPage();
      const errores = [];
      pagina.on("pageerror", (e) => errores.push(`error de JavaScript: ${e.message.slice(0, 120)}`));
      pagina.on("console", (m) => {
        if (/Content.Security.Policy|Refused to|Permissions.Policy/i.test(m.text())) errores.push(`consola: ${m.text().slice(0, 160)}`);
      });
      await pagina.goto(BASE + ruta, { waitUntil: "networkidle" });
      const temaPintado = await pagina.evaluate(() => document.documentElement.dataset.theme);
      if (temaPintado !== tema) errores.push(`se pidió el tema ${tema} y la página pinta ${temaPintado}`);
      if (TURNSTILE && /^\/beta\/$/.test(ruta)) {
        // El widget solo se carga al empezar a rellenar el formulario.
        await pagina.focus("form input:not([type=hidden])").catch(() => errores.push("/beta sin campos que enfocar"));
        turnstileCargado ||= await pagina
          .waitForSelector('iframe[src*="challenges.cloudflare.com"]', { state: "attached", timeout: 15000 })
          .then(() => pagina.waitForTimeout(2000))
          .then(() => true, () => false);
      }
      if (/\/demo\/$/.test(ruta)) {
        // La demo monta sus pestañas al hidratar; sin ellas no se ha recorrido nada.
        await pagina
          .waitForSelector('[role="tab"]', { timeout: 15000 })
          .catch(() => errores.push("la demo no llegó a montar sus pestañas"));
        const pestanas = await pagina.$$('[role="tab"]');
        let abiertas = 0;
        for (const pestana of pestanas) {
          try {
            await pestana.click({ timeout: 1000 });
            abiertas++;
          } catch (e) {
            errores.push(`pestaña de la demo sin abrir: ${String(e).split("\n")[0].slice(0, 120)}`);
          }
        }
        demoRecorrida += abiertas;
        if (abiertas < pestanas.length) {
          errores.push(`la demo tiene ${pestanas.length} pestañas y solo se abrieron ${abiertas}`);
        }
        await pagina.waitForTimeout(300);
      }
      const vistos = await pagina.evaluate(() => window.__bloqueos ?? []);
      for (const b of [...new Set([...vistos, ...errores])]) bloqueos.push(`${ruta} (${tema})  ${b}`);
      await pagina.close();
    }
    for (const ctx of Object.values(contextos)) await ctx.close();
  }),
);
await navegador.close();
servidor.close();

console.log(
  `[cabeceras] ${paginas.length} páginas × ${TEMAS.length} temas con ${Object.keys(CABECERAS).length} cabeceras de _headers y la política de cada página; ${demoRecorrida} pestañas de la demo abiertas`,
);
if (TURNSTILE) {
  console.log(
    turnstileCargado
      ? "[cabeceras] Turnstile cargado en /beta y medido"
      : "[cabeceras] aviso — Turnstile no llegó a cargar en /beta (¿sin red?): no queda medido",
  );
}
if (demoRecorrida === 0) bloqueos.push("(demo)  no se abrió ninguna pestaña de la demo");
if (bloqueos.length) {
  console.log(`[cabeceras] FALLO — ${bloqueos.length} bloqueo(s) de la política de contenido:`);
  for (const b of bloqueos.slice(0, 40)) console.log(`   ${b}`);
  process.exit(1);
}
console.log("[cabeceras] correcto — la política de contenido no bloquea nada que el sitio use");
