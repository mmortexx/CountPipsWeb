/**
 * DESLIZADORES: comprueba tres cosas de los `input[type=range]` de las
 * herramientas que solo se ven mirando:
 *  1. El tramo recorrido acaba en la bolita. El centro de la bolita va de
 *     22 px a ancho − 22 px, así que un relleno hasta el porcentaje a secas
 *     asoma por delante cerca del máximo y deja hueco cerca del mínimo. Se
 *     mide en píxeles de una captura, a ambos lados del disco, con el control
 *     al 5 % y al 95 %.
 *  2. Las marcas de debajo («0,25 % · 1 % · 2 % · 3 %») están bajo su valor,
 *     no repartidas a partes iguales.
 *  3. Dos deslizadores de la misma fila tienen la pista a la misma altura.
 *
 * Uso:  node scripts/deslizadores.mjs --serve out
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat, readdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { join, extname } from "node:path";

const dir = process.argv.slice(2).find((a) => !a.startsWith("-")) || "out";
if (!existsSync(dir)) {
  console.log(`[deslizadores] no encuentro el directorio «${dir}». ¿Falta compilar el sitio con \`npm run build\`?`);
  process.exit(1);
}
const PREFIJO = process.env.NEXT_PUBLIC_BASE_PATH || "";
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

/** Las páginas con deslizadores, sacadas de out/: una herramienta nueva entra sola. */
async function rutasConDeslizador(raiz) {
  const rutas = [];
  async function recorre(d, ruta) {
    for (const e of await readdir(d, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (e.name.startsWith("_")) continue;
        await recorre(join(d, e.name), `${ruta}${e.name}/`);
      } else if (e.name === "index.html") {
        if (readFileSync(join(d, e.name), "utf8").includes("tj-range")) rutas.push(ruta);
      }
    }
  }
  await recorre(raiz, "/");
  return rutas.sort();
}

const RUTAS = await rutasConDeslizador(dir);
if (RUTAS.length < 10) {
  console.log(`[deslizadores] solo ${RUTAS.length} páginas con deslizador en ${dir}: algo ha cambiado en el marcado y la guarda no estaría mirando nada.`);
  process.exit(1);
}

const { server, base } = await servir(dir);
const navegador = await chromium.launch();
const fallos = [];
let medidos = 0;

/** Lee los píxeles de una fila de una captura PNG, decodificada en el propio navegador. */
async function filaDePixeles(lienzo, png, y) {
  return lienzo.evaluate(async ({ b64, y }) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext("2d");
    g.drawImage(img, 0, 0);
    return Array.from(g.getImageData(0, y, img.width, 1).data);
  }, { b64: png.toString("base64"), y });
}

const VARIANTES = [
  { ancho: 1440, tema: "light", pixeles: true },
  { ancho: 1440, tema: "dark", pixeles: true },
  { ancho: 1024, tema: "light", pixeles: false },
  { ancho: 390, tema: "light", pixeles: true },
];

