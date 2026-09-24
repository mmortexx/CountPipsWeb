import { describe, expect, it } from "vitest";
import { proyectaCapital, LIMITE_PROYECCION_USD } from "../src/lib/trading/proyeccion";

/**
 * Con win rate 80 %, ganancia media 6 R, pérdida media 0,25 R, riesgo 3 %,
 * 600 operaciones/año, sin fricción, 10 años e interés compuesto, el motor
 * mensual multiplica el balance por un factor tan grande cada mes que se
 * desborda a Infinity antes de terminar la simulación. Son valores que se
 * alcanzan con los propios deslizadores de la herramienta (todos dentro de
 * sus límites), no un caso forzado desde fuera.
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
    // Si esto empezara a pasar (finalBalance finito y por debajo del
    // límite) sin que `fueraDeEscala` avisara, sería porque alguien
    // clampó el crecimiento por dentro sin decirlo — justo lo prohibido.
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
