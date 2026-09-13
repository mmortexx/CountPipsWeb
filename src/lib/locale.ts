import type { Lang } from "@/lib/i18n";
import { TERMINOS } from "@/lib/glosario";
import { HERRAMIENTAS } from "@/lib/herramientas";

/**
 * Los prefijos de URL que usan los idiomas distintos al español (raíz).
 * Español va sin prefijo; el resto lleva `/{código}`.
 */
const LANG_PREFIXES = ["/en", "/fr", "/de", "/pt", "/it"] as const;

/**
 * Las rutas que existen traducidas, y la única lista de la que dependen
 * tres cosas distintas: qué enlaces se prefijan con `/{idioma}`, qué
 * páginas generan `app/{idioma}/**`, y qué entradas multiplica el mapa
 * del sitio.
 *
 * ── Por qué español va sin prefijo ─────────────────────────────────────
 * El mercado principal es español, así que se queda en la raíz —son las
 * direcciones que ya está indexando el buscador— y los demás idiomas
 * entran como añadidos. Es el patrón habitual cuando un sitio ya tiene
 * un idioma establecido y suma el resto, frente al patrón simétrico
 * `/es/...` + `/en/...` que tiene más sentido cuando ningún idioma es
 * "el de siempre".
 *
 * ── El glosario y las herramientas se añaden solos ─────────────────────
 * Sus 51 + 6 páginas ya tenían texto traducido en los datos; lo único
 * que faltaba era la dirección `/{idioma}/...` de cada una. Con esas
 * rutas ya creadas, esta lista las deriva de `TERMINOS`/`HERRAMIENTAS`
 * en vez de copiarlas a mano: si mañana se añade un término o una
 * herramienta, el selector de idioma, el mapa del sitio y `app/{lang}/**`
 * crecen con él sin que nadie tenga que acordarse de tocar varios sitios
 * a la vez.
 *
 * Mientras tanto, un enlace hacia una ruta que NO está en esta lista se
 * queda en español aunque se pulse desde una página en otro idioma — es
 * la ruta real, no una versión que no existe. Volver a español al tocar
 * algo aún no traducido es preferible a un 404.
 */
export const LOCALIZED_PATHS: readonly string[] = [
  "/",
  "/features",
  "/features/metricas",
  "/features/disciplina",
  "/features/seguridad",
  "/pricing",
  "/demo",
  "/test",
  "/about",
  "/faq",
  "/beta",
  "/traders/manual",
  "/traders/prop-firms",
  "/privacidad",
  "/cookies",
  "/terminos",
  "/aviso-legal",
  "/glosario",
  ...TERMINOS.map((t) => `/glosario/${t.slug}`),
  "/herramientas",
  ...HERRAMIENTAS.map((h) => `/herramientas/${h.slug}`),
];

const LOCALIZED_SET = new Set(LOCALIZED_PATHS);

/** ¿Existe una versión traducida de esta ruta (sin query ni hash)? */
export function tieneVersionTraducida(pathnameLimpio: string): boolean {
  return LOCALIZED_SET.has(pathnameLimpio);
}
/** @deprecated Usa `tieneVersionTraducida`. */
export const tieneVersionEn = tieneVersionTraducida;

/**
 * Quita el prefijo de idioma de cualquier ruta.
 * `/en/pricing` → `/pricing`. `/fr` → `/`. `/pricing` → `/pricing`.
 *
 * La usan `LanguageProvider` (para saber a dónde navegar al cambiar de
 * idioma) y `Navbar` (para comparar la ruta activa sin que el prefijo
 * de idioma haga que ningún enlace se marque como activo).
 * Una sola función, no copias que puedan desincronizarse.
 */
export function sinPrefijoIdioma(pathname: string): string {
  for (const prefix of LANG_PREFIXES) {
    if (pathname === prefix) return "/";
    if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length) || "/";
  }
  return pathname;
}
/** @deprecated Usa `sinPrefijoIdioma`. */
export const sinPrefijoEn = sinPrefijoIdioma;

/**
 * Antepone `/{idioma}` a una dirección interna cuando el idioma activo
 * no es español Y esa dirección tiene versión traducida. En cualquier
 * otro caso —español, dirección externa, `mailto:`, ancla suelta, o una
 * ruta sin traducir— la devuelve tal cual.
 *
 * Separa el `hash` y la `query` antes de decidir, y los reconstruye
 * después: un enlace como `/terminos#no-advice` no tiene versión
 * traducida porque `/terminos` no la tiene, así que se queda intacto
 * con su ancla — nunca se prefija sólo la mitad de la dirección.
 */
export function withLocale(href: string, lang: Lang): string {
  if (lang === "es") return href;
  if (!href.startsWith("/") || href.startsWith("//")) return href; // externa o relativa al protocolo
  /* Ya tiene prefijo de algún idioma.
     El segmento tiene que terminar AHÍ: un `startsWith` a secas hace que
     `/demo` empiece por `/de` y se dé por alemán, y lo mismo le pasaría a
     cualquier ruta que empiece por `/en`, `/fr`, `/pt` o `/it`. Es la
     misma comprobación que hace `sinPrefijoIdioma` justo arriba. */
  for (const prefix of LANG_PREFIXES) {
    if (href === prefix || href.startsWith(`${prefix}/`)) return href;
  }
  if (href.startsWith("#")) return href; // ancla pura de la misma página

  const hashIdx = href.indexOf("#");
  const hash = hashIdx >= 0 ? href.slice(hashIdx) : "";
  const sinHash = hashIdx >= 0 ? href.slice(0, hashIdx) : href;
  const qIdx = sinHash.indexOf("?");
  const query = qIdx >= 0 ? sinHash.slice(qIdx) : "";
  const path = qIdx >= 0 ? sinHash.slice(0, qIdx) : sinHash;

  if (!tieneVersionTraducida(path)) return href;

  const prefijada = path === "/" ? `/${lang}` : `/${lang}${path}`;
  return `${prefijada}${query}${hash}`;
}
