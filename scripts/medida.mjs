/**
 * MEDIDA — ¿cuántos caracteres tiene el renglón más largo del sitio?
 *
 * ── Qué mide ──────────────────────────────────────────────────────────
 * El renglón cómodo de lectura tiene entre 45 y 75 caracteres. Por encima
 * de ~85 el ojo pierde el salto de línea: al llegar al final de un renglón
 * tiene que rastrear el margen izquierdo para encontrar dónde sigue, y en
 * textos largos eso se nota como cansancio, no como un defecto visible.
 *
 * Esto recorre el sitio compilado y, por cada nodo de texto, CUENTA los
 * caracteres de cada línea renderizada: pone un `Range` sobre cada
 * carácter, lee su rectángulo y los agrupa por coordenada vertical. Es
 * lento y es a propósito — una estimación por ancho partido por tamaño de
 * letra se equivoca en un 35 %, que es justo el error que dejó pasar
 * renglones de 132 caracteres creyendo que medían 68.
 *
 * ── Por qué no vale `max-width` en `ch` a ojo ─────────────────────────
 * `1ch` es el ancho del glifo «0», que en una fuente proporcional es de
 * los más anchos. Medido sobre Instrument Sans con frases del propio
 * sitio, de 11 a 20 px, el factor es constante: 1 ch ≈ 1,35 caracteres de
 * texto. Y ese límite hay que escribirlo en el elemento que lleva el
 * `font-size` del texto, NUNCA en su contenedor: un `68ch` puesto en un
 * `div` se resuelve con la tipografía del `div`, no con la del párrafo que
 * lleva dentro. Las dos trampas juntas daban 110 caracteres donde el
 * código decía 68. La clase `.medida` de `globals.css` es el único sitio
 * donde vive ese cálculo.
 *
 * ── Lo que NO cuenta, y por qué ───────────────────────────────────────
 *  · TEXTOS DE UNA SOLA LÍNEA. El renglón largo cansa porque hay que
 *    volver al margen a buscar el siguiente; si no hay siguiente, no hay
 *    problema. Un pie de ficha de 102 caracteres en una línea se lee bien,
 *    y cortarlo acortaría el filete que lo separa del cuerpo.
 *  · LA DEMO (`/demo`). Imita una aplicación de escritorio, cuya densidad
 *    es la de la app real y no la de una página de lectura. Medirla con
 *    este criterio sería pedirle que dejara de parecerse a lo que imita.
 *  · Los nodos de menos de 70 caracteres, que no pueden dar el problema.
 *
 * Uso:  node scripts/medida.mjs --serve out
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";

const args = process.argv.slice(2);
const dir = args.includes("--serve") ? args[args.indexOf("--serve") + 1] : "out";
const PREFIJO = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** El umbral. 85 y no 75 porque `.medida` deja el texto corriente en torno
 *  a 62 y el peor caso en 85: el margen es para los textos con muchas
 *  palabras cortas, que meten más caracteres en el mismo ancho. */
const TOPE = 85;

const RUTAS = [
  "/",
  "/features",
  "/features/metricas",
  "/features/disciplina",
  "/features/seguridad",
  "/pricing",
  "/about",
  "/faq",
  "/glosario",
  "/glosario/expectancy",
  "/herramientas",
  "/herramientas/calculadora-de-riesgo",
  "/herramientas/proyector-de-capital",
  "/herramientas/monte-carlo",
  "/herramientas/coste-de-indisciplina",
  "/traders/manual",
  "/traders/prop-firms",
  "/beta",
  "/test",
  "/aviso-legal",
  "/privacidad",
  "/cookies",
  "/terminos",
  /* El inglés tiene palabras más cortas que el español, así que mete más
     caracteres en el mismo ancho: si un ancho pasa, pasa antes en inglés.
     Se comprueban las dos plantillas que más texto corrido llevan. */
  "/en/privacidad",
  "/en/glosario",
  "/en/features",
];

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".webp": "image/webp",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".json": "application/json",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".ico": "image/x-icon",
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

/** Lo que se ejecuta dentro de la página. */
function auditar(tope) {
  const res = [];
  const main = document.querySelector("main");
  if (!main) return res;
  const it = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = it.nextNode())) {
    const t = n.textContent;
    if (!t || t.trim().length < 70) continue;
    const el = n.parentElement;
    if (!el) continue;
    const c = getComputedStyle(el);
    if (c.display === "none" || c.visibility === "hidden") continue;
    const sonda = document.createRange();
    sonda.selectNodeContents(n);
    if (sonda.getClientRects().length === 0) continue;

    const porLinea = new Map();
    const r = document.createRange();
    for (let i = 0; i < t.length; i++) {
      r.setStart(n, i);
      r.setEnd(n, i + 1);
      const rect = r.getBoundingClientRect();
      if (!rect.height) continue;
      // 2 px de tolerancia: los acentos y las mayúsculas mueven el `top`
      // del rectángulo dentro de la misma línea.
      const clave = Math.round(rect.top / 2) * 2;
      porLinea.set(clave, (porLinea.get(clave) || 0) + 1);
    }
    if (porLinea.size < 2) continue; // una sola línea: no aplica
    const max = Math.max(...porLinea.values());
    if (max <= tope) continue;
    res.push({
      ch: max,
      lineas: porLinea.size,
      fs: Math.round(parseFloat(c.fontSize)),
      sel: el.tagName.toLowerCase() + (el.className ? "." + String(el.className).slice(0, 50) : ""),
      txt: t.trim().slice(0, 55),
    });
  }
  return res.sort((a, b) => b.ch - a.ch);
}

const { server, base } = await servir(dir);
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });

let fallos = 0;
let peor = 0;
let medidos = 0;
for (const ruta of RUTAS) {
  const pag = await ctx.newPage();
  try {
    await pag.goto(base + ruta, { waitUntil: "networkidle" });
    // Los revelados por scroll no existen hasta que se asoman.
    await pag.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await pag.waitForTimeout(600);
    await pag.evaluate(() => window.scrollTo(0, 0));
    await pag.waitForTimeout(300);
    const malos = await pag.evaluate(auditar, TOPE);
    medidos++;
    for (const m of malos) {
      fallos++;
      peor = Math.max(peor, m.ch);
      console.log(`  ${String(m.ch).padStart(4)}ch en ${m.lineas} líneas · ${m.fs}px · ${ruta} · ${m.sel}`);
      console.log(`        «${m.txt}»`);
    }
  } finally {
    await pag.close();
  }
}

await nav.close();
server.close();

console.log(`[medida] ${medidos} rutas recorridas · tope ${TOPE} caracteres por línea (sólo textos de 2 líneas o más)`);
if (fallos) {
  console.log(`[medida] ${fallos} texto(s) por encima del tope; el peor, ${peor} caracteres`);
  console.log(`[medida] se arregla añadiendo la clase \`medida\` AL ELEMENTO QUE LLEVA EL font-size del texto`);
  process.exit(1);
}
console.log("[medida] correcto — ningún renglón pasa del tope");
