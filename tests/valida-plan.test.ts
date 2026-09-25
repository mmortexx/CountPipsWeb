import { describe, expect, it } from "vitest";
import { excedeApalancamiento, TOPE_APALANCAMIENTO, validaPlan } from "../src/lib/trading/validaPlan";

/**
 * RiskCalculator daba por válido un plan cuyo objetivo cae en el MISMO lado
 * de la entrada que el stop: entrada 100, stop 105 (por encima → corto),
 * objetivo 110 (también por encima) pasaba como corto con R:R 2:1, cuando
 * un corto con el objetivo por encima del stop no es una operación posible.
 *
 * `validaPlan` exige, además de los tres positivos y distintos, que el
 * objetivo quede al lado contrario de la entrada que el stop.
 */
describe("validaPlan", () => {
  it("rechaza el objetivo que cae al mismo lado que el stop (el caso que colaba)", () => {
    const r = validaPlan(100, 105, 110);
    expect(r.valido).toBe(false);
    expect(r.motivo).toBe("lado");
  });

  it("acepta un corto correcto: stop arriba, objetivo abajo", () => {
    const r = validaPlan(100, 105, 90);
    expect(r.valido).toBe(true);
    expect(r.motivo).toBeNull();
  });

  it("acepta un largo correcto: stop abajo, objetivo arriba", () => {
    const r = validaPlan(100, 95, 115);
    expect(r.valido).toBe(true);
    expect(r.motivo).toBeNull();
  });

  it("rechaza un largo con el objetivo también por debajo de la entrada", () => {
    const r = validaPlan(100, 95, 85);
    expect(r.valido).toBe(false);
    expect(r.motivo).toBe("lado");
  });

  it("rechaza campos no positivos o no finitos antes de mirar el lado", () => {
    for (const [e, s, o] of [
      [0, 95, 115],
      [-100, 95, 115],
      [100, 0, 115],
      [100, 95, 0],
      [NaN, 95, 115],
      [100, Infinity, 115],
    ] as [number, number, number][]) {
      const r = validaPlan(e, s, o);
      expect(r.valido).toBe(false);
      expect(r.motivo).toBe("campos");
    }
  });

  it("rechaza cuando dos de los tres coinciden", () => {
    expect(validaPlan(100, 100, 110).valido).toBe(false);
    expect(validaPlan(100, 95, 100).valido).toBe(false);
    expect(validaPlan(100, 95, 95).valido).toBe(false);
  });
});

describe("excedeApalancamiento", () => {
  it("un stop a un céntimo en acciones (100×) avisa", () => {
    // 10.000 $ al 1 %: 100 $ / 0,01 $ = 10.000 acciones a 100 $ = 1.000.000 $.
    expect(excedeApalancamiento("equities", 1_000_000 / 10_000)).toBe(true);
  });

  it("dentro del tope de cada mercado no avisa, y justo en el tope tampoco", () => {
    expect(excedeApalancamiento("equities", 2)).toBe(false);
    expect(excedeApalancamiento("forex", 25)).toBe(false);
    expect(excedeApalancamiento("futures", 15)).toBe(false);
    for (const [m, tope] of Object.entries(TOPE_APALANCAMIENTO)) {
      expect(excedeApalancamiento(m as keyof typeof TOPE_APALANCAMIENTO, tope), m).toBe(false);
    }
  });

  it("lo que es normal en divisas avisa en acciones", () => {
    expect(excedeApalancamiento("forex", 20)).toBe(false);
    expect(excedeApalancamiento("equities", 20)).toBe(true);
  });

  it("sin cifra válida no avisa", () => {
    expect(excedeApalancamiento("equities", Number.NaN)).toBe(false);
    expect(excedeApalancamiento("equities", Number.POSITIVE_INFINITY)).toBe(false);
  });
});
