/**
 * REJILLAS — ¿alguna ficha despega su texto para igualar la fila?
 *
 * ── Qué mide ──────────────────────────────────────────────────────────
 * Una rejilla CSS de varias filas, metida en otra rejilla que la estira
 * para igualar la altura de sus vecinas, reparte el alto sobrante entre
 * sus propias filas (`align-content: normal` se comporta como `stretch`).
 * El título se queda arriba y la descripción baja sola: el hueco entre
 * los dos cambia de una ficha a otra según lo que mida la de al lado.
 * No rompe nada ni desborda, así que ninguna otra guarda lo ve.
 *
 * La prueba es directa: a cada rejilla de dos filas o más se le pone
 * `align-content: start` un instante; si algún hijo se mueve, la rejilla
 * estaba repartiendo hueco. Las de una sola fila no cuentan: ahí estirar
 * la fila es lo que centra el contenido en vertical, y es a propósito.
 *
 * ── Qué encontró el día que se escribió (2026-09-23) ──────────────────
 * El índice de /features, en los dos idiomas: «Playbooks» y «Riesgo de
 * ruina» separaban 11 px su descripción del título. Se vio en rojo con
 * esa compilación antes del arreglo (`content-start` en la ficha).
 *
 * ── Y el compás de las columnas (2026-09-26) ──────────────────────────
 * En una rejilla de tres pistas iguales o más, el texto de cada columna
 * tiene que empezar a la misma distancia del de la anterior. «Tus
 * hábitos, en cifras» (/features/metricas) quitaba el relleno izquierdo
 * solo a la primera celda: columnas a 400 y 376 px. Visto en rojo con esa
 * compilación. Las rejillas con filete vertical entre celdas no cuentan:
 * ahí el texto se mide desde el filete y la primera columna no lo tiene.
 *
 * ── Y el doble filete (2026-09-30) ────────────────────────────────────
 * Dos líneas horizontales de sección a 40-260 px sin nada entre ellas:
 * el filete del cierre caía bajo el borde inferior de la lista de encima
 * en 15 páginas (portada, acerca de, características, glosario, manual y
 * las diez calculadoras). Visto en rojo con esa compilación.
 *
 * ── Y el tono del filete y las rayas juntas (2026-10-01) ──────────────
 * Ningún filete gris con una opacidad escrita a mano: el tono sale de
 * `--line`, `--line-2`, `--ficha-division`, `--chip-line` o `--border`.
 * Había once: 0,06, 0,09, 0,12, 0,14, 0,16, 0,18, 0,2 y 0,3 además de
 * los tokens. Y el doble filete baja de 40 a 8 px: el índice lateral de
 * /faq cerraba con dos rayas a 24 px, la tabla de recuperación con dos a
 * 16 px. Las cajas (campos, segmentados) no cuentan como filete. Vista
 * en rojo con la compilación anterior (18 tonos y 9 pares).
 *
 * ── Y las cifras de una fila, y los segmentados vecinos (2026-10-03) ──
 * En una fila de celdas «rótulo + cifra», la cifra cae a la misma altura
 * aunque un rótulo ocupe dos líneas: «Riesgo de ruina (−50 %)» bajaba su
 * cifra 16 px respecto a las otras tres en la calculadora de riesgo (y en
 * /features/metricas), y «Statistical power (1 − β)» a 390 px. Y dos
 * controles segmentados en la misma fila miden lo mismo: firma (41 px,
 * dos líneas) y tamaño (36) en /traders/prop-firms. Vista en rojo con la
 * compilación anterior (3 cifras y 2 pares).
 *
 * ── Lo que NO mira ────────────────────────────────────────────────────
 * Flexbox, donde el mismo reparto solo ocurre si alguien lo pide.
 *
 * Uso:  node scripts/rejillas.mjs --serve out
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, readdir, stat } from "node:fs/promises";
import { join, extname, relative } from "node:path";

const args = process.argv.slice(2);
const dir = args.includes("--serve") ? args[args.indexOf("--serve") + 1] : "out";
const PREFIJO = process.env.NEXT_PUBLIC_BASE_PATH || "";
const ANCHOS = [1440, 390];
const TOLERANCIA_PX = 4;
const PESTANAS = 4;

const TIPOS = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
  ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml",
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

/* Todas las páginas compiladas, no una lista a mano: una página nueva
   entra sola en la guarda. */
