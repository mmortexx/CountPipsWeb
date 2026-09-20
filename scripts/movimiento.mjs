/**
 * MOVIMIENTO — ¿se mueve algo cuando el visitante ha pedido que nada se mueva?
 *
 * ── Qué mide ──────────────────────────────────────────────────────────
 * El sistema operativo tiene una casilla —«reducir movimiento»— que la
 * gente con trastornos vestibulares activa porque el contenido que se
 * desliza o se acerca les provoca mareo real, no incomodidad. El
 * navegador la expone como `prefers-reduced-motion`.
 *
 * Esta guarda abre cada página CON esa preferencia puesta, la recorre
 * entera para disparar las animaciones de entrada, y vigila fotograma a
 * fotograma si algún elemento cambia de POSICIÓN.
 *
 * ── Por qué sólo la posición, y no la opacidad ────────────────────────
 * Un fundido no marea a nadie: lo que provoca el mareo es el movimiento
 * y el escalado. Por eso `reducedMotion: "user"` de framer-motion apaga
 * las animaciones de posición y deja pasar las de opacidad a propósito,
 * y por eso esta guarda hace lo mismo. Medir las dos juntas daba ocho
 * falsos positivos en `/demo/` —los ocho, fundidos correctos—.
 *
 * ── Por qué hay una pasada de CONTROL, y por qué puede fallar ─────────
 * Una guarda que busca una AUSENCIA es la más fácil de dejar ciega: el
 * día que el detector deje de detectar, pasa a aprobarlo todo y nadie se
 * entera. Así que se recorre el sitio DOS veces: una con la preferencia,
 * donde no debe moverse nada, y otra SIN ella, donde tiene que moverse
 * bastante. Si en la segunda no encuentra movimiento, la guarda se
 * declara rota y falla — porque eso significa que su primera respuesta
 * no valía nada.
 *
 * ── Qué encontró el día que se escribió (2026-09-20) ──────────────────
 * Nada. Cero elementos con movimiento de posición en siete rutas, frente
 * a 15–91 por ruta en la pasada de control. Se escribió precisamente
 * porque el resultado era bueno y nada lo sostenía: `globals.css` lo
 * resuelve con una regla global que cualquiera puede esquivar sin querer
 * animando por JavaScript, que es lo que la regla de CSS no alcanza.
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

/* Las rutas donde vive la animación: la portada y las de producto, que
   la usan para presentar cada sección; la demo, que es la que más tiene;
   y una inglesa, porque el árbol de componentes no es el mismo. */
const RUTAS = ["/", "/features/", "/pricing/", "/demo/", "/about/", "/herramientas/", "/en/"];

/* Cuántos fotogramas seguidos tiene que cambiar un elemento para que
   cuente como animación. Uno solo es un salto —así aparece un botón con
   `motion-reduce:transition-none`, sin transición ninguna—, y contarlo
   daba un falso positivo en las seis rutas. Cuatro son unos 66 ms. */
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

/* Se inyecta ANTES de que cargue la página: una animación de entrada
   dura menos que el tiempo que tardaría en instalarse después. */
const ESPIA = `
window.__mov = new Map();
(function () {
  const previo = new WeakMap();
  function mira() {
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
  /* Las animaciones de entrada esperan a que la sección aparezca, así
     que hay que bajar por la página entera para provocarlas todas. */
  for (let i = 0; i < 8; i++) {
    await p.evaluate(() => window.scrollBy(0, window.innerHeight * 0.8));
    await p.waitForTimeout(260);
  }
  await p.waitForTimeout(600);
  const r = await p.evaluate((minimo) => {
    const out = [];
    for (const v of window.__mov.values()) if (v.veces >= minimo) out.push(v);
    return out.sort((a, b) => b.veces - a.veces);
  }, FOTOGRAMAS_MINIMOS);
  await p.close();
  return r;
}

const { server, base } = await servir(dir);
const navegador = await chromium.launch();

const fallos = [];
let controlTotal = 0;
const sinControl = [];

for (const modo of ["reduce", "no-preference"]) {
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: modo });
  await ctx.addInitScript(ESPIA);
  for (const ruta of RUTAS) {
    const r = await recorrer(ctx, ruta, base);
    if (r === null) {
      fallos.push({ ruta, detalle: "la página no cargó: la guarda no pudo medirla" });
      continue;
    }
    if (modo === "reduce") {
      for (const v of r.slice(0, 5)) {
        fallos.push({ ruta, detalle: `<${v.tag}> se movió durante ${v.veces} fotogramas — «${v.texto}» · ${v.clase}` });
      }
      if (r.length > 5) fallos.push({ ruta, detalle: `… y ${r.length - 5} elemento(s) más` });
    } else {
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

console.log(`\n[movimiento] ${RUTAS.length} rutas · control: ${controlTotal} elementos con movimiento cuando se permite`);

/* La pasada de control es la que impide que esta guarda se quede verde
   para siempre. Si el sitio se moviera en menos de la mitad de sus
   rutas con el movimiento permitido, o casi nada en total, lo que ha
   detectado —o dejado de detectar— en la otra pasada no significa nada. */
if (sinControl.length > RUTAS.length / 2 || controlTotal < 20) {
  console.log(`[movimiento] el detector no ve movimiento ni cuando está permitido (${sinControl.length} ruta(s) a cero, ${controlTotal} en total)`);
  console.log("[movimiento] eso no dice que el sitio esté quieto: dice que esta guarda está rota y no vale su respuesta");
  process.exit(1);
}
if (fallos.length) {
  console.log(`[movimiento] ${fallos.length} elemento(s) cambian de posición con «reducir movimiento» activo`);
  console.log("[movimiento] las transiciones de CSS las apaga la regla de `globals.css`; lo que anima por JavaScript, no");
  console.log("[movimiento] framer-motion necesita `<MotionConfig reducedMotion=\"user\">` por encima, o `useReducedMotion()` en el componente");
  process.exit(1);
}
console.log("[movimiento] correcto — con «reducir movimiento» activo no se desplaza nada; sólo quedan fundidos, que no marean");
