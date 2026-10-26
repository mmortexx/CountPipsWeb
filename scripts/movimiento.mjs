/**
 * MOVIMIENTO: abre cada ruta con `prefers-reduced-motion: reduce`, la recorre
 * entera para disparar las animaciones de entrada y vigila fotograma a
 * fotograma si algún elemento cambia de posición. Un fallo es movimiento que
 * escapa a la regla global de `globals.css`, típicamente animado por JavaScript.
 *
 * En todas las pasadas, además: ninguna cifra cuenta hasta su valor (sale ya
 * en él; contar compite con el dato) y nada se desplaza dentro de algo que se
 * desplaza. Para que la vigilancia de cifras no se quede verde si deja de ver,
 * cada página recibe un testigo que cuenta y que tiene que aparecer.
 *
 * Solo la posición, no la opacidad: los fundidos no marean y medirlos daba
 * falsos positivos.
 *
 * La pasada de control recorre el sitio otra vez sin la preferencia, donde
 * debe haber mucho movimiento: si no lo encuentra, el detector está roto y su
 * respuesta con la preferencia no vale (una guarda de ausencias se queda verde
 * si deja de detectar).
 *
 * Uso:  node scripts/movimiento.mjs --serve out
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, extname } from "node:path";

const dir = process.argv.slice(2).find((a) => !a.startsWith("-")) || "out";
if (!existsSync(dir)) {
  console.log(`[movimiento] no encuentro el directorio «${dir}». ¿Falta compilar el sitio con \`npm run build\`?`);
  process.exit(1);
}
const PREFIJO = process.env.NEXT_PUBLIC_BASE_PATH || "";

// Rutas con animación: portada y producto, la demo (la que más tiene) y una inglesa, de árbol distinto.
const RUTAS = ["/", "/features/", "/pricing/", "/demo/", "/about/", "/herramientas/", "/en/"];

/* Fotogramas seguidos que debe cambiar un elemento para contar como animación.
   Uno solo es un salto sin transición (un botón con `motion-reduce:transition-none`).
   Cuatro son unos 66 ms. */
const FOTOGRAMAS_MINIMOS = 4;

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

// Se inyecta antes de que cargue la página: una animación de entrada dura menos que instalarlo después.
const ESPIA = `
window.__mov = new Map();
window.__cuenta = new Map();
window.__nidos = new Map();
(function () {
  const previo = new WeakMap();
  let marco = 0;
  /* Una cifra que cuenta cambia de texto en fotogramas seguidos; un reloj, una
     vez por segundo. Se anota cada elemento cuyo texto con cifras cambia, y la
     racha más larga de fotogramas consecutivos (con un hueco de hasta 2). */
  const textoPrevio = new WeakMap();
  new MutationObserver((ms) => {
    for (const m of ms) {
      const el = m.target.nodeType === 3 ? m.target.parentElement : m.target;
      if (!el || !el.isConnected) continue;
      const t = el.textContent;
      const antes = textoPrevio.get(el);
      textoPrevio.set(el, t);
      // Una cifra es texto corto: un contenedor que monta secciones también cambia.
      if (antes === undefined || antes === t || t.length > 40 || !/\\d/.test(t)) continue;
      const v = window.__cuenta.get(el) || { racha: 0, max: 0, ultimo: -9 };
      if (v.ultimo === marco) continue;
      v.racha = marco - v.ultimo <= 3 ? v.racha + 1 : 1;
      v.max = Math.max(v.max, v.racha);
      v.ultimo = marco;
      v.texto = t.trim().slice(0, 34);
      v.testigo = el.id === "testigo-cuenta";
      window.__cuenta.set(el, v);
    }
  }).observe(document, { subtree: true, childList: true, characterData: true });
  const desc = (el) => el.tagName.toLowerCase() + (typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\\s+/).slice(0, 3).join(".") : "");
  /* Un desplazamiento dentro de otro: el contenido recorre la suma de los dos
     y se lee como un tirón. Solo animaciones por tiempo (las atadas al scroll
     siguen al dedo) que muevan algo, en su fase activa. */
  function anidados() {
    const mueve = new Map();
    for (const a of document.getAnimations()) {
      const ef = a.effect;
      if (!ef || !ef.target || ef.pseudoElement || a.playState !== "running" || !(a.timeline instanceof DocumentTimeline)) continue;
      const ct = ef.getComputedTiming();
      const lt = ct.localTime ?? 0;
      if (ct.progress === null || lt < (ct.delay || 0) || lt > (ct.delay || 0) + ct.activeDuration) continue;
      let props = [];
      try { props = ef.getKeyframes().flatMap((k) => Object.keys(k)); } catch {}
      if (!props.some((p) => p === "transform" || p === "translate")) continue;
      mueve.set(ef.target, a.animationName || (a.transitionProperty ? "transición" : "JavaScript"));
    }
    for (const [el, nombre] of mueve) {
      for (let p = el.parentElement; p; p = p.parentElement) {
        if (!mueve.has(p)) continue;
        // La demo imita la entrada de página del programa, con sus piezas
        // entrando dentro: excepción decidida (PROJECT.md, «Movimiento»).
        if (p.matches(".tj-demo-entra")) break;
        const k = desc(p) + " [" + mueve.get(p) + "] > " + desc(el) + " [" + nombre + "]";
        window.__nidos.set(k, (window.__nidos.get(k) || 0) + 1);
        break;
      }
    }
  }
  function mira() {
    marco++;
    anidados();
    for (const el of document.querySelectorAll("body *")) {
      const cs = getComputedStyle(el);
      const t = cs.transform;
      const antes = previo.get(el);
      /* La identidad no es movimiento: un elemento quieto con
         \`transform: translateZ(0)\` —el truco de la capa de GPU— tiene
         matriz identidad y aquí no cuenta. */
      if (antes !== undefined && antes !== t && t !== "none" && t !== "matrix(1, 0, 0, 1, 0, 0)") {
        const v = window.__mov.get(el) || { veces: 0 };
        v.veces++;
        v.tag = el.tagName.toLowerCase();
        v.clase = typeof el.className === "string" ? el.className.trim().slice(0, 90) : "";
        v.texto = (el.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 34);
        window.__mov.set(el, v);
      }
      previo.set(el, t);
    }
    requestAnimationFrame(mira);
  }
  requestAnimationFrame(mira);
})();
`;

