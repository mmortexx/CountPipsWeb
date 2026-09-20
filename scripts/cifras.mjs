/**
 * CIFRAS — ¿está cada número, y cada palabra, escrito en su idioma?
 *
 * ── Qué mide ──────────────────────────────────────────────────────────
 * Recorre el sitio compilado y comprueba cuatro convenciones que cambian
 * con la lengua y que se escapan de los formateadores en cuanto alguien
 * compone un número —o una frase— a mano en el JSX:
 *
 *   · EL PORCENTAJE. Español: espacio antes del signo. Inglés: pegado.
 *     (El espacio DURO, U+00A0, es lo correcto en una columna estrecha —lo
 *     pone `pctSep`— pero no se exige aquí: en un párrafo corrido el
 *     espacio normal no rompe nada, y acusarlo llenaría la salida de ruido
 *     que taparía los fallos de idioma, que sí importan.)
 *   · EL DÓLAR. Español detrás de la cifra («10.000 $»), inglés delante
 *     («$10,000»).
 *   · EL SIGNO MENOS. El tipográfico (U+2212) en toda cifra negativa, no
 *     el guion del teclado: en una columna de cifras tabulares el guion
 *     es más corto y descoloca la alineación.
 *   · LA PALABRA SUELTA EN ESPAÑOL dentro de la web inglesa. Una etiqueta
 *     que nadie bifurcó por idioma no rompe nada, no sale en ninguna
 *     prueba y se queda ahí para siempre; pero al lector inglés le dice
 *     que la página está traducida a medias. Se busca una lista corta de
 *     palabras que no existen en inglés —artículos, preposiciones y el
 *     vocabulario del dominio— sobre el texto visible de /en.
 *
 * ── Qué encontró el día que se escribió (2026-09-20) ──────────────────
 * 11 porcentajes a la española en la web inglesa —«Win rate 55 %»—, y el
 * dólar detrás de la cifra en los deslizadores y en la tabla de coste de
 * indisciplina de /en. Una página en inglés que escribe «32 %» y
 * «10,000 $» se lee como traducida del español, que es exactamente lo que
 * un portal bilingüe no puede parecer.
 *
 * Y, con la cuarta regla, «218.2x capital inicial» bajo el balance
 * proyectado del proyector de capital inglés, en dos páginas: el literal
 * era el único del componente que nadie había bifurcado por idioma.
 *
 * ── Lo que NO cuenta ──────────────────────────────────────────────────
 * Los atributos de estilo (`color-mix(... 22%)`) y el CSS embebido, que
 * llevan porcentajes que no son texto. Se recortan antes de medir.
 *
 * Uso:  node scripts/cifras.mjs [out]
 */
import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const RAIZ = process.argv[2] || "out";

async function* htmls(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* htmls(p);
    else if (e.name.endsWith(".html")) yield p;
  }
}

/** Texto visible, y con MUCHO cuidado con los espacios que se inventan.
 *
 *  Aplanar el HTML metiendo un espacio en el sitio de cada etiqueta crea
 *  separaciones que en pantalla no existen, y aquí eso es justo lo que se
 *  está midiendo. Dos fuentes de espacios falsos:
 *
 *   · LOS COMENTARIOS DE REACT. React escribe `<!-- -->` entre dos nodos
 *     de texto contiguos para poder volver a distinguirlos al hidratar.
 *     `0.50<!-- -->%` se ve «0.50%», pero sustituyendo el comentario por
 *     un espacio se lee «0.50 %» y se acusa un fallo que no existe.
 *   · LAS ETIQUETAS EN LÍNEA. `<span>60</span><span>%</span>` tampoco
 *     pinta ningún espacio entre las dos.
 *
 *  Así que los comentarios y las etiquetas en línea se borran sin dejar
 *  nada, y sólo las de bloque dejan un separador. */
const EN_LINEA = /<\/?(?:span|b|strong|em|i|sup|sub|small|code|abbr|time|a|label|bdi|mark|u|s)\b[^>]*>/gi;

function soloTexto(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(EN_LINEA, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, "\u00a0")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/[ \t]+/g, " ");
}

