import { describe, expect, it } from "vitest";
import { leerEscenario, simularFondeo, type ParametrosFondeo } from "@/lib/trading/fondeo";

/** Ruina del jugador con pasos de ±1: probabilidad de subir `a` antes de bajar `b`. */
function exacta(p: number, a: number, b: number): number {
  if (p === 0.5) return b / (a + b);
  const r = (1 - p) / p;
  return (1 - r ** b) / (1 - r ** (a + b));
}

const BASE: ParametrosFondeo = {
  objetivo: 0.08,
  ddMaximo: 0.1,
  drawdown: "estatico",
  riesgo: 0.01,
  acierto: 0.55,
  payoff: 1,
  maxOperaciones: 5000,
  caminos: 6000,
  semilla: 7,
};

describe("simulación de una prueba de fondeo", () => {
  it("con pasos iguales coincide con la ruina del jugador (8 arriba, 10 abajo)", () => {
    for (const acierto of [0.45, 0.5, 0.55]) {
      const r = simularFondeo({ ...BASE, acierto })!;
      expect(Math.abs(r.aprueba - exacta(acierto, 8, 10)), `acierto ${acierto}`).toBeLessThan(0.02);
    }
  });

  it("el drawdown dinámico nunca aprueba más que el estático con la misma semilla", () => {
    for (const acierto of [0.4, 0.5, 0.6]) {
      const est = simularFondeo({ ...BASE, acierto, payoff: 2 })!;
      const din = simularFondeo({ ...BASE, acierto, payoff: 2, drawdown: "dinamico" })!;
      expect(din.aprueba).toBeLessThanOrEqual(est.aprueba);
    }
  });

  it("las tres salidas suman uno, y con pocas operaciones quedan caminos sin resolver", () => {
    const r = simularFondeo({ ...BASE, maxOperaciones: 5 })!;
    expect(r.aprueba + r.suspende + r.sinResolver).toBeCloseTo(1, 12);
    expect(r.sinResolver).toBe(1);
    expect(r.medianaAprobar).toBeNull();
  });

  it("la misma semilla da el mismo resultado", () => {
    expect(simularFondeo(BASE)).toEqual(simularFondeo(BASE));
  });

  it("un escenario compartido en la dirección se lee, se acota y se ajusta al paso", () => {
    expect(leerEscenario("?objetivo=6&dd=4&tipo=dinamico")).toEqual({ objetivo: 6, dd: 4, tipo: "dinamico" });
    expect(leerEscenario("?objetivo=99&riesgo=0.3&acierto=-5&ops=333")).toEqual({
      objetivo: 15,
      riesgo: 0.25,
      acierto: 25,
      ops: 330,
    });
    expect(leerEscenario("?objetivo=abc&dd=&tipo=raro&payoff=2.04")).toEqual({ payoff: 2 });
    expect(leerEscenario("")).toEqual({});
  });

  it("entradas imposibles devuelven null", () => {
    expect(simularFondeo({ ...BASE, ddMaximo: 1 })).toBeNull();
    expect(simularFondeo({ ...BASE, riesgo: 0 })).toBeNull();
    expect(simularFondeo({ ...BASE, acierto: 1.1 })).toBeNull();
    expect(simularFondeo({ ...BASE, payoff: Number.NaN })).toBeNull();
    expect(simularFondeo({ ...BASE, maxOperaciones: 0 })).toBeNull();
  });
});
