import { describe, expect, it } from "vitest";
import { FUTURES_CONTRACTS, PARES_FOREX, calculaPlan, fraccionesKelly, type EntradaPlan } from "@/lib/trading/plan";
import { fmtPrecio } from "@/lib/trading/format";

const par = (id: string) => PARES_FOREX.find((p) => p.id === id)!;
const futuro = (id: string) => FUTURES_CONTRACTS.find((f) => f.id === id)!;

const BASE: EntradaPlan = {
  mercado: "forex",
  balance: 10000,
  riesgoPct: 1,
  entrada: 1.085,
  stop: 1.082,
  objetivo: 1.091,
  friccion: false,
  futuro: futuro("es"),
  lote: "standard",
  par: par("EUR/USD"),
  tipoReferencia: null,
};

describe("forex: el pip y la divisa cotizada de cada par", () => {
  it("EUR/USD: 100 $ de riesgo a 30 pips son 0,33 lotes estándar", () => {
    const c = calculaPlan(BASE);
    expect(c.tamano).toBeCloseTo(0.33, 10);
    expect(c.riesgoReal).toBeCloseTo(99, 6);
    expect(c.valorPip).toBeCloseTo(3.3, 6);
  });

  it("USD/JPY: el pip es 0,01 y la cotizada son yenes: medio lote, no 0,0033", () => {
    const c = calculaPlan({ ...BASE, par: par("USD/JPY"), entrada: 150.2, stop: 149.9, objetivo: 150.8 });
    expect(c.tamano).toBeCloseTo(0.5, 10);
    expect(c.valorPip).toBeCloseTo((50000 * 0.01) / 150.2, 6);
    expect(c.riesgoReal).toBeLessThanOrEqual(100 + 1e-9);
    expect(c.riesgoReal).toBeGreaterThan(95);
  });

  it("EUR/GBP: se convierte con el GBP/USD y nunca se arriesga más de lo pedido", () => {
    const c = calculaPlan({ ...BASE, par: par("EUR/GBP"), entrada: 0.855, stop: 0.853, objetivo: 0.859, tipoReferencia: 1.27 });
    expect(c.riesgoReal).toBeLessThanOrEqual(100 + 1e-9);
    expect(c.riesgoReal).toBeGreaterThan(95);
    expect(c.nocional).toBeCloseTo((c.tamano * 100000) * 0.855 * 1.27, 6);
  });

  it("si no cabe ni un micro lote, lo dice en vez de enseñar 0,00 lotes", () => {
    const c = calculaPlan({ ...BASE, balance: 1000, riesgoPct: 0.25, stop: 1.035, objetivo: 1.185 });
    expect(c.tamano).toBe(0);
    expect(c.noCabe).toBe(true);
  });
});

describe("futuros: contratos enteros", () => {
  it("ES con 20 puntos de stop y 100 $ de riesgo no cabe; el micro sí", () => {
    const es = calculaPlan({ ...BASE, mercado: "futures", entrada: 5800, stop: 5780, objetivo: 5840, futuro: futuro("es") });
    expect(es.tamano).toBe(0);
    expect(es.noCabe).toBe(true);
    expect(futuro("es").micro).toBe("mes");
    const mes = calculaPlan({ ...BASE, mercado: "futures", entrada: 5800, stop: 5780, objetivo: 5840, futuro: futuro("mes") });
    expect(mes.tamano).toBe(1);
    expect(mes.riesgoReal).toBeCloseTo(100, 6);
  });

  it("el tamaño es siempre entero y el riesgo real nunca pasa del nominal", () => {
    for (const f of FUTURES_CONTRACTS)
      for (const riesgoPct of [0.25, 0.5, 1, 2, 3])
        for (const balance of [5000, 10000, 50000, 250000]) {
          const c = calculaPlan({ ...BASE, mercado: "futures", futuro: f, riesgoPct, balance, entrada: 100, stop: 99.5, objetivo: 101.5 });
          expect(Number.isInteger(c.tamano)).toBe(true);
          expect(c.riesgoReal).toBeLessThanOrEqual(c.riesgoNominal + 1e-9);
        }
  });
});

describe("fricción: comisión de ida y vuelta y un tick de deslizamiento", () => {
  it("dos ES: 2 × 4,50 $ de comisión y 2 × 12,50 $ de un tick", () => {
    const c = calculaPlan({ ...BASE, mercado: "futures", balance: 100000, riesgoPct: 1, entrada: 5800, stop: 5790, objetivo: 5830, futuro: futuro("es"), friccion: true });
    expect(c.tamano).toBe(2);
    expect(c.friccion).toBeCloseTo(2 * 4.5 + 2 * 12.5, 6);
    expect(c.riesgoTotal).toBeCloseTo(c.riesgoReal + c.friccion, 6);
    expect(c.beneficioNeto).toBeCloseTo(c.beneficioBruto - c.friccion, 6);
  });

  it("apagada, la fricción es cero", () => {
    expect(calculaPlan({ ...BASE, friccion: false }).friccion).toBe(0);
  });

  it("si la fricción se come el objetivo, el beneficio neto sale negativo, no cero", () => {
    const c = calculaPlan({ ...BASE, mercado: "futures", balance: 100000, entrada: 5800, stop: 5790, objetivo: 5800.25, futuro: futuro("es"), friccion: true });
    expect(c.beneficioNeto).toBeLessThan(0);
  });
});

describe("Kelly: la mitad es la mitad", () => {
  it("55 % a 3:1 da 40 %, 20 % y 10 %", () => {
    const k = fraccionesKelly(55, 3);
    expect(k.completo).toBeCloseTo(40, 10);
    expect(k.medio).toBeCloseTo(20, 10);
    expect(k.cuarto).toBeCloseTo(10, 10);
  });
  it("sin ventaja, cero", () => {
    expect(fraccionesKelly(40, 1)).toEqual({ completo: 0, medio: 0, cuarto: 0 });
    expect(fraccionesKelly(60, 0)).toEqual({ completo: 0, medio: 0, cuarto: 0 });
  });
});

describe("los precios del plan conservan sus decimales", () => {
  it("1,085 no es 1,09 y 0,000012 no es 0,00", () => {
    expect(fmtPrecio(1.085, "es")).toBe("1,085");
    expect(fmtPrecio(1.091, "en")).toBe("1.091");
    expect(fmtPrecio(0.000012, "es")).toBe("0,000012");
    expect(fmtPrecio(5800, "es")).toBe("5.800,00");
  });
});
