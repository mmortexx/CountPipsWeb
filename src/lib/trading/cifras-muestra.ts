import { INITIAL_BALANCE_CONST, METRICS, TRADES, rankByExpectancy, weekdayBreakdown } from "@/lib/trading/data";
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

/** Las seis lecturas de «Lo que destapa el diario», ya calculadas. */
export type LecturasMuestra = {
  setup: { name: string; totalPnl: number; count: number; winRate: number };
  instrumento: { name: string; totalPnl: number; count: number };
  dia: { day: string; pnl: number };
  compliancePct: number;
  profitFactor: number;
  maxWinStreak: number;
};

export function lecturasMuestra(): LecturasMuestra {
  const s = rankByExpectancy(TRADES, (t) => t.setup)[0];
  const i = rankByExpectancy(TRADES, (t) => t.instrument)[0];
  const d = [...weekdayBreakdown(TRADES)].sort((a, b) => b.pnl - a.pnl)[0];
  return {
    setup: { name: s.name, totalPnl: s.totalPnl, count: s.count, winRate: s.winRate },
    instrumento: { name: i.name, totalPnl: i.totalPnl, count: i.count },
    dia: { day: d.day, pnl: d.pnl },
    compliancePct: METRICS.compliancePct,
    profitFactor: METRICS.profitFactor,
    maxWinStreak: METRICS.maxWinStreak,
  };
}
