/**
 * ESCALA: comprueba, en todas las páginas de `out/` a 1440 y 390 px, que cada
 * titular y cada párrafo miden lo que dice la escala de `globals.css`
 * (`t-display`, `t-h1`…`t-h5`, `t-lede`, `t-entradilla`). No copia sus valores:
 * crea una sonda por clase y lee el tamaño que el navegador le da a ese ancho.
 * Un fallo es:
 *  - un h1–h4 visible que no mide lo de ningún peldaño de titular;
 *  - un bloque de texto (p, li, dd, blockquote de 40+ caracteres) que no mide
 *    un peldaño de texto (11–16 px enteros) ni uno de la escala;
 *  - un tramo de titular con otro color que el titular (se mira el color
 *    calculado, no la clase);
 *  - interlineado de lectura distinto de 1,6 (13 y 14 px) o 1,7 (15 y 16 px);
 *  - negrita distinta de 600, texto de herramienta bajo 12 px fuera de los
 *    gráficos, o tarjeta de resultado sin `.tj-ficha-barra`.
 * Atrapa el tamaño escrito a mano (un `clamp()` suelto, un `text-[17px]`).
 * No mira la demo (`[data-demo-raiz]`, con su propia escala), el texto
 * `.sr-only` ni rótulos cortos, cifras y botones.
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
let herramientas = 0;
let negritas = 0;
let interlineados = 0;

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
          // Un solo tono: ningún tramo del titular pinta otro color que el titular, sea con la clase que sea.
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
        // Interlineado de lectura: un párrafo de dos líneas o más va a 1,6 (13 y 14 px) o a 1,7 (15 y 16 px).
        let ni = 0;
        const INTERLINEADO = { 13: 1.6, 14: 1.6, 15: 1.7, 16: 1.7 };
        for (const el of document.querySelectorAll("main p, main li, main dd, main blockquote, main .medida")) {
          if (!fuera(el) || !visible(el) || el.closest("h1,h2,h3,h4,button,.cta,svg")) continue;
          if (/\bt-(display|h\d|lede|entradilla)\b/.test(el.className)) continue;
          const propio = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").trim();
          if (propio.length < 40) continue;
          const s = getComputedStyle(el);
          // Las fórmulas del glosario van en monoespaciada: son código, no prosa.
          if (/mono/i.test(s.fontFamily)) continue;
          const px = parseFloat(s.fontSize);
          const esperado = INTERLINEADO[Math.round(px)];
          if (!esperado || Math.abs(px - Math.round(px)) > 0.05) continue;
          const lh = parseFloat(s.lineHeight);
          if (!(el.getBoundingClientRect().height >= lh * 1.8)) continue;
          ni++;
          if (Math.abs(lh / px - esperado) > 0.012) malos.push({ tipo: `interlineado ${(lh / px).toFixed(3)} (pide ${esperado})`, px, texto: propio.slice(0, 50) });
        }
        // Herramientas: nada bajo 12 px fuera de los gráficos y la tarjeta de resultado abre con la barra común.
        let nh = 0;
        if (/\/herramientas\/[^/]+\/$/.test(location.pathname)) {
          nh = 1;
          if (!document.querySelector("main .tj-ficha > .tj-ficha-barra:first-child")) {
            malos.push({ tipo: "herramienta sin barra de ficha", px: 0, texto: document.querySelector("h1")?.textContent.trim().slice(0, 50) ?? "" });
          }
          for (const el of document.querySelectorAll("main *")) {
            if (el.closest("svg,[aria-hidden=true]") || !visible(el)) continue;
            if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
            const px = parseFloat(getComputedStyle(el).fontSize);
            if (px < 11.95) malos.push({ tipo: "texto de herramienta bajo 12", px, texto: el.textContent.trim().slice(0, 50) });
          }
        }
        // La negrita de la casa es 600; la del navegador (700) pesa más que cualquier titular.
        let nn = 0;
        for (const el of document.querySelectorAll("strong, b")) {
          if (!fuera(el) || !visible(el)) continue;
          nn++;
          const peso = getComputedStyle(el).fontWeight;
          if (peso !== "600") malos.push({ tipo: `negrita a ${peso}`, px: parseFloat(getComputedStyle(el).fontSize), texto: el.textContent.trim().slice(0, 50) });
        }
        return { malos, nt, nb, nh, nn, ni };
      });
      titulares += r.nt;
      bloques += r.nb;
      herramientas += r.nh;
      negritas += r.nn;
      interlineados += r.ni;
      for (const m of r.malos) fallos.push({ ruta, ancho, ...m });
    }
    await pag.close();
  }));
  await ctx.close();
}

await navegador.close();
server.close();

console.log(`[escala] ${rutas.length} páginas × ${ANCHOS.length} anchos: ${titulares} titulares, ${bloques} bloques de texto, ${herramientas} páginas de herramienta y ${negritas} negritas y ${interlineados} párrafos medidos`);
if (!titulares || !bloques || !herramientas || !negritas || !interlineados) {
  console.log("[escala] no encontró titulares, bloques, herramientas, negritas o párrafos: la guarda no está mirando");
  process.exit(1);
}
if (fallos.length) {
  const porTamano = {};
  for (const f of fallos) (porTamano[`${f.tipo} ${Math.round(f.px * 100) / 100} px`] ||= []).push(f);
  for (const [clave, casos] of Object.entries(porTamano)) {
    console.log(`\n  ${clave} — ${casos.length} caso(s)`);
    for (const c of casos.slice(0, 4)) console.log(`     ${c.ruta} a ${c.ancho}  «${c.texto}»`);
  }
  console.log(`\n[escala] ${fallos.length} caso(s) fuera de la escala: usa un peldaño t-* de globals.css y el interlineado de lectura, no un valor a mano`);
  process.exit(1);
}
console.log("[escala] correcto — todo titular y todo bloque de texto está en un peldaño de la escala");
