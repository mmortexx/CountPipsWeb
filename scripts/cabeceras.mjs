/**
 * CABECERAS: recorre el sitio compilado con las cabeceras de seguridad de
 * `public/_headers` puestas, como lo servirá Cloudflare Pages en el dominio
 * propio, y cuenta lo que la política de contenido (CSP) bloquea. GitHub Pages
 * ignora ese fichero y ninguna otra auditoría lo aplica, así que un script,
 * una fuente o una conexión nueva fuera de la lista se vería bien en todas
 * partes y fallaría por primera vez el día del lanzamiento, en público.
 *
 * Aplica las cabeceras del bloque `/*` a todas las respuestas, abre cada
 * página del export (más la 404), recorre las pestañas de la demo y escucha el
 * evento `securitypolicyviolation` del navegador. Falla si `_headers` no
 * declara una CSP o si alguna página dispara un bloqueo. No mide lo que solo
 * carga con claves de producción (PostHog, Turnstile): el CI compila sin ellas.
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

const navegador = await chromium.launch();
const bloqueos = [];
let siguiente = 0;
let demoRecorrida = 0;

await Promise.all(
  Array.from({ length: 6 }, async () => {
    const ctx = await navegador.newContext();
    await ctx.addInitScript(() => {
      document.addEventListener("securitypolicyviolation", (e) => {
        (window.__bloqueos ??= []).push(`${e.violatedDirective} ${e.blockedURI}`);
      });
    });
    while (siguiente < paginas.length) {
      const ruta = paginas[siguiente++];
      const pagina = await ctx.newPage();
      const errores = [];
      pagina.on("pageerror", (e) => errores.push(`error de JavaScript: ${e.message.slice(0, 120)}`));
      await pagina.goto(BASE + ruta, { waitUntil: "networkidle" });
      if (/\/demo\/$/.test(ruta)) {
        for (const pestana of await pagina.$$('[role="tab"]')) {
          await pestana.click({ timeout: 1000 }).catch(() => {});
          demoRecorrida++;
        }
        await pagina.waitForTimeout(300);
      }
      const vistos = await pagina.evaluate(() => window.__bloqueos ?? []);
      for (const b of [...new Set([...vistos, ...errores])]) bloqueos.push(`${ruta}  ${b}`);
      await pagina.close();
    }
    await ctx.close();
  }),
);
await navegador.close();
servidor.close();

console.log(
  `[cabeceras] ${paginas.length} páginas con ${Object.keys(CABECERAS).length} cabeceras de _headers; ${demoRecorrida} pestañas de la demo abiertas`,
);
if (bloqueos.length) {
  console.log(`[cabeceras] FALLO — ${bloqueos.length} bloqueo(s) de la política de contenido:`);
  for (const b of bloqueos.slice(0, 40)) console.log(`   ${b}`);
  process.exit(1);
}
console.log("[cabeceras] correcto — la política de contenido no bloquea nada que el sitio use");
