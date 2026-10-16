/**
 * TOQUE: mide, con la página pintada en un móvil táctil (390 px, puntero
 * grueso), la zona que recoge el dedo en cada control: enlaces, botones,
 * campos, pestañas. No lee clases ni el CSS escrito: desde el centro de cada
 * control pregunta al navegador qué elemento hay en cada píxel hacia arriba,
 * abajo, izquierda y derecha (`elementFromPoint`), así que cuenta lo que
 * añade un pseudoelemento o un relleno con margen negativo y descuenta lo
 * que tapa otra capa. Listón: 44 px de alto, el del sistema de diseño en
 * puntero grueso (`.toque-comodo`), y 24 de ancho, el mínimo de WCAG 2.5.8
 * (un enlace de texto corto como «Inicio» es estrecho y no por eso falla).
 *   - Fuera de la regla: los enlaces dentro de una frase (la excepción
 *     «en línea» de WCAG 2.5.8), lo oculto, lo desactivado y lo que está
 *     bajo `aria-hidden` o `inert`.
 *
 * Uso:  node scripts/toque.mjs --serve out
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";

const args = process.argv.slice(2);
const dir = args.includes("--serve") ? args[args.indexOf("--serve") + 1] : "out";
const PREFIJO = process.env.NEXT_PUBLIC_BASE_PATH || "";
const ALTO = 44;
const ANCHO = 24;

const RUTAS = [
  "/",
  "/en",
  "/pt",
  "/fr",
  "/de",
  "/it",
  "/features",
  "/features/metricas",
  "/features/disciplina",
  "/features/seguridad",
  "/pricing",
  "/demo",
  "/about",
  "/faq",
  "/traders/manual",
  "/traders/prop-firms",
  "/glosario",
  "/glosario/expectancy",
  "/herramientas",
  "/herramientas/calculadora-de-riesgo",
  "/herramientas/significancia-estadistica",
  "/herramientas/monte-carlo",
  "/herramientas/recuperacion-de-drawdown",
  "/herramientas/prueba-de-fondeo",
  "/herramientas/proyector-de-capital",
  "/herramientas/coste-de-indisciplina",
  "/herramientas/reloj-de-sesiones",
  "/herramientas/ahorro-vs-suscripcion",
  "/herramientas/impacto-de-comisiones",
  "/beta",
  "/test",
  "/aviso-legal",
  "/privacidad",
  "/cookies",
  "/terminos",
];

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".webp": "image/webp",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".json": "application/json",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".ico": "image/x-icon",
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

/** Lo que se ejecuta dentro de la página: devuelve los controles por debajo del listón. */
function medir({ alto: altoMin, ancho: anchoMin }) {
  const SELECTOR =
    "a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=link], [role=checkbox], [role=radio], [role=switch], [role=menuitem], [role=option]";
  const nombre = (el) =>
    (el.getAttribute("aria-label") || el.textContent || el.getAttribute("placeholder") || el.getAttribute("name") || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 40);
  const zona = (el) => el.closest("header, footer, nav, main, [role=dialog]")?.tagName.toLowerCase() ?? "página";
  const sel = (el) =>
    `${zona(el)} › ${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}.${(el.className?.baseVal ?? el.className ?? "")
      .toString()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .join(".")}`;

  /** Un enlace dentro de una frase: hay texto suyo y de la frase en la misma línea. */
  const enFrase = (el) => {
    if (el.tagName !== "A") return false;
    if (getComputedStyle(el).display !== "inline") return false;
    const padre = el.parentElement;
    if (!padre) return false;
    const textoPadre = (padre.textContent || "").replace(/\s+/g, " ").trim();
    const textoPropio = (el.textContent || "").replace(/\s+/g, " ").trim();
    return textoPadre.length > textoPropio.length + 1;
  };

  const visible = (el) => {
    if (el.closest("[aria-hidden='true'], [inert]")) return false;
    if (el.disabled || el.getAttribute("aria-disabled") === "true") return false;
    // Una casilla o un botón de radio nativos se tocan por su `label`, que es lo que se mide.
    if (el.matches("input[type=checkbox], input[type=radio]") && el.closest("label")) return false;
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden" || Number(s.opacity) === 0) return false;
    // Lo que solo existe para el lector de pantalla hasta recibir el foco («Saltar al contenido»).
    if (s.clip === "rect(0px, 0px, 0px, 0px)" || s.clipPath === "inset(50%)") return false;
    const r = el.getBoundingClientRect();
    return r.width >= 2 && r.height >= 2;
  };

  /** Del centro hacia un lado, píxel a píxel, mientras el dedo siga cayendo en el control. */
  const alcance = (el, x, y, dx, dy) => {
    let n = 0;
    for (let i = 1; i <= 80; i++) {
      const px = x + dx * i;
      const py = y + dy * i;
      if (px < 0 || py < 0 || px >= innerWidth || py >= innerHeight) break;
      const e = document.elementFromPoint(px, py);
      const objetivo = el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA" ? el.closest("label") || el : el;
      if (!e || !(objetivo === e || objetivo.contains(e) || el.contains(e))) break;
      n = i;
    }
    return n;
  };

  const fallos = [];
  let medidos = 0;
  const vistos = new Set();
  for (const el of document.querySelectorAll(SELECTOR)) {
    if (vistos.has(el)) continue;
    vistos.add(el);
    if (!visible(el) || enFrase(el)) continue;
    el.scrollIntoView({ block: "center", inline: "center" });
    const r = el.getBoundingClientRect();
    // Centro exacto, sin redondear: redondeado, el muestreo por píxeles perdía
    // hasta uno y un control de 44 px medía 43.
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) continue;
    const centro = document.elementFromPoint(x, y);
    const objetivo = el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA" ? el.closest("label") || el : el;
    if (!centro || !(objetivo === centro || objetivo.contains(centro) || el.contains(centro))) {
      // Tapado por otra capa en su propio centro: no se puede tocar ahí.
      fallos.push({ nombre: nombre(el), sel: sel(el), alto: 0, ancho: 0, tapado: true });
      continue;
    }
    medidos++;
    const alto = 1 + alcance(el, x, y, 0, -1) + alcance(el, x, y, 0, 1);
    const ancho = 1 + alcance(el, x, y, -1, 0) + alcance(el, x, y, 1, 0);
    if (alto < altoMin || ancho < anchoMin) fallos.push({ nombre: nombre(el), sel: sel(el), alto, ancho, tapado: false });
  }
  return { medidos, fallos };
}

