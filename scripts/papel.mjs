/**
 * PAPEL — ¿sale entero lo que se imprime?
 *
 * ── El fallo que existe para cazar ────────────────────────────────────
 * El sistema de aparición del sitio deja cada pieza en `opacity: 0` hasta
 * que entra en el viewport. Al imprimir, el navegador NO recorre la
 * página: compone el documento tal como está en ese instante. Todo lo que
 * el visitante no hubiera bajado a ver salía EN BLANCO, y salía como un
 * hueco del tamaño del bloque — que es peor que no salir, porque el papel
 * parece completo y no lo está.
 *
 * Medido el 2026-09-20 sobre /privacidad recién cargada: las listas de
 * «Qué NO se recoge» y «Quién más los ve» —las que dicen qué hace y qué no
 * hace la web con tus datos— se imprimían vacías. Un PDF de la política de
 * privacidad al que le faltan cláusulas.
 *
 * ── Qué comprueba ─────────────────────────────────────────────────────
 * Carga cada página SIN desplazarse —que es como llega alguien que pulsa
 * «Imprimir» nada más entrar—, emula `media: print` y busca texto que
 * exista en el documento pero no vaya a dejar tinta: apagado por
 * `opacity`, por `visibility`, o por un ancestro en cualquiera de esas
 * dos. Lo que está oculto a propósito con `display: none` o marcado
 * `.tj-no-print` no cuenta: eso es una decisión, no una pérdida.
 *
 * Uso:  node scripts/papel.mjs --serve out
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";

const args = process.argv.slice(2);
const dir = args.includes("--serve") ? args[args.indexOf("--serve") + 1] : "out";
const PREFIJO = process.env.NEXT_PUBLIC_BASE_PATH || "";

/* Lo que la gente imprime o guarda en PDF: los cuatro documentos legales,
   el glosario y su ficha. Se comprueban los dos idiomas de un legal y del
   glosario, porque las plantillas son las mismas pero el contenido no. */
const RUTAS = [
  "/aviso-legal",
  "/privacidad",
  "/cookies",
  "/terminos",
  "/glosario",
  "/glosario/expectancy",
  "/en/privacidad",
  "/en/glosario",
  "/faq",
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

function auditar() {
  const perdidos = [];
  const main = document.querySelector("main");
  if (!main) return perdidos;
  const it = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
  let n;
  const yaVisto = new Set();
  while ((n = it.nextNode())) {
    const t = (n.textContent || "").trim();
    if (t.length < 25) continue;
    const el = n.parentElement;
    if (!el) continue;

    let apagado = null;
    let cur = el;
    let oculto = false;
    while (cur && cur !== document.documentElement) {
      const c = getComputedStyle(cur);
      // Oculto a propósito: no es una pérdida, es una decisión.
      if (c.display === "none" || cur.classList.contains("tj-no-print")) {
        oculto = true;
        break;
      }
      if (parseFloat(c.opacity) < 0.05 || c.visibility === "hidden") {
        apagado = {
          tag: cur.tagName.toLowerCase() + (cur.className ? "." + String(cur.className).slice(0, 34) : ""),
          attr: cur.getAttribute("data-tj-ap") !== null ? `data-tj-ap="${cur.getAttribute("data-tj-ap")}"` : cur.getAttribute("data-entra") !== null ? "data-entra" : "",
          opacity: c.opacity,
          visibility: c.visibility,
        };
        break;
      }
      cur = cur.parentElement;
    }
    if (oculto || !apagado) continue;
    const clave = apagado.tag + "|" + t.slice(0, 30);
    if (yaVisto.has(clave)) continue;
    yaVisto.add(clave);
    perdidos.push({ ...apagado, txt: t.slice(0, 60) });
  }
  return perdidos;
}

const { server, base } = await servir(dir);
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport: { width: 794, height: 1123 } });

let fallos = 0;
for (const ruta of RUTAS) {
  const pag = await ctx.newPage();
  try {
    // A propósito SIN desplazarse: así llega quien imprime nada más entrar.
    await pag.goto(base + ruta, { waitUntil: "networkidle" });
    await pag.emulateMedia({ media: "print" });
    await pag.waitForTimeout(500);
    const perdidos = await pag.evaluate(auditar);
    for (const p of perdidos) {
      fallos++;
      console.log(`  ${ruta} · ${p.tag} ${p.attr} · opacity ${p.opacity} · visibility ${p.visibility}`);
      console.log(`      «${p.txt}»`);
    }
  } finally {
    await pag.close();
  }
}

await nav.close();
server.close();

console.log(`[papel] ${RUTAS.length} rutas compuestas en \`media: print\` sin desplazarse`);
if (fallos) {
  console.log(`[papel] ${fallos} trozo(s) de texto que NO dejarían tinta en el papel`);
  console.log("[papel] se arregla en el bloque @media print del final de globals.css");
  process.exit(1);
}
console.log("[papel] correcto — todo el texto del documento llega al papel");
