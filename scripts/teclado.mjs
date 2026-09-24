/**
 * TECLADO — el sitio entero sin ratón
 *
 * ── Qué mide ──────────────────────────────────────────────────────────
 * Tres cosas que se rompen por separado y que ninguna revisión visual
 * encuentra, porque con el ratón todas funcionan:
 *
 *  1. Que cada parada del tabulador se VEA. Un control al que se llega
 *     sin que nada lo señale deja a quien navega con teclado sin saber
 *     dónde está: es el criterio 2.4.7 de WCAG, y basta un `outline:
 *     none` suelto para perderlo en un sitio y en ningún otro.
 *  2. Que el megamenú se abra con Enter, se cierre con Escape y
 *     devuelva el foco a su disparador. Si no vuelve, el foco cae al
 *     principio del documento y hay que volver a recorrerlo entero.
 *  3. Que los diálogos atrapen el foco mientras están abiertos. Un
 *     modal del que el tabulador se escapa deja a la persona navegando
 *     por detrás de una capa que no puede ver ni cerrar.
 *
 * ── Qué encontró el día que se escribió (2026-09-20) ──────────────────
 * Nada. 57 paradas en la portada, todas con indicador; el megamenú
 * correcto; y los tres diálogos —glosario, ayuda de atajos y cajón
 * móvil— atrapando el foco y devolviéndolo. Se escribió porque nada de
 * eso estaba sostenido por ninguna comprobación: la de la demo existía,
 * la del sitio de marketing no.
 *
 * ── Un falso positivo que conviene no volver a perseguir ──────────────
 * El diálogo del glosario NO lleva `aria-modal="true"` y los otros dos
 * sí. No es una incoherencia que arreglar: ese lo monta Radix, que a
 * propósito esconde el resto del documento con `aria-hidden` —se
 * midieron 14 elementos— en vez de declarar `aria-modal`, porque el
 * soporte de ese atributo en los lectores reales es irregular. Por eso
 * esta guarda comprueba el COMPORTAMIENTO (el foco queda dentro, Escape
 * cierra) y no la presencia del atributo.
 *
 * Uso:  node scripts/teclado.mjs --serve out
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, extname } from "node:path";

const dir = process.argv.slice(2).find((a) => !a.startsWith("-")) || "out";
if (!existsSync(dir)) {
  console.log(`[teclado] no encuentro el directorio «${dir}». ¿Falta compilar el sitio con \`npm run build\`?`);
  process.exit(1);
}
const PREFIJO = process.env.NEXT_PUBLIC_BASE_PATH || "";

const RUTAS = ["/", "/pricing/", "/glosario/", "/en/"];
/** Por debajo de esto, el recorrido no está midiendo la página entera. */
const PARADAS_MINIMAS = 20;

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

// ── 1. cada parada del tabulador se ve ────────────────────────────────
for (const ruta of RUTAS) {
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  try {
    await p.goto(base + ruta, { waitUntil: "load", timeout: 30000 });
  } catch {
    fallos.push({ ruta, detalle: "la página no cargó: la guarda no pudo medirla" });
    await ctx.close();
    continue;
  }
  await p.waitForTimeout(700);

  let paradas = 0;
  const sinIndicador = [];
  for (let i = 0; i < 400; i++) {
    await p.keyboard.press("Tab");
    const r = await p.evaluate(() => {
      const a = document.activeElement;
      if (!a || a === document.body) return { fin: true };
      /* La marca va en el ELEMENTO, no en su nombre: dos botones que se
         llaman igual son dos paradas distintas, y cortar por nombre
         repetido hacía creer que el recorrido se atascaba. */
      if (a.dataset.tabVisto === "1") return { ciclo: true };
      a.dataset.tabVisto = "1";
      const cs = getComputedStyle(a);
      const anillo = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0;
      const sombra = cs.boxShadow !== "none";
      return {
        tag: a.tagName,
        texto: (a.textContent || "").trim().replace(/\s+/g, " ").slice(0, 30),
        visible: anillo || sombra,
      };
    });
    if (r.fin || r.ciclo) break;
    paradas++;
    if (!r.visible) sinIndicador.push(`<${r.tag}> «${r.texto}»`);
  }
  paradasTotales += paradas;

  if (paradas < PARADAS_MINIMAS) {
    fallos.push({ ruta, detalle: `solo ${paradas} paradas de tabulador: se esperaban decenas. ¿Cargó la página?` });
  }
  for (const x of sinIndicador.slice(0, 6)) {
    fallos.push({ ruta, detalle: `se llega con el tabulador y nada lo señala: ${x}` });
  }
  if (sinIndicador.length > 6) fallos.push({ ruta, detalle: `… y ${sinIndicador.length - 6} parada(s) más sin señalar` });
  console.log(`  ${ruta.padEnd(14)} ${String(paradas).padStart(3)} paradas · ${sinIndicador.length} sin indicador de foco`);
  await ctx.close();
}

