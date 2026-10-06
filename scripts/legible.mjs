/**
 * LEGIBLE: recorre todo el texto visible de cada página y comprueba, por cada
 * trozo, el contraste contra el fondo real y el tamaño. `humo.mjs` solo lee
 * píxeles de los textos pequeños más difíciles; esto cubre el resto.
 *   - Contraste: el fondo se compone recorriendo los ancestros y mezclando cada
 *     capa translúcida. Umbral WCAG AA: 4,5:1, o 3:1 si el texto es grande
 *     (≥24 px, o ≥18,66 px en negrita).
 *   - Tamaño: suelo de 9,5 px. No es de la norma (WCAG no fija mínimo): es lo
 *     que se lee de verdad en etiquetas de eje o cifras tabulares.
 * No puede medir los textos sobre imagen o degradado (papel grabado, bandas
 * con velo): componer colores planos inventaría el resultado. Se cuentan como
 * «sin fondo plano», nunca como aprobados, y los mide `humo.mjs`.
 *
 * Uso:  node scripts/legible.mjs --serve out
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";

const args = process.argv.slice(2);
const dir = args.includes("--serve") ? args[args.indexOf("--serve") + 1] : "out";
const PREFIJO = process.env.NEXT_PUBLIC_BASE_PATH || "";

const RUTAS = [
  "/",
  "/features",
  "/features/metricas",
  "/features/disciplina",
  "/features/seguridad",
  "/pricing",
  "/demo",
  "/about",
  "/faq",
  "/traders/manual",
  "/glosario",
  "/herramientas",
  // Las calculadoras, los documentos legales, el acceso, el test y una ficha de
  // glosario; las fichas y los legales salen de plantilla y con una de cada familia basta.
  "/herramientas/calculadora-de-riesgo",
  "/herramientas/significancia-estadistica",
  "/herramientas/monte-carlo",
  "/herramientas/recuperacion-de-drawdown",
  "/herramientas/prueba-de-fondeo",
  "/herramientas/proyector-de-capital",
  "/herramientas/coste-de-indisciplina",
  "/herramientas/reloj-de-sesiones",
  "/herramientas/ahorro-vs-suscripcion",
  "/herramientas/impacto-de-comisiones",
  "/traders/prop-firms",
  "/beta",
  "/test",
  "/glosario/expectancy",
  "/aviso-legal",
  "/privacidad",
  "/cookies",
  "/terminos",
];

const PANTALLAS = [
  { nombre: "escritorio", width: 1440, height: 900 },
  { nombre: "movil", width: 390, height: 844 },
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
function auditar() {
  const rgba = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[,/]/).map((x) => parseFloat(x));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const canal = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const luz = ({ r, g, b }) => 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
  const contraste = (a, b) => {
    const [l1, l2] = [luz(a), luz(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
  };
  const sobre = (frente, fondo) => ({
    r: frente.r * frente.a + fondo.r * (1 - frente.a),
    g: frente.g * frente.a + fondo.g * (1 - frente.a),
    b: frente.b * frente.a + fondo.b * (1 - frente.a),
    a: 1,
  });

  /** Fondo efectivo: compone las capas hasta dar con una opaca. */
  const fondoDe = (el) => {
    const capas = [];
    let n = el;
    while (n && n !== document.documentElement.parentElement) {
      const s = getComputedStyle(n);
      if (s.backgroundImage && s.backgroundImage !== "none") return { imagen: true };
      const c = rgba(s.backgroundColor);
      if (c && c.a > 0) {
        capas.push(c);
        if (c.a >= 0.999) break;
      }
      n = n.parentElement;
    }
    if (!capas.length) return { imagen: false, color: { r: 255, g: 255, b: 255, a: 1 } };
    let acc = capas[capas.length - 1];
    if (acc.a < 0.999) acc = sobre(acc, { r: 255, g: 255, b: 255, a: 1 });
    for (let i = capas.length - 2; i >= 0; i--) acc = sobre(capas[i], acc);
    return { imagen: false, color: acc };
  };

  const problemas = [];
  let medidos = 0;
  let sinFondoPlano = 0;

  const CORTE = 0.0001;
  for (const el of document.querySelectorAll("body *")) {
    if (el.closest("svg")) continue;
    // Lo decorativo (`aria-hidden`) no se juzga: si había que leerlo, el problema es el `aria-hidden`, no el contraste.
    if (el.closest("[aria-hidden='true']")) continue;
    // Solo elementos con texto propio.
    const texto = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join(" ")
      .trim();
    if (!texto) continue;

    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden") continue;
    const op = Number(s.opacity);
    if (op < 0.99) continue; // En plena animación de entrada: no es su estado final.
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;

    const tam = parseFloat(s.fontSize);
    const peso = Number(s.fontWeight) || 400;
    const grande = tam >= 24 || (tam >= 18.66 && peso >= 700);
    const minimo = grande ? 3 : 4.5;

    if (tam < 9.5) {
      problemas.push({
        tipo: "tamaño",
        texto: texto.slice(0, 40),
        detalle: `${tam.toFixed(1)}px (suelo 9,5)`,
        sel: `${el.tagName.toLowerCase()}.${(el.className || "").toString().split(/\s+/).filter(Boolean).slice(0, 2).join(".")}`,
      });
      continue;
    }

    const tinta = rgba(s.color);
    if (!tinta || tinta.a < CORTE) continue;
    const fondo = fondoDe(el);
    if (fondo.imagen) {
      sinFondoPlano++;
      continue;
    }
    const tintaSobre = tinta.a < 0.999 ? sobre(tinta, fondo.color) : tinta;
    const ratio = contraste(tintaSobre, fondo.color);
    medidos++;
    if (ratio < minimo) {
      problemas.push({
        tipo: "contraste",
        texto: texto.slice(0, 40),
        detalle: `${ratio.toFixed(2)}:1 (mínimo ${minimo}) · ${tam.toFixed(1)}px`,
        sel: `${el.tagName.toLowerCase()}.${(el.className || "").toString().split(/\s+/).filter(Boolean).slice(0, 2).join(".")}`,
      });
    }
  }
  return { medidos, sinFondoPlano, problemas };
}

