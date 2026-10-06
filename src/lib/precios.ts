/**
 * Precios previstos de lanzamiento: fuente única de las cifras, para que la
 * web no diga dos precios. No son una oferta; donde aparecen van con
 * `SelloPrevisto`. Con una pasarela de pago, la fuente pasará a ser el
 * catálogo real.
 */

/** Dólares al año, plan Core. */
export const PRECIO_CORE = 149;

/** Dólares al año, plan Pro. */
export const PRECIO_PRO = 249;

/**
 * Dólares por euro del tipo de referencia del BCE, para la equivalencia
 * aproximada que se enseña en español. Es orientativa: se revisa a mano.
 */
export const USD_POR_EUR = 1.1551;
export const FECHA_TIPO_EUR = "2026-09-14";

export const aproxEur = (usd: number) => Math.round(usd / USD_POR_EUR);

/** Meses de suscripción que cuestan lo mismo que el pago único, y si caben en el horizonte elegido. */
export function amortizacion(precio: number, mensual: number, anios: number) {
  const meses = precio > 0 && mensual > 0 ? Math.ceil(precio / mensual) : null;
  return { meses, dentro: meses !== null && meses <= anios * 12 };
}