/* Palabras que no son palabras inglesas y que, apareciendo en /en, sólo
   pueden venir de un literal sin bifurcar. La lista es corta a propósito:
   cada entrada se probó contra las 84 páginas inglesas y ninguna produce
   un falso positivo. Si alguna lo diera algún día —un nombre propio, una
   cita— se quita de aquí antes que relajar la regla entera. */
const PALABRAS_ES = [
  "del", "las", "los", "una", "unas", "unos", "por", "para", "pero", "porque",
  "cuando", "donde", "según", "también", "además", "aunque", "mientras", "hacia",
  "desde", "hasta", "entre", "sobre", "cada", "todo", "todos", "toda", "todas",
  "otro", "otra", "esto", "esta", "este", "estos", "estas", "más", "muy", "así",
  "sólo", "siempre", "nunca", "año", "años", "mes", "meses", "día", "días",
  "operaciones", "ganancia", "pérdida", "riesgo", "cuenta", "cuentas", "inicial",
];
const RE_ES = new RegExp("\\b(?:" + PALABRAS_ES.join("|") + ")\\b", "gi");

const fallos = [];
let paginas = 0;

for await (const f of htmls(RAIZ)) {
  const ruta = "/" + relative(RAIZ, f).split(sep).join("/").replace(/index\.html$/, "");
  if (ruta.startsWith("/404") || ruta.startsWith("/_not-found")) continue;
  const en = ruta === "/en/" || ruta.startsWith("/en/");
  const t = soloTexto(await readFile(f, "utf8"));
  paginas++;

  const anota = (regla, re, ejemploDe) => {
    re.lastIndex = 0;
    const m = [...t.matchAll(re)];
    for (const x of m.slice(0, 3)) {
      fallos.push({ ruta, regla, ejemplo: ejemploDe(t, x) });
    }
    return m.length;
  };
  const ctx = (texto, x) => texto.slice(Math.max(0, x.index - 26), x.index + x[0].length + 4).trim();

  if (en) {
    // inglés: nada de espacio antes del %, nada de dólar detrás
    anota("% con espacio en inglés", /\d[ \u00a0]%/g, ctx);
    anota("dólar detrás en inglés", /\d[\d.,]*[ \u00a0]\$(?!\d)/g, ctx);
    anota("palabra española en la web inglesa", RE_ES, ctx);
  } else {
    anota("% pegado en español", /\d%/g, ctx);
    /* El lookbehind evita el falso positivo de una fila de importes
       españoles: en «0 $ 5.000 $ 10.000 $» —o «10 k $ 25 k $»— el símbolo
       va DETRÁS de cada cifra, pero visto de izquierda a derecha parece ir
       delante de la siguiente. Sólo se acusa un «$» que no venga precedido
       de una cifra o de su abreviatura de escala. */
    anota("dólar delante en español", /(?<![\dkM][ \u00a0])\$[ \u00a0]?\d/g, ctx);
  }
  // en los dos: el menos de las cifras es el tipográfico
  anota("menos de teclado en una cifra", /[\s(>]-\d[\d.,]*/g, ctx);
}

const porRegla = {};
for (const x of fallos) (porRegla[x.regla] ||= []).push(x);

for (const [regla, casos] of Object.entries(porRegla)) {
  console.log(`\n  ${regla} — ${casos.length} caso(s)`);
  for (const c of casos.slice(0, 6)) console.log(`     ${c.ruta}  «${c.ejemplo}»`);
  if (casos.length > 6) console.log(`     … y ${casos.length - 6} más`);
}

console.log(`\n[cifras] ${paginas} páginas revisadas`);
if (fallos.length) {
  console.log(`[cifras] ${fallos.length} caso(s) con la convención del otro idioma`);
  console.log("[cifras] el separador del porcentaje sale de `pctSep(lang)`; el dólar, de `fmtMoney` o `formatoUsd`");
  console.log("[cifras] una palabra española en /en es un literal sin bifurcar: `es ? \"…\" : \"…\"`");
  process.exit(1);
}
console.log("[cifras] correcto — cada número y cada palabra usan la convención de su idioma");
