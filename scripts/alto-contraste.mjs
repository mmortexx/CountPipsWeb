/**
 * ALTO CONTRASTE: recorre el sitio compilado con el modo de alto contraste de
 * Windows emulado (`forced-colors: active`). En ese modo el navegador cambia
 * fondos, bordes y textos por los colores del sistema y quita las sombras:
 * todo lo que distinga un estado solo con un fondo translúcido o con
 * `box-shadow` desaparece. El público de un programa solo para Windows
 * incluye a quien usa ese modo.
 *
 * Tres comprobaciones:
 *  1. Cada parada del tabulador lleva contorno (`outline`): el anillo de
 *     `ring-*` es una sombra y aquí no se pinta.
 *  2. Lo elegido (`aria-pressed`, `aria-selected`, `data-activo`) se pinta
 *     distinto de sus hermanos sin elegir, sin contar el grosor de letra.
 *  3. La bola de cada interruptor (`role="switch"`) se distingue de su pista.
 *
 * Uso:  node scripts/alto-contraste.mjs --serve out
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, extname } from "node:path";

const dir = process.argv.slice(2).find((a) => !a.startsWith("-")) || "out";
if (!existsSync(dir)) {
  console.log(`[alto-contraste] no encuentro el directorio «${dir}». ¿Falta compilar el sitio con \`npm run build\`?`);
  process.exit(1);
}
const PREFIJO = process.env.NEXT_PUBLIC_BASE_PATH || "";

const RUTAS = ["/", "/pricing/", "/features/", "/demo/", "/glosario/", "/herramientas/calculadora-de-riesgo/", "/beta/"];
/** Por debajo de esto no ha medido de verdad (páginas que no cargaron, selectores muertos). */
const PARADAS_MINIMAS = 150;
const ESTADOS_MINIMOS = 5;
const INTERRUPTORES_MINIMOS = 2;

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

const { server, base } = await servir(dir);
const navegador = await chromium.launch();
const fallos = [];
let paradasTotales = 0;
let estadosTotales = 0;
let interruptoresTotales = 0;

/** Estados elegidos frente a sus hermanos, e interruptores; corre en la página. */
const mideEstados = () => {
  const firma = (el) => {
    const s = getComputedStyle(el);
    const lados = ["Top", "Right", "Bottom", "Left"]
      .map((l) => `${s[`border${l}Width`]} ${s[`border${l}Style`]} ${s[`border${l}Color`]}`)
      .join("|");
    return [s.backgroundColor, s.color, lados, `${s.outlineStyle} ${s.outlineWidth}`, s.textDecorationLine].join(" · ");
  };
  const visible = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
  const elegido = (el) =>
    el.getAttribute("aria-pressed") === "true" || el.getAttribute("aria-selected") === "true" || el.getAttribute("data-activo") === "true";
  const out = { estados: 0, iguales: [], interruptores: 0, bolas: [] };
  const vistos = new Set();
  for (const el of document.querySelectorAll('[aria-pressed="true"], [aria-selected="true"], [data-activo="true"]')) {
    if (!visible(el) || !el.parentElement || vistos.has(el.parentElement)) continue;
    const otro = [...el.parentElement.children].find((h) => h !== el && h.tagName === el.tagName && !elegido(h) && visible(h));
    if (!otro) continue;
    vistos.add(el.parentElement);
    out.estados++;
    if (firma(el) === firma(otro)) {
      out.iguales.push(`«${(el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 24)}» elegido se pinta igual que «${(otro.textContent || "").trim().replace(/\s+/g, " ").slice(0, 24)}»`);
    }
  }
  for (const sw of document.querySelectorAll('[role="switch"]')) {
    if (!visible(sw)) continue;
    const bola = sw.querySelector("span");
    if (!bola) continue;
    out.interruptores++;
    const sp = getComputedStyle(sw);
    const sb = getComputedStyle(bola);
    const bordeBola = parseFloat(sb.borderTopWidth) >= 1 && sb.borderTopStyle !== "none";
    if (!bordeBola && sb.backgroundColor === sp.backgroundColor) {
      out.bolas.push(`interruptor «${sw.getAttribute("aria-label") || sw.getAttribute("aria-labelledby") || "?"}»: la bola y la pista son del mismo color (${sb.backgroundColor})`);
    }
  }
  return out;
};

