/**
 * METADATOS: comprueba, en todas las páginas compiladas, la ficha con la que
 * se presentan fuera del sitio: título, descripción, canónico, `hreflang`,
 * idioma, datos estructurados y tarjeta social. No se ve abriendo el sitio,
 * sino en un buscador o al pegar un enlace.
 *
 * Límites: título ≤ 60 caracteres (si no, se recorta con puntos suspensivos)
 * y descripción entre 70 y 160 (el corte real es por anchura en píxeles, así
 * que 160 es un borde prudente). Son criterio, no física: si cambian, se
 * cambian aquí.
 *
 * El 404 queda fuera de casi todas las reglas solo porque se declara
 * `noindex`; si alguien se lo quita, se le empieza a exigir la ficha.
 *
 * También vigila lo que se busca: que cada página principal lleve en el título
 * su búsqueda (`BUSQUEDA_DEL_TITULO`) y que las voces del glosario con nombre
 * español se titulen con él en `/glosario/` y con el inglés en `/en/glosario/`,
 * y que cada voz publique su ejemplo y por qué importa (`glosario-ampliado.ts`).
 *
 * Uso:  node scripts/metadatos.mjs out
 */
import { readFileSync, globSync, existsSync } from "node:fs";
import { TABLA_IDIOMAS } from "../src/lib/locale.ts";
import { GLOSSARY } from "../src/lib/trading/glossary.ts";
import { slugTermino } from "../src/lib/trading/nombre-termino.ts";
import { AMPLIADO } from "../src/lib/glosario-ampliado.ts";

// Acepta `out` y `--serve out`, la forma de otras guardas.
const dir = process.argv.slice(2).find((a) => !a.startsWith("-")) || "out";
if (!existsSync(dir)) {
  console.log(`[metadatos] no encuentro el directorio «${dir}». ¿Falta compilar el sitio con \`npm run build\`?`);
  process.exit(1);
}
// En GitHub Pages el sitio cuelga de un subdirectorio: el canónico lleva ese prefijo y la ruta del fichero no.
const PREFIJO = process.env.NEXT_PUBLIC_BASE_PATH || "/CountPipsWeb";

const TITULO_MAX = 60;
const DESC_MIN = 70;
const DESC_MAX = 160;

const entidades = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();

// Texto visible de un encabezado: sin etiquetas ni espacios de más, y sin el punto final de estilo.
const texto = (s) => entidades(s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ")).replace(/\.$/, "");

const saca = (html, re) => {
  const m = html.match(re);
  return m ? entidades(m[1]) : null;
};

const ficheros = globSync(`${dir}/**/index.html`);
const paginas = ficheros.map((f) => {
  const html = readFileSync(f, "utf8");
  const ruta = "/" + f.replace(/\\/g, "/").replace(new RegExp(`^${dir}/`), "").replace(/index\.html$/, "");
  return {
    ruta,
    titulo: saca(html, /<title>([^<]*)<\/title>/),
    desc: saca(html, /<meta name="description" content="([^"]*)"/),
    canonico: saca(html, /<link rel="canonical" href="([^"]*)"/),
    // Next escribe `hrefLang` en camelCase: la búsqueda va sin distinguir mayúsculas.
    alternos: [...html.matchAll(/<link rel="alternate"[^>]*hreflang="([^"]*)"[^>]*href="([^"]*)"/gi)].map((m) => ({ idioma: m[1], destino: m[2] })),
    jsonld: (html.match(/application\/ld\+json/g) || []).length,
    lang: saca(html, /<html[^>]*\blang="([^"]*)"/),
    noindex: /<meta name="robots" content="[^"]*noindex/.test(html),
    ogTitulo: saca(html, /<meta property="og:title" content="([^"]*)"/),
    twTitulo: saca(html, /<meta name="twitter:title" content="([^"]*)"/),
    imagenes: [...html.matchAll(/<meta (?:property="og:image"|name="twitter:image") content="([^"]*)"/g)].map((m) => entidades(m[1])),
    imagenesLd: [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap((m) =>
      [...m[1].matchAll(/"image":"([^"]*)"/g)].map((x) => x[1]),
    ),
    bloquesLd: [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1])),
    h1: [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => texto(m[1])),
    h2: [...html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => texto(m[1])),
    cuerpo: texto((html.match(/<main\b[\s\S]*?<\/main>/) || [""])[0].replace(/<script\b[\s\S]*?<\/script>/g, " ")),
  };
});

