import type { Trade } from "./data";

/* «Esta selección frente al resto», como en la pantalla Operaciones de la app
   (SliceComparisonCalculator + SetupComparisonCalculator): se enfrenta lo
   filtrado a su complemento por la ventaja por operación en R, y solo se
   declara ganador si los intervalos del 95 % no se solapan. Solaparse no es
   empatar, por eso no hay veredicto de «iguales».
   La app saca el intervalo por bootstrap; aquí va la aproximación normal
   para que la demo dé siempre la misma cifra. El mínimo de muestra es el
   suyo (SignificanceCalculator.MinSample). */
export const MUESTRA_MINIMA_COMPARAR = 20;

export interface LadoComparado {
  n: number;
  expectancyR: number | null;
  icBajo: number | null;
  icAlto: number | null;
  winRate: number | null;
  pnl: number;
}

export type Veredicto = "gana-seleccion" | "gana-resto" | "solapan" | "insuficiente";

export interface Comparacion {
  seleccion: LadoComparado;
  resto: LadoComparado;
  veredicto: Veredicto;
}

function lado(trades: Trade[]): LadoComparado {
  const n = trades.length;
  const rs = trades.map((t) => t.rMultiple).filter((r) => Number.isFinite(r));
  const pnl = trades.reduce((s, t) => s + t.netPnl, 0);
  const winRate = n ? trades.filter((t) => t.netPnl > 0).length / n : null;
  if (!rs.length) return { n, expectancyR: null, icBajo: null, icAlto: null, winRate, pnl };
  const media = rs.reduce((s, r) => s + r, 0) / rs.length;
  if (rs.length < MUESTRA_MINIMA_COMPARAR) {
    return { n, expectancyR: media, icBajo: null, icAlto: null, winRate, pnl };
  }
  const varianza = rs.reduce((s, r) => s + (r - media) ** 2, 0) / (rs.length - 1);
  const margen = 1.96 * Math.sqrt(varianza / rs.length);
  return { n, expectancyR: media, icBajo: media - margen, icAlto: media + margen, winRate, pnl };
}

/** `null` cuando no hay dos grupos que enfrentar: selección vacía o que abarca todo. */
export function compararSeleccion(todas: Trade[], seleccion: Trade[]): Comparacion | null {
  const ids = new Set(seleccion.map((t) => t.id));
  const resto = todas.filter((t) => !ids.has(t.id));
  if (!seleccion.length || !resto.length) return null;
  const a = lado(seleccion);
  const b = lado(resto);
  let veredicto: Veredicto = "insuficiente";
  if (a.icBajo !== null && a.icAlto !== null && b.icBajo !== null && b.icAlto !== null) {
    veredicto = a.icBajo > b.icAlto ? "gana-seleccion" : b.icBajo > a.icAlto ? "gana-resto" : "solapan";
  }
  return { seleccion: a, resto: b, veredicto };
}
