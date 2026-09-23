import { describe, expect, it } from "vitest";
import {
  crecimientoPorOperacion,
  gananciaParaRecuperar,
  operacionesParaRecuperar,
} from "@/lib/trading/recuperacion";

describe("recuperación de una caída", () => {
  it("la asimetría: 20 % pide 25 %, 50 % pide 100 %, 90 % pide 900 %", () => {
    expect(gananciaParaRecuperar(0.2)).toBeCloseTo(0.25, 12);
    expect(gananciaParaRecuperar(0.5)).toBeCloseTo(1, 12);
    expect(gananciaParaRecuperar(0.9)).toBeCloseTo(9, 12);
    expect(gananciaParaRecuperar(0)).toBe(0);
  });

  it("el número de operaciones es el primero que vuelve al máximo, no uno antes", () => {
    const [d, r, p, b] = [0.2, 0.01, 0.45, 2];
    const n = operacionesParaRecuperar(d, r, p, b)!;
    const capital = (k: number) => (1 - d) * (1 + r * b) ** (p * k) * (1 - r) ** ((1 - p) * k);
    expect(n).toBe(66);
    expect(capital(n)).toBeGreaterThanOrEqual(1);
    expect(capital(n - 1)).toBeLessThan(1);
  });

  it("sin ventaja el camino típico no vuelve: esperanza cero ya pierde en la mediana", () => {
    expect(crecimientoPorOperacion(0.01, 0.5, 1)!).toBeLessThan(0);
    expect(operacionesParaRecuperar(0.1, 0.01, 0.5, 1)).toBeNull();
    expect(operacionesParaRecuperar(0.1, 0.01, 0.3, 1)).toBeNull();
  });

  it("sin caída no hace falta ninguna operación", () => {
    expect(operacionesParaRecuperar(0, 0.01, 0.45, 2)).toBe(0);
  });

  it("entradas imposibles devuelven null, nunca NaN ni Infinity", () => {
    expect(gananciaParaRecuperar(1)).toBeNull();
    expect(gananciaParaRecuperar(-0.1)).toBeNull();
    expect(gananciaParaRecuperar(Number.NaN)).toBeNull();
    expect(crecimientoPorOperacion(0, 0.5, 2)).toBeNull();
    expect(crecimientoPorOperacion(1, 0.5, 2)).toBeNull();
    expect(crecimientoPorOperacion(0.01, 1.2, 2)).toBeNull();
    expect(crecimientoPorOperacion(0.01, 0.5, 0)).toBeNull();
    expect(operacionesParaRecuperar(1, 0.01, 0.45, 2)).toBeNull();
    expect(operacionesParaRecuperar(0.2, Number.POSITIVE_INFINITY, 0.45, 2)).toBeNull();

    for (const d of [0, 0.01, 0.5, 0.99]) {
      for (const r of [0.0025, 0.01, 0.05]) {
        for (const p of [0, 0.2, 0.5, 0.8, 1]) {
          for (const b of [0.5, 1, 5]) {
            const n = operacionesParaRecuperar(d, r, p, b);
            if (n !== null) expect(Number.isFinite(n) && n >= 0).toBe(true);
          }
        }
      }
    }
  });
});