const { server, base } = await servir(dir);
const navegador = await chromium.launch();
const ctx = await navegador.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 1,
  reducedMotion: "reduce",
});
const pagina = await ctx.newPage();
const fallos = [];
let total = 0;
for (const ruta of RUTAS) {
  await pagina.goto(`${base}${ruta}`, { waitUntil: "load" });
  const grueso = await pagina.evaluate(() => matchMedia("(pointer: coarse)").matches);
  if (!grueso) {
    console.error("[toque] el navegador no se presenta como táctil (pointer: coarse): lo medido no valdría nada.");
    process.exit(2);
  }
  const hojas = await pagina.evaluate(() => document.styleSheets.length);
  if (!hojas) {
    console.error(`[toque] ${ruta} se ha servido SIN hojas de estilo. ¿Falta NEXT_PUBLIC_BASE_PATH?`);
    process.exit(2);
  }
  // Recorre la página para que entre lo diferido.
  await pagina.evaluate(async () => {
    const alto = document.documentElement.scrollHeight;
    for (let y = 0; y < alto; y += Math.round(innerHeight * 0.8)) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    scrollTo(0, 0);
  });
  const r = await pagina.evaluate(medir, { alto: ALTO, ancho: ANCHO });
  total += r.medidos;
  for (const f of r.fallos) {
    fallos.push(
      `${ruta} · «${f.nombre}» ${f.tapado ? "tapado por otra capa en su centro" : `${f.ancho}×${f.alto} px`} — ${f.sel}`
    );
  }
}
await navegador.close();
server.close();

console.log(`[toque] ${RUTAS.length} páginas · ${total} controles medidos con el dedo`);
if (total < RUTAS.length * 5) {
  console.error("[toque] demasiado pocos controles medidos: el detector no está viendo la página.");
  process.exit(2);
}
if (fallos.length) {
  console.error(`[toque] ${fallos.length} control(es) por debajo de ${ALTO} px de alto o ${ANCHO} de ancho:`);
  for (const f of fallos) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`[toque] correcto — todo control se puede tocar en ${ALTO} px de alto y ${ANCHO} de ancho`);
