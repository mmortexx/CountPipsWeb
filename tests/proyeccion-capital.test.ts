import { describe, expect, it } from "vitest";
import { proyectaCapital, LIMITE_PROYECCION_USD } from "../src/lib/trading/proyeccion";

/**
 * Con acierto del 80 %, ganancia media de 6 R, pérdida media de 0,25 R,
 * riesgo del 3 %, 600 operaciones al año, sin fricción, 10 años y interés
 * compuesto, el balance se desborda a Infinity antes de terminar. Son valores
 * que alcanzan los propios deslizadores, dentro de sus límites.
 */
const PARAMS_EXTREMOS = {
  startBalance: 10000,
  tradesPerYear: 600,
  winRate: 80,
  avgWinR: 6,
  avgLossR: 0.25,
  riskPct: 3,
  years: 10,
  reinvestMode: "compound" as const,
  monthlyContribution: 0,
  frictionR: 0,
};

describe("proyectaCapital", () => {
  it("con estos extremos el balance en bruto no está acotado: el crecimiento no se recorta en silencio", () => {
    const r = proyectaCapital(PARAMS_EXTREMOS);
    // Un balance finito por debajo del límite sin que avise `fueraDeEscala`
    // significaría que alguien recortó el crecimiento en silencio.
    expect(!Number.isFinite(r.finalBalance) || r.finalBalance > LIMITE_PROYECCION_USD).toBe(true);
  });

  it("marca fueraDeEscala cuando el balance proyectado deja de ser una cifra creíble", () => {
    const r = proyectaCapital(PARAMS_EXTREMOS);
    expect(r.fueraDeEscala).toBe(true);
  });

  it("con parámetros razonables no marca fueraDeEscala", () => {
    const r = proyectaCapital({
      startBalance: 10000,
      tradesPerYear: 250,
      winRate: 56,
      avgWinR: 1.5,
      avgLossR: 1.0,
      riskPct: 0.5,
      years: 3,
      reinvestMode: "compound",
      monthlyContribution: 0,
      frictionR: 0.02,
    });
    expect(r.fueraDeEscala).toBe(false);
    expect(Number.isFinite(r.finalBalance)).toBe(true);
    expect(r.finalBalance).toBeLessThan(LIMITE_PROYECCION_USD);
  });
});

const PERFIL = {
  startBalance: 10000,
  tradesPerYear: 250,
  winRate: 56,
  avgWinR: 1.5,
  avgLossR: 1.0,
  riskPct: 0.5,
  years: 5,
  reinvestMode: "compound" as const,
  monthlyContribution: 0,
  frictionR: 0.02,
};

// Mes en que la curva llega al doble del balance inicial, sin contar los ingresos.
const mesDelDoble = (r: ReturnType<typeof proyectaCapital>, inicio: number) =>
  r.monthlyPoints.find((p) => p.balance - (p.totalDeposited - inicio) >= 2 * inicio)?.month ?? null;

describe("proyectaCapital: la tasa anual mide la estrategia, no los ingresos", () => {
  it("con expectancy cero, aportar dinero no da rentabilidad", () => {
    const r = proyectaCapital({ ...PERFIL, winRate: 50, avgWinR: 1, avgLossR: 1, frictionR: 0, monthlyContribution: 1000, years: 10 });
    expect(r.cagr).toBeCloseTo(0, 10);
  });

  it("con expectancy negativa y aportes la tasa anual es negativa", () => {
    const r = proyectaCapital({ ...PERFIL, winRate: 50, avgWinR: 1, avgLossR: 1, frictionR: 0.06, riskPct: 1, monthlyContribution: 1000, years: 10 });
    expect(r.cagr).toBeLessThan(0);
  });

  it("en interés compuesto la tasa anual es la misma con y sin aportes", () => {
    const sin = proyectaCapital(PERFIL).cagr;
    const con = proyectaCapital({ ...PERFIL, monthlyContribution: 250 }).cagr;
    expect(con).toBeCloseTo(sin, 10);
  });
});

describe("proyectaCapital: el tiempo para duplicar cuadra con la curva", () => {
  for (const reinvestMode of ["compound", "linear"] as const) {
    it(`en modo ${reinvestMode} la curva cruza el doble en el mes que anuncia la casilla`, () => {
      const r = proyectaCapital({ ...PERFIL, reinvestMode, years: 10 });
      expect(r.monthsToDouble).not.toBeNull();
      expect(mesDelDoble(r, PERFIL.startBalance)).toBe(Math.ceil(r.monthsToDouble!));
    });
  }

  it("un empate con ruido de coma flotante no es ventaja ni tarda «∞ meses»", () => {
    const r = proyectaCapital({ ...PERFIL, winRate: 25, avgWinR: 0.9, avgLossR: 0.3, frictionR: 0 });
    expect(r.netExpectancyR).toBe(0);
    expect(r.hasEdge).toBe(false);
    expect(r.monthsToDouble).toBeNull();
  });

  it("el «primer año» es el año 1 de la tabla", () => {
    for (const reinvestMode of ["compound", "linear"] as const) {
      const r = proyectaCapital({ ...PERFIL, reinvestMode, monthlyContribution: 500 });
      expect(r.yearlyUsdInitial).toBeCloseTo(r.yearlyBreakdown[0].yearProfit, 6);
    }
  });
});
