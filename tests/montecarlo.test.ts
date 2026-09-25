import { describe, expect, it } from "vitest";
import { simulaMonteCarlo, type ParametrosMonteCarlo } from "@/lib/trading/montecarlo";
import { computeRiskOfRuin, UMBRAL_RUINA_PCT } from "@/lib/trading/estadistica";

/**
 * Con riesgo compuesto el saldo decae hacia 0 sin tocarlo nunca, así que
 * «ruina = saldo a 0» salía 0,0 % con la cuenta en fracciones de céntimo
 * y la fórmula de al lado en 100 %. La ruina es tocar el umbral
 * (`UMBRAL_RUINA_PCT` del balance inicial perdido), el mismo que usa la
 * calculadora de riesgo.
 */

const BASE: ParametrosMonteCarlo = {
  caminos: 300,
  startBalance: 10_000,
  trades: 100,
  winRate: 55,
  avgWinR: 2,
  avgLossR: 1,
  riskPct: 1,
  monthlyWithdrawal: 0,
  seed: 1,
};

const PEOR: ParametrosMonteCarlo = { ...BASE, trades: 300, winRate: 30, avgWinR: 0.5, avgLossR: 3, riskPct: 3.5 };

describe("ruina en el simulador de Monte Carlo", () => {
  it("la peor combinación de los deslizadores es ruina segura, en la simulación y por fórmula", () => {
    const c = simulaMonteCarlo(PEOR);
    expect(c.finalP50).toBeLessThan(1);
    expect(c.probRuin).toBe(100);
    expect(c.analyticalRuinProb).toBe(100);
  });

  it.each([
    ["base", BASE],
    ["peor", PEOR],
    ["riesgo alto", { ...BASE, riskPct: 3.5, trades: 300 }],
    ["con retiros", { ...BASE, monthlyWithdrawal: 500, trades: 300 }],
    ["acierto bajo", { ...BASE, winRate: 35, seed: 7 }],
  ] as const)("%s: todo camino que acaba bajo el umbral cuenta como ruina", (_, p) => {
    const c = simulaMonteCarlo(p);
    const suelo = p.startBalance * (1 - UMBRAL_RUINA_PCT / 100);
    const bajoElSuelo = [c.finalP5, c.finalP25, c.finalP50, c.finalP75, c.finalP95];
    const cuantil = [5, 25, 50, 75, 95];
    bajoElSuelo.forEach((v, i) => {
      if (v < suelo) expect(c.probRuin, `P${cuantil[i]} = ${v}`).toBeGreaterThanOrEqual(cuantil[i]);
    });
  });

  it("la fórmula es la misma que la de la calculadora de riesgo, con el mismo umbral", () => {
    for (const p of [BASE, { ...BASE, winRate: 45, avgWinR: 1.5, riskPct: 2 }, { ...BASE, avgLossR: 1.5, riskPct: 2.5 }]) {
      const esperado = computeRiskOfRuin(p.winRate, p.avgWinR / p.avgLossR, p.riskPct * p.avgLossR, UMBRAL_RUINA_PCT);
      expect(simulaMonteCarlo(p).analyticalRuinProb).toBeCloseTo(esperado, 2);
    }
  });
});
