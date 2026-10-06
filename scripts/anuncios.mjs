/**
 * ANUNCIOS: comprueba que lo que cambia en pantalla lo oye quien usa un lector
 * (WCAG 4.1.3). Las herramientas recalculan mientras se teclea; el resultado
 * debe acabar dicho en una región viva. Tres comprobaciones:
 *  1. Al tocar una entrada, el resultado se anuncia en una región viva.
 *  2. Al cargar la página la región está vacía: un `role="status"` con texto
 *     inicial se lee encima del titular.
 *  3. El anuncio usa la convención numérica de su idioma. Se genera en el
 *     navegador y `cifras.mjs`, que lee el HTML compilado, no lo ve.
 * Además cubre el test de disciplina y los buscadores del glosario y la FAQ.
 *
 * El anuncio se publica ~700 ms después del último cambio para no leer cada
 * tecla. Si se sube ese retardo en `ResultadoAnunciado`, hay que subir `ESPERA`
 * o la guarda fallará sin que nada esté roto.
 *
 * Uso:  node scripts/anuncios.mjs --serve out
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync, readdirSync } from "node:fs";
import { join, extname } from "node:path";

const dir = process.argv.slice(2).find((a) => !a.startsWith("-")) || "out";
if (!existsSync(dir)) {
  console.log(`[anuncios] no encuentro el directorio «${dir}». ¿Falta compilar el sitio con \`npm run build\`?`);
  process.exit(1);
}
const PREFIJO = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** Más que el retardo de `ResultadoAnunciado`, con margen. */
const ESPERA = 1400;

// Las herramientas salen de la compilación, no de una lista a mano. El reloj de
// sesiones no recibe datos ni calcula: no tiene resultado que anunciar.
const SIN_RESULTADO = new Set(["reloj-de-sesiones"]);
const HERRAMIENTAS = readdirSync(join(dir, "herramientas"), { withFileTypes: true })
  .filter((e) => e.isDirectory() && !e.name.startsWith("__") && !SIN_RESULTADO.has(e.name))
  .map((e) => `herramientas/${e.name}`);
if (HERRAMIENTAS.length < 9) {
  console.log(`[anuncios] solo encuentro ${HERRAMIENTAS.length} herramientas en ${dir}/herramientas: la guarda no está midiendo lo que cree`);
  process.exit(1);
}

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
let conAnuncio = 0;
let sinCambios = 0;

for (const herramienta of HERRAMIENTAS) {
  for (const idioma of ["es", "en"]) {
    const ruta = `/${idioma === "en" ? "en/" : ""}${herramienta}/`;
    const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
    const p = await ctx.newPage();
    try {
      await p.goto(base + ruta, { waitUntil: "load", timeout: 30000 });
    } catch {
      fallos.push({ ruta, detalle: "la página no cargó: la guarda no pudo medirla" });
      await ctx.close();
      continue;
    }
    await p.waitForTimeout(ESPERA);

    // (2) Recién cargada, la región no puede estar diciendo nada.
    const alCargar = await p.evaluate(() =>
      [...document.querySelectorAll('[role="status"], [aria-live="polite"]')]
        .map((e) => (e.textContent || "").trim())
        .filter(Boolean),
    );
    if (alCargar.length) {
      fallos.push({ ruta, detalle: `habla sola al cargar, sin que nadie toque nada: «${alCargar[0].slice(0, 60)}»` });
    }

    const antes = await p.evaluate(() => document.body.innerText);

    const campo = p.locator('input[type="number"], input[type="range"]').first();
    if (!(await campo.count())) {
      fallos.push({ ruta, detalle: "no encontré ninguna entrada que tocar: ¿cambió la herramienta?" });
      await ctx.close();
      continue;
    }
    if ((await campo.getAttribute("type")) === "range") {
      await campo.focus();
      for (let i = 0; i < 6; i++) await p.keyboard.press("ArrowRight");
    } else {
      await campo.fill("123");
    }
    await p.waitForTimeout(ESPERA);

    const r = await p.evaluate(() => ({
      vivos: [...document.querySelectorAll('[role="status"], [aria-live="polite"]')]
        .map((e) => (e.textContent || "").trim())
        .filter(Boolean),
      texto: document.body.innerText,
    }));

    // Control: si tocar una entrada no cambia nada en pantalla, la guarda no mide lo que cree.
    if (r.texto === antes) {
      sinCambios++;
      fallos.push({ ruta, detalle: "tocar una entrada no cambió nada en pantalla: la guarda no está midiendo lo que cree" });
      await ctx.close();
      continue;
    }

    if (!r.vivos.length) {
      fallos.push({ ruta, detalle: "el resultado cambia y nada lo anuncia" });
    } else {
      conAnuncio++;
      // (3) La convención numérica del anuncio, que `cifras.mjs` no puede ver.
      const dicho = r.vivos.join(" · ");
      if (idioma === "en") {
        if (/\d[ \u00a0]%/.test(dicho)) fallos.push({ ruta, detalle: `anuncia el % con espacio, a la española: «${dicho.slice(0, 60)}»` });
        if (/\d[\d.,]*[ \u00a0]\$(?!\d)/.test(dicho)) fallos.push({ ruta, detalle: `anuncia el dólar detrás de la cifra, a la española: «${dicho.slice(0, 60)}»` });
      } else {
        if (/\d%/.test(dicho)) fallos.push({ ruta, detalle: `anuncia el % pegado a la cifra, a la inglesa: «${dicho.slice(0, 60)}»` });
        if (/(?<![\dkM][ \u00a0])\$[ \u00a0]?\d/.test(dicho)) fallos.push({ ruta, detalle: `anuncia el dólar delante de la cifra, a la inglesa: «${dicho.slice(0, 60)}»` });
      }
      console.log(`  ${ruta.padEnd(44)} «${dicho.slice(0, 62)}»`);
    }
    await ctx.close();
  }
}

