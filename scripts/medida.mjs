/**
 * MEDIDA: comprueba que ningún renglón del sitio compilado supere los 85
 * caracteres (el cómodo está entre 45 y 75). Por cada nodo de texto pone un
 * `Range` sobre cada carácter y los agrupa por coordenada vertical: es lento a
 * propósito, porque estimar por ancho y tamaño de letra se equivoca un 35 %.
 *
 * `max-width` en `ch` no vale a ojo: 1 ch ≈ 1,35 caracteres de texto en
 * Instrument Sans, y el límite debe ir en el elemento que lleva el `font-size`
 * del texto, no en su contenedor. La clase `.medida` de `globals.css` es el
 * único sitio con ese cálculo; un fallo se arregla añadiéndola al elemento
 * que lleva el `font-size`.
 *
 * No cuentan los textos de una sola línea, la demo (imita la densidad de la
 * app de escritorio) ni los nodos de menos de 70 caracteres.
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

/** Umbral: 85 y no 75 porque `.medida` deja el texto corriente en torno a 62 y el
 *  peor caso en 85; el margen es para textos con muchas palabras cortas. */
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
  // El inglés mete más caracteres en el mismo ancho: se comprueban las plantillas con más texto corrido.
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
      // 2 px de tolerancia: acentos y mayúsculas mueven el `top` dentro de la misma línea.
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

console.log(`[medida] ${medidos} rutas recorridas · tope ${TOPE} caracteres por línea (solo textos de 2 líneas o más)`);
if (fallos) {
  console.log(`[medida] ${fallos} texto(s) por encima del tope; el peor, ${peor} caracteres`);
  console.log(`[medida] se arregla añadiendo la clase \`medida\` AL ELEMENTO QUE LLEVA EL font-size del texto`);
  process.exit(1);
}
console.log("[medida] correcto — ningún renglón pasa del tope");
