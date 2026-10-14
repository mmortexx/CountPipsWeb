/**
 * Precios previstos de lanzamiento: fuente única de las cifras, para que la
 * web no diga dos precios. No son una oferta; donde aparecen van con
 * `SelloPrevisto`. Con una pasarela de pago, la fuente pasará a ser el
 * catálogo real.
 */

import type { Lang } from "./locale";
import { deFr, LOCALE_FECHA, fmtInt } from "./trading/format";

/** Dólares, pago único del plan Core. */
export const PRECIO_CORE = 149;

/** Dólares, pago único del plan Pro. */
export const PRECIO_PRO = 249;

/**
 * Dólares por euro del tipo de referencia del BCE, para la equivalencia
 * aproximada de la tarjeta de precios. Es orientativa: se revisa a mano.
 */
export const USD_POR_EUR = 1.1551;
export const FECHA_TIPO_EUR = "2026-09-14";

export const aproxEur = (usd: number) => Math.round(usd / USD_POR_EUR);

/* Solo en los idiomas de la zona euro: el inglés lee dólares y el portugués
   de la web es el de Brasil. */
const AL_CAMBIO: Partial<Record<Lang, (mes: string) => string>> = {
  es: (mes) => `al cambio de ${mes}`,
  fr: (mes) => `au taux de change ${deFr(mes)}`,
  de: (mes) => `zum Wechselkurs vom ${mes}`,
  it: (mes) => `al cambio di ${mes}`,
};

/** «≈ 129 € al cambio de septiembre de 2026», o `null` donde no se enseña. */
export function equivalenciaEur(usd: number, lang: Lang): string | null {
  const frase = AL_CAMBIO[lang];
  if (!frase) return null;
  const mes = new Date(FECHA_TIPO_EUR).toLocaleDateString(LOCALE_FECHA[lang], { month: "long", year: "numeric", timeZone: "UTC" });
  return `≈\u00a0${fmtInt(aproxEur(usd), lang)}\u00a0€ ${frase(mes)}`;
}

/** Meses de suscripción que cuestan lo mismo que el pago único, y si caben en el horizonte elegido. */
export function amortizacion(precio: number, mensual: number, anios: number) {
  const meses = precio > 0 && mensual > 0 ? Math.ceil(precio / mensual) : null;
  return { meses, dentro: meses !== null && meses <= anios * 12 };
}
