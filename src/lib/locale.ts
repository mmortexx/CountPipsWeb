import type { Lang } from "@/lib/i18n";

/**
 * Las rutas que existen en inglés, y la única lista de la que dependen
 * tres cosas distintas: qué enlaces se prefijan con `/en`, qué páginas
 * genera `app/en/**`, y qué entradas dobla el mapa del sitio.
 *
 * ── Por qué español va sin prefijo e inglés lleva `/en` ────────────────
 * El mercado principal es español, así que se queda en la raíz —son las
 * direcciones que ya está indexando el buscador— e inglés entra como
 * añadido. Es el patrón habitual cuando un sitio ya tiene un idioma
 * establecido y suma el segundo, frente al patrón simétrico
 * `/es/...` + `/en/...` que tiene más sentido cuando ningún idioma es
 * "el de siempre".
 *
 * ── El glosario y las herramientas se añaden solos ─────────────────────
 * Sus 51 + 6 páginas ya tenían texto en inglés en los datos —igual que el
 * resto del sitio—; lo único que faltaba era la dirección `/en/...` de
 * cada una (`app/en/glosario/[termino]`, `app/en/herramientas/
 * [herramienta]`). Con esas rutas ya creadas, esta lista las deriva de
 * `TERMINOS`/`HERRAMIENTAS` en vez de copiarlas a mano: si mañana se
 * añade un término o una herramienta, el selector de idioma, el mapa del
 * sitio y `app/en/**` crecen con él sin que nadie tenga que acordarse de
 * tocar tres sitios a la vez.
 *
 * La lista completa vive en `rutas-en.ts`, no aquí: este módulo lo carga
 * cada página (barra, enlaces) y derivarla aquí metía el glosario entero
 * en el JavaScript de todas. Aquí basta con saber que toda ficha de
 * glosario o herramienta tiene su versión inglesa.
 *
 * Mientras tanto, un enlace hacia una ruta que NO está en esta lista se
 * queda en español aunque se pulse desde una página en inglés — es la
 * `/faq` real, no una `/en/faq` que no existe. Volver a la sesión en
 * español al tocar algo aún no traducido es preferible a un 404.
 */
export const RUTAS_FIJAS_EN: readonly string[] = [
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
  "/herramientas",
];

const LOCALIZED_SET = new Set(RUTAS_FIJAS_EN);
const FAMILIAS_EN = ["/glosario/", "/herramientas/"];

/**
 * ¿Existe una versión en inglés de esta ruta (sin query ni hash)?
 *
 * LA BARRA FINAL NO PUEDE DECIDIR EL IDIOMA. Esta lista está escrita sin
 * ella —«/faq»—, y la comparación es de texto, así que un enlace escrito
 * «/faq/» no encajaba y se quedaba en español: el visitante inglés que
 * pulsaba «More questions?» en la página de precios acababa en la FAQ
 * española. Un solo carácter, en la página que más importa vender.
 *
 * El arreglo va aquí y no en el enlace porque el que falla es este
 * criterio: mientras compare cadenas, cualquiera que mañana escriba la
 * barra volverá a caer igual y en silencio. `scripts/enlaces.mjs` recorre
 * el sitio compilado y lo caza si vuelve a pasar.
 */
export function tieneVersionEn(pathnameLimpio: string): boolean {
  const ruta = pathnameLimpio.length > 1 ? pathnameLimpio.replace(/\/+$/, "") || "/" : pathnameLimpio;
  if (LOCALIZED_SET.has(ruta)) return true;
  return FAMILIAS_EN.some(
    (f) => ruta.length > f.length && ruta.startsWith(f) && !ruta.includes("/", f.length),
  );
}

/**
 * `/en/pricing` → `/pricing`. `/en` → `/`. Cualquier otra ruta, sin
 * tocar — ya está en español.
 *
 * La usan `LanguageProvider` (para saber a dónde navegar al cambiar de
 * idioma) y `Navbar` (para comparar la ruta activa sin que el prefijo
 * `/en` haga que ningún enlace se marque como activo estando en inglés).
 * Una sola función, no dos copias que puedan desincronizarse.
 */
export function sinPrefijoEn(pathname: string): string {
  if (pathname === "/en") return "/";
  if (pathname.startsWith("/en/")) return pathname.slice(3) || "/";
  return pathname;
}

/**
 * Antepone `/en` a una dirección interna cuando el idioma activo es
 * inglés Y esa dirección tiene versión en inglés. En cualquier otro caso
 * —español, dirección externa, `mailto:`, ancla suelta, o una ruta sin
 * traducir— la devuelve tal cual.
 *
 * Separa el `hash` y la `query` antes de decidir, y los reconstruye
 * después: un enlace como `/terminos#no-advice` no tiene versión en
 * inglés porque `/terminos` no la tiene, así que se queda intacto con su
 * ancla — nunca se prefija solo la mitad de la dirección.
 */
export function withLocale(href: string, lang: Lang): string {
  if (lang !== "en") return href;
  if (!href.startsWith("/") || href.startsWith("//")) return href; // externa o relativa al protocolo
  if (href.startsWith("/en") ) return href; // ya está en inglés (cubre "/en" y "/en/…")
  if (href.startsWith("#")) return href; // ancla pura de la misma página

  const hashIdx = href.indexOf("#");
  const hash = hashIdx >= 0 ? href.slice(hashIdx) : "";
  const sinHash = hashIdx >= 0 ? href.slice(0, hashIdx) : href;
  const qIdx = sinHash.indexOf("?");
  const query = qIdx >= 0 ? sinHash.slice(qIdx) : "";
  const path = qIdx >= 0 ? sinHash.slice(0, qIdx) : sinHash;

  if (!tieneVersionEn(path)) return href;

  const prefijada = path === "/" ? "/en" : `/en${path}`;
  return `${prefijada}${query}${hash}`;
}
