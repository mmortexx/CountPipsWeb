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

  // Más pulsaciones que enfocables: si no, la trampa rota nunca se alcanza.
  const enfocables = await p.evaluate(() => {
    const dl = document.querySelector('[role="dialog"][data-state="open"], [role="dialog"][data-visible="true"]') || document.querySelector('[role="dialog"]');
    return dl ? dl.querySelectorAll("a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex='-1'])").length : 0;
  });
  const vueltas = Math.max(30, enfocables + 3);
  let fuera = 0;
  for (let i = 0; i < vueltas; i++) {
    await p.keyboard.press("Tab");
    const sigueDentro = await p.evaluate(() => {
      const dl = document.querySelector('[role="dialog"][data-state="open"], [role="dialog"][data-visible="true"]') || document.querySelector('[role="dialog"]');
      return dl ? dl.contains(document.activeElement) : true;
    });
    if (!sigueDentro) fuera++;
  }
  if (fuera > 0) fallos.push({ ruta: d.ruta, detalle: `el foco se escapa de «${d.nombre}»: ${fuera} de ${vueltas} tabuladores acabaron detrás de la capa` });

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

// ── 4. las capas devuelven el foco, y el aviso de cookies no lo roba ──
/* Seis recorridos que el 2026-09-25 fallaban: el Tab se escapaba de la
   paleta de la demo, la ayuda de la demo se abría sin llevarse el foco, el
   aviso de cookies reabierto desde el pie no lo recibía, el glosario no
   decía qué opción estaba activa, el megamenú se quedaba abierto al salir
   de él con Tab y el formulario señalaba el error en los tres campos. */
const nueva = async (ruta, { ancho = 1280, consentimiento = "declined" } = {}) => {
  const ctx = await navegador.newContext({ viewport: { width: ancho, height: 900 }, reducedMotion: "reduce" });
  if (consentimiento) {
    await ctx.addInitScript((v) => { try { localStorage.setItem("tj-cookie-consent", v); } catch {} }, consentimiento);
  }
  // Nada de esta guarda puede llegar a enviar un mensaje de verdad.
  await ctx.route(/web3forms/i, (r) => r.abort());
  const p = await ctx.newPage();
  await p.goto(base + ruta, { waitUntil: "load", timeout: 30000 });
  await p.waitForTimeout(800);
  return { ctx, p };
};
const marcaFoco = (p) => p.evaluate(() => {
  const a = document.activeElement;
  if (!a || a === document.body) return false;
  a.setAttribute("data-foco-previo", "");
  return true;
});
const focoVuelve = (p) => p.evaluate(() => document.activeElement?.hasAttribute("data-foco-previo") === true);
const dialogo = (p, nombre) => p.evaluate((n) => {
  const d = [...document.querySelectorAll('[role="dialog"]')].find((x) => x.getAttribute("aria-label") === n);
  if (!d) return null;
  const a = document.activeElement;
  return { dentro: d.contains(a), foco: a?.getAttribute("aria-label") || (a?.textContent || "").trim().slice(0, 30) };
}, nombre);
/* Recorre MÁS paradas que enfocables tiene la capa, primero hacia delante y
   luego hacia atrás: una trampa rota solo se ve al pasar del último (o del
   primero). Con un número fijo de pulsaciones, una paleta de 15 botones
   aprobaba sin trampa ninguna porque nunca se llegaba al final. */
const atrapa = async (p, nombre) => {
  const n = await p.evaluate((x) => {
    const d = [...document.querySelectorAll('[role="dialog"]')].find((e) => e.getAttribute("aria-label") === x);
    return d ? d.querySelectorAll("a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex='-1'])").length : 0;
  }, nombre);
  let fuera = 0;
  for (const tecla of ["Tab", "Shift+Tab"]) {
    for (let i = 0; i < n + 3; i++) {
      await p.keyboard.press(tecla);
      if (!(await dialogo(p, nombre))?.dentro) fuera++;
    }
  }
  return { fuera, pulsaciones: 2 * (n + 3) };
};
let recorridos = 0;

