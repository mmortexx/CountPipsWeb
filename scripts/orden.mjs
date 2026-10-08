/**
 * ORDEN: la primera pantalla de cada página se compone en orden de lectura.
 * Lee las animaciones CSS que el navegador aplica de verdad (`getAnimations()`)
 * y exige, en la portada y en cada cabecera de página:
 *
 *   · que todo lo que va tras el titular empiece después de su primera palabra
 *     (la entradilla salía antes en las cabeceras sin ceja: se escalonaba por
 *     índice de hija);
 *   · que el contenido de debajo (panel de la portada, primera sección) empiece
 *     después de la entradilla y se funda, no solo se desplace (sin opacidad
 *     el panel estaba entero desde el primer fotograma, antes que el titular);
 *   · que en el cambio de página la nueva no entre hasta que la vieja ha salido
 *     (solapadas se leían dos titulares a la vez).
 *
 * Un elemento que debería animarse y no tiene animación es fallo, no se salta:
 * si cambian los selectores, la guarda se pone roja en vez de quedarse verde.
 *
 * Uso:  node scripts/orden.mjs --serve out
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, extname } from "node:path";

const dir = process.argv.slice(2).find((a) => !a.startsWith("-")) || "out";
if (!existsSync(dir)) {
  console.log(`[orden] no encuentro el directorio «${dir}». ¿Falta compilar el sitio con \`npm run build\`?`);
  process.exit(1);
}
const PREFIJO = process.env.NEXT_PUBLIC_BASE_PATH || "";
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

// Todas las páginas salvo las fichas del glosario y las herramientas, que comparten plantilla: basta una muestra.
const MUESTRA = /\/(glosario\/(expectancy|risk-of-ruin)|herramientas\/(calculadora-de-riesgo|monte-carlo))\/$/;
const RUTAS = ["/"];
async function recorre(d, ruta) {
  for (const e of await readdir(d, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.startsWith("_") || e.name === "404") continue;
    const r = `${ruta}${e.name}/`;
    if (existsSync(join(d, e.name, "index.html")) && (!/\/(glosario|herramientas)\/[^/]+\/$/.test(r) || MUESTRA.test(r))) RUTAS.push(r);
    await recorre(join(d, e.name), r);
  }
}
await recorre(dir, "/");
if (RUTAS.length < 30) {
  console.log(`[orden] solo ${RUTAS.length} rutas en ${dir}: la guarda no estaría mirando el sitio.`);
  process.exit(1);
}

const { server, base } = await servir(dir);
const navegador = await chromium.launch();
const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
await ctx.addInitScript(() => { try { localStorage.setItem("tj-cookie-consent", "declined"); } catch {} });
const fallos = [];
let cabeceras = 0;

for (const ruta of RUTAS) {
  const p = await ctx.newPage();
  try {
    await p.goto(base + ruta, { waitUntil: "load", timeout: 30000 });
  } catch {
    fallos.push(`${ruta}: la página no cargó`);
    await p.close();
    continue;
  }
  const r = await p.evaluate((primera) => {
    const out = [];
    // Arranque de la entrada de un elemento: retardo de su animación de opacidad o desplazamiento.
    const entrada = (el) => {
      for (const a of el.getAnimations()) {
        const k = a.effect?.getKeyframes?.() ?? [];
        if (!k.some((f) => "opacity" in f || "transform" in f)) continue;
        return { t: a.effect.getTiming().delay / 1000, funde: k.length > 0 && "opacity" in k[0] && parseFloat(k[0].opacity) < 0.5 };
      }
      return null;
    };
    const hero = document.querySelector(".tj-hero > .tj-container:first-child");
    const raiz = hero ?? document.querySelector(".tj-cabecera .tj-container");
    if (!raiz) return { out, vista: false };
    const nombre = (el) => `<${el.tagName.toLowerCase()}> «${el.textContent.replace(/\s+/g, " ").trim().slice(0, 40)}»`;

    const h1 = raiz.querySelector(":scope > h1");
    const palabras = h1 ? [...h1.querySelectorAll(".tj-pal > span")].map(entrada).filter(Boolean) : [];
    if (!palabras.length) return { out: ["el titular no tiene palabras que entren (.tj-pal)"], vista: true };
    const tH1 = Math.min(...palabras.map((e) => e.t));

    let tras = null;
    for (let el = h1.nextElementSibling; el; el = el.nextElementSibling) {
      const e = entrada(el);
      if (!e) { out.push(`${nombre(el)} va tras el titular y no tiene entrada`); continue; }
      if (e.t <= tH1) out.push(`${nombre(el)} empieza a ${e.t}s, no después del titular (${tH1}s)`);
      if (tras === null) tras = e.t;
    }

    const contenido = hero
      ? document.querySelector(".tj-hero > .tj-container:nth-child(2)")
      : document.querySelector("#main-content .tj-cabecera + section:not(#top)");
    if (contenido && contenido.getBoundingClientRect().top < innerHeight) {
      const e = entrada(contenido);
      const umbral = tras ?? tH1;
      if (!e) out.push("el contenido bajo la cabecera asoma en la primera pantalla sin entrada");
      else {
        if (e.t <= umbral) out.push(`el contenido bajo la cabecera empieza a ${e.t}s, antes que lo de encima (${umbral}s)`);
        if (!e.funde) out.push("el contenido bajo la cabecera solo se desplaza: está entero antes que el titular");
      }
    }

    if (primera) {
      // Cambio de página: duración y retardo de cada lado, leídos de la hoja.
      const lados = {};
      for (const hoja of document.styleSheets) {
        let reglas;
        try { reglas = hoja.cssRules; } catch { continue; }
        for (const regla of reglas) {
          const m = regla.selectorText?.match(/^::view-transition-(old|new)\(pagina\)$/);
          if (!m) continue;
          // Con un `var()` dentro, el atajo no se reparte en sus longhands: se leen
          // los tiempos del texto, en su orden (duración y luego retardo).
          const tiempos = [...regla.style.cssText.matchAll(/(?<![\w.(-])(\d*\.?\d+)(ms|s)\b/g)].map((t) => (t[2] === "ms" ? +t[1] / 1000 : +t[1]));
          lados[m[1]] = tiempos.length ? { dur: tiempos[0], ret: tiempos[1] ?? 0 } : null;
        }
      }
      if (!lados.old || !lados.new) out.push("no encuentro la animación del cambio de página (::view-transition-old/new(pagina))");
      else if (lados.new.ret < lados.old.ret + lados.old.dur * 0.85)
        out.push(`cambio de página: la nueva entra a ${lados.new.ret}s y la vieja no acaba hasta ${lados.old.ret + lados.old.dur}s; se ven las dos`);
    }
    return { out, vista: true };
  }, ruta === "/");
  if (r.vista) cabeceras++;
  for (const x of r.out) fallos.push(`${ruta}: ${x}`);
  await p.close();
}

await ctx.close();
await navegador.close();
server.close();

console.log(`[orden] ${RUTAS.length} rutas · ${cabeceras} cabeceras medidas`);
if (cabeceras < RUTAS.length * 0.8) fallos.push(`solo ${cabeceras} cabeceras de ${RUTAS.length} rutas: la guarda no está viendo el sitio`);
if (fallos.length) {
  for (const f of fallos) console.log(`  ✗ ${f}`);
  console.log(`[orden] ${fallos.length} fallo(s)`);
  process.exit(1);
}
console.log("[orden] correcto — cada primera pantalla entra en orden de lectura y el cambio de página no solapa");
