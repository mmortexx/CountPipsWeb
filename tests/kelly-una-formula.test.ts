import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { CifraKelly } from "@/components/demo/pages/AnalyticsPage";
import { computeHalfKelly, medioKellySeleccion } from "@/lib/trading/data";
import { kellyPct } from "@/lib/trading/estadistica";
import { fraccionesKelly } from "@/lib/trading/plan";
import { proyectaCapital, type ParametrosProyeccion } from "@/lib/trading/proyeccion";

/* La demo, la calculadora de riesgo y el proyector daban Kelly con tres
   fórmulas: sin pérdidas (payoff 0) la demo suponía payoff 1 y enseñaba
   «Medio Kelly 50 %» con solo ganadoras, y la calculadora daba 0. Sin payoff
   medible Kelly no se calcula (null): un 0 se leía «sin ventaja». */
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
    const avgLossR = payoff > 0 ? 1 : 0;
    const proyeccion = proyectaCapital({ ...BASE, winRate: acierto, avgWinR: payoff > 0 ? payoff : 1, avgLossR });
    if (completo === null) {
      expect(fraccionesKelly(acierto, payoff)).toBeNull();
      expect(computeHalfKelly(acierto / 100, payoff)).toBeNull();
      expect(proyeccion.fullKellyPct).toBeNull();
      expect(proyeccion.halfKellyPct).toBeNull();
      return;
    }
    expect(fraccionesKelly(acierto, payoff)?.completo).toBeCloseTo(completo, 9);
    expect(computeHalfKelly(acierto / 100, payoff)).toBeCloseTo(completo / 2, 2);
    expect(proyeccion.fullKellyPct).toBeCloseTo(completo, 9);
  });

  it("sin payoff medible (todo ganadoras, todo perdedoras o payoff 0) no se calcula", () => {
    expect(kellyPct(1, 2)).toBeNull();
    expect(kellyPct(0, 3)).toBeNull();
    expect(kellyPct(0.6, 0)).toBeNull();
    expect(kellyPct(0.6, Number.NaN)).toBeNull();
    expect(kellyPct(0.6, Infinity)).toBeNull();
    expect(computeHalfKelly(1, 0)).toBeNull();
  });

  it("con payoff medible y sin ventaja es 0, no null", () => {
    expect(kellyPct(0.4, 1)).toBe(0);
    expect(computeHalfKelly(40, 1)).toBe(0);
  });

  it("los valores de referencia", () => {
    expect(kellyPct(0.55, 1.5)).toBeCloseTo(25, 9);
    expect(kellyPct(0.55, 1)).toBeCloseTo(10, 9);
  });
});

describe("la demo dice por qué no hay Kelly", () => {
  it("una selección sin pérdidas o sin ganancias no calcula Kelly y nombra lo que falta", () => {
    expect(medioKellySeleccion(5, 0, 1, 0)).toEqual({ medio: null, falta: "perdidas" });
    expect(medioKellySeleccion(0, 4, 0, 0)).toEqual({ medio: null, falta: "ganancias" });
    expect(medioKellySeleccion(0, 0, 0, 0)).toEqual({ medio: null, falta: "ganancias" });
    expect(medioKellySeleccion(6, 4, 0.6, 1.5)).toEqual({ medio: computeHalfKelly(0.6, 1.5), falta: null });
  });

  it.each([
    ["es", "perdidas", "sin pérdidas aún"],
    ["en", "perdidas", "no losses yet"],
    ["es", "ganancias", "sin ganancias aún"],
    ["en", "ganancias", "no wins yet"],
  ] as const)("%s, sin %s: «—» y «%s», en color neutro", (lang, falta, nota) => {
    const html = renderToString(createElement(CifraKelly, { medio: null, falta, lang }));
    expect(html).toContain("—");
    expect(html).toContain(nota);
    expect(html).not.toMatch(/text-pnl-(warn|pos|neg)/);
  });

  it("con Kelly calculado, la cifra con su color", () => {
    const html = renderToString(createElement(CifraKelly, { medio: 12.5, falta: null, lang: "es" }));
    expect(html).toContain("12,5");
    expect(html).toContain("text-pnl-pos");
  });
});
