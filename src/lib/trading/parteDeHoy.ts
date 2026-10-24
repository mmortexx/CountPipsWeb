import type { Lang } from "@/lib/locale";
import { fmtOperaciones } from "./format";

/** Lo que «El parte de hoy» de la demo cuenta a partir de las operaciones, las de la muestra y las que registra el visitante. */

type ConCierre = { closedAt: Date };

/** Operaciones cerradas en el día local de `ahora`. */
export function operacionesDeHoy(trades: readonly ConCierre[], ahora: Date): number {
  const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).getTime();
  const fin = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1).getTime();
  return trades.filter((tr) => tr.closedAt.getTime() >= inicio && tr.closedAt.getTime() < fin).length;
}

/** Operaciones cerradas en un día de la semana (0 = domingo). Cada operación se fecha en UTC (ver `data.ts`). */
export function operacionesDelMismoDia(trades: readonly ConCierre[], diaDeLaSemana: number): number {
  return trades.filter((tr) => tr.closedAt.getUTCDay() === diaDeLaSemana).length;
}

export function fraseOperacionesHoy(n: number, lang: Lang): string {
  const es = lang === "es";
  if (n <= 0) return es ? "Todavía no has cerrado ninguna operación hoy." : "You have not closed any trade today.";
  return es ? `Hoy has cerrado ${fmtOperaciones(n, lang)}.` : `You have closed ${fmtOperaciones(n, lang)} today.`;
}
