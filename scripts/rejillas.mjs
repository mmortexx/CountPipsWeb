/**
 * REJILLAS: comprueba, sobre todas las páginas compiladas a 1440 y 390 px, la
 * alineación dentro de rejillas CSS. Un fallo es uno de estos descuadres:
 *   - Una rejilla de varias filas reparte el alto sobrante entre sus filas
 *     (`align-content: normal` actúa como `stretch`) y despega título y
 *     descripción. Se prueba poniéndole `align-content: start`: si un hijo se
 *     mueve, estaba repartiendo. Las de una fila no cuentan.
 *   - Compás: en rejillas de tres o más pistas iguales, el texto de cada
 *     columna empieza a la misma distancia de la anterior (salvo con filete
 *     vertical entre celdas).
 *   - Dos filetes horizontales de sección, de 8 a 260 px, sin nada entre ellos
 *     (a menos de 40 px solo cuenta lo que cae bajo los dos).
 *   - Filete gris con opacidad escrita a mano en vez de un token (`--line`,
 *     `--line-2`, `--ficha-division`, `--chip-line`, `--border`).
 *   - Cifra que cae más abajo que sus vecinas de fila, y controles segmentados
 *     vecinos de distinto alto.
 *   - Ficha del glosario a 1440 px cuyo primer texto no arranca a la altura
 *     de la ceja del raíl (tolerancia 16 px: la caja «Fórmula» baja ~10 px).
 *   - Lista a dos columnas con filete por entrada que cierra distinto en cada
 *     columna (con número impar, medio filete colgando), o cuyo filete propio
 *     cruza el hueco entre columnas mientras los de las entradas no.
 *   - Rótulo y valor (`dt`/`dd`) lado a lado y del mismo cuerpo de letra que
 *     no comparten línea base.
 *   - Precios (`data-precio`) de tarjetas vecinas a distinta altura.
 * No mira flexbox, donde el reparto solo ocurre si alguien lo pide.
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

// Todas las páginas compiladas, no una lista a mano: una nueva entra sola.
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
let fichasGlosario = 0;
let listasDoblesTotal = 0;
let paresRotuloTotal = 0;
let paresPrecioTotal = 0;

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
      // Compás de columnas en rejillas de pistas iguales.
      const pistas = cs.gridTemplateColumns.trim().split(/\s+/).map(parseFloat);
      if (pistas.length >= 3 && pistas.every((p) => Math.abs(p - pistas[0]) <= 1) && el.getBoundingClientRect().height > 0) {
        const fila = [...el.children].filter((c) => Math.abs(c.getBoundingClientRect().top - el.children[0].getBoundingClientRect().top) < 2);
        // Con filete vertical entre celdas (`.tj-matriz`, TechSpecs) el texto se mide desde el filete: la diferencia es correcta.
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
    // Doble filete: dos líneas horizontales de sección sin nada pintado entre ellas.
    const main = document.querySelector("main");
    const filetes = [];
    const cosas = [];
    /* Tono del filete: los tonos válidos se leen del CSS con una sonda nueva
       por token; reutilizar una devuelve el valor anterior por la transición
       de color y todos los tonos salen iguales. */
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
        // Una caja (campo, segmentado) no es un filete.
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
    // Cifras a compás: en una fila de celdas «rótulo + cifra» caen a la misma altura.
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
    // Controles segmentados vecinos: el mismo alto.
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
    // Listas a dos columnas con filete por entrada: las dos columnas cierran igual.
    const colgados = [];
    let listasDobles = 0;
    const filo = (c, lado) => {
      const s = getComputedStyle(c);
      return parseFloat(s[`border${lado}Width`]) > 0 && s[`border${lado}Style`] !== "none";
    };
    for (const el of document.querySelectorAll("main ul, main ol, main dl")) {
      const cs = getComputedStyle(el);
      if (!cs.display.includes("grid") || cs.gridTemplateColumns.trim().split(/\s+/).length !== 2) continue;
      const hijos = [...el.children].filter((c) => c.getBoundingClientRect().height > 0);
      if (hijos.length < 3 || !hijos.some((c) => filo(c, "Top") || filo(c, "Bottom"))) continue;
      listasDobles++;
      const texto = (el.textContent || "").trim().slice(0, 36);
      if (parseFloat(cs.columnGap) > 0 && (filo(el, "Top") || filo(el, "Bottom"))) {
        colgados.push({ texto, que: "filete de la lista corrido sobre el hueco entre columnas" });
      }
      const pies = hijos.filter((c) => filo(c, "Bottom")).map((c) => c.getBoundingClientRect());
      if (pies.length) {
        const fondo = Math.max(...pies.map((p) => p.bottom));
        const columnas = new Set(hijos.map((c) => Math.round(c.getBoundingClientRect().left)));
        const cierran = new Set(pies.filter((p) => fondo - p.bottom <= 2).map((p) => Math.round(p.left)));
        if (cierran.size < columnas.size) colgados.push({ texto, que: "medio filete colgando en la última fila" });
      }
    }
    // Rótulo y valor lado a lado en una lista de definición: a la misma línea base.
    const desnivelados = [];
    let paresRotulo = 0;
    const primerTexto = (el) => {
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      while (w.nextNode()) {
        if (!w.currentNode.textContent.trim()) continue;
        const rg = document.createRange();
        rg.selectNodeContents(w.currentNode);
        const q = rg.getClientRects()[0];
        if (q && q.height > 0) return { pie: q.bottom, cuerpo: getComputedStyle(w.currentNode.parentElement).fontSize };
      }
      return null;
    };
    for (const dt of document.querySelectorAll("main dl dt")) {
      const dd = dt.nextElementSibling;
      if (dd?.tagName !== "DD" || dt.closest("[data-demo-raiz]")) continue;
      const a = dt.getBoundingClientRect();
      const b = dd.getBoundingClientRect();
      if (a.height === 0 || b.height === 0 || b.left < a.right - 1 || b.top > a.bottom) continue;
      const ta = primerTexto(dt);
      const tb = primerTexto(dd);
      // Con cuerpos distintos el pie del texto difiere aunque compartan línea base.
      if (!ta || !tb || ta.cuerpo !== tb.cuerpo) continue;
      paresRotulo++;
      if (Math.abs(ta.pie - tb.pie) > 1.5) {
        desnivelados.push({ texto: `${dt.textContent.trim().slice(0, 24)} / ${dd.textContent.trim().slice(0, 24)}`, salto: Math.round((tb.pie - ta.pie) * 10) / 10 });
      }
    }
    // Precios de tarjetas vecinas (`data-precio`): a la misma altura, sea cual sea el largo de la descripción.
    const precios = [...document.querySelectorAll("main [data-precio]")].map((e) => e.getBoundingClientRect()).filter((q) => q.height > 0);
    const preciosDesparejos = [];
    let paresPrecio = 0;
    for (let i = 0; i < precios.length; i++) {
      for (let j = i + 1; j < precios.length; j++) {
        if (Math.abs(precios[i].left - precios[j].left) < 40) continue;
        paresPrecio++;
        if (Math.abs(precios[i].top - precios[j].top) > 1.5) preciosDesparejos.push(Math.round(precios[j].top - precios[i].top));
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
        /* Cuenta lo que haya en cualquier columna y un titular que arranca a la
           altura del segundo filete (ahí empieza sección). A menos de 40 px solo
           cuenta lo que cae bajo los dos: se leen dobles aunque la columna de
           al lado tenga texto. */
        const lo = Math.max(a.x1, c.x1);
        const hi = Math.min(a.x2, c.x2);
        if (!cosas.some((k) => k.b > a.y + 1 && k.t < c.y + 8 && (hueco >= 40 || (k.x2 > lo && k.x1 < hi)))) {
          dobles.push({ y: Math.round(a.y), hueco: Math.round(hueco) });
          break;
        }
      }
    }
    return { vistos, n, descompases, columnadas, dobles, nf: filetes.length, sueltos, nt: tonos.size, descolgadas, filasCifra, desiguales, colgados, listasDobles, desnivelados, paresRotulo, preciosDesparejos, paresPrecio };
  }, TOLERANCIA_PX);
  paresPrecioTotal += r.paresPrecio;
  for (const d of r.preciosDesparejos) {
    const k = "precios de tarjetas vecinas a distinta altura";
    if (!fallos.has(k)) fallos.set(k, []);
    fallos.get(k).push(`${ancho} ${ruta}  a ${d} px`);
  }
  filetesTotal += r.nf;
  listasDoblesTotal += r.listasDobles;
  paresRotuloTotal += r.paresRotulo;
  for (const d of r.desnivelados) {
    const k = "rótulo y valor a distinta línea base";
    if (!fallos.has(k)) fallos.set(k, []);
    fallos.get(k).push(`${ancho} ${ruta}  «${d.texto}» a ${d.salto} px`);
  }
  for (const c of r.colgados) {
    const k = `lista a dos columnas: ${c.que}`;
    if (!fallos.has(k)) fallos.set(k, []);
    fallos.get(k).push(`${ancho} ${ruta}  «${c.texto}»`);
  }
  filasCifraTotal += r.filasCifra;
  // Ficha del glosario a dos columnas: el primer texto arranca a la altura de la ceja del raíl.
  const desfase = ancho >= 1024 ? await pag.evaluate(() => {
    const ceja = [...document.querySelectorAll("p.eyebrow")].find((p) => /^(De la misma familia|Same family)$/.test(p.textContent.trim()));
    const columna = document.querySelector('nav[aria-label="Recorrer el glosario"], nav[aria-label="Browse the glossary"]')?.closest(".lg\\:grid")?.firstElementChild;
    if (!ceja || !columna) return null;
    const primero = [...columna.querySelectorAll("p, span")].find((e) => e.children.length === 0 && e.textContent.trim() && e.getBoundingClientRect().height > 0);
    return primero ? Math.round(primero.getBoundingClientRect().top - ceja.getBoundingClientRect().top) : null;
  }) : null;
  if (desfase !== null) {
    fichasGlosario++;
    if (Math.abs(desfase) > 16) {
      const k = "ficha del glosario descolgada de su raíl";
      if (!fallos.has(k)) fallos.set(k, []);
      fallos.get(k).push(`${ancho} ${ruta}  a ${desfase} px de «De la misma familia»`);
    }
  }
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

