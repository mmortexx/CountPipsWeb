/**
 * ANUNCIOS — lo que cambia en pantalla, ¿lo oye quien no la ve?
 *
 * ── Qué mide ──────────────────────────────────────────────────────────
 * Las cinco herramientas del sitio recalculan mientras se teclea. Quien
 * usa un lector de pantalla no ve ese cambio: si no está dentro de una
 * región que el lector anuncie, teclea sus datos y no se entera de que
 * el resultado ya está ahí. Es el criterio 4.1.3 de WCAG, y no lo caza
 * ninguna revisión visual porque en pantalla todo se ve bien.
 *
 * ── Qué encontró el día que se escribió (2026-09-20) ──────────────────
 * Las cinco calladas. Al tocar una entrada cambiaban entre 6 y 19 líneas
 * de texto, y ninguna estaba dentro de una región viva. La calculadora
 * de riesgo anunciaba el error de validación —`role="alert"`— pero no el
 * número, que es a lo que se va.
 *
 * ── Las tres cosas que comprueba, y por qué las tres ──────────────────
 *  1. Que al tocar una entrada el resultado acabe dicho en una región
 *     viva. Es el fallo original.
 *  2. Que al CARGAR la página esa región esté vacía. Un `role="status"`
 *     que nace con texto dentro lo leen algunos lectores nada más
 *     entrar, por encima del titular, sin que nadie haya hecho nada.
 *  3. Que el anuncio use la convención numérica de SU idioma. Es texto
 *     que se genera en el navegador, así que `cifras.mjs` —que lee el
 *     HTML compilado— no lo ve: aquí se escribiría «$1,234.50» en la
 *     página española sin que nada lo denunciara.
 *
 * ── Por qué el retardo, y por qué hay que esperarlo ───────────────────
 * El anuncio se publica ~700 ms después del último cambio, a propósito:
 * React repinta en cada tecla y un `aria-live` directo dispararía una
 * lectura por pulsación. Esta guarda espera más que ese retardo; si
 * alguien lo sube en `ResultadoAnunciado`, hay que subirlo también aquí
 * o esto empezará a fallar sin que nada esté roto.
 *
 * Uso:  node scripts/anuncios.mjs --serve out
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, extname } from "node:path";

const dir = process.argv.slice(2).find((a) => !a.startsWith("-")) || "out";
if (!existsSync(dir)) {
  console.log(`[anuncios] no encuentro el directorio «${dir}». ¿Falta compilar el sitio con \`npm run build\`?`);
  process.exit(1);
}
const PREFIJO = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** Más que el retardo de `ResultadoAnunciado`, con margen. */
const ESPERA = 1400;

const HERRAMIENTAS = [
  "herramientas/calculadora-de-riesgo",
  "herramientas/significancia-estadistica",
  "herramientas/monte-carlo",
  "herramientas/proyector-de-capital",
  "herramientas/coste-de-indisciplina",
];

const TIPOS = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
  ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".avif": "image/avif",
  ".woff2": "font/woff2", ".json": "application/json", ".txt": "text/plain",
  ".xml": "application/xml", ".ico": "image/x-icon",
};

