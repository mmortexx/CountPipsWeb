import { describe, expect, it } from "vitest";
import {
  computeExpectedMaxLossStreak,
  computeMetrics,
  heatmap,
  monthlyBreakdown,
  TRADES,
  type Trade,
} from "@/lib/trading/data";
import { computeEdge, buildPeriodRows } from "@/components/demo/pages/AnalyticsPage";
import { FACTOR_SIN_PERDIDAS, fmtFactor } from "@/lib/trading/format";
import { mulberry32 } from "@/lib/trading/azar";

function op(id: number, netPnl: number, fecha: string, rMultiple = netPnl > 0 ? 1 : -1): Trade {
  const closedAt = new Date(fecha);
  return {
    id, instrument: "ES", setup: "Breakout", direction: "long", session: "NY", entry: 100, exit: 101, qty: 1,
    grossPnl: netPnl, fees: 0, netPnl, rMultiple, riskUsd: 100, plannedRr: 2, mae: -1, mfe: 1, initialStop: 99,
    target: 102, compliance: "yes", openedAt: closedAt, closedAt, durationMin: 60, dayScore: 3, entryNote: "", closeNote: "",
  };
}

describe("drawdown máximo en porcentaje", () => {
  it("es el mayor porcentaje, aunque la mayor caída en dólares llegue después y pese menos", () => {
    // De 10.000 a 9.000 (−10 %, 1.000 $); luego a 30.000 y a 28.500 (−5 %, 1.500 $).
    const m = computeMetrics([
      op(1, -1000, "2026-01-05T10:00:00Z"),
      op(2, 21000, "2026-01-06T10:00:00Z"),
      op(3, -1500, "2026-01-07T10:00:00Z"),
    ]);
    expect(m.maxDrawdown).toBe(1500);
    expect(m.maxDrawdownPct).toBeCloseTo(0.1, 10);
  });

  it("la Analítica enseña el mismo máximo en el KPI y en la tabla de periodos", () => {
    const ops = TRADES.filter((t) => t.instrument === "EURUSD");
    const historico = buildPeriodRows(ops).find((f) => f.label === "Histórico")!;
    expect(computeMetrics(ops).maxDrawdownPct * 100).toBeCloseTo(historico.maxDdPct, 6);
  });
});

describe("factor de beneficio sin pérdidas", () => {
  const ganadoras = [op(1, 200, "2026-01-05T10:00:00Z"), op(2, 150, "2026-01-06T10:00:00Z")];

  it("no es el neto en dólares: 350 $ de ganancia no son un factor de 350", () => {
    expect(computeMetrics(ganadoras).profitFactor).toBe(FACTOR_SIN_PERDIDAS);
  });

  it("toda la demo usa la misma convención", () => {
    expect(buildPeriodRows(ganadoras).at(-1)!.profitFactor).toBe(FACTOR_SIN_PERDIDAS);
  });

  it("se escribe como infinito, y un factor normal con sus decimales", () => {
    expect(fmtFactor(FACTOR_SIN_PERDIDAS, "es")).toBe("∞");
    expect(fmtFactor(1.64, "es")).toBe("1,64");
    expect(fmtFactor(1.64, "en")).toBe("1.64");
    expect(fmtFactor(0, "es")).toBe("0,00");
  });
});

describe("veredicto de ventaja de la Analítica", () => {
  // 40 operaciones de −0,02 R de media y dispersión baja: el límite inferior queda por encima de −0,1.
  const ops = Array.from({ length: 40 }, (_, i) =>
    op(i + 1, i % 2 ? 8 : -12, `2026-01-${String((i % 28) + 1).padStart(2, "0")}T10:00:00Z`, i % 2 ? 0.08 : -0.12)
  );

  it("con media negativa no dice que «apunta en la dirección correcta»", () => {
    const e = computeEdge(ops, "es");
    expect(e.expectancyR).toBeLessThan(0);
    expect(e.verdict).toBe("Sin ventaja");
  });

  it("con media positiva y el intervalo tocando el cero sí es sugerente", () => {
    const positivas = ops.map((t, i) => ({ ...t, rMultiple: i % 2 ? 0.14 : -0.1, netPnl: i % 2 ? 14 : -10 }));
    expect(computeEdge(positivas, "es").verdict).toBe("Sugerente");
  });
});

describe("racha máxima de pérdidas esperada", () => {
  it("con 100 monedas al aire sale la mediana simulada, no una más", () => {
    expect(computeExpectedMaxLossStreak(50, 100)).toBe(6);
    expect(computeExpectedMaxLossStreak(55, 100)).toBe(5);
    expect(computeExpectedMaxLossStreak(40, 200)).toBe(9);
  });

  it("en una rejilla de aciertos y muestras no se aparta más de una de la mediana simulada", () => {
    const azar = mulberry32(7);
    const peorRacha = (acierto: number, n: number) => {
      let racha = 0;
      let peor = 0;
      for (let i = 0; i < n; i++) {
        racha = azar() < acierto ? 0 : racha + 1;
        peor = Math.max(peor, racha);
      }
      return peor;
    };
    for (const acierto of [30, 40, 50, 60, 70])
      for (const n of [50, 100, 300, 1000]) {
        const sim = Array.from({ length: 1001 }, () => peorRacha(acierto / 100, n)).sort((a, b) => a - b);
        expect(Math.abs(computeExpectedMaxLossStreak(acierto, n) - sim[500])).toBeLessThanOrEqual(1);
      }
  });

  it("los extremos siguen acotados", () => {
    expect(computeExpectedMaxLossStreak(100, 100)).toBe(0);
    expect(computeExpectedMaxLossStreak(0, 100)).toBe(100);
    expect(computeExpectedMaxLossStreak(50, 1)).toBe(1);
  });
});

describe("agregados por calendario", () => {
  it("enero de dos años distintos no se suma en un mismo mes", () => {
    const filas = monthlyBreakdown([op(1, 300, "2026-01-20T10:00:00Z"), op(2, -5000, "2027-01-20T10:00:00Z")]);
    expect(filas).toEqual([
      { month: "Ene 26", pnl: 300 },
      { month: "Ene 27", pnl: -5000 },
    ]);
  });

  it("dentro de un solo año el mes no lleva año, y siguen en orden", () => {
    expect(monthlyBreakdown([op(1, 1, "2026-03-02T10:00:00Z"), op(2, 2, "2026-01-02T10:00:00Z")], "en").map((f) => f.month)).toEqual(["Jan", "Mar"]);
  });

  it("el mapa de calor no pierde lo operado en fin de semana: suma el neto entero", () => {
    const suma = heatmap(TRADES).flat().reduce((s, v) => s + v, 0);
    expect(suma).toBeCloseTo(computeMetrics(TRADES).netPnl, 2);
  });
});
