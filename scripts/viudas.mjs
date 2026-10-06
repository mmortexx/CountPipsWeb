/**
 * VIUDAS: comprueba que ningún titular acaba en una palabra sola si podía
 * evitarlo. `text-wrap: balance` iguala los renglones y a veces deja justo una
 * palabra colgando. Solo se acusa la viuda evitable: la que cabría arriba si
 * bajara con ella el último bloque del renglón anterior (un bloque son las
 * palabras unidas por espacio duro); si ni así cabe, manda el ancho. Mira los
 * h1, h2 y h3 visibles de cuatro palabras o más, en las dos lenguas, a 390,
 * 768 y 1440 px.
 *
 * Uso:  node scripts/viudas.mjs --serve out
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, extname } from "node:path";

const dir = process.argv.slice(2).find((a) => !a.startsWith("-")) || "out";
if (!existsSync(dir)) {
  console.log(`[viudas] no encuentro el directorio «${dir}». ¿Falta compilar el sitio con \`npm run build\`?`);
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

// Todas las páginas salvo las fichas del glosario, que comparten plantilla: basta una muestra.
const MUESTRA_GLOSARIO = /\/glosario\/(expectancy|risk-of-ruin|wald-wolfowitz-runs-test)\/$/;
const RUTAS = ["/"];
async function recorre(d, ruta) {
  for (const e of await readdir(d, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.startsWith("_") || e.name === "404") continue;
    const r = `${ruta}${e.name}/`;
    if (existsSync(join(d, e.name, "index.html")) && (!/\/glosario\/[^/]+\/$/.test(r) || MUESTRA_GLOSARIO.test(r))) RUTAS.push(r);
    await recorre(join(d, e.name), r);
  }
}
await recorre(dir, "/");
if (RUTAS.length < 50) {
  console.log(`[viudas] solo ${RUTAS.length} rutas en ${dir}: la guarda no estaría mirando el sitio.`);
  process.exit(1);
}

const { server, base } = await servir(dir);
const navegador = await chromium.launch();
const fallos = [];
let titulares = 0;

for (const ancho of [390, 768, 1440]) {
  const ctx = await navegador.newContext({ viewport: { width: ancho, height: 900 }, reducedMotion: "reduce" });
  await ctx.addInitScript(() => { try { localStorage.setItem("tj-cookie-consent", "declined"); } catch {} });
  for (const ruta of RUTAS) {
    const p = await ctx.newPage();
    try {
      await p.goto(base + ruta, { waitUntil: "load", timeout: 30000 });
    } catch {
      fallos.push(`${ruta} (${ancho}): la página no cargó`);
      await p.close();
      continue;
    }
    await p.addStyleTag({ content: ".cv-auto{content-visibility:visible!important}" });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(200);
    const r = await p.evaluate(() => {
      const out = [];
      let vistos = 0;
      for (const h of document.querySelectorAll("h1, h2, h3")) {
        const caja = h.getBoundingClientRect();
        // Los títulos ocultos a lectores miden 1 px y apilan cada palabra: no se ven.
        if (!h.offsetParent || caja.width < 40) continue;
        // Un bloque es lo que va entre espacios normales; el espacio duro lo mantiene unido.
        const bloques = [];
        const tw = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
        let n;
        while ((n = tw.nextNode())) {
          const re = /[^ \n\t\r]+/g;
          let m;
          while ((m = re.exec(n.data))) {
            const rg = document.createRange();
            rg.setStart(n, m.index);
            rg.setEnd(n, m.index + m[0].length);
            const rr = rg.getClientRects();
            if (!rr.length) continue;
            const ult = rr[rr.length - 1];
            bloques.push({ t: m[0], top: ult.top, izq: rr[0].left, der: ult.right, palabras: m[0].split(" ").length });
          }
        }
        const palabras = bloques.reduce((a, b) => a + b.palabras, 0);
        if (palabras < 4) continue;
        vistos++;
        const filas = [];
        for (const b of bloques) {
          const f = filas.find((x) => Math.abs(x.top - b.top) < 6);
          if (f) f.b.push(b); else filas.push({ top: b.top, b: [b] });
        }
        filas.sort((a, b) => a.top - b.top);
        if (filas.length < 2) continue;
        const ultima = filas[filas.length - 1].b;
        if (ultima.length !== 1 || ultima[0].palabras !== 1) continue;
        const sola = ultima[0];
        const previa = filas[filas.length - 2].b;
        const bajaria = previa[previa.length - 1];
        const espacio = 0.3 * parseFloat(getComputedStyle(h).fontSize);
        const necesita = (bajaria.der - bajaria.izq) + espacio + (sola.der - sola.izq);
        if (previa.length > 1 && necesita <= caja.width + 1)
          out.push(`${h.tagName.toLowerCase()} «${h.textContent.replace(/\s+/g, " ").trim()}» acaba en «${sola.t}» sola, y con «${bajaria.t}» abajo cabía (${Math.round(necesita)} de ${Math.round(caja.width)} px)`);
      }
      return { out, vistos };
    });
    titulares += r.vistos;
    for (const x of r.out) fallos.push(`${ruta} (${ancho}): ${x}`);
    await p.close();
  }
  await ctx.close();
}

await navegador.close();
server.close();

console.log(`[viudas] ${RUTAS.length} rutas × 3 anchos · ${titulares} titulares de cuatro palabras o más`);
if (titulares < 300) fallos.push(`solo ${titulares} titulares medidos: la guarda no está viendo el sitio`);
if (fallos.length) {
  for (const f of fallos) console.log(`  ✗ ${f}`);
  console.log(`[viudas] ${fallos.length} fallo(s)`);
  process.exit(1);
}
console.log("[viudas] correcto — ningún titular deja una palabra sola en su último renglón pudiendo evitarlo");
