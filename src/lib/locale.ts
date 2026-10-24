export type Lang = "es" | "en" | "pt" | "fr" | "de" | "it";

export interface IdiomaInfo {
  readonly codigo: Lang;
  readonly prefijo: string;
  readonly htmlLang: string;
  readonly intlLocale: string;
  /** `og:locale` de Open Graph. */
  readonly ogLocale: string;
  readonly nombre: string;
  readonly code2: string;
}

/**
 * Tabla canónica de idiomas del sitio: una sola declaración para que rutas,
 * `hreflang`, sitemap, selector, `postbuild` y pruebas la lean.
 */
export const TABLA_IDIOMAS: readonly IdiomaInfo[] = [
  { codigo: "es", prefijo: "", htmlLang: "es", intlLocale: "es-ES", ogLocale: "es_ES", nombre: "Español", code2: "ES" },
  { codigo: "en", prefijo: "/en", htmlLang: "en", intlLocale: "en-US", ogLocale: "en_GB", nombre: "English", code2: "EN" },
  { codigo: "pt", prefijo: "/pt", htmlLang: "pt-BR", intlLocale: "pt-BR", ogLocale: "pt_BR", nombre: "Português", code2: "PT" },
  { codigo: "fr", prefijo: "/fr", htmlLang: "fr-FR", intlLocale: "fr-FR", ogLocale: "fr_FR", nombre: "Français", code2: "FR" },
  { codigo: "de", prefijo: "/de", htmlLang: "de-DE", intlLocale: "de-DE", ogLocale: "de_DE", nombre: "Deutsch", code2: "DE" },
  { codigo: "it", prefijo: "/it", htmlLang: "it-IT", intlLocale: "it-IT", ogLocale: "it_IT", nombre: "Italiano", code2: "IT" },
] as const;

export const IDIOMAS_NUEVOS: readonly Lang[] = ["pt", "fr", "de", "it"] as const;

/** Rutas con versión en los idiomas nuevos (solo `/` y `/pricing`). */
export const RUTAS_NUEVOS_IDIOMAS: readonly string[] = ["/", "/pricing"] as const;

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
 * ¿Existe versión de esta ruta para el idioma especificado?
 */
export function tieneVersion(pathnameLimpio: string, lang: Lang): boolean {
  if (lang === "es") return true;
  if (lang === "en") return tieneVersionEn(pathnameLimpio);
  const ruta = pathnameLimpio.length > 1 ? pathnameLimpio.replace(/\/+$/, "") || "/" : pathnameLimpio;
  return RUTAS_NUEVOS_IDIOMAS.includes(ruta);
}

export function prefijoDeIdioma(lang: Lang): string {
  const item = TABLA_IDIOMAS.find((i) => i.codigo === lang);
  return item ? item.prefijo : "";
}

/**
 * Quita el prefijo de idioma a cualquier ruta prefijada (`/en/pricing` → `/pricing`,
 * `/pt/pricing` → `/pricing`, `/en` → `/`).
 */
export function sinPrefijo(pathname: string): string {
  for (const idioma of TABLA_IDIOMAS) {
    if (!idioma.prefijo) continue;
    if (pathname === idioma.prefijo) return "/";
    if (pathname.startsWith(`${idioma.prefijo}/`)) {
      return pathname.slice(idioma.prefijo.length) || "/";
    }
  }
  return pathname;
}

/** Alias retrocompatible con la API anterior. */
export function sinPrefijoEn(pathname: string): string {
  return sinPrefijo(pathname);
}

/** La dirección de esta página en otro idioma, sin `search` ni `hash`. */
export function rutaEnIdioma(pathname: string, destino: Lang): string {
  const base = sinPrefijo(pathname);
  const prefijo = prefijoDeIdioma(destino);
  if (!prefijo) return base;
  return base === "/" ? prefijo : `${prefijo}${base}`;
}

/**
 * Devuelve la lista de idiomas disponibles para una ruta dada (los idiomas
 * que esa página tiene).
 */
export function idiomasDeRuta(pathname: string): readonly IdiomaInfo[] {
  const base = sinPrefijo(pathname);
  return TABLA_IDIOMAS.filter((i) => tieneVersion(base, i.codigo));
}

/** `og:locale` de un idioma. */
export function ogLocaleDe(lang: Lang): string {
  return TABLA_IDIOMAS.find((i) => i.codigo === lang)!.ogLocale;
}

/** `og:locale:alternate` de una ruta: los demás idiomas en que existe. */
export function localesAlternos(pathname: string, actual: Lang): string[] {
  return idiomasDeRuta(pathname).filter((i) => i.codigo !== actual).map((i) => i.ogLocale);
}

/**
 * Antepone el prefijo de idioma correspondiente a una dirección interna.
 * Si el idioma es nuevo y la página no tiene versión en ese idioma, enlaza
 * a la versión inglesa si existe (regla 7).
 */
export function withLocale(href: string, lang: Lang): string {
  if (lang === "es") return href;
  if (!href.startsWith("/") || href.startsWith("//")) return href; // externa o relativa al protocolo
  if (href.startsWith("#")) return href; // ancla pura de la misma página

  const hashIdx = href.indexOf("#");
  const hash = hashIdx >= 0 ? href.slice(hashIdx) : "";
  const sinHash = hashIdx >= 0 ? href.slice(0, hashIdx) : href;
  const qIdx = sinHash.indexOf("?");
  const query = qIdx >= 0 ? sinHash.slice(qIdx) : "";
  const path = qIdx >= 0 ? sinHash.slice(0, qIdx) : sinHash;

  for (const idioma of TABLA_IDIOMAS) {
    if (idioma.prefijo && (path === idioma.prefijo || path.startsWith(`${idioma.prefijo}/`))) {
      return href;
    }
  }

  const prefijo = prefijoDeIdioma(lang);

  if (lang === "en") {
    if (!tieneVersionEn(path)) return href;
    const prefijada = path === "/" ? "/en" : `/en${path}`;
    return `${prefijada}${query}${hash}`;
  }

  // Idioma nuevo (pt, fr, de, it):
  if (tieneVersion(path, lang)) {
    const prefijada = path === "/" ? prefijo : `${prefijo}${path}`;
    return `${prefijada}${query}${hash}`;
  }

  // Desde un idioma nuevo, lo que no tenga versión en ese idioma enlaza a la inglesa (regla 7):
  if (tieneVersionEn(path)) {
    const prefijada = path === "/" ? "/en" : `/en${path}`;
    return `${prefijada}${query}${hash}`;
  }

  return href;
}