const rutasQueExisten = new Set(paginas.map((p) => p.ruta.replace(/\/$/, "") || "/"));

const fallos = [];
const anota = (regla, ruta, detalle) => fallos.push({ regla, ruta, detalle });

// Solo las páginas indexables responden por su ficha.
const indexables = paginas.filter((p) => !p.noindex);

for (const p of paginas) {
  let esperado = "es";
  for (const idioma of TABLA_IDIOMAS) {
    if (!idioma.prefijo) continue;
    if (p.ruta === `${idioma.prefijo}/` || p.ruta.startsWith(`${idioma.prefijo}/`)) {
      esperado = idioma.htmlLang;
      break;
    }
  }
  if (p.lang !== esperado) anota("idioma que no cuadra con la carpeta", p.ruta, `lang="${p.lang}", se esperaba "${esperado}"`);
}

for (const p of indexables) {
  if (!p.titulo) anota("sin título", p.ruta, "ninguna página indexable puede salir sin <title>");
  else if (p.titulo.length > TITULO_MAX) anota("título que el buscador recorta", p.ruta, `${p.titulo.length} caracteres (tope ${TITULO_MAX}) — «${p.titulo}»`);

  if (!p.desc) anota("sin descripción", p.ruta, "el buscador se inventa el resumen si no se lo das");
  else if (p.desc.length > DESC_MAX)
    anota("descripción que se corta a mitad", p.ruta, `${p.desc.length} caracteres (tope ${DESC_MAX}) — se perdería «…${p.desc.slice(DESC_MAX - 10)}»`);
  else if (p.desc.length < DESC_MIN)
    anota("descripción que desaprovecha el hueco", p.ruta, `${p.desc.length} caracteres (mínimo ${DESC_MIN}) — «${p.desc}»`);

  if (!p.canonico) anota("sin canónico", p.ruta, "dos rutas con el mismo contenido compiten entre sí");
  else {
    const declarada = p.canonico.replace(/^https?:\/\/[^/]+/, "").replace(new RegExp(`^${PREFIJO}`), "") || "/";
    if (declarada.replace(/\/$/, "") !== p.ruta.replace(/\/$/, ""))
      anota("canónico que señala a otra página", p.ruta, `apunta a ${declarada}`);
  }

  if (p.alternos.length === 0) anota("sin hreflang", p.ruta, "el sitio es bilingüe y esta página no dice dónde está su gemela");
  // Un hreflang a una página inexistente es peor que no ponerlo: el buscador deja de fiarse del grupo.
  for (const a of p.alternos) {
    const destino = a.destino.replace(/^https?:\/\/[^/]+/, "").replace(new RegExp(`^${PREFIJO}`), "") || "/";
    if (!rutasQueExisten.has(destino.replace(/\/$/, "") || "/"))
      anota("hreflang que apunta a una página que no existe", p.ruta, `hreflang="${a.idioma}" → ${destino}`);
  }
  if (p.jsonld === 0) anota("sin datos estructurados", p.ruta, "ningún bloque ld+json");

  // La raíz es el canónico menos la ruta de la página; la tarjeta social debe colgar de ella y existir en out/.
  const raiz = p.canonico && p.canonico.endsWith(p.ruta) ? p.canonico.slice(0, p.canonico.length - p.ruta.length) : null;
  for (const img of p.imagenes) {
    const sinConsulta = img.split("?")[0];
    if (!raiz || !sinConsulta.startsWith(raiz + "/")) {
      anota("tarjeta social fuera del sitio", p.ruta, `${img} no cuelga de ${raiz ?? "(sin canónico)"}`);
    } else if (!existsSync(`${dir}${sinConsulta.slice(raiz.length)}`)) {
      anota("tarjeta social que no existe", p.ruta, `${sinConsulta.slice(raiz.length)} no está en ${dir}/`);
    }
  }
  // X y el resto de redes comparten la misma ficha.
  if (p.ogTitulo && p.twTitulo !== p.ogTitulo)
    anota("twitter:title distinto del og:title", p.ruta, `«${p.twTitulo}» frente a «${p.ogTitulo}»`);
  // Una descripción recortada a máquina acaba en «…» a media palabra.
  if (p.desc && p.desc.endsWith("…")) anota("descripción recortada con puntos suspensivos", p.ruta, `«…${p.desc.slice(-40)}»`);
  // Una sola marca y un solo separador: «Título — CountPips».
  if (p.titulo && (/·\s*CountPips/.test(p.titulo) || (p.titulo.match(/ — /g) || []).length > 1))
    anota("separador de título que no es «— CountPips»", p.ruta, `«${p.titulo}»`);
  // La imagen de los datos estructurados es la misma tarjeta que anuncia la página.
  const tarjeta = p.imagenes[0]?.split("?")[0];
  for (const img of p.imagenesLd) {
    if (img.split("?")[0] !== tarjeta) anota("datos estructurados con otra imagen que la tarjeta", p.ruta, `${img} frente a ${tarjeta ?? "(sin og:image)"}`);
  }

  // Google no acepta un `Product` sin precio, reseñas ni valoración, y ponerle precio diría que ya se vende.
  for (const b of p.bloquesLd) {
    if (b["@type"] === "Product" && !b.offers && !b.review && !b.aggregateRating)
      anota("Product sin offers, review ni aggregateRating", p.ruta, `«${b.name}»: Google lo da por inválido`);
  }

  // Una voz del glosario se titula con el nombre que declara su `DefinedTerm`: el que se busca en ese idioma.
  const termino = p.bloquesLd.find((b) => b["@type"] === "DefinedTerm");
  if (termino) {
    const sinParentesis = termino.name.replace(/\s*\([^)]*\)/g, "").trim();
    if (p.h1[0] !== termino.name) anota("voz del glosario con otro H1 que su nombre", p.ruta, `H1 «${p.h1[0]}» frente a «${termino.name}»`);
    if (p.titulo && !p.titulo.startsWith(termino.name) && !p.titulo.startsWith(sinParentesis))
      anota("voz del glosario con otro título que su nombre", p.ruta, `«${p.titulo}» frente a «${termino.name}»`);
  }
}

