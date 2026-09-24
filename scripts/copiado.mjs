/**
 * COPIADO — el texto que se llevan al portapapeles, ¿está en su idioma?
 *
 * ── Por qué existe aparte de `cifras.mjs` ─────────────────────────────
 * `cifras.mjs` lee el HTML compilado, y el resumen de una calculadora no
 * está ahí: se construye en JavaScript cuando alguien pulsa «Copiar». Es
 * el único texto del sitio que el visitante se lleva fuera —lo pega en
 * su diario, en un chat, en un correo— y el único que ninguna guarda
 * miraba. Así que aquí se pulsa el botón de verdad, en un navegador, y
 * se lee lo que quedó en el portapapeles.
 *
 * ── Qué encontró el día que se escribió (2026-09-20) ──────────────────
 * Tres renglones del proyector de capital salían SIEMPRE en español, aun
 * en la web inglesa: «Ratio Ganancia / Pérdida», «Expectancy Neta» y
 * «Riesgo / Op». Y dos convenciones cruzadas: el plan de la calculadora
 * de riesgo escribía «1,00 %» con espacio también en inglés y restaba
 * con el guion del teclado, y el diagnóstico de disciplina pegaba el
 * porcentaje también en español.
 *
 * ── Las reglas ────────────────────────────────────────────────────────
 * Las mismas que `cifras.mjs`, sobre el texto copiado: el porcentaje con
 * espacio duro en español y pegado en inglés, el dólar detrás en español
 * y delante en inglés, el menos tipográfico (U+2212) en toda cifra
 * negativa, y ni una palabra española en la versión inglesa.
 *
 * ── Por qué no puede quedarse ciega ───────────────────────────────────
 * La lista de herramientas es fija y cada una DEBE encontrar su botón y
 * un texto copiado que no esté vacío. Si alguien renombra el botón, mueve
 * la ruta o rompe el copiado, la guarda falla en vez de pasar en verde
 * sin haber comprobado nada.
 *
 * Uso:  node scripts/copiado.mjs --serve out
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";

const args = process.argv.slice(2);
const dir = args.includes("--serve") ? args[args.indexOf("--serve") + 1] : "out";
const PREFIJO = process.env.NEXT_PUBLIC_BASE_PATH || "";

/* Las herramientas con botón de copiar. `preparar` deja la página
   en el estado en que ese botón existe: el test de disciplina no lo
   muestra hasta haber respondido las preguntas. */
