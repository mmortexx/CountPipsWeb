/**
 * ENLACES: recorre el sitio compilado y comprueba que ninguna página inglesa
 * enlaza al español cuando existe la versión inglesa, que ninguna española
 * enlaza a `/en/…`, que todo enlace interno lleva a una página que existe y
 * que ningún botón de acción (`.cta`) lleva a la página en la que está.
 *
 * Se comprueba contra los ficheros de `out/`, no contra la lista de rutas del
 * código. No cuentan los recursos (`/_next/…`, imágenes, fuentes), las
 * direcciones externas, los `mailto:` ni las anclas sueltas.
 *
 * El selector de idioma, el único enlace correcto al otro idioma, no aparece
 * en el HTML estático. Si algún día lo acusa, hay que marcarlo
 * (`data-cambio-idioma`) y exceptuarlo aquí, no relajar la regla.
 *
 * Uso:  node scripts/enlaces.mjs [out]
 */
import { existsSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";

// Acepta `out` y `--serve out`, la forma de otras guardas.
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

// El `<body>` sin scripts: el payload de hidratación de Next lleva las direcciones de los dos idiomas.
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

// Un botón de acción (`.cta`) cuyo destino es la propia página no lleva a ningún sitio; las anclas (`#…`) sí son destino.
function llamadasASiMisma(html, ruta) {
  const aqui = ruta.replace(/\/+$/, "") || "/";
  const salida = [];
  for (const [etiqueta] of cuerpo(html).matchAll(/<a\b[^>]*>/g)) {
    const clase = etiqueta.match(/class="([^"]*)"/)?.[1] ?? "";
    if (!/(?:^|\s)cta(?:\s|$)/.test(clase)) continue;
    let h = etiqueta.match(/href="([^"]*)"/)?.[1] ?? "";
    if (!h.startsWith("/") || h.includes("#")) continue;
    if (PREFIJO && h.startsWith(PREFIJO)) h = h.slice(PREFIJO.length) || "/";
    if ((h.split("?")[0].replace(/\/+$/, "") || "/") === aqui) salida.push(h);
  }
  return salida;
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

  for (const h of llamadasASiMisma(html, ruta)) {
    fallos.push({ ruta, regla: "botón de acción que lleva a la misma página", detalle: h });
  }

  for (const h of enlacesInternos(html)) {
    enlaces++;
    // Enlace roto: se comprueba contra los ficheros de `out/`, que es lo que se publica.
    if (!(await existe(h))) {
      fallos.push({ ruta, regla: "enlace que no lleva a ninguna parte", detalle: `${h} — no hay página compilada ahí` });
      continue;
    }
    if (en) {
      if (h === "/en" || h.startsWith("/en/")) continue; // ya está en inglés
      // Solo es fallo si la versión inglesa existe; sin traducir, volver al español es deliberado.
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
  console.log(`[enlaces] ${fallos.length} enlace(s) con fallo`);
  console.log("[enlaces] el prefijo `/en` lo pone `withLocale(href, lang)`, en `src/lib/locale.ts`");
  process.exit(1);
}
console.log("[enlaces] correcto — todos llevan a una página que existe, y ninguno cambia de idioma por su cuenta");