// Cada página principal se titula con la búsqueda que quiere ganar. Si la ruta desaparece, falla: una regla
// que no encuentra a quién mirar no debe aprobar.
const BUSQUEDA_DEL_TITULO = {
  "/": /diario de trading/i,
  "/en/": /trading journal/i,
  "/features/": /diario de trading/i,
  "/en/features/": /trading journal/i,
  "/features/metricas/": /métricas de trading/i,
  "/en/features/metricas/": /trading metrics/i,
  "/features/disciplina/": /disciplina de trading/i,
  "/en/features/disciplina/": /trading discipline/i,
  "/features/seguridad/": /diario de trading/i,
  "/en/features/seguridad/": /trading journal/i,
  "/pricing/": /diario de trading/i,
  "/en/pricing/": /trading journal/i,
  "/demo/": /diario de trading/i,
  "/en/demo/": /trading journal/i,
  "/test/": /disciplina para traders/i,
  "/en/test/": /trading discipline/i,
  "/faq/": /preguntas frecuentes/i,
  "/en/faq/": /questions/i,
  "/herramientas/": /calculadoras de trading/i,
  "/en/herramientas/": /trading calculators/i,
  "/herramientas/calculadora-de-riesgo/": /lotaje/i,
  "/en/herramientas/calculadora-de-riesgo/": /lot size/i,
  "/herramientas/monte-carlo/": /riesgo de ruina/i,
  "/en/herramientas/monte-carlo/": /risk of ruin/i,
  "/herramientas/reloj-de-sesiones/": /horario de sesiones/i,
  "/en/herramientas/reloj-de-sesiones/": /sessions clock/i,
  "/traders/manual/": /diario de trading/i,
  "/en/traders/manual/": /trading journal/i,
};
// Las voces con nombre español se titulan con él en `/glosario/` y con el inglés en `/en/glosario/`.
const conNombreEs = GLOSSARY.filter((t) => t.nombreEs);
if (conNombreEs.length === 0) anota("glosario sin nombres en español que mirar", "/glosario/", "ninguna voz declara `nombreEs`");
for (const t of conNombreEs) {
  for (const [ruta, nombre] of [[`/glosario/${slugTermino(t.term)}/`, t.nombreEs], [`/en/glosario/${slugTermino(t.term)}/`, t.term]]) {
    const p = indexables.find((x) => x.ruta === ruta);
    if (!p) anota("voz del glosario que no está", ruta, `«${t.term}» no tiene página indexable`);
    else if (p.h1[0] !== nombre || !p.titulo?.startsWith(nombre))
      anota("voz del glosario que no se titula con su nombre en ese idioma", ruta, `H1 «${p.h1[0]}», título «${p.titulo}»; se esperaba «${nombre}»`);
  }
}

