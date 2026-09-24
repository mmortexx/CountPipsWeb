/* Catálogo de setups, aparte del generador de la muestra: quien solo
   necesita el nombre no carga las 200 operaciones. */

/**
 * Los cinco setups del catálogo, por su CLAVE — no por su rótulo.
 *
 * ── Por qué la clave está en inglés ───────────────────────────────────
 * La lista decía `["Ruptura", "Pullback", "Reversión", "Tendencia",
 * "Rango"]`: cuatro palabras españolas y una inglesa que se había
 * quedado sin traducir, y ese valor era a la vez el identificador del
 * dato, el `value` de los desplegables de filtro, la clave con la que se
 * agrupa la expectancia y el texto que se pintaba en pantalla. Las 76
 * páginas de `/en` enseñaban «Ruptura» y «Reversión» en el diario, en la
 * tabla de operaciones y en el detalle de cada una.
 *
 * Separar las dos cosas —una clave estable, un rótulo por idioma— es lo
 * que permite que el filtro siga comparando cadenas exactas mientras el
 * texto cambia con la ruta. La clave se escribe en inglés porque es el
 * idioma del vocabulario técnico del oficio (y porque «Pullback» ya lo
 * estaba), y porque una clave inglesa deja claro de un vistazo que lo
 * que se está tocando es un identificador y no una traducción.
 *
 * Nada persistido se rompe: `demoStore` guarda el diario del visitante
 * con estas mismas claves desde el momento en que se escribe, y valida
 * `typeof setup === "string"`, así que una entrada antigua sigue
 * cargando — solo deja de casar con su filtro, que es el peor caso
 * aceptable para datos de una demo sin publicar.
 */
export const SETUP_NAMES = [
  "Breakout",
  "Pullback",
  "Reversal",
  "Trend",
  "Range",
] as const;
export type SetupName = (typeof SETUP_NAMES)[number];

/** El rótulo visible de cada setup, en los dos idiomas del sitio. */
const SETUP_LABELS: Record<SetupName, { es: string; en: string }> = {
  Breakout: { es: "Ruptura", en: "Breakout" },
  Pullback: { es: "Pullback", en: "Pullback" },
  Reversal: { es: "Reversión", en: "Reversal" },
  Trend: { es: "Tendencia", en: "Trend" },
  Range: { es: "Rango", en: "Range" },
};

/**
 * El nombre de un setup tal y como debe leerse en la página.
 *
 * Acepta `string` y no solo `SetupName` porque el diario del visitante
 * se guarda en su navegador: una entrada escrita antes de este cambio
 * trae un valor que ya no está en el catálogo, y la respuesta correcta
 * es pintarlo tal cual —el dato es suyo— en vez de romper la vista.
 */
export function nombreSetup(setup: string, lang: "es" | "en"): string {
  return SETUP_LABELS[setup as SetupName]?.[lang] ?? setup;
}