// ── 2. el megamenú ────────────────────────────────────────────────────
{
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  await p.goto(base + "/", { waitUntil: "load", timeout: 30000 });
  await p.waitForTimeout(700);
  const disp = p.locator("#navbar-producto-trigger").first();
  if (!(await disp.count())) {
    fallos.push({ ruta: "/", detalle: "no encontré `#navbar-producto-trigger`: ¿se renombró el megamenú?" });
  } else {
    await disp.focus();
    await p.keyboard.press("Enter");
    await p.waitForTimeout(400);
    const abierto = await p.evaluate(() => document.getElementById("navbar-producto-trigger")?.getAttribute("aria-expanded"));
    if (abierto !== "true") fallos.push({ ruta: "/", detalle: `el megamenú no se abre con Enter (aria-expanded=${abierto})` });
    await p.keyboard.press("Escape");
    await p.waitForTimeout(400);
    const tras = await p.evaluate(() => ({
      expandido: document.getElementById("navbar-producto-trigger")?.getAttribute("aria-expanded"),
      focoId: document.activeElement?.id,
    }));
    if (tras.expandido !== "false") fallos.push({ ruta: "/", detalle: "Escape no cierra el megamenú" });
    if (tras.focoId !== "navbar-producto-trigger") {
      fallos.push({ ruta: "/", detalle: `al cerrar, el foco no vuelve al disparador (quedó en «${tras.focoId || "ninguno"}»): hay que recorrer la página entera otra vez` });
    }
    console.log(`  megamenú: abre con Enter, cierra con Escape, el foco vuelve a su sitio`);
  }
  await ctx.close();
}

// ── 3. los diálogos atrapan el foco y lo devuelven ────────────────────
const DIALOGOS = [
  {
    nombre: "glosario",
    ruta: "/faq/",
    ancho: 1280,
    abrir: async (p) => {
      const b = p.locator("button").filter({ hasText: /glosario|glossary/i }).first();
      if (!(await b.count())) return false;
      await b.focus();
      await p.keyboard.press("Enter");
      return true;
    },
  },
  {
    nombre: "ayuda de atajos",
    ruta: "/",
    ancho: 1280,
    abrir: async (p) => {
      await p.click("body", { position: { x: 400, y: 400 } });
      await p.keyboard.press("Shift+Slash");
      return true;
    },
  },
  {
    nombre: "cajón de navegación móvil",
    ruta: "/",
    ancho: 390,
    abrir: async (p) => {
      const b = p.locator('button[aria-controls="mobile-nav-drawer"]').first();
      if (!(await b.count())) return false;
      await b.focus();
      await p.keyboard.press("Enter");
      return true;
    },
  },
];

