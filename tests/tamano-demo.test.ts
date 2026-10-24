import { describe, expect, it } from "vitest";
import { tamanoParaRiesgo } from "@/lib/trading/plan";
import { INITIAL_BALANCE_CONST, INSTRUMENTS, getInstrumentMultiplier, seNegociaEnEnteros } from "@/lib/trading/data";

describe("«Calcular tamaño» de la demo: contratos y acciones enteros, nunca por encima del riesgo pedido", () => {
  it("acciones y futuros van hacia abajo: 65,79 acciones son 65, no 66 ni 65,79", () => {
    expect(tamanoParaRiesgo(100, 1.52, 1, true)).toBe(65);
    expect(tamanoParaRiesgo(1000, 43.2, 50, true)).toBe(0);
    expect(tamanoParaRiesgo(1000, 15, 50, true)).toBe(1);
  });

  it("lo que no cabe en una unidad da 0, no una fracción de contrato", () => {
    expect(tamanoParaRiesgo(100, 43.2, 50, true)).toBe(0);
    expect(tamanoParaRiesgo(99.99, 2, 50, true)).toBe(0);
  });

  it("un múltiplo exacto no pierde una unidad por la coma flotante", () => {
    expect(tamanoParaRiesgo(100, 2, 50, true)).toBe(1);
    expect(tamanoParaRiesgo(300, 2, 50, true)).toBe(3);
    expect(tamanoParaRiesgo(0.3, 0.1, 1, true)).toBe(3);
  });

  it("cripto y forex conservan su fracción", () => {
    expect(tamanoParaRiesgo(100, 520, 1, false)).toBeCloseTo(100 / 520, 12);
    expect(tamanoParaRiesgo(100, 0.0086, 100_000, false)).toBeCloseTo(100 / 860, 12);
  });

  it("entradas sin sentido dan 0", () => {
    for (const [riesgo, dist, mult] of [[100, 0, 1], [100, -1, 1], [100, Number.NaN, 1], [0, 1, 1], [-5, 1, 1], [100, 1, 0], [100, Number.POSITIVE_INFINITY, 1]]) {
      expect(tamanoParaRiesgo(riesgo, dist, mult, true), `${riesgo} ${dist} ${mult}`).toBe(0);
      expect(tamanoParaRiesgo(riesgo, dist, mult, false), `${riesgo} ${dist} ${mult}`).toBe(0);
    }
  });

  it("qué instrumentos de la demo van en unidades enteras: acciones, futuros y el crudo CL; no cripto, forex ni oro al contado", () => {
    const enteros = INSTRUMENTS.filter(seNegociaEnEnteros).map((i) => i.symbol);
    expect(enteros).toEqual(["AAPL", "ES", "NQ", "CL", "GER40"]);
  });

  it("CL, aunque su clase sea materia prima, sale en contratos enteros", () => {
    const cl = INSTRUMENTS.find((i) => i.symbol === "CL")!;
    const dist = cl.basePrice * 0.008;
    const q = tamanoParaRiesgo(10_000, dist, getInstrumentMultiplier(cl.symbol, cl.assetClass), seNegociaEnEnteros(cl));
    expect(q).toBe(Math.floor(q));
    expect(q).toBeGreaterThan(0);
  });

  it("con las acciones y futuros de la demo, el tamaño entero nunca arriesga más del 1 % de la cuenta", () => {
    const riesgo = INITIAL_BALANCE_CONST * 0.01;
    for (const i of INSTRUMENTS.filter(seNegociaEnEnteros)) {
      const dist = i.basePrice * 0.008;
      const q = tamanoParaRiesgo(riesgo, dist, getInstrumentMultiplier(i.symbol, i.assetClass), true);
      expect(Number.isInteger(q), i.symbol).toBe(true);
      expect(q * dist * getInstrumentMultiplier(i.symbol, i.assetClass), i.symbol).toBeLessThanOrEqual(riesgo + 1e-9);
    }
  });
});
