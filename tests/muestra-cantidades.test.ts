import { describe, expect, it } from "vitest";
import { computeMetrics, getInstrumentMultiplier, INSTRUMENTS, seNegociaEnEnteros, TRADES } from "@/lib/trading/data";
import { reparteCantidad } from "@/components/demo/pages/TradeDetailPage";
import { fmtCantidad } from "@/lib/trading/format";

const inst = (s: string) => INSTRUMENTS.find((i) => i.symbol === s)!;
const mult = (s: string) => getInstrumentMultiplier(s, inst(s).assetClass);
/** Lo que mueve la cuenta medio tick de precio, con la cantidad de la operación. */
const medioTick = (t: { instrument: string; qty: number }) => (inst(t.instrument).tickSize / 2) * t.qty * mult(t.instrument);

describe("las ejecuciones del detalle", () => {
  it("una cantidad entera solo se reparte en enteros y un contrato no se reparte", () => {
    expect(reparteCantidad(1, 0.6)).toBeNull();
    expect(reparteCantidad(5, 0.6)).toBe(3);
    expect(reparteCantidad(50, 0.5)).toBe(25);
    expect(reparteCantidad(0.154, 0.5)).toBe(0.077);
    expect(reparteCantidad(0.001, 0.5)).toBeNull();
  });

  it("la cantidad se escribe sin ceros de relleno", () => {
    expect(fmtCantidad(1, "es")).toBe("1");
    expect(fmtCantidad(0.15, "es")).toBe("0,15");
    expect(fmtCantidad(1200, "en")).toBe("1,200");
    expect(fmtCantidad(0.005, "en")).toBe("0.005");
  });
});

describe("la cantidad de cada operación de la muestra cuadra con sus precios", () => {
  it("contratos y acciones en enteros, y nunca cero", () => {
    for (const t of TRADES) {
      expect(t.qty).toBeGreaterThan(0);
      if (seNegociaEnEnteros(inst(t.instrument))) expect(Number.isInteger(t.qty), `${t.instrument} ${t.qty}`).toBe(true);
    }
  });

  it("distancia al stop × cantidad × multiplicador es el riesgo, salvo el redondeo al tick", () => {
    for (const t of TRADES) {
      const riesgo = Math.abs(t.entry - t.initialStop) * t.qty * mult(t.instrument);
      expect(Math.abs(riesgo - t.riskUsd), `${t.instrument} nº ${t.id}: ${riesgo} frente a ${t.riskUsd}`).toBeLessThanOrEqual(medioTick(t) + 0.01);
    }
  });

  it("recorrido de entrada a salida × cantidad × multiplicador es el bruto, salvo el redondeo al tick", () => {
    for (const t of TRADES) {
      const lado = t.direction === "long" ? 1 : -1;
      const bruto = (t.exit - t.entry) * lado * t.qty * mult(t.instrument);
      expect(Math.abs(bruto - t.grossPnl), `${t.instrument} nº ${t.id}: ${bruto} frente a ${t.grossPnl}`).toBeLessThanOrEqual(medioTick(t) + 0.01);
    }
  });

  it("los precios caen en el tick del instrumento y el stop y el objetivo a su lado", () => {
    for (const t of TRADES) {
      const { tickSize } = inst(t.instrument);
      for (const precio of [t.entry, t.exit, t.initialStop, t.target]) {
        const enTicks = precio / tickSize;
        expect(Math.abs(enTicks - Math.round(enTicks)), `${t.instrument} ${precio}`).toBeLessThan(1e-6);
      }
      if (t.direction === "long") {
        expect(t.initialStop).toBeLessThan(t.entry);
        expect(t.target).toBeGreaterThan(t.entry);
      } else {
        expect(t.initialStop).toBeGreaterThan(t.entry);
        expect(t.target).toBeLessThan(t.entry);
      }
    }
  });

  it("no todas las operaciones de un instrumento entran al mismo precio", () => {
    for (const { symbol } of INSTRUMENTS) {
      const entradas = new Set(TRADES.filter((t) => t.instrument === symbol).map((t) => t.entry));
      expect(entradas.size, symbol).toBeGreaterThan(3);
    }
  });

  it("las cifras de la muestra no se mueven por ello", () => {
    expect(computeMetrics(TRADES).netPnl).toBeCloseTo(6807.72, 2);
  });
});
