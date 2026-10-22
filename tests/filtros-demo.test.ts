import { describe, expect, it } from "vitest";
import { TRADES, type Compliance } from "@/lib/trading/data";
import { filtraOperaciones, pasaCumplimiento } from "@/lib/trading/filtros";

const TODOS = { instrument: "all", setup: "all", direction: "all", compliance: "all" } as const;

describe("filtro de cumplimiento de la demo (Analítica y Operaciones)", () => {
  it.each(["yes", "partial", "no"] as const)("«%s» deja exactamente las operaciones de ese nivel", (nivel: Compliance) => {
    const esperadas = TRADES.filter((t) => t.compliance === nivel);
    expect(esperadas.length).toBeGreaterThan(0);
    expect(filtraOperaciones(TRADES, { ...TODOS, compliance: nivel })).toEqual(esperadas);
    expect(TRADES.filter((t) => pasaCumplimiento(t.compliance, nivel))).toEqual(esperadas);
  });

  it("«todas» no quita nada", () => {
    expect(filtraOperaciones(TRADES, TODOS)).toEqual(TRADES);
  });
});
