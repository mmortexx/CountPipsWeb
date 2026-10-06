/**
 * MOVIMIENTO: abre cada ruta con `prefers-reduced-motion: reduce`, la recorre
 * entera para disparar las animaciones de entrada y vigila fotograma a
 * fotograma si algún elemento cambia de posición o si una cifra marcada con
 * `data-cuenta` (`CountUp`, en la pestaña Operaciones de la demo) cuenta en
 * vez de salir ya en su valor. Un fallo es movimiento que escapa a la regla
 * global de `globals.css`, típicamente animado por JavaScript.
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
(function () {
  const previo = new WeakMap();
  const textoPrevio = new WeakMap();
  function mira() {
    for (const el of document.querySelectorAll("[data-cuenta]")) {
      const t = el.textContent;
      const antes = textoPrevio.get(el);
      if (antes !== undefined && antes !== t) {
        const v = window.__cuenta.get(el) || { veces: 0 };
        v.veces++;
        v.texto = t.trim().slice(0, 34);
        window.__cuenta.set(el, v);
      }
      textoPrevio.set(el, t);
    }
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
  // Las animaciones de entrada esperan a que la sección aparezca: hay que bajar la página entera.
  for (let i = 0; i < 8; i++) {
    await p.evaluate(() => window.scrollBy(0, window.innerHeight * 0.8));
    await p.waitForTimeout(260);
  }
  await p.waitForTimeout(600);
  // En la demo, además, la pestaña Operaciones: su franja de cifras cuenta.
  if (ruta === "/demo/") {
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.getByRole("tab", { name: "Operaciones", exact: true }).first().click().catch(() => {});
    await p.waitForTimeout(400);
    // Cuentan al verse: sin desplazarse hasta ellas la pasada de control no vería nada.
    await p.locator("[data-cuenta]").first().evaluate((el) => el.scrollIntoView({ block: "center" })).catch(() => {});
    await p.waitForTimeout(2000);
  }
  const r = await p.evaluate((minimo) => {
    const out = [];
    for (const v of window.__mov.values()) if (v.veces >= minimo) out.push(v);
    const cuentas = [];
    for (const v of window.__cuenta.values()) if (v.veces >= minimo) cuentas.push(v);
    return { mov: out.sort((a, b) => b.veces - a.veces), cuentas };
  }, FOTOGRAMAS_MINIMOS);
  await p.close();
  return r;
}

const { server, base } = await servir(dir);
const navegador = await chromium.launch();

const fallos = [];
let controlTotal = 0;
let controlCuentas = 0;
const sinControl = [];

for (const modo of ["reduce", "no-preference"]) {
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: modo });
  await ctx.addInitScript(ESPIA);
  for (const ruta of RUTAS) {
    const res = await recorrer(ctx, ruta, base);
    if (res === null) {
      fallos.push({ ruta, detalle: "la página no cargó: la guarda no pudo medirla" });
      continue;
    }
    const r = res.mov;
    if (modo === "reduce") {
      for (const v of res.cuentas) {
        fallos.push({ ruta, detalle: `una cifra cambió durante ${v.veces} fotogramas hasta «${v.texto}»: cuenta pese a la preferencia` });
      }
      for (const v of r.slice(0, 5)) {
        fallos.push({ ruta, detalle: `<${v.tag}> se movió durante ${v.veces} fotogramas — «${v.texto}» · ${v.clase}` });
      }
      if (r.length > 5) fallos.push({ ruta, detalle: `… y ${r.length - 5} elemento(s) más` });
    } else {
      controlTotal += r.length;
      controlCuentas += res.cuentas.length;
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

console.log(`\n[movimiento] ${RUTAS.length} rutas · control: ${controlTotal} elementos con movimiento y ${controlCuentas} cifras que cuentan cuando se permite`);

// La pasada de control evita que la guarda se quede verde: sin movimiento permitido, la otra pasada no significa nada.
if (sinControl.length > RUTAS.length / 2 || controlTotal < 20) {
  console.log(`[movimiento] el detector no ve movimiento ni cuando está permitido (${sinControl.length} ruta(s) a cero, ${controlTotal} en total)`);
  console.log("[movimiento] eso no dice que el sitio esté quieto: dice que esta guarda está rota y no vale su respuesta");
  process.exit(1);
}
if (controlCuentas === 0) {
  console.log("[movimiento] ninguna cifra de la demo contó ni con el movimiento permitido: la vigilancia de `data-cuenta` está rota o la pestaña no se abrió");
  process.exit(1);
}
if (fallos.length) {
  console.log(`[movimiento] ${fallos.length} elemento(s) se mueven o cuentan con «reducir movimiento» activo`);
  console.log("[movimiento] las transiciones de CSS las apaga la regla de `globals.css`; lo que anima por JavaScript, no");
  console.log("[movimiento] lo que anime por JavaScript (WAAPI, `useViaje`) tiene que consultar `matchMedia(\"(prefers-reduced-motion: reduce)\")` antes de moverse");
  process.exit(1);
}
console.log("[movimiento] correcto — con «reducir movimiento» activo no se desplaza nada; solo quedan fundidos, que no marean");