// El test de disciplina se contesta pregunta a pregunta: se responde entero y se exige que anuncie el resultado.
for (const ruta of ["/test/", "/en/test/"]) {
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  try {
    await p.goto(base + ruta, { waitUntil: "load", timeout: 30000 });
    await p.waitForTimeout(ESPERA);
    const vivos = () =>
      p.evaluate(() =>
        [...document.querySelectorAll('[role="status"], [aria-live="polite"]')].map((e) => (e.textContent || "").trim()).filter(Boolean),
      );
    const alCargar = await vivos();
    if (alCargar.length) fallos.push({ ruta, detalle: `habla sola al cargar: «${alCargar[0].slice(0, 60)}»` });
    let respondidas = 0;
    for (let i = 0; i < 40; i++) {
      const opciones = p.locator('[role="radio"]');
      if (!(await opciones.count())) break;
      await opciones.last().click();
      respondidas++;
      const siguiente = p.getByRole("button", { name: /^(Siguiente|Next)/ });
      if (!(await siguiente.count())) break;
      await siguiente.click();
    }
    await p.waitForTimeout(ESPERA);
    const dicho = (await vivos()).join(" · ");
    if (respondidas < 10) fallos.push({ ruta, detalle: `solo pude responder ${respondidas} preguntas: ¿cambió el test?` });
    else if (!dicho) fallos.push({ ruta, detalle: "con todo respondido, la puntuación no se anuncia" });
    else {
      conAnuncio++;
      console.log(`  ${ruta.padEnd(44)} «${dicho.slice(0, 62)}»`);
    }
  } catch (e) {
    fallos.push({ ruta, detalle: `la página no se pudo recorrer: ${String(e).slice(0, 80)}` });
  }
  await ctx.close();
}

// Los buscadores del glosario y la FAQ cambian la lista con cada letra: se busca
// algo que no existe y algo que sí, y se exige oír ambos resultados.
const BUSCADORES = [
  { ruta: "/glosario/", campo: "#glos-q", existe: "drawdown", nada: /Ningún término/ },
  { ruta: "/en/glosario/", campo: "#glos-q", existe: "drawdown", nada: /No terms/ },
  { ruta: "/faq/", campo: '#faq input[type="search"]', existe: "Windows", nada: /No se encontraron/ },
  { ruta: "/en/faq/", campo: '#faq input[type="search"]', existe: "Windows", nada: /No results/ },
];
for (const b of BUSCADORES) {
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  const ruta = b.ruta;
  try {
    await p.goto(base + ruta, { waitUntil: "load", timeout: 30000 });
    await p.waitForTimeout(ESPERA);
    const vivos = () =>
      p.evaluate(() =>
        [...document.querySelectorAll('[role="status"], [aria-live="polite"]')].map((e) => (e.textContent || "").trim()).filter(Boolean).join(" · "),
      );
    const alCargar = await vivos();
    if (alCargar) fallos.push({ ruta, detalle: `habla sola al cargar: «${alCargar.slice(0, 60)}»` });
    const campo = p.locator(b.campo).first();
    if (!(await campo.count())) {
      fallos.push({ ruta, detalle: `no encontré el buscador (${b.campo})` });
    } else {
      await campo.fill("qzxwv");
      await p.waitForTimeout(ESPERA);
      const sinNada = await vivos();
      await campo.fill(b.existe);
      await p.waitForTimeout(ESPERA);
      const conAlgo = await vivos();
      if (!b.nada.test(sinNada)) fallos.push({ ruta, detalle: `buscar algo que no existe no se anuncia (se oye «${sinNada.slice(0, 50)}»)` });
      else if (!/\d/.test(conAlgo)) fallos.push({ ruta, detalle: `buscar «${b.existe}» no anuncia cuántos resultados quedan (se oye «${conAlgo.slice(0, 50)}»)` });
      else {
        conAnuncio++;
        console.log(`  ${ruta.padEnd(44)} «${sinNada.slice(0, 28)}» / «${conAlgo.slice(0, 28)}»`);
      }
    }
  } catch (e) {
    fallos.push({ ruta, detalle: `la página no se pudo recorrer: ${String(e).slice(0, 80)}` });
  }
  await ctx.close();
}

await navegador.close();
server.close();

if (fallos.length) {
  console.log(`\n  problemas — ${fallos.length}`);
  for (const f of fallos) console.log(`     ${f.ruta}  ${f.detalle}`);
}

console.log(`\n[anuncios] ${HERRAMIENTAS.length * 2 + 2 + BUSCADORES.length} páginas · ${conAnuncio} anuncian su resultado`);

if (sinCambios > HERRAMIENTAS.length) {
  console.log("[anuncios] en casi ninguna cambió nada al tocar una entrada: la guarda está rota, no el sitio");
  process.exit(1);
}
if (fallos.length) {
  console.log(`[anuncios] ${fallos.length} problema(s)`);
  console.log("[anuncios] el anuncio lo pone `<ResultadoAnunciado>` (src/components/tj/ResultadoAnunciado.tsx), una frase por herramienta");
  console.log("[anuncios] si falla «habla sola al cargar»: algo publica texto en el primer render, y eso se lee encima del titular");
  process.exit(1);
}
console.log("[anuncios] correcto — las herramientas dicen su resultado, callan al cargar, y cada una en la convención de su idioma");
