import { describe, expect, it } from "vitest";
import { computeHalfKelly } from "@/lib/trading/data";
import { kellyPct } from "@/lib/trading/estadistica";
import { fraccionesKelly } from "@/lib/trading/plan";
import { proyectaCapital, type ParametrosProyeccion } from "@/lib/trading/proyeccion";

/* La demo, la calculadora de riesgo y el proyector daban Kelly con tres
   fórmulas: sin pérdidas (payoff 0) la demo suponía payoff 1 y enseñaba
   «Medio Kelly 50 %» con solo ganadoras, y la calculadora daba 0. */
const BASE: ParametrosProyeccion = {
  startBalance: 10_000,
  tradesPerYear: 200,
  winRate: 50,
  avgWinR: 1,
  avgLossR: 1,
  riskPct: 1,
  years: 1,
  reinvestMode: "compound",
  monthlyContribution: 0,
  frictionR: 0,
};

const CASOS: [aciertoPct: number, payoff: number][] = [
  [55, 1.5],
  [40, 1],
  [50, 1],
  [100, 2],
  [100, 0],
  [0, 3],
  [60, 0],
  [35, 2.5],
];

describe("Kelly sale de una sola fórmula", () => {
  it.each(CASOS)("acierto %s, payoff %s: demo, calculadora y proyector dicen lo mismo", (acierto, payoff) => {
    const completo = kellyPct(acierto / 100, payoff);
    expect(fraccionesKelly(acierto, payoff).completo).toBeCloseTo(completo, 9);
    expect(computeHalfKelly(acierto / 100, payoff)).toBeCloseTo(completo / 2, 2);
    const avgLossR = payoff > 0 ? 1 : 0;
    const proyeccion = proyectaCapital({ ...BASE, winRate: acierto, avgWinR: payoff > 0 ? payoff : 1, avgLossR });
    expect(proyeccion.fullKellyPct).toBeCloseTo(completo, 9);
  });

  it("sin payoff medible no propone apuesta, ni con todas ganadoras", () => {
    expect(kellyPct(1, 0)).toBe(0);
    expect(kellyPct(0.6, Number.NaN)).toBe(0);
    expect(kellyPct(0.6, Infinity)).toBe(0);
    expect(computeHalfKelly(1, 0)).toBe(0);
  });

  it("los valores de referencia", () => {
    expect(kellyPct(0.55, 1.5)).toBeCloseTo(25, 9);
    expect(kellyPct(0.55, 1)).toBeCloseTo(10, 9);
    expect(kellyPct(0.4, 1)).toBe(0);
  });
});