async function paginas(carpeta) {
  const rutas = [];
  for (const e of await readdir(carpeta, { withFileTypes: true })) {
    const p = join(carpeta, e.name);
    if (e.isDirectory() && !e.name.startsWith("_")) rutas.push(...(await paginas(p)));
    else if (e.name === "index.html") {
      const rel = relative(dir, carpeta).replaceAll("\\", "/");
      rutas.push(rel ? `/${rel}/` : "/");
    }
  }
  return rutas;
}

const RUTAS = await paginas(dir);
if (RUTAS.length < 100) {
  console.log(`[rejillas] solo ${RUTAS.length} páginas en ${dir}: ¿está compilado?`);
  process.exit(1);
}

const { server, base } = await servir(dir);
const navegador = await chromium.launch();
const fallos = new Map();
let rejillas = 0;
let columnadasTotal = 0;
let filetesTotal = 0;
let filasCifraTotal = 0;

async function medir(pag, ruta, ancho) {
  try {
    await pag.goto(`${base}${ruta}`, { waitUntil: "networkidle", timeout: 30000 });
  } catch {
    fallos.set(`ruta que no carga ${ruta}`, [`${ancho} ${ruta}`]);
    return;
  }
  // Las secciones diferidas no tienen alto propio hasta que se pintan.
  await pag.addStyleTag({ content: ".cv-auto{content-visibility:visible!important}" });
  await pag.waitForTimeout(150);
  const r = await pag.evaluate((tol) => {
    const vistos = [];
    let n = 0;
    const descompases = [];
    let columnadas = 0;
    for (const el of document.querySelectorAll("body *")) {
      const cs = getComputedStyle(el);
      if (!cs.display.includes("grid") || el.children.length < 2) continue;
      /* Compás de columnas: en una rejilla de pistas iguales, el texto de
         cada columna empieza a la misma distancia del de la anterior. */
      const pistas = cs.gridTemplateColumns.trim().split(/\s+/).map(parseFloat);
      if (pistas.length >= 3 && pistas.every((p) => Math.abs(p - pistas[0]) <= 1) && el.getBoundingClientRect().height > 0) {
        const fila = [...el.children].filter((c) => Math.abs(c.getBoundingClientRect().top - el.children[0].getBoundingClientRect().top) < 2);
        /* Con filete vertical entre celdas (`.tj-matriz`, TechSpecs) el texto
           se mide desde el filete, y la primera columna no tiene: ahí la
           diferencia de compás es la correcta. */
        const conFilete = fila.slice(1).some((c) => {
          const s = getComputedStyle(c);
          return parseFloat(s.borderLeftWidth) > 0 || /-1px 0px 0px/.test(s.boxShadow);
        });
        if (fila.length >= 3 && !conFilete) {
          columnadas++;
          const inicios = fila.map((c) => {
            const s = getComputedStyle(c);
            return c.getBoundingClientRect().left + parseFloat(s.paddingLeft) + parseFloat(s.borderLeftWidth);
          });
          const pasos = inicios.slice(1).map((x, i) => x - inicios[i]);
          const desvio = Math.max(...pasos) - Math.min(...pasos);
          if (desvio > tol) {
            descompases.push({
              clase: `<${el.tagName.toLowerCase()} class="${String(el.className).slice(0, 70)}">`,
              texto: (el.textContent || "").trim().slice(0, 36),
              pasos: pasos.map(Math.round).join("/"),
            });
          }
        }
      }
      if (!["normal", "stretch"].includes(cs.alignContent)) continue;
      if (el.getBoundingClientRect().height === 0) continue;
      if (cs.gridTemplateRows.trim().split(/\s+/).length < 2) continue;
      n++;
      const hijos = [...el.children];
      const antes = hijos.map((c) => c.getBoundingClientRect().top);
      const propio = el.style.alignContent;
      el.style.alignContent = "start";
      const mov = Math.max(...hijos.map((c, i) => Math.abs(c.getBoundingClientRect().top - antes[i])));
      el.style.alignContent = propio;
      if (mov > tol) {
        vistos.push({
          clase: `<${el.tagName.toLowerCase()} class="${String(el.className).slice(0, 70)}">`,
          texto: (el.textContent || "").trim().slice(0, 36),
          mov: Math.round(mov),
        });
      }
    }
    /* Doble filete: dos líneas horizontales de sección a 40-260 px una de
       otra sin nada pintado entre ellas, en todo el ancho que cubren. */
    const main = document.querySelector("main");
    const filetes = [];
    const cosas = [];
    /* Tono del filete: el gris de un filete sale de un token (`--line`,
       `--line-2`, `--ficha-division`, `--chip-line`, `--border`), no de
       una opacidad escrita a mano. Se leen del propio CSS con una sonda
       nueva por token: si se reutiliza una, la transición de color del
       sitio devuelve el valor anterior y todos los tonos salen iguales. */
    const tonos = new Set();
    const lee = (css, prop) => {
      const sonda = document.createElement("div");
      sonda.style.cssText = css;
      document.body.appendChild(sonda);
      const v = getComputedStyle(sonda)[prop];
      sonda.remove();
      return v;
    };
    for (const v of ["--line", "--line-2", "--ficha-division", "--chip-line", "--border"]) {
      tonos.add(lee(`border-top:1px solid var(${v})`, "borderTopColor"));
    }
    const baseFilete = lee("color:rgb(var(--divider))", "color").replace(/^rgb\((.*)\)$/, "$1");
    const sueltos = [];
    if (main) {
      const sy = window.scrollY;
      const tiene = (s, lado) => parseFloat(s[`border${lado}Width`]) > 0 && s[`border${lado}Style`] !== "none" && s[`border${lado}Color`] !== "rgba(0, 0, 0, 0)";
      for (const el of main.querySelectorAll("*")) {
        if (el.closest("[data-demo-raiz],svg,input,textarea,select,[aria-hidden=true]")) continue;
        const s = getComputedStyle(el);
        if (s.visibility === "hidden") continue;
        const b = el.getBoundingClientRect();
        if (b.width === 0 || b.height === 0) continue;
        for (const lado of ["Top", "Bottom", "Left", "Right"]) {
          if (!tiene(s, lado)) continue;
          const c = s[`border${lado}Color`];
          const m = c.match(/^rgba\((\d+, \d+, \d+), ([\d.]+)\)$/);
          if (m && m[1] === baseFilete && !tonos.has(c)) {
            sueltos.push({ clase: `<${el.tagName.toLowerCase()} class="${String(el.className).slice(0, 60)}">`, tono: m[2] });
          }
        }
        /* Una caja (campo, control segmentado) no es un filete: su borde
           inferior no se suma a la línea que venga debajo. */
        if (b.width < 200 || (tiene(s, "Left") && tiene(s, "Right"))) continue;
        if (tiene(s, "Top")) filetes.push({ y: b.top + sy, x1: b.left, x2: b.right });
        if (tiene(s, "Bottom")) filetes.push({ y: b.bottom + sy, x1: b.left, x2: b.right });
      }
      const w = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
      while (w.nextNode()) {
        const t = w.currentNode;
        if (!t.textContent.trim() || t.parentElement?.closest(".sr-only")) continue;
        const rg = document.createRange();
        rg.selectNodeContents(t);
        for (const q of rg.getClientRects()) if (q.width > 0) cosas.push({ t: q.top + sy, b: q.bottom + sy, x1: q.left, x2: q.right });
      }
      for (const el of main.querySelectorAll("img,svg,canvas,input,textarea,select,button,video")) {
        const q = el.getBoundingClientRect();
        if (q.width > 0 && q.height > 0) cosas.push({ t: q.top + sy, b: q.bottom + sy, x1: q.left, x2: q.right });
      }
    }
    /* Cifras a compás: en una fila de celdas «rótulo + cifra», las cifras
       caen a la misma altura aunque un rótulo ocupe dos líneas. */
    const descolgadas = [];
    let filasCifra = 0;
    const esCelda = (c) => c.children.length === 2 && /\d/.test(c.children[1].textContent || "") && c.children[1].getBoundingClientRect().height > 0;
    for (const el of document.querySelectorAll("main *")) {
      if (el.closest("[data-demo-raiz]") || !getComputedStyle(el).display.includes("grid")) continue;
      const celdas = [...el.children].filter(esCelda);
      const filas = new Map();
      for (const c of celdas) {
        const k = Math.round(c.getBoundingClientRect().top / 3);
        if (!filas.has(k)) filas.set(k, []);
        filas.get(k).push(c);
      }
      for (const fila of filas.values()) {
        if (fila.length < 2) continue;
        filasCifra++;
        const pies = fila.map((c) => c.children[1].getBoundingClientRect().bottom);
        if (Math.max(...pies) - Math.min(...pies) > 2) {
          descolgadas.push({ texto: (fila[0].textContent || "").trim().slice(0, 36), salto: Math.round(Math.max(...pies) - Math.min(...pies)) });
        }
      }
    }
    /* Controles segmentados uno al lado del otro: el mismo alto. */
    const desiguales = [];
    for (const g of document.querySelectorAll("main .tj-segmentado")) {
      const h = g.nextElementSibling;
      if (!h?.classList.contains("tj-segmentado")) continue;
      const a = g.getBoundingClientRect();
      const b = h.getBoundingClientRect();
      if (Math.abs(a.top - b.top) < 2 && Math.abs(a.height - b.height) > 1) {
        desiguales.push({ texto: (g.textContent || "").trim().slice(0, 30), altos: `${Math.round(a.height)}/${Math.round(b.height)}` });
      }
    }
    filetes.sort((a, b) => a.y - b.y);
    const dobles = [];
    for (let i = 0; i < filetes.length; i++) {
      for (let j = i + 1; j < filetes.length; j++) {
        const a = filetes[i];
        const c = filetes[j];
        const hueco = c.y - a.y;
        if (hueco < 8) continue;
        if (hueco > 260) break;
        if (Math.min(a.x2, c.x2) - Math.max(a.x1, c.x1) < 200) continue;
        /* Cuenta lo que haya en cualquier columna, y un titular que arranca
           a la altura del segundo filete: ahí empieza sección, no hay banda
           vacía. A menos de 40 px, en cambio, solo cuenta lo que cae bajo
           los dos filetes: dos rayas tan juntas se leen dobles aunque la
           columna de al lado tenga texto (el índice lateral de /faq). */
        const lo = Math.max(a.x1, c.x1);
        const hi = Math.min(a.x2, c.x2);
        if (!cosas.some((k) => k.b > a.y + 1 && k.t < c.y + 8 && (hueco >= 40 || (k.x2 > lo && k.x1 < hi)))) {
          dobles.push({ y: Math.round(a.y), hueco: Math.round(hueco) });
          break;
        }
      }
    }
    return { vistos, n, descompases, columnadas, dobles, nf: filetes.length, sueltos, nt: tonos.size, descolgadas, filasCifra, desiguales };
  }, TOLERANCIA_PX);
  filetesTotal += r.nf;
  filasCifraTotal += r.filasCifra;
  for (const d of r.descolgadas) {
    const k = "cifra descolgada de su fila";
    if (!fallos.has(k)) fallos.set(k, []);
    fallos.get(k).push(`${ancho} ${ruta}  «${d.texto}» a ${d.salto} px`);
  }
  for (const d of r.desiguales) {
    const k = "segmentados vecinos de distinto alto";
    if (!fallos.has(k)) fallos.set(k, []);
    fallos.get(k).push(`${ancho} ${ruta}  «${d.texto}» ${d.altos} px`);
  }
  if (r.nt < 3) fallos.set(`sin tokens de filete ${ruta}`, [`${ancho} ${ruta}: la sonda no leyó los tonos`]);
  for (const t of r.sueltos) {
    const k = `filete con tono suelto /${t.tono} ${t.clase}`;
    if (!fallos.has(k)) fallos.set(k, []);
    fallos.get(k).push(`${ancho} ${ruta}`);
  }
  for (const d of r.dobles) {
    const k = "doble filete sin nada entre medias";
    if (!fallos.has(k)) fallos.set(k, []);
    fallos.get(k).push(`${ancho} ${ruta}  en y=${d.y}, el siguiente a ${d.hueco} px`);
  }
  rejillas += r.n;
  columnadasTotal += r.columnadas;
  for (const v of r.vistos) {
    if (!fallos.has(v.clase)) fallos.set(v.clase, []);
    fallos.get(v.clase).push(`${ancho} ${ruta}  «${v.texto}» baja ${v.mov} px`);
  }
  for (const d of r.descompases) {
    const k = `compás ${d.clase}`;
    if (!fallos.has(k)) fallos.set(k, []);
    fallos.get(k).push(`${ancho} ${ruta}  «${d.texto}» columnas a ${d.pasos} px`);
  }
}

