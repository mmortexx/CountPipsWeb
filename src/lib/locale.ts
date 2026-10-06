import type { Lang } from "@/lib/i18n";

/**
 * Rutas fijas que existen en inglés: de esta lista dependen los enlaces que
 * se prefijan con `/en`, las páginas de `app/en/**` y el sitemap. El español
 * va sin prefijo (son las direcciones ya indexadas) y el inglés lleva `/en`.
 *
 * Las fichas de glosario y herramientas no se listan: se cubren por familia
 * (`FAMILIAS_EN`) para no cargar el glosario entero en el JavaScript de todas
 * las páginas; su lista completa vive en `rutas-en.ts`. Un enlace a una ruta
 * que no esté aquí se queda en español en vez de dar un 404.
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
 * ¿Existe una versión en inglés de esta ruta (sin query ni hash)? La barra
 * final no decide: la lista va sin ella y «/faq/» debe casar igual.
 * `scripts/enlaces.mjs` caza en el sitio compilado un enlace que se quede en español.
 */
export function tieneVersionEn(pathnameLimpio: string): boolean {
  const ruta = pathnameLimpio.length > 1 ? pathnameLimpio.replace(/\/+$/, "") || "/" : pathnameLimpio;
  if (LOCALIZED_SET.has(ruta)) return true;
  return FAMILIAS_EN.some(
    (f) => ruta.length > f.length && ruta.startsWith(f) && !ruta.includes("/", f.length),
  );
}

/**
 * `/en/pricing` → `/pricing`, `/en` → `/`; el resto, sin tocar. La usan
 * `LanguageProvider` (destino al cambiar de idioma) y `Navbar` (ruta activa).
 */
export function sinPrefijoEn(pathname: string): string {
  if (pathname === "/en") return "/";
  if (pathname.startsWith("/en/")) return pathname.slice(3) || "/";
  return pathname;
}

/**
 * Antepone `/en` a una dirección interna si el idioma es inglés y la ruta
 * tiene versión inglesa; en cualquier otro caso la devuelve tal cual.
 * Separa `hash` y `query` antes de decidir y los reconstruye después.
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