async function servir(raiz) {
  const server = createServer(async (req, res) => {
    try {
      let ruta = decodeURIComponent((req.url || "/").split("?")[0]);
      if (PREFIJO && ruta.startsWith(PREFIJO)) ruta = ruta.slice(PREFIJO.length) || "/";
      let fichero = join(raiz, ruta);
      try {
        if ((await stat(fichero)).isDirectory()) fichero = join(fichero, "index.html");
      } catch {
        fichero = extname(fichero) ? fichero : `${fichero}.html`;
      }
      const cuerpo = await readFile(fichero);
      res.writeHead(200, { "content-type": TIPOS[extname(fichero)] || "application/octet-stream" });
      res.end(cuerpo);
    } catch {
      res.writeHead(404).end("no está");
    }
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return { server, base: `http://127.0.0.1:${server.address().port}${PREFIJO}` };
}

const { server, base } = await servir(dir);
const navegador = await chromium.launch();

const fallos = [];
let conAnuncio = 0;
let sinCambios = 0;

for (const herramienta of HERRAMIENTAS) {
  for (const idioma of ["es", "en"]) {
    const ruta = `/${idioma === "en" ? "en/" : ""}${herramienta}/`;
    const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
    const p = await ctx.newPage();
    try {
      await p.goto(base + ruta, { waitUntil: "load", timeout: 30000 });
    } catch {
      fallos.push({ ruta, detalle: "la página no cargó: la guarda no pudo medirla" });
      await ctx.close();
      continue;
    }
    await p.waitForTimeout(ESPERA);

    /* (2) Recién cargada, la región no puede estar diciendo nada. */
    const alCargar = await p.evaluate(() =>
      [...document.querySelectorAll('[role="status"], [aria-live="polite"]')]
        .map((e) => (e.textContent || "").trim())
        .filter(Boolean),
    );
    if (alCargar.length) {
      fallos.push({ ruta, detalle: `habla sola al cargar, sin que nadie toque nada: «${alCargar[0].slice(0, 60)}»` });
    }

    const antes = await p.evaluate(() => document.body.innerText);

    const campo = p.locator('input[type="number"], input[type="range"]').first();
    if (!(await campo.count())) {
      fallos.push({ ruta, detalle: "no encontré ninguna entrada que tocar: ¿cambió la herramienta?" });
      await ctx.close();
      continue;
    }
    if ((await campo.getAttribute("type")) === "range") {
      await campo.focus();
      for (let i = 0; i < 6; i++) await p.keyboard.press("ArrowRight");
    } else {
      await campo.fill("123");
    }
    await p.waitForTimeout(ESPERA);

    const r = await p.evaluate(() => ({
      vivos: [...document.querySelectorAll('[role="status"], [aria-live="polite"]')]
        .map((e) => (e.textContent || "").trim())
        .filter(Boolean),
      texto: document.body.innerText,
    }));

    /* El control de esta guarda: si tocar una entrada no cambia NADA en
       pantalla, no está midiendo lo que cree — y su respuesta sobre el
       anuncio no vale. */
    if (r.texto === antes) {
      sinCambios++;
      fallos.push({ ruta, detalle: "tocar una entrada no cambió nada en pantalla: la guarda no está midiendo lo que cree" });
      await ctx.close();
      continue;
    }

    if (!r.vivos.length) {
      fallos.push({ ruta, detalle: "el resultado cambia y nada lo anuncia" });
    } else {
      conAnuncio++;
      /* (3) La convención numérica del anuncio, que no viaja en el HTML
         y por tanto `cifras.mjs` no puede ver. */
      const dicho = r.vivos.join(" · ");
      if (idioma === "en") {
        if (/\d[ \u00a0]%/.test(dicho)) fallos.push({ ruta, detalle: `anuncia el % con espacio, a la española: «${dicho.slice(0, 60)}»` });
        if (/\d[\d.,]*[ \u00a0]\$(?!\d)/.test(dicho)) fallos.push({ ruta, detalle: `anuncia el dólar detrás de la cifra, a la española: «${dicho.slice(0, 60)}»` });
      } else {
        if (/\d%/.test(dicho)) fallos.push({ ruta, detalle: `anuncia el % pegado a la cifra, a la inglesa: «${dicho.slice(0, 60)}»` });
        if (/(?<![\dkM][ \u00a0])\$[ \u00a0]?\d/.test(dicho)) fallos.push({ ruta, detalle: `anuncia el dólar delante de la cifra, a la inglesa: «${dicho.slice(0, 60)}»` });
      }
      console.log(`  ${ruta.padEnd(44)} «${dicho.slice(0, 62)}»`);
    }
    await ctx.close();
  }
}

await navegador.close();
server.close();

if (fallos.length) {
  console.log(`\n  problemas — ${fallos.length}`);
  for (const f of fallos) console.log(`     ${f.ruta}  ${f.detalle}`);
}

console.log(`\n[anuncios] ${HERRAMIENTAS.length * 2} páginas · ${conAnuncio} anuncian su resultado`);

if (sinCambios > HERRAMIENTAS.length) {
  console.log("[anuncios] en casi ninguna cambió nada al tocar una entrada: la guarda está rota, no el sitio");
  process.exit(1);
}
if (fallos.length) {
  console.log(`[anuncios] ${fallos.length} problema(s)`);
  console.log("[anuncios] el anuncio lo pone `<ResultadoAnunciado>` (src/components/tj/ResultadoAnunciado.tsx), una frase por herramienta");
  console.log("[anuncios] si falla «habla sola al cargar»: algo publica texto en el primer render, y eso se lee encima del titular");
  process.exit(1);
}
console.log("[anuncios] correcto — las cinco herramientas dicen su resultado, callan al cargar, y cada una en la convención de su idioma");
