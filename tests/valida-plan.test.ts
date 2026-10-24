import { describe, expect, it } from "vitest";
import { LIMITES } from "../src/lib/trading/limites";
import { excedeApalancamiento, TOPE_APALANCAMIENTO, validaPlan, validaRegistro } from "../src/lib/trading/validaPlan";

/**
 * `validaPlan` exige, además de tres precios positivos y distintos, que el
 * objetivo quede al lado contrario de la entrada que el stop: un corto con
 * stop y objetivo por encima de la entrada no es una operación posible.
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

describe("validaRegistro (registro rápido de la demo)", () => {
  const BUENO = { entrada: 1.1, stop: 1.09, salida: 1.12, cantidad: 2 };

  it("acepta un registro correcto tal cual", () => {
    expect(validaRegistro(BUENO)).toEqual(BUENO);
  });

  it("sin salida cierra en la entrada", () => {
    expect(validaRegistro({ ...BUENO, salida: Number.NaN })?.salida).toBe(BUENO.entrada);
  });

  it.each([0, -1.1])("una salida de %s se rechaza", (salida) => {
    expect(validaRegistro({ ...BUENO, salida })).toBeNull();
  });

  it.each([0, -3, Number.NaN])("una cantidad de %s se rechaza en vez de cambiarse por 1", (cantidad) => {
    expect(validaRegistro({ ...BUENO, cantidad })).toBeNull();
  });

  it.each([
    { entrada: 0 },
    { stop: -1 },
    { stop: BUENO.entrada },
    { entrada: Number.NaN },
  ])("entrada y stop siguen siendo obligatorios: %o", (cambio) => {
    expect(validaRegistro({ ...BUENO, ...cambio })).toBeNull();
  });

  describe("el resultado tampoco pasa del tope, aunque cada cifra esté dentro del suyo", () => {
    const max = LIMITES.precio.max;
    const EURUSD = { entrada: 1.1, stop: 1.09, salida: max, cantidad: max, multiplicador: 100_000 };

    it("EURUSD con salida y cantidad en su máximo daría ≈1e19 de P&L: se rechaza", () => {
      expect(validaRegistro(EURUSD)).toBeNull();
    });

    it("el riesgo (distancia al stop × cantidad × multiplicador) también cuenta", () => {
      expect(validaRegistro({ ...EURUSD, stop: 1, salida: 1.1 })).toBeNull();
    });

    it("la frontera: el P&L en el tope pasa y un céntimo de precio más no", () => {
      const tope = LIMITES.resultadoRegistro.max;
      const base = { entrada: 100, stop: 99, cantidad: 1000, multiplicador: 1 };
      const salidaEnElTope = 100 + tope / (base.cantidad * base.multiplicador);
      expect(validaRegistro({ ...base, salida: salidaEnElTope })).not.toBeNull();
      expect(validaRegistro({ ...base, salida: salidaEnElTope + 0.01 })).toBeNull();
    });

    it("una pérdida enorme se rechaza igual que una ganancia", () => {
      expect(validaRegistro({ ...EURUSD, salida: 0.0001 + 1e-3, cantidad: max })).toBeNull();
    });

    it("sin multiplicador cuenta 1 y un registro normal pasa", () => {
      expect(validaRegistro(BUENO)).toEqual(BUENO);
      expect(validaRegistro({ ...BUENO, multiplicador: 100_000 })).toEqual(BUENO);
    });
  });
});
