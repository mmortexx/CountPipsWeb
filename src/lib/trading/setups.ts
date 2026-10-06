/* Catálogo de setups, aparte del generador de la muestra: quien solo
   necesita el nombre no carga las 200 operaciones. */

/**
 * Los cinco setups del catálogo, por su clave, no por su rótulo. La clave es
 * el identificador del dato (filtros, agrupación de la expectancia) y va en
 * inglés, el idioma del oficio; el rótulo visible cambia con la ruta
 * (`nombreSetup`). `demoStore` valida solo `typeof setup === "string"`: una
 * entrada con una clave que ya no existe carga, pero deja de casar con su filtro.
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
 * El nombre de un setup como debe leerse en la página. Acepta `string` porque
 * el diario del visitante vive en su navegador y puede traer una clave que ya
 * no está en el catálogo: se pinta tal cual en vez de romper la vista.
 */
export function nombreSetup(setup: string, lang: "es" | "en"): string {
  return SETUP_LABELS[setup as SetupName]?.[lang] ?? setup;
}