for (const ruta of RUTAS) {
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce", forcedColors: "active" });
  const p = await ctx.newPage();
  try {
    await p.goto(base + ruta, { waitUntil: "load", timeout: 30000 });
  } catch {
    fallos.push({ ruta, detalle: "la página no cargó" });
    await ctx.close();
    continue;
  }
  await p.waitForTimeout(700);
  if (!(await p.evaluate(() => matchMedia("(forced-colors: active)").matches))) {
    fallos.push({ ruta, detalle: "el navegador no emula `forced-colors: active`: la guarda no mide nada" });
    await ctx.close();
    continue;
  }

  let paradas = 0;
  const sinContorno = [];
  for (let i = 0; i < 400; i++) {
    await p.keyboard.press("Tab");
    const r = await p.evaluate(() => {
      const a = document.activeElement;
      if (!a || a === document.body) return { fin: true };
      if (a.dataset.contrasteVisto === "1") return { ciclo: true };
      a.dataset.contrasteVisto = "1";
      const cs = getComputedStyle(a);
      return {
        tag: a.tagName,
        texto: (a.getAttribute("aria-label") || a.textContent || "").trim().replace(/\s+/g, " ").slice(0, 30),
        visible: cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 1,
      };
    });
    if (r.fin || r.ciclo) break;
    paradas++;
    if (!r.visible) sinContorno.push(`<${r.tag}> «${r.texto}»`);
  }
  paradasTotales += paradas;
  for (const x of sinContorno.slice(0, 5)) fallos.push({ ruta, detalle: `con el foco, nada lo señala: ${x}` });
  if (sinContorno.length > 5) fallos.push({ ruta, detalle: `… y ${sinContorno.length - 5} parada(s) más sin contorno` });

  const e = await p.evaluate(mideEstados);
  estadosTotales += e.estados;
  interruptoresTotales += e.interruptores;
  for (const x of [...e.iguales, ...e.bolas]) fallos.push({ ruta, detalle: x });
  console.log(`  ${ruta.padEnd(38)} ${String(paradas).padStart(3)} paradas (${sinContorno.length} sin contorno) · ${e.estados} estados · ${e.interruptores} interruptores`);
  await ctx.close();
}

// La ayuda de atajos tiene su propio interruptor y solo existe al abrirla.
{
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce", forcedColors: "active" });
  const p = await ctx.newPage();
  await p.goto(base + "/", { waitUntil: "load", timeout: 30000 });
  await p.waitForTimeout(700);
  await p.locator("header a:visible").first().focus();
  await p.keyboard.press("?");
  await p.waitForTimeout(700);
  const e = await p.evaluate(mideEstados);
  interruptoresTotales += e.interruptores;
  for (const x of e.bolas) fallos.push({ ruta: "/ (ayuda de atajos)", detalle: x });
  console.log(`  ${"/ (ayuda de atajos)".padEnd(38)} ${e.interruptores} interruptores`);
  await ctx.close();
}

await navegador.close();
server.close();

if (fallos.length) {
  console.log(`\n  problemas — ${fallos.length}`);
  for (const f of fallos) console.log(`     ${f.ruta}  ${f.detalle}`);
}
console.log(`\n[alto-contraste] ${paradasTotales} paradas · ${estadosTotales} grupos con un elegido · ${interruptoresTotales} interruptores`);
// Vigila ausencias: si deja de encontrar paradas, estados o interruptores, aprobaría sin mirar.
if (paradasTotales < PARADAS_MINIMAS || estadosTotales < ESTADOS_MINIMOS || interruptoresTotales < INTERRUPTORES_MINIMOS) {
  console.log(`[alto-contraste] midió menos de lo esperado (mínimos: ${PARADAS_MINIMAS} paradas, ${ESTADOS_MINIMOS} estados, ${INTERRUPTORES_MINIMOS} interruptores): su respuesta no vale`);
  process.exit(1);
}
if (fallos.length) {
  console.log(`[alto-contraste] ${fallos.length} problema(s) con el alto contraste de Windows`);
  console.log("[alto-contraste] las reglas viven en `@media (forced-colors: active)` de `globals.css`: colores del sistema (Highlight, CanvasText) y contorno en vez de sombra");
  process.exit(1);
}
console.log("[alto-contraste] correcto — con el alto contraste de Windows, el foco se ve, lo elegido se distingue y los interruptores enseñan su bola");