const HERRAMIENTAS = [
  { ruta: "/herramientas/proyector-de-capital", nombre: "proyector de capital" },
  { ruta: "/herramientas/calculadora-de-riesgo", nombre: "calculadora de riesgo" },
  { ruta: "/herramientas/coste-de-indisciplina", nombre: "coste de indisciplina" },
  { ruta: "/herramientas/significancia-estadistica", nombre: "significancia estadística" },
  { ruta: "/herramientas/recuperacion-de-drawdown", nombre: "recuperación de drawdown" },
  { ruta: "/herramientas/prueba-de-fondeo", nombre: "prueba de fondeo" },
  { ruta: "/test", nombre: "test de disciplina", preparar: responderTest },
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

/** Responde el cuestionario —una pregunta por pantalla: cuatro opciones y
 *  un «Siguiente»— marcando la primera opción y avanzando, hasta que
 *  aparezca el botón de copiar. El tope evita un bucle infinito si alguien
 *  cambia el flujo; quedarse sin preguntas sin haber llegado al botón lo
 *  denuncia el propio bucle principal, que exige encontrarlo. */
async function responderTest(pag) {
  for (let i = 0; i < 40; i++) {
    if (await pag.locator("button", { hasText: /copiar|copy/i }).count()) return;
    const opcion = pag.locator('[role="radio"]').first();
    if (await opcion.count()) {
      await opcion.click({ timeout: 4000 }).catch(() => {});
      await pag.waitForTimeout(100);
    }
    /* El patrón va ANCLADO al principio del texto: sin el ancla, «resultado»
       encajaba también con «Solo el resultado» —un selector de vista de la
       página de resultados— y el recorrido se quedaba dando vueltas en la
       primera pregunta sin que nada lo denunciara. */
    const avanzar = pag
      .locator("button", { hasText: /^(?:siguiente|next|ver resultado|see result)/i })
      .filter({ hasNot: pag.locator("[disabled]") })
      .first();
    if (!(await avanzar.count())) break;
    await avanzar.click({ timeout: 4000 }).catch(() => {});
    await pag.waitForTimeout(150);
  }
}

const PALABRAS_ES = [
  "del", "las", "los", "una", "unas", "unos", "por", "para", "pero", "porque",
  "cuando", "donde", "según", "también", "además", "aunque", "mientras", "hacia",
  "desde", "hasta", "entre", "sobre", "cada", "todo", "todos", "toda", "todas",
  "otro", "otra", "esto", "esta", "este", "estos", "estas", "más", "muy", "así",
  "solo", "siempre", "nunca", "año", "años", "mes", "meses", "día", "días",
  "operación", "operaciones", "ganancia", "pérdida", "riesgo", "cuenta", "cuentas",
  "inicial", "neta", "neto", "beneficio", "fuga", "brecha", "desglose", "resumen",
  "perfil", "ventaja", "puntuación", "objetivo", "tamaño", "entrada", "dirección",
];
const RE_ES = new RegExp("\\b(?:" + PALABRAS_ES.join("|") + ")\\b", "gi");

/* El texto copiado es de renglón corto y separadores propios, así que
   aquí no hay que temer los espacios inventados que sí complican el HTML:
   se mide tal cual llegó al portapapeles. */
function revisar(texto, en) {
  const fallos = [];
  const anota = (regla, re) => {
    for (const m of texto.matchAll(re)) {
      fallos.push({ regla, ejemplo: texto.slice(Math.max(0, m.index - 24), m.index + m[0].length + 4).trim() });
      if (fallos.filter((f) => f.regla === regla).length >= 3) break;
    }
  };
  if (en) {
    anota("% con espacio en inglés", /\d[ \u00a0]%/g);
    anota("dólar detrás en inglés", /\d[\d.,]*[ \u00a0]\$(?!\d)/g);
    anota("palabra española en el texto inglés", RE_ES);
  } else {
    anota("% pegado en español", /\d%/g);
    anota("dólar delante en español", /(?<![\dkM][ \u00a0])\$[ \u00a0]?\d/g);
  }
  anota("menos de teclado en una cifra", /[\s(:]-\d[\d.,]*/g);
  return fallos;
}

const { server, base } = await servir(dir);
const navegador = await chromium.launch();
const ctx = await navegador.newContext({
  viewport: { width: 1280, height: 900 },
  reducedMotion: "reduce",
  permissions: ["clipboard-read", "clipboard-write"],
});

const problemas = [];
let copiados = 0;

for (const h of HERRAMIENTAS) {
  for (const idioma of ["es", "en"]) {
    const ruta = (idioma === "en" ? "/en" : "") + h.ruta;
    const pag = await ctx.newPage();
    await pag.goto(`${base}${ruta}/`, { waitUntil: "networkidle" });
    /* El aviso de cookies vive fijo abajo a la izquierda y puede quedar
       encima del botón; se contesta lo más conservador y desaparece. */
    const cookies = pag.locator("button", { hasText: /^(?:solo necesarias|necessary only)/i }).first();
    if (await cookies.count()) await cookies.click({ timeout: 3000 }).catch(() => {});
    if (h.preparar) await h.preparar(pag);

    const boton = pag.locator("button", { hasText: /copiar|copy/i }).first();
    if (!(await boton.count())) {
      problemas.push({ ruta, regla: "sin botón de copiar", ejemplo: `«${h.nombre}» no expone ningún botón de copiar` });
      await pag.close();
      continue;
    }
    await boton.scrollIntoViewIfNeeded();
    await boton.click();
    await pag.waitForTimeout(250);

    const texto = await pag.evaluate(() => navigator.clipboard.readText().catch(() => ""));
    if (!texto || texto.trim().length < 20) {
      problemas.push({ ruta, regla: "portapapeles vacío", ejemplo: `«${h.nombre}» copió ${texto.length} caracteres` });
      await pag.close();
      continue;
    }
    copiados++;
    for (const f of revisar(texto, idioma === "en")) problemas.push({ ruta, ...f });
    await pag.close();
  }
}

await navegador.close();
server.close();

const porRegla = {};
for (const x of problemas) (porRegla[x.regla] ||= []).push(x);
for (const [regla, casos] of Object.entries(porRegla)) {
  console.log(`\n  ${regla} — ${casos.length} caso(s)`);
  for (const c of casos.slice(0, 6)) console.log(`     ${c.ruta}  «${c.ejemplo}»`);
  if (casos.length > 6) console.log(`     … y ${casos.length - 6} más`);
}

console.log(`\n[copiado] ${copiados} de ${HERRAMIENTAS.length * 2} resúmenes copiados y revisados`);
if (problemas.length || copiados !== HERRAMIENTAS.length * 2) {
  console.log(`[copiado] ${problemas.length} problema(s) en el texto que se lleva el visitante`);
  console.log("[copiado] el separador del porcentaje sale de `pctSep(lang)`; el resto del texto, de `es ? \"…\" : \"…\"`");
  process.exit(1);
}
console.log("[copiado] correcto — cada resumen se copia en el idioma de su página");