const { server, base } = await servir(dir);
const navegador = await chromium.launch();
const fallos = [];
let totalMedidos = 0;
let totalSinFondo = 0;

for (const pantalla of PANTALLAS) {
  for (const tema of ["dark", "light"]) {
    const ctx = await navegador.newContext({
      viewport: { width: pantalla.width, height: pantalla.height },
      reducedMotion: "reduce", // El estado final, no un fotograma intermedio.
    });
    await ctx.addInitScript(
      (t) => window.localStorage.setItem("tj-theme", t),
      tema
    );
    const pagina = await ctx.newPage();
    for (const ruta of RUTAS) {
      await pagina.goto(`${base}${ruta}`, { waitUntil: "load" });
      await pagina.evaluate((t) => document.documentElement.setAttribute("data-theme", t), tema);
      await pagina.waitForTimeout(400);
      // Recorre la página para que entre lo diferido.
      await pagina.evaluate(async () => {
        const alto = document.documentElement.scrollHeight;
        for (let y = 0; y < alto; y += Math.round(window.innerHeight * 0.8)) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 90));
        }
        window.scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 200));
      });
      // Sin CSS no hay nada que medir: servir el export sin el prefijo de
      // despliegue da 404 en las hojas de estilo y se mediría una página sin
      // estilo, con números pero sin información.
      const hojas = await pagina.evaluate(() => document.styleSheets.length);
      if (!hojas) {
        console.error(
          `[legible] ${ruta} se ha servido SIN hojas de estilo. ` +
            `¿Falta NEXT_PUBLIC_BASE_PATH? Lo medido no valdría nada.`
        );
        process.exit(2);
      }
      const r = await pagina.evaluate(auditar);
      totalMedidos += r.medidos;
      totalSinFondo += r.sinFondoPlano;
      for (const p of r.problemas) {
        fallos.push(`${pantalla.nombre} ${tema} ${ruta} · ${p.tipo}: «${p.texto}» ${p.detalle} — ${p.sel}`);
      }
    }
    await ctx.close();
  }
}

await navegador.close();
server.close();

console.log(
  `[legible] ${totalMedidos} trozos de texto medidos contra su fondo real ` +
    `(${RUTAS.length} rutas × ${PANTALLAS.length} anchos × 2 temas)`
);
console.log(`[legible] ${totalSinFondo} sobre fondo con imagen o degradado — esos los mide humo.mjs`);

if (fallos.length) {
  // Se agrupan: el mismo componente aparece en muchas rutas.
  const unicos = [...new Set(fallos.map((f) => f.split(" · ").slice(1).join(" · ")))];
  console.log(`
[legible] ${fallos.length} aviso(s), ${unicos.length} distinto(s):`);
  for (const grupo of ["contraste", "tamaño"]) {
    const lista = unicos.filter((u) => u.startsWith(grupo));
    if (!lista.length) continue;
    console.log(`
  ── ${grupo} (${lista.length}) ──`);
    for (const f of lista.slice(0, 20)) console.log(`  ✗ ${f}`);
    if (lista.length > 20) console.log(`  … y ${lista.length - 20} más`);
    if (process.env.LEGIBLE_TODO) for (const f of lista.slice(20)) console.log(`  ✗ ${f}`);
  }
  process.exit(1);
}
console.log("[legible] correcto — todo el texto llega a AA sobre su fondo");
