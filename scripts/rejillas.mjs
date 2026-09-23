/**
 * REJILLAS — ¿alguna ficha despega su texto para igualar la fila?
 *
 * ── Qué mide ──────────────────────────────────────────────────────────
 * Una rejilla CSS de varias filas, metida en otra rejilla que la estira
 * para igualar la altura de sus vecinas, reparte el alto sobrante entre
 * sus propias filas (`align-content: normal` se comporta como `stretch`).
 * El título se queda arriba y la descripción baja sola: el hueco entre
 * los dos cambia de una ficha a otra según lo que mida la de al lado.
 * No rompe nada ni desborda, así que ninguna otra guarda lo ve.
 *
 * La prueba es directa: a cada rejilla de dos filas o más se le pone
 * `align-content: start` un instante; si algún hijo se mueve, la rejilla
 * estaba repartiendo hueco. Las de una sola fila no cuentan: ahí estirar
 * la fila es lo que centra el contenido en vertical, y es a propósito.
 *
 * ── Qué encontró el día que se escribió (2026-09-23) ──────────────────
 * El índice de /features, en los dos idiomas: «Playbooks» y «Riesgo de
 * ruina» separaban 11 px su descripción del título. Se vio en rojo con
 * esa compilación antes del arreglo (`content-start` en la ficha).
 *
 * ── Lo que NO mira ────────────────────────────────────────────────────
 * Flexbox, donde el mismo reparto sólo ocurre si alguien lo pide.
 *
 * Uso:  node scripts/rejillas.mjs --serve out
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, readdir, stat } from "node:fs/promises";
import { join, extname, relative } from "node:path";

const args = process.argv.slice(2);
const dir = args.includes("--serve") ? args[args.indexOf("--serve") + 1] : "out";
const PREFIJO = process.env.NEXT_PUBLIC_BASE_PATH || "";
const ANCHOS = [1440, 390];
const TOLERANCIA_PX = 4;
const PESTANAS = 4;

const TIPOS = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
  ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml",
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

/* Todas las páginas compiladas, no una lista a mano: una página nueva
   entra sola en la guarda. */
async function paginas(carpeta) {
  const rutas = [];
  for (const e of await readdir(carpeta, { withFileTypes: true })) {
    const p = join(carpeta, e.name);
    if (e.isDirectory() && !e.name.startsWith("_")) rutas.push(...(await paginas(p)));
    else if (e.name === "index.html") {
      const rel = relative(dir, carpeta).replaceAll("\\", "/");
      rutas.push(rel ? `/${rel}/` : "/");
    }
  }
  return rutas;
}

const RUTAS = await paginas(dir);
if (RUTAS.length < 100) {
  console.log(`[rejillas] sólo ${RUTAS.length} páginas en ${dir}: ¿está compilado?`);
  process.exit(1);
}

const { server, base } = await servir(dir);
const navegador = await chromium.launch();
const fallos = new Map();
let rejillas = 0;

async function medir(pag, ruta, ancho) {
  try {
    await pag.goto(`${base}${ruta}`, { waitUntil: "networkidle", timeout: 30000 });
  } catch {
    fallos.set(`ruta que no carga ${ruta}`, [`${ancho} ${ruta}`]);
    return;
  }
  // Las secciones diferidas no tienen alto propio hasta que se pintan.
  await pag.addStyleTag({ content: ".cv-auto{content-visibility:visible!important}" });
  await pag.waitForTimeout(150);
  const r = await pag.evaluate((tol) => {
    const vistos = [];
    let n = 0;
    for (const el of document.querySelectorAll("body *")) {
      const cs = getComputedStyle(el);
      if (!cs.display.includes("grid") || el.children.length < 2) continue;
      if (!["normal", "stretch"].includes(cs.alignContent)) continue;
      if (el.getBoundingClientRect().height === 0) continue;
      if (cs.gridTemplateRows.trim().split(/\s+/).length < 2) continue;
      n++;
      const hijos = [...el.children];
      const antes = hijos.map((c) => c.getBoundingClientRect().top);
      const propio = el.style.alignContent;
      el.style.alignContent = "start";
      const mov = Math.max(...hijos.map((c, i) => Math.abs(c.getBoundingClientRect().top - antes[i])));
      el.style.alignContent = propio;
      if (mov > tol) {
        vistos.push({
          clase: `<${el.tagName.toLowerCase()} class="${String(el.className).slice(0, 70)}">`,
          texto: (el.textContent || "").trim().slice(0, 36),
          mov: Math.round(mov),
        });
      }
    }
    return { vistos, n };
  }, TOLERANCIA_PX);
  rejillas += r.n;
  for (const v of r.vistos) {
    if (!fallos.has(v.clase)) fallos.set(v.clase, []);
    fallos.get(v.clase).push(`${ancho} ${ruta}  «${v.texto}» baja ${v.mov} px`);
  }
}

for (const ancho of ANCHOS) {
  const ctx = await navegador.newContext({ viewport: { width: ancho, height: 900 }, reducedMotion: "reduce" });
  await ctx.addInitScript(() => {
    try { localStorage.setItem("tj-cookie-consent", "declined"); } catch {}
  });
  const cola = [...RUTAS];
  const trabajador = async () => {
    const pag = await ctx.newPage();
    for (let ruta = cola.shift(); ruta; ruta = cola.shift()) await medir(pag, ruta, ancho);
    await pag.close();
  };
  await Promise.all(Array.from({ length: PESTANAS }, trabajador));
  await ctx.close();
}

await navegador.close();
server.close();

for (const [clase, casos] of fallos) {
  console.log(`\n  ${clase} — ${casos.length} caso(s)`);
  for (const c of casos.slice(0, 6)) console.log(`     ${c}`);
  if (casos.length > 6) console.log(`     … y ${casos.length - 6} más`);
}

console.log(`\n[rejillas] ${RUTAS.length} páginas × ${ANCHOS.length} anchos · ${rejillas} rejillas de varias filas medidas`);
/* Una guarda que no mide nada pasa siempre: el sitio tiene cientos. */
if (rejillas < 200) {
  console.log(`[rejillas] sólo ${rejillas} rejillas: se esperaban cientos. ¿Falló la carga?`);
  process.exit(1);
}
if (fallos.size) {
  console.log(`[rejillas] ${fallos.size} rejilla(s) reparten el alto sobrante entre sus filas`);
  console.log("[rejillas] si la ficha debe ir arriba, `content-start` (align-content: start) en ella");
  process.exit(1);
}
console.log("[rejillas] correcto — ninguna ficha despega su texto para igualar la fila");