for (const ancho of ANCHOS) {
  const ctx = await navegador.newContext({ viewport: { width: ancho, height: 900 }, reducedMotion: "reduce" });
  await ctx.addInitScript(() => {
    try { localStorage.setItem("tj-cookie-consent", "declined"); } catch {}
  });
  const cola = [...RUTAS];
  const trabajador = async () => {
    const pag = await ctx.newPage();
    for (let ruta = cola.shift(); ruta; ruta = cola.shift()) await medir(pag, ruta, ancho);
    await pag.close();
  };
  await Promise.all(Array.from({ length: PESTANAS }, trabajador));
  await ctx.close();
}

await navegador.close();
server.close();

for (const [clase, casos] of fallos) {
  console.log(`\n  ${clase} — ${casos.length} caso(s)`);
  for (const c of casos.slice(0, 6)) console.log(`     ${c}`);
  if (casos.length > 6) console.log(`     … y ${casos.length - 6} más`);
}

console.log(`\n[rejillas] ${RUTAS.length} páginas × ${ANCHOS.length} anchos · ${rejillas} rejillas de varias filas medidas · ${columnadasTotal} de tres columnas o más, con su compás · ${filetesTotal} filetes · ${filasCifraTotal} filas de cifras`);
if (filasCifraTotal < 50) {
  console.log(`[rejillas] solo ${filasCifraTotal} filas de cifras: la comprobación de compás de cifras no está mirando`);
  process.exit(1);
}
if (filetesTotal < 1000) {
  console.log(`[rejillas] solo ${filetesTotal} filetes: el doble filete no está mirando`);
  process.exit(1);
}
if (columnadasTotal < 20) {
  console.log(`[rejillas] solo ${columnadasTotal} rejillas de tres columnas: el compás no está mirando`);
  process.exit(1);
}
/* Una guarda que no mide nada pasa siempre: el sitio tiene cientos. */
if (rejillas < 200) {
  console.log(`[rejillas] solo ${rejillas} rejillas: se esperaban cientos. ¿Falló la carga?`);
  process.exit(1);
}
if (fallos.size) {
  const compas = [...fallos.keys()].filter((k) => k.startsWith("compás ")).length;
  const tono = [...fallos.keys()].filter((k) => k.startsWith("filete con tono suelto") || k.startsWith("sin tokens de filete")).length;
  const doble = fallos.has("doble filete sin nada entre medias") ? 1 : 0;
  const cifra = fallos.has("cifra descolgada de su fila") ? 1 : 0;
  const segmento = fallos.has("segmentados vecinos de distinto alto") ? 1 : 0;
  if (cifra) {
    console.log("[rejillas] una cifra cae más abajo que sus vecinas porque su rótulo ocupa dos líneas: celda `flex flex-col` y cifra con `mt-auto`");
  }
  if (segmento) {
    console.log("[rejillas] dos controles segmentados en la misma fila con altos distintos: `items-stretch` en el contenedor");
  }
  if (doble) {
    console.log("[rejillas] dos filetes seguidos sin contenido entre ellos: si lo de encima ya cierra con filete, `<FinalCTANew sinFilete />`");
  }
  if (tono) {
    console.log(`[rejillas] ${tono} filete(s) con una opacidad escrita a mano: usa --line, --line-2 o --ficha-division`);
  }
  if (fallos.size - compas - doble - tono - cifra - segmento) {
    console.log(`[rejillas] ${fallos.size - compas - doble - tono - cifra - segmento} rejilla(s) reparten el alto sobrante entre sus filas`);
    console.log("[rejillas] si la ficha debe ir arriba, `content-start` (align-content: start) en ella");
  }
  if (compas) {
    console.log(`[rejillas] ${compas} rejilla(s) de pistas iguales con el texto a distancias distintas`);
    console.log("[rejillas] el mismo relleno a un solo lado en todas las celdas (p. ej. `pr-6`), no quitarlo solo a la primera");
  }
  process.exit(1);
}
console.log("[rejillas] correcto — ninguna ficha despega su texto para igualar la fila ni hay filetes dobles");
