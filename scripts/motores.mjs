/**
 * MOTORES: las rutas principales y las cuatro pestañas de la demo en Chromium,
 * Firefox y WebKit (el motor de Safari), a 375 y 1440 px y en los dos temas.
 * El resto de auditorías solo abre Chromium, y Firefox y Safari pintan, cargan
 * fuentes y aplican la `<meta>` de la política de contenido a su manera.
 *
 * Por página y combinación falla si hay un error de JavaScript o de consola,
 * una respuesta ≥ 400, un bloqueo de la política de contenido, un tema distinto
 * del pedido, un titular que no se ve, una de las dos familias tipográficas
 * sin cargar o algo visible que se sale por un canto de la ventana sin estar
 * dentro de un recuadro que recorta o desplaza. En la demo, además, cada
 * pestaña tiene que abrirse y no desbordar.
 *
 * Sirve la exportación como GitHub Pages (sin `_headers`: esa parte la mide
 * `cabeceras.mjs`). Necesita los tres navegadores de Playwright
 * (`bunx playwright install firefox webkit`); el CI solo tiene Chromium.
 *
 * Uso:  node scripts/motores.mjs --serve out [--navegador firefox,webkit] [--shots <carpeta>]
 */
import { chromium, firefox, webkit } from "playwright";
import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const args = process.argv.slice(2);
const arg = (nombre, pordefecto) => {
  const i = args.indexOf(nombre);
  return i >= 0 && args[i + 1] ? args[i + 1] : pordefecto;
};
const RAIZ = arg("--serve", "out");
const SHOTS = arg("--shots", null);
const PREFIJO = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
const TODOS = { chromium, firefox, webkit };
const MOTORES = arg("--navegador", "chromium,firefox,webkit").split(",");
for (const m of MOTORES) {
  if (!TODOS[m]) {
    console.log(`[motores] navegador desconocido: ${m} (chromium, firefox o webkit)`);
    process.exit(1);
  }
}
if (!existsSync(join(RAIZ, "index.html"))) {
  console.log(`[motores] no encuentro ${RAIZ}/index.html. ¿Falta compilar el sitio?`);
  process.exit(1);
}
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const RUTAS = [
  "/", "/demo/", "/pricing/", "/features/", "/faq/", "/beta/", "/about/", "/test/",
  "/glosario/", "/glosario/drawdown/", "/herramientas/", "/herramientas/monte-carlo/",
  "/en/", "/en/demo/", "/en/pricing/", "/de/",
];
const PANTALLAS = [
  { width: 375, height: 812 },
  { width: 1440, height: 900 },
];
const TEMAS = ["light", "dark"];

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

function fichero(ruta) {
  let pedida = decodeURIComponent(ruta.split("?")[0]);
  if (PREFIJO && (pedida === PREFIJO || pedida.startsWith(`${PREFIJO}/`))) {
    pedida = pedida.slice(PREFIJO.length) || "/";
  }
  const limpia = normalize(pedida).replace(/^(\.\.[/\\])+/, "");
  for (const c of [join(RAIZ, limpia), join(RAIZ, limpia, "index.html")]) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

const servidor = createServer((req, res) => {
  const f = fichero(req.url || "/");
  const destino = f ?? join(RAIZ, "404.html");
  res.writeHead(f ? 200 : 404, {
    "content-type": TIPOS[extname(destino).toLowerCase()] || "application/octet-stream",
  });
  res.end(readFileSync(destino));
});
await new Promise((ok) => servidor.listen(0, "127.0.0.1", ok));
const BASE = `http://127.0.0.1:${servidor.address().port}${PREFIJO}`;

/* Compilando en Windows, Next escribe los prefetch de segmento como carpeta y el
   cliente los pide en plano: 404 en todas las páginas. Solo se toleran si la
   exportación no trae ningún fichero plano (igual que `humo.mjs`). */
function hayFicherosPlanos(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (e.name !== "_next" && hayFicherosPlanos(join(dir, e.name))) return true;
    } else if (/^__next\..+\.__PAGE__\.txt$/.test(e.name)) return true;
  }
  return false;
}
const PREFETCH = hayFicherosPlanos(RAIZ) ? null : /\/__next\.[^/?]*\.txt(\?|$)/;
const RUIDO = /favicon|Download the React DevTools/i;

/**
 * Texto o control cortado a lo ancho: se sale de la ventana o del primer
 * antepasado que recorta (`overflow: hidden/clip`, como las secciones). Dentro
 * de un recuadro que se desplaza no cuenta: se llega desplazándolo. Se mide el
 * texto y no la caja: un adorno `::before` que queda fuera a propósito (el «·»
 * que abre renglón en el Diario de la demo) no es texto cortado.
 */
