/**
 * PESOS — ¿alguien le pide a una fuente un grosor que no tiene?
 *
 * ── Qué mide ──────────────────────────────────────────────────────────
 * Las dos serif del sitio llevan el eje de grosor RECORTADO a lo que se
 * usa: la redonda a 400–500, la cursiva fija en 400. Eso quitó 42,8 kB y
 * 81,2 kB de fichero sin cambiar un píxel, porque una fuente variable
 * paga por cada tramo del eje aunque nadie lo pise.
 *
 * El precio de ese recorte es un fallo silencioso: si alguien escribe
 * `font-serif font-bold` sobre un titular, la fuente ya no tiene el 700 y
 * el navegador NO avisa — lo finge, engordando los trazos por su cuenta.
 * Queda una negrita falsa, sucia y desigual, que no rompe ninguna prueba
 * y que nadie mira porque «la letra está en negrita, ¿no?».
 *
 * Así que esta guarda recorre el sitio compuesto, mira qué grosor pide de
 * verdad cada elemento que usa una de esas familias, y lo contrasta con el
 * rango que `src/app/layout.tsx` declara para ella. Los dos números salen
 * de ahí: no hay ninguno escrito a mano en este fichero, de modo que si
 * mañana se vuelve a ampliar el eje, basta con cambiar el `weight` de
 * `layout.tsx` y esta guarda se adapta sola.
 *
 * ── Qué encontró el día que se escribió (2026-09-20) ──────────────────
 * Nada: se escribió a la vez que el recorte, y sirvió para justificarlo.
 * Medidos 104 elementos a 500, 2 a 400 y 2 en cursiva a 400, en trece
 * rutas. Se vio en rojo pidiendo un 700 a mano antes de darla por buena.
 *
 * ── Lo que NO mira ────────────────────────────────────────────────────
 * Las familias sin recortar (Instrument Sans, Geist Mono): ahí el eje
 * está entero y no hay nada que se pueda pedir de más.
 *
 * Uso:  node scripts/pesos.mjs --serve out
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";

const args = process.argv.slice(2);
const dir = args.includes("--serve") ? args[args.indexOf("--serve") + 1] : "out";
const PREFIJO = process.env.NEXT_PUBLIC_BASE_PATH || "";

/* Rutas con serif de sobra: portadas de los dos idiomas, las páginas con
   titular grande, el glosario, la demo y el 404, que compone su cifra con
   la serif y es la que más fácil se olvida. */
const RUTAS = [
  "/", "/pricing", "/features", "/features/metricas", "/about", "/beta",
  "/glosario", "/glosario/expectancy", "/herramientas",
  "/herramientas/calculadora-de-riesgo", "/faq", "/demo", "/terminos",
  "/en/", "/en/features", "/en/pricing", "/en/about", "/en/glosario",
];

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

/** Los rangos declarados en `layout.tsx`, que son la única fuente de verdad. */
async function rangosDeclarados() {
  const fuente = await readFile("src/app/layout.tsx", "utf8");
  const encontrados = [];
  const re = /path:\s*"\.\/fonts\/([^"]+)\.woff2"\s*,\s*weight:\s*"([^"]+)"\s*,\s*style:\s*"(normal|italic)"/g;
  for (const m of fuente.matchAll(re)) {
    const [min, max] = m[2].trim().split(/\s+/).map(Number);
    encontrados.push({
      familia: m[1].replace(/-Italic$/, ""),
      ficheroCursiva: m[1].endsWith("-Italic"),
      estilo: m[3],
      min,
      max: Number.isFinite(max) ? max : min,
    });
  }
  return encontrados;
}

const declarados = await rangosDeclarados();
/* Sólo las familias con el eje recortado. Si una declara el rango completo
   de su fichero, no hay nada que pedirle de más. */
const VIGILADAS = declarados.filter((d) => /Newsreader/i.test(d.familia));
if (!VIGILADAS.length) {
  console.log("[pesos] no se encontró ninguna declaración de Newsreader en src/app/layout.tsx");
  console.log("[pesos] si la fuente se renombró, actualiza esta guarda: sin declaración no vigila nada");
  process.exit(1);
}
console.log("[pesos] rangos declarados en layout.tsx:");
for (const d of VIGILADAS) {
  console.log(`   ${d.familia}${d.estilo === "italic" ? " (cursiva)" : ""}: ${d.min}${d.max !== d.min ? `–${d.max}` : " fijo"}`);
}

const { server, base } = await servir(dir);
const navegador = await chromium.launch();
const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });

const fallos = [];
let elementos = 0;
let rutasVistas = 0;

for (const ruta of RUTAS) {
  const pag = await ctx.newPage();
  try {
    await pag.goto(`${base}${ruta}`, { waitUntil: "networkidle", timeout: 30000 });
  } catch {
    fallos.push({ ruta, regla: "ruta que no carga", detalle: "la guarda no pudo medirla" });
    await pag.close();
    continue;
  }
  await pag.waitForTimeout(250);
  rutasVistas++;

  const medidos = await pag.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll("*")) {
      const cs = getComputedStyle(el);
      const fam = cs.fontFamily;
      if (!/Newsreader/i.test(fam)) continue;
      const propio = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!propio) continue;
      out.push({
        peso: Number(cs.fontWeight),
        cursiva: cs.fontStyle === "italic",
        tag: el.tagName,
        txt: (el.textContent || "").trim().slice(0, 32),
      });
    }
    return out;
  });

  for (const m of medidos) {
    elementos++;
    const d = VIGILADAS.find((v) => v.estilo === (m.cursiva ? "italic" : "normal"));
    if (!d) continue;
    if (m.peso < d.min || m.peso > d.max) {
      fallos.push({
        ruta,
        regla: `grosor fuera del rango de la ${m.cursiva ? "cursiva" : "redonda"}`,
        detalle: `<${m.tag}> pide ${m.peso}, la fuente trae ${d.min}${d.max !== d.min ? `–${d.max}` : " fijo"} — «${m.txt}»`,
      });
    }
  }
  await pag.close();
}

await navegador.close();
server.close();

const porRegla = {};
for (const x of fallos) (porRegla[x.regla] ||= []).push(x);
for (const [regla, casos] of Object.entries(porRegla)) {
  console.log(`\n  ${regla} — ${casos.length} caso(s)`);
  for (const c of casos.slice(0, 8)) console.log(`     ${c.ruta}  ${c.detalle}`);
  if (casos.length > 8) console.log(`     … y ${casos.length - 8} más`);
}

console.log(`\n[pesos] ${rutasVistas} de ${RUTAS.length} rutas · ${elementos} elementos compuestos con la serif`);
/* Si no encuentra elementos, algo se rompió: la serif está en todos los
   titulares del sitio. Una guarda que no mide nada pasa siempre. */
if (elementos < 50) {
  console.log(`[pesos] sólo ${elementos} elementos con la serif: se esperaban decenas. ¿Cambió la familia o falló la carga?`);
  process.exit(1);
}
if (fallos.length) {
  console.log(`[pesos] ${fallos.length} elemento(s) piden un grosor que la fuente no trae`);
  console.log("[pesos] el navegador lo finge: engorda o adelgaza el trazo él mismo, y no avisa");
  console.log("[pesos] o se usa un grosor del rango, o se amplía el eje en `src/app/fonts` y el `weight` de `src/app/layout.tsx`");
  process.exit(1);
}
console.log("[pesos] correcto — nadie le pide a la serif un grosor que no tenga");
