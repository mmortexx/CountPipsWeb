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
 *  2. Lo elegido (`aria-pressed`, `aria-selected`, radio marcado, `data-activo`) se pinta
 *     distinto de sus hermanos sin elegir, sin contar el grosor de letra, y
 *     su texto se lee (fotografiado: ver `textoSeLee`).
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
    el.getAttribute("aria-pressed") === "true" || el.getAttribute("aria-selected") === "true" || el.getAttribute("data-activo") === "true" ||
    (el.getAttribute("role") === "radio" && el.getAttribute("aria-checked") === "true");
  const out = { estados: 0, iguales: [], interruptores: 0, bolas: [], textos: [] };
  const vistos = new Set();
  for (const el of document.querySelectorAll('[aria-pressed="true"], [aria-selected="true"], [role="radio"][aria-checked="true"], [data-activo="true"]')) {
    if (!visible(el) || !el.parentElement || vistos.has(el.parentElement)) continue;
    const otro = [...el.parentElement.children].find((h) => h !== el && h.tagName === el.tagName && !elegido(h) && visible(h));
    if (!otro) continue;
    vistos.add(el.parentElement);
    out.estados++;
    if ((el.textContent || "").trim()) {
      el.dataset.contrasteElegido = String(out.textos.length);
      out.textos.push({ n: out.textos.length, nombre: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 24) });
    }
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

/* En este modo Chromium pinta tras cada texto una placa del color del fondo
   (Canvas). Sobre un elegido pintado de Highlight, la placa tapa el fondo y el
   texto (HighlightText, del mismo tono que Canvas) desaparece. No se ve en los
   estilos calculados: se fotografía el elegido y se compara el fondo entre las
   letras con el de alrededor (su relleno), que es el color con que se pinta lo
   elegido de verdad. Se mide, no se calcula: en Linux Highlight es translúcido
   y dos capas elegidas (botón y pieza viajera de la demo) se oscurecen entre
   sí. Sin placa, el fondo entre letras pasa de la mitad. */
