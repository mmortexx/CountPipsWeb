import { mulberry32 } from "./azar";
import { computeExpectedMaxLossStreak, computeRiskOfRuin, UMBRAL_RUINA_PCT } from "./estadistica";

export type ParametrosMonteCarlo = {
  caminos: number;
  startBalance: number;
  trades: number;
  winRate: number;
  avgWinR: number;
  avgLossR: number;
  riskPct: number;
  monthlyWithdrawal: number;
  seed: number;
};

/** Operaciones por mes para repartir el retiro periódico. */
const OPERACIONES_POR_MES = 20;

export function simulaMonteCarlo({
  caminos,
  startBalance,
  trades,
  winRate,
  avgWinR,
  avgLossR,
  riskPct,
  monthlyWithdrawal,
  seed,
}: ParametrosMonteCarlo) {
  const wr = winRate / 100;
  const expectancyR = wr * avgWinR - (1 - wr) * avgLossR;

  /* Ruina = perder UMBRAL_RUINA_PCT del balance inicial en algún momento,
     por pérdidas o por retiros. Con riesgo compuesto el saldo tiende a 0
     sin tocarlo, así que «saldo a 0» daba 0 % de ruina con la cuenta en
     céntimos. La fórmula es la de la calculadora de riesgo, con la pérdida
     media como unidad: payoff = ganancia / pérdida y riesgo = riesgo × pérdida. */
  const analyticalRuinProb = computeRiskOfRuin(winRate, avgWinR / avgLossR, riskPct * avgLossR, UMBRAL_RUINA_PCT);
  const sueloRuina = startBalance * (1 - UMBRAL_RUINA_PCT / 100);

  const rng = mulberry32(seed * 7919 + 1);
  const paths: number[][] = [];
  let ruinCount = 0;
  let doubleCount = 0;
  const finalBalances: number[] = [];
  const maxLossStreaks: number[] = [];

  for (let run = 0; run < caminos; run++) {
    const path: number[] = [startBalance];
    let bal = startBalance;
    let ruined = false;
    let curLossStreak = 0;
    let maxLossRun = 0;

    for (let t = 0; t < trades; t++) {
      if (bal <= 0) { ruined = true; break; }
      const r = rng();
      const riskUsd = bal * (riskPct / 100);
      if (r < wr) {
        bal += riskUsd * avgWinR;
        curLossStreak = 0;
      } else {
        bal -= riskUsd * avgLossR;
        curLossStreak++;
        maxLossRun = Math.max(maxLossRun, curLossStreak);
      }

      if ((t + 1) % OPERACIONES_POR_MES === 0 && monthlyWithdrawal > 0) {
        bal = Math.max(0, bal - monthlyWithdrawal);
      }

      if (bal <= 0) bal = 0;
      if (bal <= sueloRuina) ruined = true;
      path.push(bal);
    }
    paths.push(path);
    finalBalances.push(bal);
    maxLossStreaks.push(maxLossRun);
    if (ruined) ruinCount++;
    if (bal >= startBalance * 2) doubleCount++;
  }

  // Estadísticas por operación: P5, P25, P50 (mediana), P75, P95, media.
  const statsPerTrade: { p5: number; p25: number; p50: number; p75: number; p95: number; mean: number }[] = [];
  for (let t = 0; t <= trades; t++) {
    const vals = paths.map((p) => p[t] ?? 0).sort((a, b) => a - b);
    const idx = (q: number) => Math.min(vals.length - 1, Math.max(0, Math.floor(q * vals.length)));
    statsPerTrade.push({
      p5: vals[idx(0.05)],
      p25: vals[idx(0.25)],
      p50: vals[idx(0.50)],
      p75: vals[idx(0.75)],
      p95: vals[idx(0.95)],
      mean: vals.reduce((s, v) => s + v, 0) / vals.length,
    });
  }

  const sortedFinal = [...finalBalances].sort((a, b) => a - b);
  const idx = (q: number) => Math.min(sortedFinal.length - 1, Math.max(0, Math.floor(q * sortedFinal.length)));
  const finalP5 = sortedFinal[idx(0.05)];
  const finalP25 = sortedFinal[idx(0.25)];
  const finalP50 = sortedFinal[idx(0.50)];
  const finalP75 = sortedFinal[idx(0.75)];
  const finalP95 = sortedFinal[idx(0.95)];
  const finalMean = finalBalances.reduce((s, v) => s + v, 0) / finalBalances.length;

  const sortedStreaks = [...maxLossStreaks].sort((a, b) => a - b);
  const medianMaxLossStreak = sortedStreaks[idx(0.50)];
  const p95MaxLossStreak = sortedStreaks[idx(0.95)];

  const probRuin = (ruinCount / caminos) * 100;
  const probDouble = (doubleCount / caminos) * 100;

  return {
    expectancyR,
    statsPerTrade,
    finalP5, finalP25, finalP50, finalP75, finalP95, finalMean,
    medianMaxLossStreak,
    p95MaxLossStreak,
    theoreticalMaxLossStreak: computeExpectedMaxLossStreak(winRate, trades),
    analyticalRuinProb,
    probRuin, probDouble,
  };
}
