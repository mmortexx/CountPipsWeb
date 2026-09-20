/**
 * ENLACES — ¿te deja un enlace tirado en el otro idioma?
 *
 * ── Qué mide ──────────────────────────────────────────────────────────
 * Recorre el sitio compilado y comprueba una sola cosa, en las dos
 * direcciones:
 *
 *   · Ninguna página INGLESA enlaza a una ruta española que SÍ tiene
 *     versión inglesa. Si existe `/en/faq/`, un enlace a `/faq/` desde
 *     `/en/pricing/` saca al visitante de su idioma sin avisarle.
 *   · Ninguna página ESPAÑOLA enlaza a una ruta `/en/…`.
 *
 * No se comprueba contra la lista de rutas del código, sino contra los
 * FICHEROS que hay en `out/`: que exista `out/en/faq/index.html` es un
 * hecho; que la lista diga que debería existir es una intención. Si el
 * día de mañana alguien borra la página inglesa, esta guarda deja de
 * exigir el enlace —correctamente— sin que nadie tenga que tocarla.
 *
 * ── Qué encontró el día que se escribió (2026-09-20) ──────────────────
 * Un enlace: «More questions? → See full FAQ» en `/en/pricing/`, que
 * llevaba a la FAQ española. Y detrás, la causa de verdad: la función
 * que decide el idioma del destino comparaba rutas como texto, y su
 * lista dice «/faq» sin barra final, así que «/faq/» —con barra— no
 * encajaba y el enlace se quedaba en español. Un solo carácter, en la
 * página que más importa vender, y ninguna prueba lo veía.
 *
 * ── Lo que NO cuenta ──────────────────────────────────────────────────
 * Los recursos (`/_next/…`, imágenes, fuentes, manifiesto), las
 * direcciones externas, los `mailto:` y las anclas sueltas.
 *
 * ── Si algún día falla por el selector de idioma ──────────────────────
 * El selector es el único sitio donde un enlace al otro idioma es
 * correcto por definición. Hoy no aparece en el HTML estático —se
 * construye al abrirlo—, así que no hace falta excluirlo. Si un día
 * cambia y esta guarda empieza a acusarlo, la salida correcta es
 * marcarlo en el HTML (`data-cambio-idioma`) y exceptuarlo aquí, no
 * relajar la regla.
 *
 * Uso:  node scripts/enlaces.mjs [out]
 */
import { existsSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";

/* Acepta tanto `out` como `--serve out`: seis de estas guardas usan la
   segunda forma y confundirlas reventaba con una traza de Node sobre un
   directorio llamado «--serve». */
const RAIZ = process.argv.slice(2).find((a) => !a.startsWith("-")) || "out";
if (!existsSync(RAIZ)) {
  console.log(`[enlaces] no encuentro el directorio «${RAIZ}». ¿Falta compilar el sitio con \`npm run build\`?`);
  process.exit(1);
}
const PREFIJO = process.env.NEXT_PUBLIC_BASE_PATH || "";

async function* htmls(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* htmls(p);
    else if (e.name.endsWith(".html")) yield p;
  }
}

/** ¿Existe la página compilada de esta ruta? */
async function existe(ruta) {
  const limpia = ruta.replace(/^\/+|\/+$/g, "");
  for (const candidato of [join(RAIZ, limpia, "index.html"), join(RAIZ, `${limpia}.html`)]) {
    try {
      if ((await stat(candidato)).isFile()) return true;
    } catch {
      /* no está, se prueba el siguiente */
    }
  }
  return false;
}

/* El `<body>`, sin scripts: el payload de hidratación de Next lleva
   dentro las direcciones de los dos idiomas y acusaría a todas las
   páginas de todo. */
function cuerpo(html) {
  const i = html.indexOf("<body");
  const cuerpoBruto = i >= 0 ? html.slice(i) : html;
  return cuerpoBruto.replace(/<script[\s\S]*?<\/script>/gi, " ");
}

const RECURSOS = /^\/(?:_next\/|favicon|icon|apple-|manifest|robots|sitemap|opengraph|twitter)/;

function enlacesInternos(html) {
  const salida = new Set();
  for (const m of cuerpo(html).matchAll(/href="([^"]+)"/g)) {
    let h = m[1];
    if (!h.startsWith("/") || h.startsWith("//")) continue; // externa, mailto:, ancla
    if (PREFIJO && h.startsWith(PREFIJO)) h = h.slice(PREFIJO.length) || "/";
    if (RECURSOS.test(h)) continue;
    if (/\.(?:png|jpg|jpeg|webp|svg|ico|txt|xml|json|woff2?)$/i.test(h)) continue;
    salida.add(h.split("#")[0].split("?")[0] || "/");
  }
  return [...salida];
}

const fallos = [];
let paginas = 0;
let enlaces = 0;

for await (const f of htmls(RAIZ)) {
  const ruta = "/" + relative(RAIZ, f).split(sep).join("/").replace(/index\.html$/, "");
  if (ruta.startsWith("/404") || ruta.startsWith("/_not-found")) continue;
  const en = ruta === "/en/" || ruta.startsWith("/en/");
  const html = await readFile(f, "utf8");
  paginas++;

  for (const h of enlacesInternos(html)) {
    enlaces++;
    /* UN ENLACE QUE NO LLEVA A NINGUNA PARTE.
       Esto no lo vigilaba nadie. `deep_audit.mjs` prometía en su cabecera
       «inexistencia de enlaces rotos internos» y no seguía ni un enlace:
       pedía sus 64 rutas escritas a mano y comprobaba que respondieran.
       Un `href` mal escrito en una página que su lista no incluía —o a un
       destino que se renombró— daba 404 al visitante y verde en la
       auditoría. Aquí se comprueba contra los ficheros de `out/`, que es
       lo que se publica. */
    if (!(await existe(h))) {
      fallos.push({ ruta, regla: "enlace que no lleva a ninguna parte", detalle: `${h} — no hay página compilada ahí` });
      continue;
    }
    if (en) {
      if (h === "/en" || h.startsWith("/en/")) continue; // ya está en inglés
      /* Sólo es un fallo si la versión inglesa EXISTE. Un enlace a una
         página que nunca se tradujo es deliberado: volver al español es
         mejor que un 404. */
      const hermana = h === "/" ? "/en" : `/en${h}`;
      if (await existe(hermana)) {
        fallos.push({ ruta, regla: "página inglesa que enlaza al español", detalle: `${h} → existe ${hermana}` });
      }
    } else if (h === "/en" || h.startsWith("/en/")) {
      fallos.push({ ruta, regla: "página española que enlaza al inglés", detalle: h });
    }
  }
}

const porRegla = {};
for (const x of fallos) (porRegla[x.regla] ||= []).push(x);
for (const [regla, casos] of Object.entries(porRegla)) {
  console.log(`\n  ${regla} — ${casos.length} caso(s)`);
  for (const c of casos.slice(0, 8)) console.log(`     ${c.ruta}  ${c.detalle}`);
  if (casos.length > 8) console.log(`     … y ${casos.length - 8} más`);
}

console.log(`\n[enlaces] ${paginas} páginas · ${enlaces} enlaces internos revisados`);
if (fallos.length) {
  console.log(`[enlaces] ${fallos.length} enlace(s) que sacan al visitante de su idioma`);
  console.log("[enlaces] el prefijo `/en` lo pone `withLocale(href, lang)`, en `src/lib/locale.ts`");
  process.exit(1);
}
console.log("[enlaces] correcto — todos llevan a una página que existe, y ninguno cambia de idioma por su cuenta");
