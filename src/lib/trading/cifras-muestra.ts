import { INITIAL_BALANCE_CONST, METRICS } from "@/lib/trading/data";
import { getRDistribution, type RBin } from "@/lib/trading/fixtures";

/** Lo que el panel de cifras necesita de la operativa de muestra. Se calcula
 *  al construir la página y viaja ya hecho: el navegador no genera las
 *  operaciones ni descarga el código que las genera. */
export type CifrasMuestra = {
  inicial: number;
  saldos: number[];
  techos: number[];
  fechas: (number | null)[];
  bins: RBin[];
  m: Pick<typeof METRICS, "sharpe" | "sortino" | "omega" | "calmar" | "expectancyR" | "maxDrawdownPct" | "winRate" | "payoff" | "closedCount">;
};

export function cifrasMuestra(): CifrasMuestra {
  const { sharpe, sortino, omega, calmar, expectancyR, maxDrawdownPct, winRate, payoff, closedCount } = METRICS;
  return {
    inicial: INITIAL_BALANCE_CONST,
    saldos: [INITIAL_BALANCE_CONST, ...METRICS.equityCurve.map((e) => e.balance)],
    techos: [INITIAL_BALANCE_CONST, ...METRICS.drawdownCeiling],
    fechas: [null, ...METRICS.equityCurve.map((e) => e.date.getTime())],
    bins: getRDistribution(),
    m: { sharpe, sortino, omega, calmar, expectancyR, maxDrawdownPct, winRate, payoff, closedCount },
  };
}
