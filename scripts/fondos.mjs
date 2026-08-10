/**
 * Comprobación del fondo grabado: que cada sección dibuje algo distinto.
 *
 * No sustituye a `tests/atlas.test.ts`: aquella vigila el guion declarado
 * —qué láminas tiene asignadas cada ruta— y ésta vigila lo que de verdad
 * acaba en el canvas. Son cosas distintas: el mapeo puede ser correcto y
 * el dibujo salir idéntico igualmente, porque dos juegos distintos pueden
 * terminar en la misma figura.
 *
 * El caso que la motivó: el atlas conocía diez rutas de setenta y cuatro.
 * El glosario entero (51 términos), las herramientas, el acceso
 * anticipado, las páginas de traders y las cuatro legales caían todas en
 * la ruta por defecto y enseñaban la curva de resultados de la portada —
 * incluida la política de privacidad, que tenía un gráfico de ganancias
 * detrás. Ninguna prueba de tipos ni de contrato veía eso; sólo se veía
 * abriendo la web página por página.
 *
 * Cómo mide: toma una huella de la tinta del canvas en TRES momentos del
 * recorrido, no sólo al final. Dos secciones con juegos distintos pueden
 * acabar en la misma lámina —`[calendar, heatmap]` y
 * `[rolling, distribution, heatmap]` terminan las dos en el mapa de
 * calor— y una huella tomada sólo al final las daría por iguales cuando
 * el visitante ha visto cosas distintas por el camino.
 *
 * Uso:
 *   node scripts/fondos.mjs                    (contra http://localhost:3000)
 *   node scripts/fondos.mjs --base http://…    (contra otra dirección)
 *   node scripts/fondos.mjs --serve out        (levanta su propio servidor)
 *
 * Sale con código 1 si algo falla, para poder colgarlo de la integración
 * continua.
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const args = process.argv.slice(2);
const leer = (bandera) => {
  const i = args.indexOf(bandera);
  return i >= 0 ? args[i + 1] : null;
};
const CARPETA = leer("--serve");
let BASE = leer("--base") ?? "http://localhost:3000";

/** Secciones que DEBEN llevar figura, cada una distinta de las demás. */
const CON_FIGURA = [
  "/",
  "/features",
  "/features/metricas",
  "/features/disciplina",
  "/features/seguridad",
  "/pricing",
  "/demo",
  "/faq",
  "/about",
  "/test",
  "/beta",
  "/traders/manual",
  "/traders/prop-firms",
  "/glosario",
  "/herramientas",
  /* Dos páginas derivadas, para comprobar que el reparto por nombre
     funciona y no cae en la figura de su índice. */
  "/glosario/drawdown",
  "/herramientas/monte-carlo",
];

/** Páginas donde una figura sobra: un texto legal no lleva gráfico detrás. */
const SIN_FIGURA = ["/privacidad", "/terminos", "/cookies", "/aviso-legal"];

/* ── Servidor estático propio, para no depender de nada externo ─────── */
const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

async function levantar(raiz) {
  const resolver = async (ruta) => {
    for (const c of [ruta, join(ruta, "index.html"), `${ruta}.html`]) {
      try {
        if ((await stat(c)).isFile()) return c;
      } catch {}
    }
    return null;
  };
  /* Mismo motivo que en `humo.mjs`: en Actions el sitio se construye con
     `NEXT_PUBLIC_BASE_PATH=/CountPipsWeb` porque Pages lo publica en una
     subcarpeta, y entonces el HTML pide `/CountPipsWeb/_next/...`. Si el
     servidor no neutraliza ese prefijo, todo da 404 y la comprobación
     mide una página sin estilos. En local la variable no existe y esto no
     hace nada. */
  const PREFIJO = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
  const server = createServer(async (req, res) => {
    let pedido = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (PREFIJO && (pedido === PREFIJO || pedido.startsWith(`${PREFIJO}/`))) {
      pedido = pedido.slice(PREFIJO.length) || "/";
    }
    const destino = await resolver(join(raiz, normalize(pedido).replace(/^(\.\.[/\\])+/, "")));
    if (!destino) return void res.writeHead(404).end("no encontrado");
    res.writeHead(200, {
      "content-type": TIPOS[extname(destino)] ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(await readFile(destino));
  });
  await new Promise((r) => server.listen(0, r));
  const url = `http://127.0.0.1:${server.address().port}`;
  console.log(`[fondos] sirviendo ${raiz} en ${url}`);
  return { url, cerrar: () => server.close() };
}

/* ── La huella ─────────────────────────────────────────────────────── */
async function muestrear(page) {
  return page.evaluate(() => {
    const c = document.querySelector("canvas");
    if (!c) return { hay: false, firma: "", tinta: 0 };
    const g = c.getContext("2d", { willReadFrequently: true });
    if (!g) return { hay: true, firma: "sin-contexto", tinta: -1 };
    const N = 26;
    let firma = "";
    let tinta = 0;
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const x = Math.floor((c.width * (i + 0.5)) / N);
        const y = Math.floor((c.height * (j + 0.5)) / N);
        const a = g.getImageData(x, y, 1, 1).data[3];
        tinta += a;
        firma += a > 8 ? "1" : "0";
      }
    }
    return { hay: true, firma, tinta };
  });
}

async function huella(page, ruta) {
  await page.goto(BASE + ruta + (ruta.endsWith("/") ? "" : "/"), { waitUntil: "networkidle" });
  await page.evaluate(() => document.querySelector("#tj-loader")?.remove());
  await page.waitForTimeout(900);

  const trozos = [];
  for (const parada of [0.25, 0.6, 1]) {
    await page.evaluate(async (p) => {
      const hasta = document.body.scrollHeight * p;
      for (let y = window.scrollY; y <= hasta; y += window.innerHeight * 0.5) {
        window.scrollTo({ top: y, behavior: "instant" });
        await new Promise((r) => setTimeout(r, 120));
      }
    }, parada);
    await page.waitForTimeout(1300);
    trozos.push(await muestrear(page));
  }
  return {
    tinta: trozos.reduce((s, t) => s + Math.max(0, t.tinta), 0),
    firma: trozos.map((t) => t.firma).join("|"),
  };
}

/* ── La pasada ─────────────────────────────────────────────────────── */
let servidor = null;
if (CARPETA) {
  servidor = await levantar(CARPETA);
  BASE = servidor.url;
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const vistas = new Map();
const fallos = [];

for (const ruta of CON_FIGURA) {
  const { tinta, firma } = await huella(page, ruta);
  if (tinta <= 0) {
    fallos.push(`${ruta}: no dibuja ninguna figura, y debería`);
    continue;
  }
  const previa = vistas.get(firma);
  if (previa) fallos.push(`${ruta}: dibuja exactamente lo mismo que ${previa}`);
  else vistas.set(firma, ruta);
}

for (const ruta of SIN_FIGURA) {
  const { tinta } = await huella(page, ruta);
  if (tinta > 0) fallos.push(`${ruta}: lleva figura y no debería (un texto legal no la necesita)`);
}

await browser.close();
servidor?.cerrar();

for (const f of fallos) console.log(`  fallo  ${f}`);
console.log(
  fallos.length
    ? `[fondos] ${fallos.length} problema(s) — ${vistas.size} fondos distintos en ${CON_FIGURA.length} secciones`
    : `[fondos] correcto — ${vistas.size} fondos distintos en ${CON_FIGURA.length} secciones, y ${SIN_FIGURA.length} páginas sin figura`,
);
process.exit(fallos.length ? 1 : 0);