function desbordes() {
  const ancho = document.documentElement.clientWidth;
  const vistos = [];
  const rango = document.createRange();
  for (const el of document.body.querySelectorAll("*")) {
    if (el.closest("[aria-hidden=true], [hidden], svg")) continue;
    const textos = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim());
    if (!textos.length && !/^(INPUT|BUTTON|SELECT|TEXTAREA)$/.test(el.tagName)) continue;
    let r = el.getBoundingClientRect();
    if (textos.length) {
      const trozos = textos.flatMap((n) => {
        rango.selectNodeContents(n);
        return [...rango.getClientRects()].filter((t) => t.width > 0);
      });
      if (!trozos.length) continue;
      const izqT = Math.min(...trozos.map((t) => t.left));
      const derT = Math.max(...trozos.map((t) => t.right));
      r = { left: izqT, right: derT, width: derT - izqT, height: r.height };
    }
    if (r.width === 0 || r.height === 0) continue;
    // Entero fuera de la ventana es a propósito (el campo trampa de los formularios).
    if (r.right < 0 || r.left > ancho) continue;
    const s = getComputedStyle(el);
    if (s.visibility === "hidden" || Number(s.opacity) === 0 || s.position === "fixed") continue;
    // El recorte más cercano (empezando por el propio elemento, que con
    // `truncate` corta su texto con «…») decide si el texto queda cortado; un
    // recuadro desplazable por encima solo disculpa el canto de la ventana.
    let recorte = null;
    let desplazable = false;
    let aproposito = false;
    for (let a = textos.length ? el : el.parentElement; a && a !== document.body; a = a.parentElement) {
      const sa = getComputedStyle(a);
      if (sa.position === "fixed" || Number(sa.opacity) === 0) {
        aproposito = true;
        break;
      }
      if (/auto|scroll/.test(sa.overflowX)) {
        desplazable = true;
        break;
      }
      if (!recorte && (/hidden|clip/.test(sa.overflowX) || sa.contain.includes("paint"))) {
        const ra = a.getBoundingClientRect();
        // Caja de 1 px: oculto a propósito para quien no usa lector de pantalla
        // (`sr-only`); «…» en la miga de pan: el título entero es el h1.
        if (ra.width <= 1 || ra.height <= 1 || (a === el && sa.textOverflow === "ellipsis" && el.closest("nav"))) {
          aproposito = true;
          break;
        }
        recorte = { izq: ra.left, der: ra.right, nombre: a === el ? "su propia caja" : `${a.tagName.toLowerCase()}.${String(a.className).trim().split(/\s+/).slice(0, 2).join(".")}` };
      }
    }
    if (aproposito) continue;
    const fueraDelRecorte = recorte && (r.right > recorte.der + 1 || r.left < recorte.izq - 1);
    const fueraDeLaVentana = !desplazable && (r.right > ancho + 1 || r.left < -1);
    if (!fueraDelRecorte && !fueraDeLaVentana) continue;
    const nombre = `${el.tagName.toLowerCase()}${typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".") : ""}`;
    const donde = fueraDelRecorte ? `${recorte.nombre} (${Math.round(recorte.izq)}–${Math.round(recorte.der)})` : `la ventana (0–${ancho})`;
    vistos.push(`${nombre} «${(el.textContent || el.value || "").trim().slice(0, 40)}» de ${Math.round(r.left)} a ${Math.round(r.right)} px, cortado por ${donde}`);
    if (vistos.length >= 3) break;
  }
  return vistos;
}

const fallos = [];
const medido = { cargas: 0, pestanas: 0 };

