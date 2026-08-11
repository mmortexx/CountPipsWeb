/**
 * ARRANQUE — cuánto tarda la portada en ser legible, con la CPU frenada.
 *
 * ── Por qué existe ────────────────────────────────────────────────────
 * `humo.mjs` ya vigila un presupuesto para el titular (`PRESUPUESTO_H1_MS`),
 * y lo mide con la CPU a toda velocidad: en un portátil de desarrollo o en
 * un CI siempre pasa. Medido con el freno a ×4 —un móvil de gama media—,
 * la primera visita tardaba 2.613 ms en enseñar el titular y 2.976 ms en
 * retirar la cortina, contra un presupuesto declarado de 2.500.
 *
 * Ese hueco entre «pasa en CI» y «tarda dos segundos y medio en el móvil
 * de un visitante» es justo lo que este guion mide. No sustituye a
 * `humo.mjs`: mide otra cosa, en otras condiciones.
 *
 * ── Cómo se lee ───────────────────────────────────────────────────────
 *  · h1 legible      — cuándo el titular llega a opacidad plena.
 *  · cortina retirada— cuándo desaparece el loader de primera visita.
 *  · barra           — cuántos valores distintos toma la barra de carga.
 *    Si son dos, no está animando: está saltando de 0 a 1.
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
const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 } });
const pagina = await ctx.newPage();

const cdp = await ctx.newCDPSession(pagina);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpu });

const t0 = Date.now();
await pagina.goto(base, { waitUntil: "commit" });

const medida = await pagina.evaluate(async () => {
  const inicio = performance.now();
  const barra = new Set();
  let h1 = null;
  let cortina = null;
  /* La cortina se monta en un efecto, así que al empezar a mirar todavía
     no existe: sin esperarla, «no hay loader» se leía como «ya se ha
     retirado» y daba 474 ms de un arranque que dura cinco veces más. */
  let vista = false;
  for (let i = 0; i < 700; i++) {
    await new Promise((r) => setTimeout(r, 16));
    const loader = document.querySelector("#tj-loader");
    if (loader) vista = true;
    const b = document.querySelector("#tj-loader [data-lb]");
    if (b) barra.add(getComputedStyle(b).transform);
    const t = document.querySelector("h1");
    if (h1 === null && t && Number(getComputedStyle(t).opacity) >= 0.99) h1 = performance.now() - inicio;
    if (cortina === null && vista && !loader) cortina = performance.now() - inicio;
    if (h1 !== null && (cortina !== null || (!vista && i > 120))) break;
  }
  return { h1, cortina, pasosBarra: barra.size };
});

console.log(`[arranque] CPU ×${cpu} · 390×844 · primera visita`);
console.log(`[arranque] h1 legible        ${medida.h1 === null ? "nunca" : Math.round(medida.h1) + " ms"}`);
console.log(`[arranque] cortina retirada  ${medida.cortina === null ? "nunca" : Math.round(medida.cortina) + " ms"}`);
console.log(`[arranque] barra de carga    ${medida.pasosBarra} valores distintos`);
console.log(`[arranque] total desde goto  ${Date.now() - t0} ms`);

await navegador.close();
server.close();

const fallos = [];
if (medida.h1 === null || medida.h1 > 2500) {
  fallos.push(`el titular tarda ${medida.h1 === null ? "más que la medida" : Math.round(medida.h1) + " ms"} con la CPU a ×${cpu} (presupuesto 2500 ms)`);
}
if (medida.pasosBarra <= 2) {
  fallos.push("la barra de carga no anima: salta entre dos valores");
}
if (fallos.length) {
  console.log("\n[arranque] FALLA:");
  for (const f of fallos) console.log(`  ✗ ${f}`);
  process.exit(1);
}
console.log("[arranque] correcto");
