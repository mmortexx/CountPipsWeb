import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push() {}, replace() {} }) }));

import { TRADES, computeMetrics } from "@/lib/trading/data";
import { customTradeToTrade } from "@/lib/trading/demoStore";
import { sliceMetricsByDays } from "@/components/demo/pages/DashboardPage";

// Lo que registra el visitante se fecha hoy, meses después de la muestra
// (termina en julio de 2026). El Resumen tiene que seguir teniendo sentido.

const registrada = (netPnl: number) =>
  customTradeToTrade({
    id: 1, instrument: "ES", setup: "Breakout", direction: "long", entry: 5800, exit: 5790, qty: 1, netPnl,
    rMultiple: -1, compliance: "yes", closedAt: "2026-10-24T10:00:00.000Z", note: "",
  });

describe("el Resumen con una operación registrada hoy", () => {
  it("la caída actual en porcentaje es la pérdida sobre el máximo, no los dólares", () => {
    const m = computeMetrics([...TRADES, registrada(-150)]);
    expect(m.currentDrawdown).toBeCloseTo(150, 6);
    const maximo = Math.max(...m.drawdownCeiling);
    expect(m.currentDrawdownPct).toBeCloseTo(150 / maximo, 9);
    expect(m.currentDrawdownPct).toBeLessThan(0.05);
  });

  it.each([30, 90, 180])("la ventana de %i días deja al menos dos puntos de curva", (dias) => {
    const m = sliceMetricsByDays(computeMetrics([...TRADES, registrada(-150)]), dias);
    expect(m.equityCurve.length).toBeGreaterThanOrEqual(2);
    expect(m.drawdownCeiling).toHaveLength(m.equityCurve.length);
  });
});