const UMBRAL_FONDO_EN_TEXTO = 0.25;
let textosMedidos = 0;
let lector = null;
async function textoSeLee(p, t) {
  // Foto de la ventana, no de la página entera: esa estira la ventana y la maqueta se mueve.
  const el = p.locator(`[data-contraste-elegido="${t.n}"]`);
  await el.scrollIntoViewIfNeeded();
  // Las letras y la caja del elegido: una pieza decorativa a todo lo ancho
  // agrandaría la caja de las letras y la daría por buena.
  const { letras, caja } = await el.evaluate((x) => {
    const recorrido = document.createTreeWalker(x, NodeFilter.SHOW_TEXT);
    let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
    for (let n = recorrido.nextNode(); n; n = recorrido.nextNode()) {
      if (!n.textContent.trim()) continue;
      const rango = document.createRange();
      rango.selectNodeContents(n);
      for (const q of rango.getClientRects()) {
        a = Math.min(a, q.left); b = Math.min(b, q.top); c = Math.max(c, q.right); d = Math.max(d, q.bottom);
      }
    }
    const k = x.getBoundingClientRect();
    const x0 = Math.max(0, Math.floor(k.left)), y0 = Math.max(0, Math.floor(k.top));
    return {
      letras: c > a ? { x: a, y: b, width: c - a, height: d - b } : { x: 0, y: 0, width: 0, height: 0 },
      caja: {
        x: x0, y: y0,
        width: Math.min(innerWidth, Math.ceil(k.right)) - x0,
        height: Math.min(innerHeight, Math.ceil(k.bottom)) - y0,
      },
    };
  });
  if (letras.width < 4 || letras.height < 4 || caja.width < 4 || caja.height < 4) return { parte: 1, pintado: true };
  const png = await p.screenshot({ clip: caja });
  // El color de selección y el de la página, para cuando el elegido no tiene
  // relleno alrededor de las letras que fotografiar.
  const seleccion = await p.evaluate(() => {
    const lee = (sistema) => {
      const i = document.createElement("i");
      i.style.color = sistema;
      document.body.append(i);
      const s = getComputedStyle(i).color;
      i.remove();
      const n = /^rgba?\(/.test(s) ? s.match(/[\d.]+/g).map(Number) : [];
      return { s, n };
    };
    const h = lee("Highlight"), c = lee("Canvas");
    if (![3, 4].includes(h.n.length) || c.n.length !== 3) return { error: `Highlight «${h.s}», Canvas «${c.s}»` };
    const a = h.n[3] ?? 1;
    return { rgb: [0, 1, 2].map((k) => Math.round(h.n[k] * a + c.n[k] * (1 - a))), canvas: c.n };
  });
  if (seleccion.error) throw new Error(`[alto-contraste] no sé leer los colores del sistema: ${seleccion.error}`);
  // Las letras, en píxeles de la foto de la caja (sin escalar: deviceScaleFactor 1).
  const t0 = {
    x: Math.max(0, Math.floor(letras.x - caja.x)), y: Math.max(0, Math.floor(letras.y - caja.y)),
    x1: Math.ceil(letras.x + letras.width - caja.x), y1: Math.ceil(letras.y + letras.height - caja.y),
  };
  lector ??= await (await navegador.newContext()).newPage();
  return lector.evaluate(async ({ b64, sel, canvas, t0 }) => {
    const img = new Image();
    img.src = "data:image/png;base64," + b64;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext("2d");
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    const dist = (p, q) => Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]);
    const masVisto = (m) => [...m].sort((a, b) => b[1] - a[1]);
    const enLetras = [], alrededor = new Map(), cuenta = new Map();
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        const i = (y * c.width + x) * 4;
        const px = [d[i], d[i + 1], d[i + 2]];
        const k = px.join(",");
        // Un píxel de margen alrededor de las letras: el antialias no es fondo.
        if (x >= t0.x - 1 && x < t0.x1 + 1 && y >= t0.y - 1 && y < t0.y1 + 1) {
          if (x >= t0.x && x < t0.x1 && y >= t0.y && y < t0.y1) {
            enLetras.push(px);
            cuenta.set(k, (cuenta.get(k) ?? 0) + 1);
          }
        } else alrededor.set(k, (alrededor.get(k) ?? 0) + 1);
      }
    }
    const nAlrededor = [...alrededor.values()].reduce((s, n) => s + n, 0);
    const fondo = nAlrededor >= 20 ? masVisto(alrededor)[0][0].split(",").map(Number) : sel;
    const parte = enLetras.filter((px) => dist(px, fondo) < 60).length / Math.max(1, enLetras.length);
    // Para que un fallo diga qué se pintó en vez de qué faltó.
    const vistos = masVisto(cuenta).slice(0, 3)
      .map(([k, n]) => `rgb(${k}) ${Math.round((n / Math.max(1, enLetras.length)) * 100)} %`).join(", ");
    return { parte, pintado: dist(fondo, canvas) >= 60, fondo: `rgb(${fondo.join(",")})`, vistos };
  }, { b64: png.toString("base64"), sel: seleccion.rgb, canvas: seleccion.canvas, t0 });
}

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
  for (const t of e.textos) {
    textosMedidos++;
    const { parte, pintado, fondo, vistos } = await textoSeLee(p, t);
    if (!pintado) {
      fallos.push({ ruta, detalle: `«${t.nombre}» elegido no se pinta de color de selección: alrededor de sus letras se ve ${fondo}, el fondo de la página` });
    } else if (parte < UMBRAL_FONDO_EN_TEXTO) {
      fallos.push({ ruta, detalle: `el texto de «${t.nombre}» elegido no se lee: solo el ${Math.round(parte * 100)} % de la caja de sus letras es de su fondo ${fondo} (el navegador le pone una placa del color de la página; falta \`forced-color-adjust: none\`). Se pintó: ${vistos}` });
    }
  }
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
console.log(`\n[alto-contraste] ${paradasTotales} paradas · ${estadosTotales} grupos con un elegido (${textosMedidos} textos fotografiados) · ${interruptoresTotales} interruptores`);
// Vigila ausencias: si deja de encontrar paradas, estados o interruptores, aprobaría sin mirar.
if (paradasTotales < PARADAS_MINIMAS || estadosTotales < ESTADOS_MINIMOS || textosMedidos < ESTADOS_MINIMOS || interruptoresTotales < INTERRUPTORES_MINIMOS) {
  console.log(`[alto-contraste] midió menos de lo esperado (mínimos: ${PARADAS_MINIMAS} paradas, ${ESTADOS_MINIMOS} estados, ${INTERRUPTORES_MINIMOS} interruptores): su respuesta no vale`);
  process.exit(1);
}
if (fallos.length) {
  console.log(`[alto-contraste] ${fallos.length} problema(s) con el alto contraste de Windows`);
  console.log("[alto-contraste] las reglas viven en `@media (forced-colors: active)` de `globals.css`: colores del sistema (Highlight, CanvasText) y contorno en vez de sombra");
  process.exit(1);
}
console.log("[alto-contraste] correcto — con el alto contraste de Windows, el foco se ve, lo elegido se distingue y los interruptores enseñan su bola");