for (const v of VARIANTES) {
  const ctx = await navegador.newContext({
    viewport: { width: v.ancho, height: 900 },
    colorScheme: v.tema,
    reducedMotion: "reduce",
    isMobile: v.ancho < 768,
    hasTouch: v.ancho < 768,
  });
  await ctx.addInitScript(() => { try { localStorage.setItem("tj-cookie-consent", "declined"); } catch {} });
  const lienzo = await (await navegador.newContext()).newPage();
  for (const ruta of RUTAS) {
    const p = await ctx.newPage();
    try {
      await p.goto(base + ruta, { waitUntil: "networkidle", timeout: 30000 });
    } catch {
      fallos.push(`${ruta} (${v.ancho}): la página no cargó`);
      await p.close();
      continue;
    }
    await p.addStyleTag({ content: ".cv-auto{content-visibility:visible!important}[data-tj-ap]{opacity:1!important;transform:none!important}" });
    await p.waitForTimeout(300);

    // 3. Pistas de una misma fila a la misma altura.
    const filas = await p.evaluate(() => {
      const r = [...document.querySelectorAll("input.tj-range")]
        .filter((e) => e.offsetParent)
        .map((e) => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y + scrollY + b.height / 2, w: b.width, n: e.getAttribute("aria-label") || document.getElementById(e.getAttribute("aria-labelledby") || "")?.textContent?.trim() || "?" }; });
      const mal = [];
      for (let i = 0; i < r.length; i++)
        for (let j = i + 1; j < r.length; j++) {
          const a = r[i], b = r[j];
          const lado = a.x + a.w <= b.x + 1 || b.x + b.w <= a.x + 1;
          if (lado && Math.abs(a.y - b.y) < 60 && Math.abs(a.y - b.y) > 1.5)
            mal.push(`«${a.n}» y «${b.n}» van en la misma fila con las pistas a ${Math.round(Math.abs(a.y - b.y))} px de altura una de otra`);
        }
      return mal;
    });
    for (const m of filas) fallos.push(`${ruta} (${v.ancho}): ${m}`);

    // 2. Marcas bajo su valor.
    const marcas = await p.evaluate(() => {
      const num = (t) => Number(t.replace(/[^\d,.\-−]/g, "").replace("−", "-").replace(",", "."));
      const mal = [];
      for (const e of document.querySelectorAll("input.tj-range")) {
        if (!e.offsetParent) continue;
        const sig = e.nextElementSibling;
        if (!sig || sig.children.length < 3) continue;
        const min = Number(e.min), max = Number(e.max);
        const hijos = [...sig.children];
        const valores = hijos.map((h) => num(h.textContent || ""));
        if (valores.some((x) => !Number.isFinite(x) || x < min || x > max)) continue;
        const b = e.getBoundingClientRect();
        hijos.forEach((h, i) => {
          const hb = h.getBoundingClientRect();
          const esperado = b.x + 22 + (b.width - 44) * ((valores[i] - min) / (max - min));
          const centro = hb.x + hb.width / 2;
          if (Math.abs(centro - esperado) > 4)
            mal.push(`la marca «${h.textContent.trim()}» de «${e.getAttribute("aria-label")}» está a ${Math.round(centro - esperado)} px de donde la bolita marca ese valor`);
        });
      }
      return mal;
    });
    for (const m of marcas) fallos.push(`${ruta} (${v.ancho}): ${m}`);

    // 1. El relleno acaba en la bolita.
    if (v.pixeles) {
      const total = await p.evaluate(() => [...document.querySelectorAll("input.tj-range")].filter((e) => e.offsetParent).length);
      for (let i = 0; i < total; i++) {
        for (const fraccion of [0.05, 0.95]) {
          const dato = await p.evaluate(({ i, fraccion }) => {
            const e = [...document.querySelectorAll("input.tj-range")].filter((x) => x.offsetParent)[i];
            const min = Number(e.min), max = Number(e.max);
            const pon = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
            pon.call(e, String(min + (max - min) * fraccion));
            e.dispatchEvent(new Event("input", { bubbles: true }));
            e.scrollIntoView({ block: "center" });
            return { n: e.getAttribute("aria-label") || document.getElementById(e.getAttribute("aria-labelledby") || "")?.textContent?.trim() || "?" };
          }, { i, fraccion });
          await p.waitForTimeout(120);
          const m = await p.evaluate((i) => {
            const e = [...document.querySelectorAll("input.tj-range")].filter((x) => x.offsetParent)[i];
            const b = e.getBoundingClientRect();
            const f = (Number(e.value) - Number(e.min)) / (Number(e.max) - Number(e.min));
            const recorrido = getComputedStyle(e).getPropertyValue("--tj-recorrido").trim();
            return { x: b.x, y: b.y, w: b.width, h: b.height, f, recorrido };
          }, i);
          const clip = { x: Math.max(0, Math.floor(m.x)), y: Math.floor(m.y), width: Math.floor(m.w), height: Math.ceil(m.h) };
          const png = await p.screenshot({ clip });
          const fila = await filaDePixeles(lienzo, png, Math.floor(clip.height / 2));
          const rgb = (m.recorrido.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
          if (rgb.length < 3) { fallos.push(`${ruta}: no pude leer el color del recorrido`); continue; }
          const esRecorrido = (k) => Math.abs(fila[k * 4] - rgb[0]) + Math.abs(fila[k * 4 + 1] - rgb[1]) + Math.abs(fila[k * 4 + 2] - rgb[2]) < 90;
          const centro = (m.x - clip.x) + 22 + (m.w - 44) * m.f;
          let huecos = 0, sobra = 0;
          for (let k = 3; k < clip.width - 3; k++) {
            if (k > centro - 12 && k < centro + 12) continue;
            if (k < centro && !esRecorrido(k)) huecos++;
            if (k > centro && esRecorrido(k)) sobra++;
          }
          medidos++;
          if (huecos > 2) fallos.push(`${ruta} (${v.ancho}, ${v.tema}): «${dato.n}» al ${Math.round(m.f * 100)} % deja ${huecos} px sin rellenar detrás de la bolita`);
          if (sobra > 2) fallos.push(`${ruta} (${v.ancho}, ${v.tema}): «${dato.n}» al ${Math.round(m.f * 100)} % pinta ${sobra} px de relleno por delante de la bolita`);
        }
      }
    }
    await p.close();
  }
  await ctx.close();
}

await navegador.close();
server.close();

console.log(`[deslizadores] ${RUTAS.length} páginas · ${medidos} posiciones medidas en píxeles`);
if (medidos < 40) fallos.push(`solo ${medidos} posiciones medidas: la guarda no está viendo los deslizadores`);
if (fallos.length) {
  for (const f of fallos.slice(0, 60)) console.log(`  ✗ ${f}`);
  if (fallos.length > 60) console.log(`  … y ${fallos.length - 60} más`);
  const cuenta = (re) => fallos.filter((f) => re.test(f)).length;
  console.log(`[deslizadores] relleno: ${cuenta(/sin rellenar|por delante/)} · marcas: ${cuenta(/la marca/)} · filas: ${cuenta(/misma fila/)} · otros: ${cuenta(/no cargó|no pude|solo \d+ posiciones/)}`);
  console.log(`[deslizadores] ${fallos.length} fallo(s)`);
  process.exit(1);
}
console.log("[deslizadores] correcto — el relleno acaba en la bolita, las marcas caen bajo su valor y las filas van a la misma altura");