for (const idioma of ["es", "en"]) {
  const es = idioma === "es";
  const { ctx, p } = await nueva(es ? "/demo/" : "/en/demo/");
  const ruta = es ? "/demo/" : "/en/demo/";
  const PALETA = es ? "Paleta de comandos" : "Command palette";
  const ATAJOS = es ? "Atajos de teclado" : "Keyboard shortcuts";
  const boton = p.locator("[data-demo-raiz] button:visible").first();
  if (!(await boton.count())) {
    fallos.push({ ruta, detalle: "no encontré ningún botón dentro de `[data-demo-raiz]`: ¿se quitó el atributo de AppDemo?" });
    await ctx.close();
    continue;
  }
  // (a) la paleta de la demo
  await boton.focus();
  await marcaFoco(p);
  await p.keyboard.press("Control+k");
  await p.waitForTimeout(500);
  if (!(await dialogo(p, PALETA))) {
    fallos.push({ ruta, detalle: "Ctrl+K con el foco dentro de la demo no abre su paleta" });
  } else {
    recorridos++;
    const { fuera, pulsaciones } = await atrapa(p, PALETA);
    if (fuera) fallos.push({ ruta, detalle: `el Tab se escapa de la paleta de la demo: ${fuera} de ${pulsaciones} pulsaciones acabaron fuera` });
    await p.keyboard.press("Escape");
    await p.waitForTimeout(500);
    if (!(await focoVuelve(p))) fallos.push({ ruta, detalle: "al cerrar la paleta de la demo, el foco no vuelve a donde estaba" });
  }
  // (b) la ayuda de atajos de la demo
  await boton.focus();
  await p.keyboard.press("Shift+Slash");
  await p.waitForTimeout(700);
  const ayuda = await dialogo(p, ATAJOS);
  if (!ayuda) {
    fallos.push({ ruta, detalle: "«?» con el foco dentro de la demo no abre su ayuda de atajos" });
  } else {
    recorridos++;
    if (!ayuda.dentro) fallos.push({ ruta, detalle: `la ayuda de la demo se abre y el foco se queda fuera (en «${ayuda.foco}»)` });
    await p.keyboard.press("Escape");
    await p.waitForTimeout(500);
    if (!(await focoVuelve(p))) fallos.push({ ruta, detalle: "al cerrar la ayuda de la demo, el foco no vuelve a donde estaba" });
  }
  console.log(`  demo ${idioma}: paleta y ayuda de atajos`);
  await ctx.close();
}

// (c) el aviso de cookies: aparece solo sin robar el foco, y reabierto desde el pie sí lo recibe
{
  const { ctx, p } = await nueva("/", { consentimiento: null });
  await p.keyboard.press("Tab");
  const marcado = await marcaFoco(p);
  await p.waitForTimeout(5800);
  const visible = await p.evaluate(() => !!document.querySelector('[data-cookie-consent="visible"]'));
  if (!marcado || !visible) {
    fallos.push({ ruta: "/", detalle: `no pude preparar la prueba del aviso de cookies (foco marcado: ${marcado}, aviso visible: ${visible})` });
  } else {
    recorridos++;
    if (!(await focoVuelve(p))) fallos.push({ ruta: "/", detalle: "el aviso de cookies, al aparecer solo, se lleva el foco: quien estaba leyendo pierde su sitio" });
  }
  await ctx.close();
}
{
  const { ctx, p } = await nueva("/");
  const pie = p.locator("footer button").filter({ hasText: "Preferencias de privacidad" }).first();
  if (!(await pie.count())) {
    fallos.push({ ruta: "/", detalle: "no encontré «Preferencias de privacidad» en el pie" });
  } else {
    await pie.focus();
    await marcaFoco(p);
    await p.keyboard.press("Enter");
    await p.waitForTimeout(700);
    const aviso = await dialogo(p, "Consentimiento de cookies");
    if (!aviso?.dentro) {
      fallos.push({ ruta: "/", detalle: `reabierto desde el pie, el aviso de cookies no recibe el foco (está en «${aviso?.foco ?? "ninguno"}»)` });
    } else {
      recorridos++;
      await p.keyboard.press("Enter");
      await p.waitForTimeout(500);
      if (!(await focoVuelve(p))) fallos.push({ ruta: "/", detalle: "tras elegir en el aviso de cookies, el foco no vuelve al enlace del pie" });
    }
  }
  await ctx.close();
}