// Cada voz publica, además de la definición, su ejemplo y por qué importa: sin ellos es contenido escaso.
for (const t of GLOSSARY) {
  const a = AMPLIADO[t.term];
  for (const [ruta, encabezados, textos] of [
    [`/glosario/${slugTermino(t.term)}/`, ["Un ejemplo", "Por qué importa"], a ? [a.ejemplo.es, a.importa.es] : []],
    [`/en/glosario/${slugTermino(t.term)}/`, ["An example", "Why it matters"], a ? [a.ejemplo.en, a.importa.en] : []],
  ]) {
    const p = indexables.find((x) => x.ruta === ruta);
    if (!p) continue;
    const faltan = [
      ...encabezados.filter((h) => !p.h2.includes(h)).map((h) => `encabezado «${h}»`),
      ...(a ? textos.filter((s) => !p.cuerpo.includes(s.slice(0, 40).replace(/\s+/g, " "))).map((s) => `texto «${s.slice(0, 40)}…»`) : ["entrada en AMPLIADO"]),
    ];
    if (faltan.length) anota("voz del glosario sin ejemplo ni por qué importa", ruta, `falta: ${faltan.join(", ")}`);
  }
}

for (const [ruta, busqueda] of Object.entries(BUSQUEDA_DEL_TITULO)) {
  const p = indexables.find((x) => x.ruta === ruta);
  if (!p) anota("título sin página que mirar", ruta, "la ruta ya no existe o es noindex: actualiza BUSQUEDA_DEL_TITULO");
  else if (!busqueda.test(p.titulo ?? "")) anota("título sin la búsqueda que persigue", ruta, `«${p.titulo}» no contiene ${busqueda}`);
}

// Dos páginas indexables con el mismo título o descripción compiten por la misma consulta; las no indexables pueden repetirse.
const agrupa = (campo) => {
  const m = new Map();
  for (const p of indexables) {
    if (!p[campo]) continue;
    if (!m.has(p[campo])) m.set(p[campo], []);
    m.get(p[campo]).push(p.ruta);
  }
  return [...m.entries()].filter(([, rutas]) => rutas.length > 1);
};
for (const [texto, rutas] of agrupa("titulo")) anota("mismo título en varias páginas", rutas[0], `«${texto}» — también en ${rutas.slice(1).join(", ")}`);
for (const [texto, rutas] of agrupa("desc")) anota("misma descripción en varias páginas", rutas[0], `«${texto.slice(0, 60)}…» — también en ${rutas.slice(1).join(", ")}`);

const porRegla = {};
for (const f of fallos) (porRegla[f.regla] ||= []).push(f);
for (const [regla, casos] of Object.entries(porRegla)) {
  console.log(`\n  ${regla} — ${casos.length} caso(s)`);
  for (const c of casos.slice(0, 10)) console.log(`     ${c.ruta}  ${c.detalle}`);
  if (casos.length > 10) console.log(`     … y ${casos.length - 10} más`);
}

console.log(`\n[metadatos] ${paginas.length} páginas · ${indexables.length} indexables · ${paginas.length - indexables.length} con noindex`);

// Un puñado de páginas indica un `out/` viejo, vacío o a medio compilar; una guarda que no mira nada aprueba siempre.
if (paginas.length < 100) {
  console.log(`[metadatos] solo ${paginas.length} páginas: se esperaban más de 150. ¿Está compilado el sitio?`);
  process.exit(1);
}
if (fallos.length) {
  console.log(`[metadatos] ${fallos.length} problema(s) en la ficha con la que el sitio se presenta fuera`);
  process.exit(1);
}
console.log("[metadatos] correcto — cada página se presenta con su propia ficha, entera y del tamaño que cabe");
