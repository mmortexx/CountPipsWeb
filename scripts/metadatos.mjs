/**
 * METADATOS — la ficha con la que cada página se presenta fuera del sitio
 *
 * ── Qué mide ──────────────────────────────────────────────────────────
 * El título, la descripción, el canónico, los `hreflang`, el idioma y los
 * datos estructurados de TODAS las páginas compiladas. Nada de esto se ve
 * abriendo el sitio: se ve en el resultado de una búsqueda, en la tarjeta
 * que aparece al pegar un enlace en un chat, y en lo que un buscador
 * decide indexar. Por eso se rompe sin que nadie lo note.
 *
 * ── Qué encontró el día que se escribió (2026-09-20) ──────────────────
 * Cinco descripciones que Google corta a mitad de frase. Dos de ellas
 * —`/features/disciplina/` y su gemela inglesa— llegaban a 193 y 191
 * caracteres, así que el resultado de búsqueda perdía justo la frase con
 * la que la página se vendía: «Indisciplina medida en dinero.»
 *
 * ── Los números y de dónde salen ──────────────────────────────────────
 * · Título ≤ 60: por encima, el buscador lo recorta con puntos suspensivos.
 * · Descripción entre 70 y 160: por debajo desaprovecha el espacio, por
 *   encima se corta. El corte real es por anchura en píxeles, no por
 *   letras, así que 160 es el borde prudente, no una frontera exacta.
 * Los dos son criterio, no física: si cambian, se cambian AQUÍ y se
 * explica por qué, en vez de ir dejando excepciones sueltas.
 *
 * ── Por qué el 404 queda fuera de casi todas las reglas ───────────────
 * No queda fuera por ser el 404: queda fuera porque se declara
 * `noindex`, y a una página que pide no ser indexada no se le puede
 * exigir la ficha con la que se presentaría en un buscador. La guarda lo
 * comprueba página a página — el día que alguien le quite el `noindex`,
 * empieza a exigírsela sin que haya que tocar nada aquí.
 *
 * Uso:  node scripts/metadatos.mjs out
 */
import { readFileSync, globSync, existsSync } from "node:fs";

/* Acepta tanto `out` como `--serve out`: seis de estas guardas levantan
   un servidor y usan la segunda forma, y confundirlas reventaba con una
   traza de Node sobre un directorio llamado «--serve». */
const dir = process.argv.slice(2).find((a) => !a.startsWith("-")) || "out";
if (!existsSync(dir)) {
  console.log(`[metadatos] no encuentro el directorio «${dir}». ¿Falta compilar el sitio con \`npm run build\`?`);
  process.exit(1);
}
/* El sitio cuelga de un subdirectorio en GitHub Pages, así que el
   canónico que se escribe en el HTML lleva ese prefijo y la ruta del
   fichero no. Sin descontarlo, las 168 páginas parecerían mal. */
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
    /* Next escribe el atributo en camelCase —`hrefLang`—, que el HTML
       normaliza a minúsculas al analizarlo. Buscarlo sin `i` daba 168
       páginas «sin hreflang» que lo tenían delante. */
    alternos: [...html.matchAll(/<link rel="alternate"[^>]*hreflang="([^"]*)"[^>]*href="([^"]*)"/gi)].map((m) => ({ idioma: m[1], destino: m[2] })),
    jsonld: (html.match(/application\/ld\+json/g) || []).length,
    lang: saca(html, /<html[^>]*\blang="([^"]*)"/),
    noindex: /<meta name="robots" content="[^"]*noindex/.test(html),
  };
});

const rutasQueExisten = new Set(paginas.map((p) => p.ruta.replace(/\/$/, "") || "/"));

const fallos = [];
const anota = (regla, ruta, detalle) => fallos.push({ regla, ruta, detalle });

/* Sólo las que piden ser indexadas responden por su ficha. */
const indexables = paginas.filter((p) => !p.noindex);

for (const p of paginas) {
  const esperado = p.ruta === "/en/" || p.ruta.startsWith("/en/") ? "en" : "es";
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
  /* Un hreflang que apunta a una página inexistente es peor que no
     ponerlo: el buscador sigue el enlace, se come un 404, y deja de
     fiarse del resto del grupo de idiomas. */
  for (const a of p.alternos) {
    const destino = a.destino.replace(/^https?:\/\/[^/]+/, "").replace(new RegExp(`^${PREFIJO}`), "") || "/";
    if (!rutasQueExisten.has(destino.replace(/\/$/, "") || "/"))
      anota("hreflang que apunta a una página que no existe", p.ruta, `hreflang="${a.idioma}" → ${destino}`);
  }
  if (p.jsonld === 0) anota("sin datos estructurados", p.ruta, "ningún bloque ld+json");
}

/* Dos páginas indexables con el mismo título o la misma descripción se
   canibalizan en el buscador: compiten por la misma consulta y ninguna
   gana. Las no indexables pueden repetirse libremente. */
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

/* El sitio tiene 84 páginas por idioma. Si esta guarda encuentra un
   puñado, no es que todo esté bien: es que está mirando un `out/` viejo,
   vacío o a medio compilar, y una guarda que no mira nada aprueba
   siempre. */
if (paginas.length < 100) {
  console.log(`[metadatos] sólo ${paginas.length} páginas: se esperaban más de 150. ¿Está compilado el sitio?`);
  process.exit(1);
}
if (fallos.length) {
  console.log(`[metadatos] ${fallos.length} problema(s) en la ficha con la que el sitio se presenta fuera`);
  process.exit(1);
}
console.log("[metadatos] correcto — cada página se presenta con su propia ficha, entera y del tamaño que cabe");