for (const d of DIALOGOS) {
  const ctx = await navegador.newContext({ viewport: { width: d.ancho, height: 900 }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  await p.goto(base + d.ruta, { waitUntil: "load", timeout: 30000 });
  await p.waitForTimeout(800);
  if (!(await d.abrir(p))) {
    fallos.push({ ruta: d.ruta, detalle: `no se pudo abrir el diálogo «${d.nombre}»: ¿cambió el disparador?` });
    await ctx.close();
    continue;
  }
  await p.waitForTimeout(700);
  const abierto = await p.evaluate(() => {
    const dl = document.querySelector('[role="dialog"][data-state="open"], [role="dialog"][data-visible="true"]') || document.querySelector('[role="dialog"]');
    return dl ? { hay: true, etiquetado: !!(dl.getAttribute("aria-label") || dl.getAttribute("aria-labelledby")), dentro: dl.contains(document.activeElement) } : { hay: false };
  });
  if (!abierto.hay) {
    fallos.push({ ruta: d.ruta, detalle: `«${d.nombre}» no expone ningún role="dialog" al abrirse` });
    await ctx.close();
    continue;
  }
  if (!abierto.etiquetado) fallos.push({ ruta: d.ruta, detalle: `«${d.nombre}» se abre sin nombre: un lector lo anuncia como «diálogo» y ya` });
  if (!abierto.dentro) fallos.push({ ruta: d.ruta, detalle: `«${d.nombre}» se abre y el foco se queda fuera` });

  let fuera = 0;
  for (let i = 0; i < 30; i++) {
    await p.keyboard.press("Tab");
    const sigueDentro = await p.evaluate(() => {
      const dl = document.querySelector('[role="dialog"][data-state="open"], [role="dialog"][data-visible="true"]') || document.querySelector('[role="dialog"]');
      return dl ? dl.contains(document.activeElement) : true;
    });
    if (!sigueDentro) fuera++;
  }
  if (fuera > 0) fallos.push({ ruta: d.ruta, detalle: `el foco se escapa de «${d.nombre}»: ${fuera} de 30 tabuladores acabaron detrás de la capa` });

  await p.keyboard.press("Escape");
  await p.waitForTimeout(600);
  const cerrado = await p.evaluate(() => {
    const dl = document.querySelector('[role="dialog"][data-state="open"], [role="dialog"][data-visible="true"]');
    return !dl;
  });
  if (!cerrado) fallos.push({ ruta: d.ruta, detalle: `Escape no cierra «${d.nombre}»` });
  console.log(`  diálogo «${d.nombre}»: ${fuera === 0 ? "atrapa el foco" : "SE ESCAPA"}, ${cerrado ? "cierra con Escape" : "NO CIERRA"}`);
  await ctx.close();
}

await navegador.close();
server.close();

if (fallos.length) {
  console.log(`\n  problemas — ${fallos.length}`);
  for (const f of fallos) console.log(`     ${f.ruta}  ${f.detalle}`);
}

console.log(`\n[teclado] ${RUTAS.length} rutas recorridas · ${paradasTotales} paradas de tabulador · ${DIALOGOS.length} diálogos`);

/* Esta guarda comprueba sobre todo AUSENCIAS —nada sin indicador, nada
   que se escape—, y una guarda así aprueba siempre en cuanto deja de
   recorrer. Si apenas ha encontrado paradas, no ha mirado el sitio. */
if (paradasTotales < RUTAS.length * PARADAS_MINIMAS) {
  console.log(`[teclado] solo ${paradasTotales} paradas en ${RUTAS.length} rutas: la guarda no está recorriendo el sitio, así que su respuesta no vale`);
  process.exit(1);
}
if (fallos.length) {
  console.log(`[teclado] ${fallos.length} problema(s) navegando sin ratón`);
  console.log("[teclado] el anillo de foco lo pinta la regla `:focus-visible` de `globals.css`; un `outline: none` suelto lo borra en un sitio y en ningún otro");
  process.exit(1);
}
console.log("[teclado] correcto — toda parada se ve, el megamenú devuelve el foco, y los diálogos lo atrapan y lo sueltan donde debían");