async function revisa(motor, navegador, pantalla, tema, ruta) {
  const etiqueta = `${motor} ${pantalla.width}px ${tema} ${ruta}`;
  const ctx = await navegador.newContext({ viewport: pantalla, colorScheme: tema, reducedMotion: "reduce" });
  await ctx.addInitScript((t) => {
    try {
      localStorage.setItem("tj-theme", t);
    } catch {}
    document.addEventListener("securitypolicyviolation", (e) => {
      (window.__bloqueos ??= []).push(`${e.violatedDirective} ${e.blockedURI}`);
    });
  }, tema);
  const pagina = await ctx.newPage();
  const errores = [];
  pagina.on("pageerror", (e) => errores.push(`error de JavaScript: ${String(e.message).slice(0, 140)}`));
  pagina.on("console", (m) => {
    const t = m.text();
    if (m.type() === "error" && !RUIDO.test(t) && !(PREFETCH && /Failed to load resource|__next\./.test(t))) {
      errores.push(`consola: ${t.slice(0, 160)}`);
    }
  });
  pagina.on("response", (r) => {
    const u = r.url();
    if (r.status() >= 400 && !RUIDO.test(u) && !(PREFETCH && PREFETCH.test(u))) errores.push(`HTTP ${r.status()} ${u.replace(BASE, "")}`);
  });
  try {
    await pagina.goto(BASE + ruta, { waitUntil: "networkidle", timeout: 45000 });
    medido.cargas++;
    const estado = await pagina.evaluate(async () => {
      await document.fonts.ready;
      const h1 = document.querySelector("h1");
      const r = h1?.getBoundingClientRect();
      return {
        tema: document.documentElement.dataset.theme,
        h1: h1 ? { alto: r.height, arriba: r.top, opacidad: Number(getComputedStyle(h1).opacity) } : null,
        // La cara «… Fallback» es una fuente local del sistema y siempre carga.
        sans: [...document.fonts].some((f) => /Instrument.?Sans/i.test(f.family) && !/fallback/i.test(f.family) && f.status === "loaded"),
        serif: [...document.fonts].some((f) => /Newsreader/i.test(f.family) && !/fallback/i.test(f.family) && f.status === "loaded"),
        familias: [...new Set([...document.fonts].map((f) => `${f.family}:${f.status}`))].join(", "),
      };
    });
    if (estado.tema !== tema) errores.push(`se pidió el tema ${tema} y la página pinta ${estado.tema}`);
    if (!estado.h1) errores.push("sin h1");
    else if (estado.h1.alto === 0 || estado.h1.opacidad < 1) errores.push(`h1 sin verse (alto ${estado.h1.alto}, opacidad ${estado.h1.opacidad})`);
    if (!estado.sans || !estado.serif) errores.push(`fuentes sin cargar: ${estado.familias}`);
    for (const d of await pagina.evaluate(desbordes)) errores.push(`se sale: ${d}`);
    if (/\/demo\/$/.test(ruta)) {
      await pagina.waitForSelector('[role="tab"]', { timeout: 15000 }).catch(() => errores.push("la demo no montó sus pestañas"));
      const pestanas = await pagina.$$('[role="tab"]');
      for (const [k, pestana] of pestanas.entries()) {
        try {
          await pestana.click({ timeout: 5000 });
          await pagina.waitForFunction((el) => el.getAttribute("aria-selected") === "true", pestana, { timeout: 5000 });
          await pagina.waitForTimeout(400);
          medido.pestanas++;
          for (const d of await pagina.evaluate(desbordes)) errores.push(`pestaña ${k + 1}, se sale: ${d}`);
          if (SHOTS) await pagina.screenshot({ path: join(SHOTS, `${motor}-${pantalla.width}-${tema}${ruta.replace(/\//g, "_")}tab${k + 1}.png`) });
        } catch (e) {
          errores.push(`pestaña ${k + 1} sin abrir: ${String(e).split("\n")[0].slice(0, 120)}`);
        }
      }
      if (pestanas.length !== 4) errores.push(`la demo tiene ${pestanas.length} pestañas, no 4`);
    } else if (SHOTS) {
      await pagina.screenshot({ path: join(SHOTS, `${motor}-${pantalla.width}-${tema}${ruta.replace(/\//g, "_")}.png`) });
    }
    for (const b of await pagina.evaluate(() => window.__bloqueos ?? [])) errores.push(`política de contenido: ${b}`);
  } catch (e) {
    errores.push(`no cargó: ${String(e).split("\n")[0].slice(0, 140)}`);
  }
  for (const e of new Set(errores)) fallos.push(`${etiqueta}  ${e}`);
  // Firefox de Playwright a veces lanza al cerrar un contexto ya vacío.
  await ctx.close().catch(() => {});
}

for (const motor of MOTORES) {
  const navegador = await TODOS[motor].launch();
  const cola = PANTALLAS.flatMap((p) => TEMAS.flatMap((t) => RUTAS.map((r) => [p, t, r])));
  let siguiente = 0;
  await Promise.all(
    Array.from({ length: 3 }, async () => {
      while (siguiente < cola.length) {
        const [p, t, r] = cola[siguiente++];
        await revisa(motor, navegador, p, t, r);
      }
    }),
  );
  await navegador.close().catch(() => {});
}
servidor.close();

const esperadas = MOTORES.length * PANTALLAS.length * TEMAS.length;
console.log(
  `[motores] ${MOTORES.join(", ")}: ${medido.cargas} cargas de ${esperadas * RUTAS.length} (${RUTAS.length} rutas × 375 y 1440 px × 2 temas) y ${medido.pestanas} pestañas de la demo de ${esperadas * 2 * 4}`,
);
if (medido.cargas < esperadas * RUTAS.length || medido.pestanas < esperadas * 8) fallos.push("(recorrido)  no se midió todo lo previsto");
if (fallos.length) {
  console.log(`[motores] FALLO — ${fallos.length}:`);
  for (const f of fallos.slice(0, 60)) console.log(`   ${f}`);
  process.exit(1);
}
console.log("[motores] correcto — mismas rutas, mismo resultado en los tres motores");
