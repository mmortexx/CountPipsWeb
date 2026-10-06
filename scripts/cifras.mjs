/**
 * CIFRAS: comprueba, sobre el sitio compilado, que cada número y cada palabra
 * usan la convención de su idioma. Los formateadores no cubren lo que se
 * compone a mano en el JSX. Reglas:
 *   - Porcentaje: español con espacio duro (U+00A0) antes del signo (`pctSep`),
 *     inglés pegado. El espacio normal deja el «%» solo al partir la línea.
 *   - Dólar: detrás de la cifra en español, delante en inglés.
 *   - Menos: el tipográfico (U+2212) en toda cifra negativa.
 *   - Palabras españolas sueltas, comillas, apóstrofos, ortografía americana y
 *     «operate» en /en; restos de plantilla; flechas añadidas a enlaces; marcas
 *     o iconos delante de elementos de lista.
 * Se recortan antes de medir los atributos de estilo y el CSS embebido.
 * Un fallo es un literal sin bifurcar por idioma o fuera de convención.
 *
 * Uso:  node scripts/cifras.mjs [out]
 */
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

// Otras guardas se invocan `--serve out`; esta lee ficheros. Acepta las dos formas.
const RAIZ = process.argv.slice(2).find((a) => !a.startsWith("-")) || "out";
if (!existsSync(RAIZ)) {
  console.log(`[cifras] no encuentro el directorio «${RAIZ}». ¿Falta compilar el sitio con \`npm run build\`?`);
  process.exit(1);
}

async function* htmls(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* htmls(p);
    else if (e.name.endsWith(".html")) yield p;
  }
}

/** Texto visible sin espacios inventados: los comentarios de React (`0.50<!-- -->%`)
 *  y las etiquetas en línea (`<span>60</span><span>%</span>`) no pintan espacio
 *  y se borran sin dejar nada; solo las de bloque dejan un separador. */
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
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ");
}

/* Palabras que no existen en inglés: en /en solo pueden venir de un literal sin
   bifurcar. Lista corta a propósito; si una da un falso positivo, se quita de
   aquí antes que relajar la regla. */
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
let elementosLista = 0;