// (d) el glosario dice qué opción está activa
{
  const { ctx, p } = await nueva("/faq/");
  const b = p.locator("button").filter({ hasText: /glosario|glossary/i }).first();
  if (await b.count()) {
    await b.focus();
    await p.keyboard.press("Enter");
    await p.waitForTimeout(700);
    const lista = p.locator('[role="dialog"] [role="listbox"]').first();
    if (!(await lista.count())) {
      fallos.push({ ruta: "/faq/", detalle: "el glosario no expone ningún role=\"listbox\"" });
    } else {
      await lista.focus();
      await p.keyboard.press("ArrowDown");
      await p.keyboard.press("ArrowDown");
      await p.waitForTimeout(200);
      const r = await p.evaluate(() => {
        const ul = document.querySelector('[role="dialog"] [role="listbox"]');
        const id = ul?.getAttribute("aria-activedescendant");
        const elegida = ul?.querySelector('[aria-selected="true"]');
        return { id, existe: !!(id && document.getElementById(id)), coincide: !!elegida && elegida.id === id, foco: document.activeElement === ul };
      });
      if (!r.existe || !r.coincide) {
        fallos.push({ ruta: "/faq/", detalle: `el glosario no dice qué opción está activa (aria-activedescendant=«${r.id ?? "nada"}»)` });
      } else recorridos++;
      if (!r.foco) fallos.push({ ruta: "/faq/", detalle: "al moverse con las flechas, el foco sale de la lista del glosario" });
    }
  } else fallos.push({ ruta: "/faq/", detalle: "no encontré el botón del glosario" });
  await ctx.close();
}

// (e) el megamenú se cierra cuando el Tab sale de la navegación, no antes
{
  const { ctx, p } = await nueva("/");
  const disp = p.locator("#navbar-producto-trigger").first();
  if (await disp.count()) {
    await disp.focus();
    await p.keyboard.press("Enter");
    await p.waitForTimeout(400);
    await p.keyboard.press("Tab");
    await p.waitForTimeout(150);
    const dentroAbierto = await p.evaluate(() => document.getElementById("navbar-producto-trigger")?.getAttribute("aria-expanded"));
    if (dentroAbierto !== "true") fallos.push({ ruta: "/", detalle: "el megamenú se cierra en cuanto el Tab entra en sus enlaces" });
    let salio = false;
    for (let i = 0; i < 60 && !salio; i++) {
      await p.keyboard.press("Tab");
      salio = await p.evaluate(() => {
        const zona = document.getElementById("navbar-producto-trigger")?.parentElement?.parentElement;
        return !!zona && !zona.contains(document.activeElement);
      });
    }
    await p.waitForTimeout(300);
    const fuera = await p.evaluate(() => document.getElementById("navbar-producto-trigger")?.getAttribute("aria-expanded"));
    if (!salio) fallos.push({ ruta: "/", detalle: "tras 60 tabuladores el foco no salió de la navegación: la guarda no está midiendo lo que cree" });
    else if (fuera !== "false") fallos.push({ ruta: "/", detalle: "el Tab sale de la navegación y el megamenú se queda abierto encima de la página" });
    else recorridos++;
  }
  await ctx.close();
}

// (f) el formulario señala el error en el campo que falla, no en los tres
{
  const { ctx, p } = await nueva("/faq/");
  const email = p.locator("#cf-email");
  if (!(await email.count())) {
    fallos.push({ ruta: "/faq/", detalle: "no encontré el formulario de contacto (#cf-email)" });
  } else {
    await p.fill("#cf-name", "Prueba de teclado");
    await email.fill("esto-no-es-un-correo");
    await p.fill("#cf-msg", "Mensaje de prueba de la guarda de teclado, que nunca se envía.");
    await p.locator("form:has(#cf-email) button[type=submit]").first().focus();
    await p.keyboard.press("Enter");
    await p.waitForTimeout(500);
    const r = await p.evaluate(() => ["cf-name", "cf-email", "cf-msg"].map((id) => document.getElementById(id)?.getAttribute("aria-describedby") ?? null));
    if (r[1] !== "cf-error") fallos.push({ ruta: "/faq/", detalle: `el correo inválido no apunta a su error (aria-describedby=«${r[1]}»)` });
    else if (r[0] || r[2]) fallos.push({ ruta: "/faq/", detalle: `los campos válidos también se anuncian con el error (nombre «${r[0]}», mensaje «${r[2]}»)` });
    else recorridos++;
  }
  await ctx.close();
}
console.log(`  capas, aviso de cookies, glosario, megamenú y formulario: ${recorridos} de 9 recorridos completos`);
if (recorridos < 9 && !fallos.length) {
  fallos.push({ ruta: "—", detalle: `solo ${recorridos} de 9 recorridos llegaron a medirse` });
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