async function recorrer(ctx, ruta, base) {
  const p = await ctx.newPage();
  try {
    await p.goto(base + ruta, { waitUntil: "load", timeout: 30000 });
  } catch {
    await p.close();
    return null;
  }
  await p.waitForTimeout(900);
  await p.evaluate(() => {
    const t = document.createElement("span");
    t.id = "testigo-cuenta";
    t.textContent = "0";
    document.body.append(t);
    let n = 0;
    const paso = () => {
      t.textContent = String(++n);
      if (n < 20) requestAnimationFrame(paso);
      else t.remove();
    };
    requestAnimationFrame(paso);
  });
  // Las animaciones de entrada esperan a que la sección aparezca: hay que bajar la página entera.
  for (let i = 0; i < 8; i++) {
    await p.evaluate(() => window.scrollBy(0, window.innerHeight * 0.8));
    await p.waitForTimeout(260);
  }
  await p.waitForTimeout(600);
  // En la demo, además, la pestaña Operaciones, con su franja de cifras.
  if (ruta === "/demo/") {
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.getByRole("tab", { name: "Operaciones", exact: true }).first().click().catch(() => {});
    await p.waitForTimeout(400);
    for (let i = 0; i < 4; i++) {
      await p.evaluate(() => window.scrollBy(0, window.innerHeight * 0.6));
      await p.waitForTimeout(400);
    }
  }
  const r = await p.evaluate((minimo) => {
    const out = [];
    for (const v of window.__mov.values()) if (v.veces >= minimo) out.push(v);
    const cuentas = [];
    let testigo = false;
    for (const v of window.__cuenta.values()) {
      if (v.max < minimo) continue;
      if (v.testigo) testigo = true;
      else cuentas.push(v);
    }
    return { mov: out.sort((a, b) => b.veces - a.veces), cuentas, testigo, nidos: [...window.__nidos.keys()] };
  }, FOTOGRAMAS_MINIMOS);
  await p.close();
  return r;
}

const { server, base } = await servir(dir);
const navegador = await chromium.launch();

const fallos = [];
let controlTotal = 0;
const sinControl = [];
const cifras = [];
const sinTestigo = [];

/* La tercera pasada hace como Firefox o Safari, que no tienen
   `animation-timeline`: ahí entran los respaldos por JavaScript. */