/* Las tarjetas de precio van lado a lado desde 768 px; entre 768 y 1023 es
   donde más renglones ocupa la descripción. Ahí solo se mira su precio. */
{
  const ctx = await navegador.newContext({ viewport: { width: 820, height: 900 }, reducedMotion: "reduce" });
  const pag = await ctx.newPage();
  for (const ruta of RUTAS.filter((r) => r.endsWith("/pricing/"))) {
    await pag.goto(`${base}${ruta}`, { waitUntil: "networkidle", timeout: 30000 });
    const tops = await pag.evaluate(() => [...document.querySelectorAll("main [data-precio]")].map((e) => e.getBoundingClientRect().top));
    if (tops.length >= 2) paresPrecioTotal++;
    const salto = tops.length >= 2 ? Math.round(Math.max(...tops) - Math.min(...tops)) : 0;
    if (salto > 1) {
      const k = "precios de tarjetas vecinas a distinta altura";
      if (!fallos.has(k)) fallos.set(k, []);
      fallos.get(k).push(`820 ${ruta}  a ${salto} px`);
    }
  }
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
if (fichasGlosario < 100) {
  console.log(`[rejillas] solo ${fichasGlosario} fichas del glosario medidas: la alineación con el raíl no está mirando`);
  process.exit(1);
}
if (listasDoblesTotal < 8) {
  console.log(`[rejillas] solo ${listasDoblesTotal} listas a dos columnas con filetes: su cierre no se está mirando`);
  process.exit(1);
}
if (paresPrecioTotal < 6) {
  console.log(`[rejillas] solo ${paresPrecioTotal} pares de precios vecinos: su alineación no se está mirando`);
  process.exit(1);
}
if (paresRotuloTotal < 100) {
  console.log(`[rejillas] solo ${paresRotuloTotal} pares de rótulo y valor: su línea base no se está mirando`);
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
// Una guarda que no mide nada pasa siempre: el sitio tiene cientos.
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
  if (fallos.has("ficha del glosario descolgada de su raíl")) {
    console.log("[rejillas] la columna de la definición empieza más abajo que «De la misma familia»: mira el margen superior del primer bloque en `TerminoVista.tsx`");
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
  const lista = [...fallos.keys()].filter((k) => k.startsWith("lista a dos columnas")).length;
  const rotulo = fallos.has("rótulo y valor a distinta línea base") ? 1 : 0;
  const precio = fallos.has("precios de tarjetas vecinas a distinta altura") ? 1 : 0;
  if (precio) {
    console.log("[rejillas] dos tarjetas de precio vecinas no ponen la cifra a la misma altura: lo de encima del precio debe reservar el mismo alto en las dos");
  }
  if (rotulo) {
    console.log("[rejillas] un rótulo y su valor, lado a lado y del mismo cuerpo, no comparten línea base: `items-baseline` en la rejilla del `dl`");
  }
  if (lista) {
    console.log("[rejillas] una lista a dos columnas no cierra igual en las dos: usa `.tj-lista-filetes` (filete sobre cada entrada, sin filete propio)");
  }
  if (fallos.size - compas - doble - tono - cifra - segmento - lista - rotulo - precio) {
    console.log(`[rejillas] ${fallos.size - compas - doble - tono - cifra - segmento - lista - rotulo} rejilla(s) reparten el alto sobrante entre sus filas`);
    console.log("[rejillas] si la ficha debe ir arriba, `content-start` (align-content: start) en ella");
  }
  if (compas) {
    console.log(`[rejillas] ${compas} rejilla(s) de pistas iguales con el texto a distancias distintas`);
    console.log("[rejillas] el mismo relleno a un solo lado en todas las celdas (p. ej. `pr-6`), no quitarlo solo a la primera");
  }
  process.exit(1);
}
console.log("[rejillas] correcto — ninguna ficha despega su texto para igualar la fila ni hay filetes dobles");
