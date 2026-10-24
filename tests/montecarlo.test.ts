import { describe, expect, it } from "vitest";
import { simulaMonteCarlo, type ParametrosMonteCarlo } from "@/lib/trading/montecarlo";
import { computeRiskOfRuin, esperanzaEnR, UMBRAL_RUINA_PCT } from "@/lib/trading/estadistica";
import { esperanzaPorOperacion } from "@/lib/trading/recuperacion";

/**
 * Con riesgo compuesto el saldo decae hacia 0 sin tocarlo nunca: la ruina es
 * tocar el umbral `UMBRAL_RUINA_PCT` del balance inicial perdido, el mismo que
 * usa la calculadora de riesgo, no llegar a 0.
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

describe("expectancy del simulador de Monte Carlo", () => {
  it("un empate exacto (40 % a 1,5 R : 1 R, 25 % a 0,9 R : 0,3 R) es cero, no 1e-16", () => {
    expect(simulaMonteCarlo({ ...BASE, winRate: 40, avgWinR: 1.5, avgLossR: 1 }).expectancyR).toBe(0);
    expect(simulaMonteCarlo({ ...BASE, winRate: 25, avgWinR: 0.9, avgLossR: 0.3 }).expectancyR).toBe(0);
  });

  it("esperanzaEnR, la fórmula que comparten las herramientas, da cero en el empate y no cambia nada más", () => {
    expect(esperanzaEnR(0.4, 1.5)).toBe(0);
    expect(esperanzaEnR(0.25, 0.9, 0.3)).toBe(0);
    expect(esperanzaEnR(0.58, 2, 1)).toBeCloseTo(0.74, 12);
    expect(esperanzaEnR(0.3, 1, 1)).toBeCloseTo(-0.4, 12);
    expect(esperanzaEnR(0.5, 1, 0.9999)).toBeCloseTo(0.00005, 12);
    expect(esperanzaPorOperacion(0.4, 1.5)).toBe(0);
  });

  it("una ventaja real se conserva con su signo", () => {
    expect(simulaMonteCarlo(BASE).expectancyR).toBeCloseTo(0.55 * 2 - 0.45, 12);
    expect(simulaMonteCarlo({ ...BASE, winRate: 30 }).expectancyR).toBeCloseTo(0.3 * 2 - 0.7, 12);
  });
});

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

// «Otra tirada» suma uno a la semilla: pasado el máximo del deslizador, vuelve a 1.
describe("la semilla da la vuelta dentro del deslizador", () => {
  it("de 1 a 50 y vuelta a 1", async () => {
    const { siguienteSemilla, SEMILLA_MAX } = await import("@/lib/trading/montecarlo");
    expect(SEMILLA_MAX).toBe(50);
    expect(siguienteSemilla(1)).toBe(2);
    expect(siguienteSemilla(49)).toBe(50);
    expect(siguienteSemilla(50)).toBe(1);
  });
});

// Con los deslizadores al máximo favorable el balance ronda 3e20.
describe("un balance que ya no es creíble se marca", () => {
  it("al máximo favorable sale fuera de escala; con los valores iniciales no", () => {
    const extremo = simulaMonteCarlo({ ...BASE, startBalance: 100_000, trades: 300, winRate: 75, avgWinR: 5, avgLossR: 0.25, riskPct: 3.5 });
    expect(extremo.fueraDeEscala).toBe(true);
    expect(simulaMonteCarlo(BASE).fueraDeEscala).toBe(false);
  });
});