for await (const f of htmls(RAIZ)) {
  const ruta = "/" + relative(RAIZ, f).split(sep).join("/").replace(/index\.html$/, "");
  if (ruta.startsWith("/404") || ruta.startsWith("/_not-found")) continue;
  const en = ruta === "/en/" || ruta.startsWith("/en/");
  const crudo = await readFile(f, "utf8");
  const t = soloTexto(crudo);
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
    // Inglés: sin espacio antes del %, sin dólar detrás.
    anota("% con espacio en inglés", /\d[ \u00a0]%/g, ctx);
    anota("dólar detrás en inglés", /\d[\d.,]*[ \u00a0]\$(?!\d)/g, ctx);
    anota("palabra española en la web inglesa", RE_ES, ctx);
    // Las comillas angulares son españolas.
    anota("comillas angulares en la web inglesa", /[«»]/g, ctx);
    // El dinero de la cuenta es «balance»; en español lo vigila `tests/vocabulario.test.ts`.
    anota("«capital» para el dinero de la cuenta (es «balance»)", /\b(?:your|starting) capital\b|\bCapital and frequency\b/gi, ctx);
    // Apóstrofo y comillas tipográficos (“…”, don’t); la mayoría vive en JSX, no en los catálogos.
    anota("apóstrofo recto en la web inglesa", /[A-Za-z]'[A-Za-z]/g, ctx);
    anota("comillas rectas en la web inglesa", /"/g, ctx);
    // Ortografía británica: `tests/ortografia-britanica.test.ts` vigila los
    // catálogos y esto lo publicado. Se respeta «Maximum Favorable Excursion».
    anota(
      "ortografía americana en la web inglesa",
      /\b\w*(?:penaliz|annualiz|summariz|normaliz|optimiz|analyz|realiz|recogniz|organiz|minimiz|maximiz|standardiz|prioritiz|customiz|visualiz|categoriz|behavior|defense)\w*\b|\b(?:colors?|centers?|catalogs?)\b|\bfavor(?!able Excursion)\w*/gi,
      ctx,
    );
    // «Operar» es «trade», no «operate» (calco que la ortografía no caza). El
    // patrón se acota a quien opera para no acusar a «operating system».
    anota(
      "«operar» traducido como «operate» en la web inglesa",
      /\b(?:trader|traders|you|we|they)\s+operates?\b|\boperating\s+(?:under|with|in)\b/gi,
      ctx,
    );
  } else {
    anota("% pegado en español", /\d%/g, ctx);
    anota("% que puede quedarse solo en la línea siguiente (espacio normal, no duro)", /\d %/g, ctx);
    // El lookbehind evita acusar una fila de importes («0 $ 5.000 $»): solo se
    // acusa un «$» no precedido de una cifra o su abreviatura de escala.
    anota("dólar delante en español", /(?<![\dkM][ \u00a0])\$[ \u00a0]?\d/g, ctx);
  }
  // En los dos idiomas: el menos de las cifras es el tipográfico.
  anota("menos de teclado en una cifra", /[\s(>]-\d[\d.,]*/g, ctx);
  /* La raya de inciso pegada a una palabra debe llevar un U+2060 (unión de
     palabras) para que la línea no se parta a su lado. Se mira cada nodo de
     texto por separado: un «—» solo en su `<span>` no está pegado a nada. */
  {
    const RAYA = /[\p{L}\d.,)»]—|—[\p{L}\d(«]/u;
    let n = 0;
    for (const m of crudo.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, "").matchAll(/>([^<]*—[^<]*)</g)) {
      if (!RAYA.test(m[1])) continue;
      if (n++ < 3) fallos.push({ ruta, regla: "raya de inciso que se puede separar de su palabra", ejemplo: m[1].trim().slice(0, 60) });
    }
  }

  // Restos de plantilla en el texto visible («undefined», «NaN», «[object Object]»).
  anota("resto de plantilla a la vista", /\b(?:undefined|NaN|Invalid Date)\b|\[object [A-Z]\w*\]/g, ctx);

  // Flecha añadida a un enlace o botón: se lee el HTML para saber que cierra un `<a>` o `<button>`.
  for (const m of crudo.matchAll(/<(a|button)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const dentro = soloTexto(m[2]).replace(/\s+/g, " ").trim();
    if (/[→↗]$/.test(dentro) && !/\b(?:Siguiente|Anterior|Next|Previous)\b/i.test(dentro)) {
      fallos.push({ ruta, regla: "flecha añadida a un enlace o botón", ejemplo: dentro.slice(-60) });
    }
  }

  // Marca delante de un elemento de lista: un ✓, ✕ o icono repite lo que ya dice el rótulo.
  for (const m of crudo.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)) {
    elementosLista++;
    const inicio = m[1].replace(/^(\s*<(?:span|div)\b[^>]*>)+/i, "");
    const texto = soloTexto(m[1]).trim();
    if (/^<svg\b/i.test(inicio) || /^[✓✔✗✕×]/.test(texto)) {
      fallos.push({ ruta, regla: "marca o icono delante de un elemento de lista", ejemplo: texto.slice(0, 60) });
    }
  }
}

const porRegla = {};
for (const x of fallos) (porRegla[x.regla] ||= []).push(x);

for (const [regla, casos] of Object.entries(porRegla)) {
  console.log(`\n  ${regla} — ${casos.length} caso(s)`);
  for (const c of casos.slice(0, 6)) console.log(`     ${c.ruta}  «${c.ejemplo}»`);
  if (casos.length > 6) console.log(`     … y ${casos.length - 6} más`);
}

console.log(`\n[cifras] ${paginas} páginas revisadas, ${elementosLista} elementos de lista`);
// Sin ninguna lista, la regla de marcas no estaba mirando.
if (!elementosLista) fallos.push({ ruta: "—", regla: "no se encontró ningún elemento de lista", ejemplo: "" });
if (fallos.length) {
  console.log(`[cifras] ${fallos.length} caso(s) escritos fuera de la convención de su idioma`);
  console.log("[cifras] el separador del porcentaje sale de `pctSep(lang)`; el dólar, de `fmtMoney`");
  console.log("[cifras] una palabra española en /en es un literal sin bifurcar: `es ? \"…\" : \"…\"`");
  console.log("[cifras] un enlace se reconoce por su subrayado (`.link-underline`), no por una flecha");
  process.exit(1);
}
console.log("[cifras] correcto — cada número y cada palabra usan la convención de su idioma");
