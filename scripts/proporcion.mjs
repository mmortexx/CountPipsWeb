/**
 * PROPORCIÓN: ningún texto de un gráfico SVG sale deformado. Un SVG con
 * `preserveAspectRatio="none"` estira su dibujo al ancho de la caja; si lleva
 * `<text>` dentro, las letras se ensanchan o se aplastan (pasó con las velas de
 * la ficha de operación y con los meses de Analítica). Mide la escala real en
 * horizontal y en vertical de cada SVG visible que tenga texto y acusa los que
 * difieren más de un 4 %.
 *
 * Recorre una muestra de páginas y, dentro de la demo, sus cuatro pestañas, las
 * secciones de Analítica y la ficha de una operación, a 1440 y 390 px. Si mide
 * pocos gráficos con texto, falla: no estaría viendo el sitio.
 *
 * Uso:  node scripts/proporcion.mjs --serve out
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, extname } from "node:path";

const dir = process.argv.slice(2).find((a) => !a.startsWith("-")) || "out";
if (!existsSync(dir)) {
  console.log(`[proporcion] no encuentro el directorio «${dir}». ¿Falta compilar el sitio con \`npm run build\`?`);
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

// Páginas con gráficos fuera de la demo.
const RUTAS = [
  "/", "/features/", "/features/metricas/", "/features/disciplina/",
  "/herramientas/monte-carlo/", "/herramientas/significancia-estadistica/", "/herramientas/proyector-de-capital/",
  "/herramientas/prueba-de-fondeo/", "/herramientas/ahorro-vs-suscripcion/", "/traders/prop-firms/", "/en/",
];

// Los SVG visibles con texto: escala horizontal frente a vertical.
const medir = () =>
  [...document.querySelectorAll("svg")].flatMap((s) => {
    const textos = s.querySelectorAll("text");
    const r = s.getBoundingClientRect();
    const vb = s.viewBox?.baseVal;
    if (!textos.length || !vb || !vb.width || !vb.height || r.width < 2 || r.height < 2) return [];
    const par = s.getAttribute("preserveAspectRatio") || "";
    const sx = r.width / vb.width;
    const sy = r.height / vb.height;
    const desvio = par.startsWith("none") ? Math.abs(sx / sy - 1) : 0;
    const nombre = s.getAttribute("aria-label") || [...textos].map((t) => t.textContent.trim()).join(" ").slice(0, 40);
    return [{ nombre, desvio: Math.round(desvio * 100), px: `${Math.round(r.width)}×${Math.round(r.height)}`, vb: `${vb.width}×${vb.height}` }];
  });

const { server, base } = await servir(dir);
const navegador = await chromium.launch();
const fallos = new Set();
let medidos = 0;

const anota = (donde, lista, exige = false) => {
  medidos += lista.length;
  if (exige && !lista.length) fallos.add(`${donde}: no encuentro el gráfico con texto que debería haber`);
  for (const m of lista) if (m.desvio > 4) fallos.add(`${donde}: «${m.nombre}» estirado un ${m.desvio} % (${m.px} px sobre un dibujo de ${m.vb})`);
};

for (const [ancho, alto, movil] of [[1440, 900, false], [390, 844, true]]) {
  const ctx = await navegador.newContext({ viewport: { width: ancho, height: alto }, isMobile: movil, hasTouch: movil, reducedMotion: "reduce" });
  await ctx.addInitScript(() => { try { localStorage.setItem("tj-cookie-consent", "declined"); } catch {} });
  const p = await ctx.newPage();
  for (const ruta of RUTAS) {
    try {
      await p.goto(base + ruta, { waitUntil: "load", timeout: 30000 });
    } catch {
      fallos.add(`${ruta} (${ancho}): la página no cargó`);
      continue;
    }
    await p.addStyleTag({ content: ".cv-auto{content-visibility:visible!important}" });
    await p.waitForTimeout(300);
    anota(`${ruta} (${ancho})`, await p.evaluate(medir));
  }

  // La demo: cada pestaña, cada sección de Analítica y una ficha de operación.
  await p.goto(base + "/demo/", { waitUntil: "load", timeout: 30000 });
  await p.waitForTimeout(500);
  const pulsa = (texto, ultimo = false) =>
    p.evaluate(({ texto, ultimo }) => {
      const v = document.querySelector(".demo-window");
      const c = [...(v?.querySelectorAll("button, [role='tab']") ?? [])].filter((b) => b.textContent.trim().startsWith(texto));
      const b = ultimo ? c[c.length - 1] : c[0];
      b?.click();
      return Boolean(b);
    }, { texto, ultimo });
  const pasos = [
    ["Resumen"], ["Operaciones"], ["Diario"], ["Analítica"],
    ["Riesgo", true], ["Distribuciones", true], ["Tiempo y cadencia", true], ["Atribución", true],
  ];
  for (const [texto, ultimo] of pasos) {
    if (!(await pulsa(texto, ultimo))) { fallos.add(`/demo/ (${ancho}): no encuentro «${texto}»`); continue; }
    await p.waitForTimeout(500);
    anota(`/demo/ ${texto} (${ancho})`, await p.evaluate(medir));
  }
  await pulsa("Operaciones");
  await p.waitForTimeout(500);
  const fila = p.locator(".demo-window tbody tr, .demo-window [role='row']").nth(1);
  if (await fila.count()) {
    await fila.click();
    await p.waitForTimeout(600);
    anota(`/demo/ ficha (${ancho})`, await p.evaluate(medir), true);
  } else fallos.add(`/demo/ (${ancho}): no encuentro filas en Operaciones`);
  await ctx.close();
}

await navegador.close();
server.close();

console.log(`[proporcion] ${medidos} gráficos con texto medidos`);
if (medidos < 12) fallos.add(`solo ${medidos} gráficos con texto: la guarda no está viendo el sitio`);
if (fallos.size) {
  for (const f of fallos) console.log(`  ✗ ${f}`);
  console.log(`[proporcion] ${fallos.size} fallo(s)`);
  process.exit(1);
}
console.log("[proporcion] correcto — ningún texto de un gráfico sale estirado");
