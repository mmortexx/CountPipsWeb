/**
 * ESCALA — ¿cada titular y cada párrafo mide lo que dice la escala?
 *
 * ── Qué mide ──────────────────────────────────────────────────────────
 * La escala vive en `globals.css`: `t-display`, `t-h1` … `t-h5` para los
 * titulares y `t-lede` / `t-entradilla` para lo que va debajo. Esta guarda
 * no copia sus valores: en cada página crea una sonda con cada clase, lee
 * el tamaño que el navegador le da a ESE ancho y exige que
 *
 *  · todo h1–h4 visible mida lo mismo que algún peldaño de titular;
 *  · todo bloque de texto visible (p, li, dd, blockquote con 40 caracteres
 *    o más) mida un peldaño de texto (11–16 px enteros) o uno de la escala;
 *  · ningún tramo de un titular pinte otro color que el titular (la regla
 *    de un solo tono; se quitó `.text-gradient`, y esto mira el color
 *    calculado, no la clase, para cazar cualquier otra vía).
 *
 * Lo que atrapa es el tamaño escrito a mano: un `clamp()` suelto da
 * 17,28 o 18,72 px, y un `text-[17px]` en un h3 da un peldaño que no
 * existe. Se miran todas las páginas de `out/`, a 1440 y a 390.
 *
 * ── Qué encontró el día que se escribió (2026-09-28, tanda 44) ────────
 * Nueve tamaños distintos de h3 (14, 15, 16, 17, 18, 20, 22, 24 y 28 px),
 * h2 de panel a 20, 22 y 32 px, y entradillas a 17, 17,28, 17,6, 18,72,
 * 19 y 21 px para el mismo papel. Vista en rojo con esa compilación.
 *
 * ── Lo que NO mira ────────────────────────────────────────────────────
 * El interior de la demo (`[data-demo-raiz]`), que imita la app y tiene
 * su propia escala; el texto oculto a lectores (`.sr-only`, 1 px); y los
 * rótulos cortos, cifras y botones, que no son bloques de texto.
 *
 * Uso:  node scripts/escala.mjs --serve out
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, readdir, stat } from "node:fs/promises";
import { join, extname, relative } from "node:path";

const args = process.argv.slice(2);
const dir = args.includes("--serve") ? args[args.indexOf("--serve") + 1] : "out";
const PREFIJO = process.env.NEXT_PUBLIC_BASE_PATH || "";
const ANCHOS = [1440, 390];
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

async function paginas(carpeta) {
  const rutas = [];
  for (const e of await readdir(carpeta, { withFileTypes: true })) {
    const p = join(carpeta, e.name);
    if (e.isDirectory()) {
      if (!e.name.startsWith("_") && e.name !== "404") rutas.push(...(await paginas(p)));
    } else if (e.name === "index.html") {
      rutas.push("/" + relative(dir, carpeta).replaceAll("\\", "/"));
    }
  }
  return rutas;
}

const rutas = (await paginas(dir)).map((r) => (r === "/" ? "/" : `${r.replace(/^\/+/, "/")}/`));
const { server, base } = await servir(dir);
const navegador = await chromium.launch();
const fallos = [];
let titulares = 0;
let bloques = 0;

for (const ancho of ANCHOS) {
  const ctx = await navegador.newContext({ viewport: { width: ancho, height: 900 }, reducedMotion: "reduce" });
  await ctx.addInitScript(() => {
    try { localStorage.setItem("tj-cookie-consent", "declined"); } catch { /* sin almacenamiento */ }
  });
  const cola = [...rutas];
  await Promise.all(Array.from({ length: PESTANAS }, async () => {
    const pag = await ctx.newPage();
    while (cola.length) {
      const ruta = cola.shift();
      await pag.goto(base + ruta, { waitUntil: "load" });
      await pag.evaluate(() => document.fonts.ready);
      const r = await pag.evaluate(() => {
        const medir = (clase) => {
          const d = document.createElement("div");
          d.className = clase;
          d.textContent = "x";
          d.style.cssText = "position:absolute;visibility:hidden;left:-9999px";
          document.body.appendChild(d);
          const t = parseFloat(getComputedStyle(d).fontSize);
          d.remove();
          return t;
        };
        const deTitular = ["t-display", "t-h1", "t-h2", "t-h3", "t-h4", "t-h5"].map(medir);
        const deTexto = [11, 12, 13, 14, 15, 16, ...["t-lede", "t-entradilla", "t-h3", "t-h4", "t-h5"].map(medir)];
        const vale = (px, lista) => lista.some((v) => Math.abs(v - px) < 0.05);
        const visible = (el) => {
          const b = el.getBoundingClientRect();
          const s = getComputedStyle(el);
          return b.width > 2 && b.height > 2 && s.visibility !== "hidden" && s.display !== "none" && !el.closest(".sr-only,[hidden]");
        };
        const fuera = (el) => !el.closest("[data-demo-raiz]");
        const malos = [];
        let nt = 0;
        let nb = 0;
        for (const el of document.querySelectorAll("h1,h2,h3,h4")) {
          if (!fuera(el) || !visible(el)) continue;
          nt++;
          const px = parseFloat(getComputedStyle(el).fontSize);
          if (!vale(px, deTitular)) malos.push({ tipo: el.tagName.toLowerCase(), px, texto: el.textContent.trim().slice(0, 50) });
          /* Un solo tono: ningún tramo del titular pinta otro color que el
             titular entero, lo haga con la clase que lo haga. */
          const tinta = (x) => { const s = getComputedStyle(x); return `${s.color}|${s.webkitTextFillColor}|${s.backgroundClip}`; };
          const suya = tinta(el);
          for (const d of el.querySelectorAll("*")) {
            const conTexto = [...d.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
            if (conTexto && tinta(d) !== suya) {
              malos.push({ tipo: `${el.tagName.toLowerCase()} de dos tonos`, px, texto: el.textContent.trim().slice(0, 50) });
              break;
            }
          }
        }
        for (const el of document.querySelectorAll("main p, main li, main dd, main blockquote")) {
          if (!fuera(el) || !visible(el) || el.closest("h1,h2,h3,h4")) continue;
          const propio = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").trim();
          if (propio.length < 40) continue;
          nb++;
          const px = parseFloat(getComputedStyle(el).fontSize);
          if (!vale(px, deTexto)) malos.push({ tipo: el.tagName.toLowerCase(), px, texto: propio.slice(0, 50) });
        }
        return { malos, nt, nb };
      });
      titulares += r.nt;
      bloques += r.nb;
      for (const m of r.malos) fallos.push({ ruta, ancho, ...m });
    }
    await pag.close();
  }));
  await ctx.close();
}

await navegador.close();
server.close();

console.log(`[escala] ${rutas.length} páginas × ${ANCHOS.length} anchos: ${titulares} titulares y ${bloques} bloques de texto medidos`);
if (!titulares || !bloques) {
  console.log("[escala] no encontró titulares o bloques: la guarda no está mirando");
  process.exit(1);
}
if (fallos.length) {
  const porTamano = {};
  for (const f of fallos) (porTamano[`${f.tipo} ${Math.round(f.px * 100) / 100} px`] ||= []).push(f);
  for (const [clave, casos] of Object.entries(porTamano)) {
    console.log(`\n  ${clave} — ${casos.length} caso(s)`);
    for (const c of casos.slice(0, 4)) console.log(`     ${c.ruta} a ${c.ancho}  «${c.texto}»`);
  }
  console.log(`\n[escala] ${fallos.length} tamaño(s) fuera de la escala: usa un peldaño t-* de globals.css, no un tamaño a mano`);
  process.exit(1);
}
console.log("[escala] correcto — todo titular y todo bloque de texto está en un peldaño de la escala");
