/**
 * TECLADO: recorre el sitio compilado sin ratón. Comprueba que cada parada del
 * tabulador se ve (WCAG 2.4.7), que el megamenú se abre con Enter, se cierra
 * con Escape y devuelve el foco, que los diálogos lo atrapan y lo sueltan, y
 * varios recorridos de capas, formulario, glosario e índice lateral. Un fallo
 * es un control sin indicador de foco, un foco perdido o una trampa rota.
 *
 * El diálogo del glosario no lleva `aria-modal` a propósito: Radix oculta el
 * resto con `aria-hidden`. Por eso se comprueba el comportamiento (el foco
 * queda dentro, Escape cierra) y no el atributo.
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

// 1. Cada parada del tabulador se ve.
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
      // La marca va en el elemento, no en su nombre: dos botones con el mismo nombre son dos paradas.
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

// 2. El megamenú.
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

// 3. Los diálogos atrapan el foco y lo devuelven.
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
    if (!dl) return { hay: false };
    // Lo que lee el lector al abrir: nombre, descripción a la que apunta (Radix la declara aunque no exista) y botones.
    const id = dl.getAttribute("aria-describedby");
    const nombres = [...dl.querySelectorAll("button")].map((b) => (b.getAttribute("aria-label") || b.textContent || b.getAttribute("title") || "").trim());
    return {
      hay: true,
      etiquetado: !!(dl.getAttribute("aria-label") || dl.getAttribute("aria-labelledby")),
      dentro: dl.contains(document.activeElement),
      describeANada: !!id && !document.getElementById(id),
      sinNombre: nombres.filter((n) => !n).length,
      enIngles: document.documentElement.lang === "es" ? nombres.filter((n) => /^(close|dismiss)$/i.test(n)) : [],
    };
  });
  if (!abierto.hay) {
    fallos.push({ ruta: d.ruta, detalle: `«${d.nombre}» no expone ningún role="dialog" al abrirse` });
    await ctx.close();
    continue;
  }
  if (!abierto.etiquetado) fallos.push({ ruta: d.ruta, detalle: `«${d.nombre}» se abre sin nombre: un lector lo anuncia como «diálogo» y ya` });
  if (!abierto.dentro) fallos.push({ ruta: d.ruta, detalle: `«${d.nombre}» se abre y el foco se queda fuera` });
  if (abierto.describeANada) fallos.push({ ruta: d.ruta, detalle: `«${d.nombre}» apunta con aria-describedby a una descripción que no existe` });
  if (abierto.sinNombre) fallos.push({ ruta: d.ruta, detalle: `«${d.nombre}» tiene ${abierto.sinNombre} botón(es) sin nombre` });
  if (abierto.enIngles.length) fallos.push({ ruta: d.ruta, detalle: `«${d.nombre}» nombra en inglés, en una página española: ${abierto.enIngles.join(", ")}` });

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

// 4. Las capas devuelven el foco y el aviso de cookies no lo roba.
const nueva = async (ruta, { ancho = 1280, consentimiento = "declined" } = {}) => {
  const ctx = await navegador.newContext({ viewport: { width: ancho, height: 900 }, reducedMotion: "reduce" });
  if (consentimiento) {
    await ctx.addInitScript((v) => { try { localStorage.setItem("tj-cookie-consent", v); } catch {} }, consentimiento);
  }
  // Esta guarda nunca debe enviar un mensaje de verdad.
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
/* Recorre más paradas que enfocables tiene la capa, hacia delante y hacia
   atrás: una trampa rota solo se ve al pasar del último (o del primero). Con un
   número fijo de pulsaciones, una capa grande aprobaría sin trampa. */
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
    // Combobox: el foco se queda en el campo y aria-activedescendant dice qué comando está resaltado.
    const combo = () => p.evaluate(() => {
      const i = document.querySelector('[role="dialog"] input[role="combobox"]');
      const id = i?.getAttribute("aria-activedescendant") ?? null;
      const o = id ? document.getElementById(id) : null;
      return { id, vale: o?.getAttribute("role") === "option" && o.getAttribute("aria-selected") === "true", foco: !!i && document.activeElement === i };
    });
    const c0 = await combo();
    await p.keyboard.press("ArrowDown");
    await p.waitForTimeout(150);
    const c1 = await combo();
    if (!c0.vale || !c1.vale || c0.id === c1.id || !c1.foco) {
      fallos.push({ ruta, detalle: `la paleta de la demo no dice qué comando está resaltado (aria-activedescendant «${c0.id ?? "nada"}» → «${c1.id ?? "nada"}», foco en el campo: ${c1.foco})` });
    }
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
  // (c) grupos de opción y pestañas, y los atajos 1–4
  /* Un grupo debe tener una sola parada de tabulador y las flechas mueven la
     elección. Las cifras sueltas solo valen con el foco dentro de la demo y sin
     Ctrl, que es el cambio de pestaña del navegador. */
  if (es) {
    const pestana = () => p.evaluate(() => document.querySelector('[data-demo-raiz] [role="tab"][aria-selected="true"]')?.textContent?.trim() ?? "");
    // La barra de pestañas de la demo queda fuera: moverla cambia de página y de grupos. Se prueba aparte.
    const revisaGrupos = async (pagina) => {
      const n = await p.evaluate(() => {
        document.querySelectorAll("[data-grupo-k]").forEach((x) => x.removeAttribute("data-grupo-k"));
        const gs =[...document.querySelectorAll('[data-demo-raiz] [role="radiogroup"], [data-demo-raiz] [role="tablist"]:not(#demo-tablist)')]
          .filter((g) => g.offsetParent !== null);
        gs.forEach((g, k) => g.setAttribute("data-grupo-k", String(k)));
        return gs.length;
      });
      let bien = 0;
      for (let k = 0; k < n; k++) {
        const g = p.locator(`[data-grupo-k="${k}"]`);
        if (!(await g.count())) {
          fallos.push({ ruta, detalle: `${pagina}: el grupo ${k + 1} desapareció mientras se probaba` });
          continue;
        }
        const info = await g.evaluate((el) => {
          const rol = el.getAttribute("role") === "tablist" ? "tab" : "radio";
          const ops = [...el.querySelectorAll(`[role="${rol}"]`)];
          const paradas = ops.filter((o) => o.tabIndex >= 0);
          document.querySelectorAll("[data-parada-grupo]").forEach((x) => x.removeAttribute("data-parada-grupo"));
          paradas[0]?.setAttribute("data-parada-grupo", "");
          return { nombre: el.getAttribute("aria-label") || "?", paradas: paradas.length, total: ops.length };
        });
        if (info.paradas !== 1) {
          fallos.push({ ruta, detalle: `${pagina}: el grupo «${info.nombre}» tiene ${info.paradas} paradas de tabulador para ${info.total} opciones; debe tener una` });
          continue;
        }
        await p.focus("[data-parada-grupo]");
        await p.keyboard.press("ArrowRight");
        await p.waitForTimeout(300);
        const tras = await g.evaluate((el) => {
          const a = document.activeElement;
          return {
            dentro: el.contains(a),
            otra: !!a && !a.hasAttribute("data-parada-grupo"),
            elegida: a?.getAttribute("aria-checked") === "true" || a?.getAttribute("aria-selected") === "true",
          };
        });
        if (!tras.dentro || !tras.otra || !tras.elegida) fallos.push({ ruta, detalle: `${pagina}: la flecha → no mueve el foco y la elección dentro de «${info.nombre}»` });
        else bien++;
        await p.keyboard.press("ArrowLeft");
        await p.waitForTimeout(300);
      }
      return { n, bien };
    };
    const resumen = await revisaGrupos("Resumen");
    await boton.focus();
    await p.keyboard.press("4");
    await p.waitForTimeout(600);
    const trasCuatro = await pestana();
    const diario = await revisaGrupos("Diario");
    await boton.focus();
    await p.keyboard.press("Control+1");
    await p.waitForTimeout(400);
    const trasControl = await pestana();
    await p.locator("header a:visible").first().focus();
    await p.keyboard.press("1");
    await p.waitForTimeout(400);
    const trasFuera = await pestana();
    await p.focus('#demo-tablist [role="tab"][aria-selected="true"]');
    await p.keyboard.press("ArrowRight");
    await p.waitForTimeout(600);
    const trasVuelta = await p.evaluate(() => {
      const a = document.activeElement;
      return a?.getAttribute("role") === "tab" && a.getAttribute("aria-selected") === "true" ? a.textContent.trim() : `foco en «${(a?.textContent || "").trim().slice(0, 20)}»`;
    });
    const medidos = resumen.n + diario.n;
    const antes = fallos.length;
    if (!/Resumen/.test(trasVuelta)) fallos.push({ ruta, detalle: `→ en la última pestaña de la demo no vuelve a la primera (${trasVuelta})` });
    if (!/Diario/.test(trasCuatro)) fallos.push({ ruta, detalle: `la tecla 4 con el foco en la demo no abre el Diario (pestaña activa «${trasCuatro}»)` });
    if (trasControl !== trasCuatro) fallos.push({ ruta, detalle: `Ctrl+1 cambia la página de la demo («${trasCuatro}» → «${trasControl}»): pisa el cambio de pestaña del navegador` });
    if (trasFuera !== trasCuatro) fallos.push({ ruta, detalle: `la tecla 1 con el foco fuera de la demo cambia su página («${trasCuatro}» → «${trasFuera}»)` });
    if (medidos < 4) fallos.push({ ruta, detalle: `solo ${medidos} grupos de opción o pestañas en el Resumen y el Diario: la guarda no está midiendo lo que cree` });
    if (fallos.length === antes && resumen.bien + diario.bien === medidos) recorridos++;
    console.log(`  demo ${idioma}: ${resumen.bien + diario.bien} de ${medidos} grupos se recorren con flechas; atajos 1–4 probados`);
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
    const aviso = r[1] ? await p.evaluate((id) => document.getElementById(id)?.textContent?.trim() ?? "", r[1]) : "";
    // El borde se mide con el foco fuera de los dos campos: el anillo de foco también lo cambia.
    await p.locator("form:has(#cf-email) button[type=submit]").first().focus();
    const [bordeValido, bordeInvalido] = await p.evaluate(() => ["cf-name", "cf-email"].map((id) => getComputedStyle(document.getElementById(id)).borderTopColor));
    if (r[1] !== "cf-email-error" || !aviso) fallos.push({ ruta: "/faq/", detalle: `el correo inválido no apunta a un aviso con texto (aria-describedby=«${r[1]}», aviso «${aviso}»)` });
    else if (r[0] || r[2]) fallos.push({ ruta: "/faq/", detalle: `los campos válidos también se anuncian con el error (nombre «${r[0]}», mensaje «${r[2]}»)` });
    else if (bordeValido === bordeInvalido) fallos.push({ ruta: "/faq/", detalle: `el campo inválido lleva el mismo borde que el válido (${bordeInvalido})` });
    else recorridos++;
  }
  await ctx.close();
}
// (g) al enviarse, el foco va a la confirmación
/* El `<form>` se desmonta al enviarse y el foco debe pasar a la confirmación,
   no caer al `<body>`. El servicio de envío se sustituye por un éxito simulado;
   la ruta que lo aborta en `nueva` queda debajo de esta. */
{
  const { ctx, p } = await nueva("/faq/");
  await ctx.route(/web3forms/i, (r) =>
    r.request().method() === "OPTIONS"
      ? r.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "POST" } })
      : r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify({ success: true }) }),
  );
  if (!(await p.locator("#cf-email").count())) {
    fallos.push({ ruta: "/faq/", detalle: "no encontré el formulario de contacto (#cf-email)" });
  } else {
    await p.fill("#cf-name", "Prueba de teclado");
    await p.fill("#cf-email", "prueba@example.com");
    await p.fill("#cf-msg", "Mensaje de prueba de la guarda de teclado, que nunca se envía.");
    await p.locator("form:has(#cf-email) button[type=submit]").first().focus();
    await p.keyboard.press("Enter");
    await p.waitForTimeout(800);
    const r = await p.evaluate(() => {
      const a = document.activeElement;
      return {
        enviado: !document.getElementById("cf-email"),
        rol: a && a !== document.body ? a.getAttribute("role") : null,
        foco: a === document.body ? "<body>" : (a?.textContent || "").trim().slice(0, 30),
      };
    });
    if (!r.enviado) fallos.push({ ruta: "/faq/", detalle: "no pude simular el envío del formulario: ¿falta la clave de envío al compilar?" });
    else if (r.rol !== "status") fallos.push({ ruta: "/faq/", detalle: `tras enviar el formulario, el foco no está en la confirmación (está en «${r.foco}»)` });
    else recorridos++;
  }
  await ctx.close();
}
// (h) el glosario abierto con Ctrl+G devuelve el foco al cerrarse
// Sin disparador propio, Radix no sabe adónde devolver el foco y lo deja en `<body>`.
{
  const { ctx, p } = await nueva("/");
  await p.locator("header a:visible").first().focus();
  await marcaFoco(p);
  await p.keyboard.press("Control+g");
  await p.waitForTimeout(900);
  const abierto = await p.evaluate(() => !!document.querySelector('[role="dialog"]'));
  if (!abierto) {
    fallos.push({ ruta: "/", detalle: "Ctrl+G no abre el glosario" });
  } else {
    await p.keyboard.press("Escape");
    await p.waitForTimeout(600);
    if (!(await focoVuelve(p))) {
      const donde = await p.evaluate(() => (document.activeElement === document.body ? "<body>" : (document.activeElement?.textContent || "").trim().slice(0, 30)));
      fallos.push({ ruta: "/", detalle: `al cerrar el glosario abierto con Ctrl+G, el foco no vuelve a donde estaba (está en «${donde}»)` });
    } else recorridos++;
  }
  await ctx.close();
}
// (i) el índice lateral lleva el punto de partida del tabulador a la sección
// El enlace evita el salto nativo; el foco debe acabar en la sección, no en el índice.
{
  const { ctx, p } = await nueva("/features/", { ancho: 1680 });
  const enlaces = p.locator('nav[aria-label="Índice de la página"] a:visible');
  if ((await enlaces.count()) < 2) {
    fallos.push({ ruta: "/features/", detalle: "no encontré el índice lateral con dos enlaces o más a 1680 px" });
  } else {
    const destino = ((await enlaces.nth(1).getAttribute("href")) ?? "").replace(/^.*#/, "");
    await enlaces.nth(1).focus();
    await p.keyboard.press("Enter");
    await p.waitForTimeout(1200);
    // El foco debe estar ya en la sección: «después de ella» no basta, el pie también lo está.
    const r = await p.evaluate((id) => {
      const s = document.getElementById(id);
      const a = document.activeElement;
      return { bien: !!s && !!a && (s === a || s.contains(a)), foco: (a?.textContent || a?.tagName || "").trim().slice(0, 30) };
    }, destino);
    if (!r.bien) fallos.push({ ruta: "/features/", detalle: `tras ir a «#${destino}» desde el índice, el foco no está en la sección (sigue en «${r.foco}»): el siguiente Tab la esquiva` });
    else recorridos++;
  }
  await ctx.close();
}
console.log(`  capas, aviso de cookies, glosario, megamenú, formulario e índice: ${recorridos} de 13 recorridos completos`);
if (recorridos < 13 && !fallos.length) {
  fallos.push({ ruta: "—", detalle: `solo ${recorridos} de 13 recorridos llegaron a medirse` });
}

await navegador.close();
server.close();

if (fallos.length) {
  console.log(`\n  problemas — ${fallos.length}`);
  for (const f of fallos) console.log(`     ${f.ruta}  ${f.detalle}`);
}

console.log(`\n[teclado] ${RUTAS.length} rutas recorridas · ${paradasTotales} paradas de tabulador · ${DIALOGOS.length} diálogos`);

// Esta guarda vigila ausencias y aprobaría siempre si dejara de recorrer: sin paradas, no ha mirado el sitio.
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
