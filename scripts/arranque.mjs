/**
 * ARRANQUE: mide cuánto tarda la portada en enseñar el titular (opacidad
 * plena) con la CPU frenada a ×4 (un móvil de gama media), contra un
 * presupuesto de 2.500 ms. `humo.mjs` vigila el presupuesto del titular con la
 * CPU a toda velocidad, donde siempre pasa; esto mide el hueco entre «pasa en
 * CI» y lo que vive un visitante en un móvil. Falla si el peor de tres pasadas
 * lo supera. Las cifras valen para la máquina que mide: lo que importa es si
 * sigue cabiendo en el presupuesto.
 *
 * Uso:  node scripts/arranque.mjs --serve out [--cpu 4]
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";

const args = process.argv.slice(2);
const dir = args.includes("--serve") ? args[args.indexOf("--serve") + 1] : null;
const cpu = args.includes("--cpu") ? Number(args[args.indexOf("--cpu") + 1]) : 4;
const PREFIJO = process.env.NEXT_PUBLIC_BASE_PATH || "";

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

const { server, base } = await servir(dir || "out");
const navegador = await chromium.launch();

/* Tres pasadas y se da el rango: una sola cifra es una tirada. Contexto nuevo
   en cada una para que la caché no regale la segunda; si el rango es ancho,
   la respuesta es que así no se puede medir. El veredicto va sobre la peor. */
const PASADAS = 3;
const medidas = [];
const totales = [];

for (let i = 0; i < PASADAS; i++) {
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 } });
  const pagina = await ctx.newPage();
  const cdp = await ctx.newCDPSession(pagina);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpu });

  const t0 = Date.now();
  await pagina.goto(base, { waitUntil: "commit" });
  const medida = await pagina.evaluate(async () => {
    const inicio = performance.now();
    for (let j = 0; j < 700; j++) {
      await new Promise((r) => setTimeout(r, 16));
      const t = document.querySelector("h1");
      if (t && Number(getComputedStyle(t).opacity) >= 0.99) return { h1: performance.now() - inicio };
    }
    return { h1: null };
  });
  medidas.push(medida.h1);
  totales.push(Date.now() - t0);
  await ctx.close();
}

const rango = (vals) => {
  if (vals.some((v) => v === null)) return "nunca llegó";
  const mn = Math.round(Math.min(...vals));
  const mx = Math.round(Math.max(...vals));
  return mn === mx ? `${mn} ms` : `${mn}–${mx} ms`;
};
const peor = medidas.some((v) => v === null) ? null : Math.max(...medidas);

console.log(`[arranque] CPU ×${cpu} · 390×844 · primera visita · ${PASADAS} pasadas`);
console.log(`[arranque] h1 legible        ${rango(medidas)}`);
console.log(`[arranque] total desde goto  ${rango(totales)}`);

await navegador.close();
server.close();

const fallos = [];
if (peor === null || peor > 2500) {
  fallos.push(`el titular tarda ${peor === null ? "más que la medida" : Math.round(peor) + " ms en la peor de las " + PASADAS + " pasadas"} con la CPU a ×${cpu} (presupuesto 2500 ms)`);
}
if (fallos.length) {
  console.log("\n[arranque] FALLA:");
  for (const f of fallos) console.log(`  ✗ ${f}`);
  process.exit(1);
}
console.log("[arranque] correcto");
