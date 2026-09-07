/**
 * TINTA — ¿se lee el texto que va ENCIMA de un fondo lleno de P&L?
 *
 * Mide los sitios donde el sitio pinta un rectángulo del color de un
 * resultado (verde/rojo) y escribe texto encima. En los gráficos ese fondo
 * es un <rect> HERMANO, no el de un antepasado CSS, así que `legible.mjs`
 * no puede verlo: lo da por «sin fondo plano». Este banco lo mide a mano.
 *
 * Sirve `out` SIN la bandera de SPA, y lo comprueba pidiendo tres rutas y
 * mirando el <title>.
 *
 * Uso:  node tinta.mjs --serve out
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";

const dir = process.argv.includes("--serve")
  ? process.argv[process.argv.indexOf("--serve") + 1]
  : "out";

const TIPOS = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
  ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml",
  ".woff2": "font/woff2", ".json": "application/json", ".txt": "text/plain",
  ".xml": "application/xml", ".ico": "image/x-icon",
};

async function servir(raiz) {
  const server = createServer(async (req, res) => {
    try {
      const ruta = decodeURIComponent((req.url || "/").split("?")[0]);
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
      res.writeHead(404).end("no esta");
    }
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return { server, base: `http://127.0.0.1:${server.address().port}` };
}

/* La sonda de contraste vive en la página, instalada antes de cada carga. */
const SONDA = () => {
  const rgba = (c) => {
    const m = String(c).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[,/]/).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const canal = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const luz = (c) => 0.2126 * canal(c.r) + 0.7152 * canal(c.g) + 0.0722 * canal(c.b);
  const sobre = (f, b) => ({
    r: f.r * f.a + b.r * (1 - f.a),
    g: f.g * f.a + b.g * (1 - f.a),
    b: f.b * f.a + b.b * (1 - f.a),
    a: 1,
  });
  const esSvg = (n) => n.namespaceURI === "http://www.w3.org/2000/svg";

  window.__mide = (elTexto, elFondo) => {
    const t = elTexto, f = elFondo || elTexto;
    const st = getComputedStyle(t), sf = getComputedStyle(f);
    const tinta = rgba(esSvg(t) ? st.fill : st.color);
    let fondo = rgba(esSvg(f) ? sf.fill : sf.backgroundColor);
    if (!tinta || !fondo) return { falta: "color sin resolver" };
    if (fondo.a < 1) {
      const base = rgba(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
      fondo = sobre(fondo, base);
    }
    const [l1, l2] = [luz(tinta), luz(fondo)].sort((x, y) => y - x);
    return {
      ratio: +(((l1 + 0.05) / (l2 + 0.05))).toFixed(2),
      tinta: esSvg(t) ? st.fill : st.color,
      fondo: esSvg(f) ? sf.fill : sf.backgroundColor,
      px: parseFloat(st.fontSize),
      peso: st.fontWeight,
    };
  };
};

const { server, base } = await servir(dir);
const nav = await chromium.launch();
const ctx = await nav.newContext({
  viewport: { width: 1440, height: 900 },
  /* El boton de copiar solo entra en su estado «Copiado» —el que se pinta
     de verde— si el portapapeles responde. Sin este permiso el banco no
     llega nunca a medir ese estado. */
  permissions: ["clipboard-read", "clipboard-write"],
});
ctx.setDefaultTimeout(8000);
await ctx.addInitScript(SONDA);

/* ── Trampa conocida: el servidor que devuelve la portada para todo ── */
{
  const p = await ctx.newPage();
  const rutas = ["/", "/pricing/", "/demo/"];
  const titulos = [];
  for (const r of rutas) { await p.goto(base + r); titulos.push(await p.title()); }
  await p.close();
  const distintos = new Set(titulos).size;
  console.log(`banco · ${distintos}/3 titulos distintos ${distintos === 3 ? "OK" : "EL SERVIDOR MIENTE"}`);
  rutas.forEach((r, i) => console.log(`   ${r} -> ${titulos[i]}`));
  if (distintos !== 3) { await nav.close(); server.close(); process.exit(1); }
}

const filas = [];
for (const tema of ["dark", "light"]) {
  const p = await ctx.newPage();
  await p.addInitScript((t) => { try { localStorage.setItem("tj-theme", t); } catch {} }, tema);
  const fijaTema = () => p.evaluate((t) => document.documentElement.setAttribute("data-theme", t), tema);

  /* ── /demo → Operaciones: los cuatro filtros de resultado ── */
  await p.goto(base + "/demo/", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2500);
  await fijaTema();
  await p.locator("button").filter({ hasText: /^Operaciones$/ }).first().click().catch(() => {});
  await p.waitForTimeout(700);

  for (const rotulo of ["Ganadoras", "Pérdidas", "Fuera de Plan (Fallo)", "100% en Plan"]) {
    /* Texto literal, no expresion regular: hay dos botones «Ganadoras»
       —el filtro rapido y el selector de resultado— y el primero en el
       DOM es el que se pinta con el fondo lleno de P&L. */
    const b = p.locator("button").filter({ hasText: rotulo }).first();
    await b.click().catch(() => {});
    await p.waitForTimeout(250);
    const r = await b.evaluate((el) => window.__mide(el, null)).catch((e) => ({ falta: String(e).slice(0, 60) }));
    filas.push({ tema, sitio: `filtro ${rotulo}`, ...r });
  }

  /* ── /demo → detalle: etiquetas SL y TP del gráfico de velas ── */
  await p.locator("button").filter({ hasText: /^Ganadoras$/ }).first().click().catch(() => {});
  await p.waitForTimeout(300);
  await p.locator("tbody tr").first().click().catch(() => {});
  await p.waitForTimeout(1200);
  for (const pref of ["SL", "TP"]) {
    const r = await p.evaluate((pre) => {
      const t = [...document.querySelectorAll("svg text")].find((n) => n.textContent.trim().startsWith(pre + " "));
      if (!t) return { falta: "sin texto " + pre };
      const rect = [...t.parentElement.querySelectorAll("rect")].pop();
      if (!rect) return { falta: "sin rect " + pre };
      return window.__mide(t, rect);
    }, pref);
    filas.push({ tema, sitio: `etiqueta ${pref} (velas)`, ...r });
  }

  /* ── El boton de cerrar del chrome de la demo, en hover ── */
  await p.goto(base + "/demo/", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2500);
  await fijaTema();
  /* El banner de consentimiento se planta encima del canto inferior de la
     ventana y se come el hover del boton de cerrar: sin retirarlo, el banco
     mide el estado en reposo creyendo medir el hover. */
  await p.locator("button").filter({ hasText: "Solo necesarias" }).first().click().catch(() => {});
  await p.waitForTimeout(500);
  const cerrar = p.locator('button[aria-label="Cerrar"]').first();
  await cerrar.scrollIntoViewIfNeeded().catch(() => {});
  await cerrar.hover().catch(() => {});
  await p.waitForTimeout(400);
  if (!(await cerrar.evaluate((el) => el.matches(":hover")).catch(() => false))) {
    filas.push({ tema, sitio: "boton Cerrar (hover)", falta: "no llego a estado hover" });
  } else
  filas.push({
    tema,
    sitio: "boton Cerrar (hover)",
    ...(await cerrar.evaluate((el) => {
      /* El glifo es un SVG con `stroke: currentColor`, asi que lo que se
         lee es el `color` del boton contra su fondo en hover. */
      const s = getComputedStyle(el);
      const falso = document.createElement("span");
      falso.style.color = s.color;
      falso.style.backgroundColor = s.backgroundColor;
      falso.style.fontSize = "12px";
      falso.style.fontWeight = "700";
      el.appendChild(falso);
      const out = window.__mide(falso, falso);
      falso.remove();
      return out;
    }).catch((e) => ({ falta: String(e).slice(0, 60) }))),
  });

  /* ── /herramientas/proyector-de-capital ── */
  await p.goto(base + "/herramientas/proyector-de-capital/", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2500);
  await fijaTema();
  const copiar = p.locator("button").filter({ hasText: /Copiar Resumen/ }).first();
  await copiar.scrollIntoViewIfNeeded().catch(() => {});
  await copiar.click().catch(() => {});
  await p.waitForTimeout(500);
  const rc = await p.locator("button").filter({ hasText: /Copiado/ }).first()
    .evaluate((el) => window.__mide(el, null)).catch((e) => ({ falta: String(e).slice(0, 60) }));
  filas.push({ tema, sitio: "boton Copiado", ...rc });

  const restos = await p.evaluate(() =>
    document.querySelectorAll('svg path[d="M1 1L9 9M9 1L1 9"]').length);
  console.log(`${tema} · controles de ventana decorativos en el proyector: ${restos} ${restos === 0 ? "OK" : "SIGUEN"}`);
  await p.close();
}

console.log("");
console.log("tema   sitio                     contraste     px  tinta                      fondo");
let mal = 0;
for (const f of filas) {
  if (f.falta) { console.log(`${f.tema.padEnd(6)} ${f.sitio.padEnd(25)} NO MEDIDO (${f.falta})`); mal++; continue; }
  const grande = f.px >= 24 || (f.px >= 18.66 && Number(f.peso) >= 700);
  const puerta = grande ? 3 : 4.5;
  const ok = f.ratio >= puerta;
  if (!ok) mal++;
  console.log(
    `${f.tema.padEnd(6)} ${f.sitio.padEnd(25)} ${String(f.ratio).padStart(6)}:1 ${ok ? "OK" : "FALLA"} ` +
    `${String(f.px).padStart(5)}  ${String(f.tinta).padEnd(26)} ${f.fondo}`,
  );
}
console.log("");
console.log(mal === 0 ? "TODO PASA" : `${mal} FALLO(S)`);
await nav.close();
server.close();
process.exit(mal === 0 ? 0 : 1);