const SIN_VIEW = `{ const o = CSS.supports.bind(CSS); CSS.supports = (a, b) => (String(a).includes("animation-timeline") ? false : b === undefined ? o(a) : o(a, b)); }`;
const anidados = [];

for (const modo of ["reduce", "no-preference", "sin-view"]) {
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: modo === "reduce" ? "reduce" : "no-preference" });
  if (modo === "sin-view") await ctx.addInitScript(SIN_VIEW);
  await ctx.addInitScript(ESPIA);
  for (const ruta of RUTAS) {
    const res = await recorrer(ctx, ruta, base);
    if (res === null) {
      fallos.push({ ruta, detalle: "la página no cargó: la guarda no pudo medirla" });
      continue;
    }
    const r = res.mov;
    if (!res.testigo) sinTestigo.push(`${ruta} (${modo})`);
    for (const v of res.cuentas) cifras.push(`${ruta} (${modo})  una cifra cambió ${v.max} fotogramas seguidos hasta «${v.texto}»`);
    if (modo === "reduce") {
      for (const v of r.slice(0, 5)) {
        fallos.push({ ruta, detalle: `<${v.tag}> se movió durante ${v.veces} fotogramas — «${v.texto}» · ${v.clase}` });
      }
      if (r.length > 5) fallos.push({ ruta, detalle: `… y ${r.length - 5} elemento(s) más` });
    } else {
      for (const n of res.nidos) anidados.push(`${ruta}${modo === "sin-view" ? " (sin view())" : ""}  ${n}`);
      if (modo === "sin-view") continue;
      controlTotal += r.length;
      if (r.length === 0) sinControl.push(ruta);
      console.log(`[movimiento] control ${ruta.padEnd(16)} ${String(r.length).padStart(3)} elementos con movimiento`);
    }
  }
  await ctx.close();
}

await navegador.close();
server.close();

if (fallos.length) {
  console.log(`\n  elementos que se mueven pese a la preferencia — ${fallos.length}`);
  for (const f of fallos) console.log(`     ${f.ruta}  ${f.detalle}`);
}

console.log(`\n[movimiento] ${RUTAS.length} rutas · control: ${controlTotal} elementos con movimiento cuando se permite; testigo de cifras visto en ${RUTAS.length * 3 - sinTestigo.length} de ${RUTAS.length * 3} pasadas`);

// La pasada de control evita que la guarda se quede verde: sin movimiento permitido, la otra pasada no significa nada.
if (sinControl.length > RUTAS.length / 2 || controlTotal < 20) {
  console.log(`[movimiento] el detector no ve movimiento ni cuando está permitido (${sinControl.length} ruta(s) a cero, ${controlTotal} en total)`);
  console.log("[movimiento] eso no dice que el sitio esté quieto: dice que esta guarda está rota y no vale su respuesta");
  process.exit(1);
}
if (sinTestigo.length) {
  console.log(`[movimiento] el testigo que cuenta no se vio en ${sinTestigo.join(", ")}: la vigilancia de cifras está rota y su respuesta no vale`);
  process.exit(1);
}
if (cifras.length) {
  console.log(`\n  cifras que cuentan hasta su valor — ${cifras.length}`);
  for (const c of cifras) console.log(`     ${c}`);
  console.log("[movimiento] una cifra sale ya en su valor: contar compite con el dato (PROJECT.md, «Movimiento»)");
  process.exit(1);
}
if (anidados.length) {
  console.log(`\n  desplazamientos dentro de otro desplazamiento — ${anidados.length}`);
  for (const n of [...new Set(anidados)]) console.log(`     ${n}`);
  console.log("[movimiento] un movimiento por rama: si el contenedor se desplaza, lo de dentro solo funde (PROJECT.md, «Movimiento»)");
  process.exit(1);
}
if (fallos.length) {
  console.log(`[movimiento] ${fallos.length} elemento(s) se mueven o cuentan con «reducir movimiento» activo`);
  console.log("[movimiento] las transiciones de CSS las apaga la regla de `globals.css`; lo que anima por JavaScript, no");
  console.log("[movimiento] lo que anime por JavaScript (WAAPI, `useViaje`) tiene que consultar `matchMedia(\"(prefers-reduced-motion: reduce)\")` antes de moverse");
  process.exit(1);
}
console.log("[movimiento] correcto — con «reducir movimiento» activo no se desplaza nada; solo quedan fundidos, que no marean");
