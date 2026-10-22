import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { comandosDemo } from "@/components/demo/DemoCommandPalette";
import { addTrade, getCustomTrades, DEMO_TRADES_KEY } from "@/lib/trading/demoStore";

/** `localStorage` en memoria: la demo guarda ahí las operaciones propias. */
function ventanaFalsa() {
  const datos = new Map<string, string>();
  return {
    localStorage: {
      getItem: (k: string) => datos.get(k) ?? null,
      setItem: (k: string, v: string) => void datos.set(k, v),
      removeItem: (k: string) => void datos.delete(k),
    },
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

describe("paleta de la demo: «Reiniciar demo»", () => {
  beforeEach(() => vi.stubGlobal("window", ventanaFalsa()));
  afterEach(() => vi.unstubAllGlobals());

  it("borra las operaciones propias, quita los filtros y vuelve al resumen", () => {
    addTrade({
      instrument: "EURUSD", setup: "Breakout", direction: "long", entry: 1.1, exit: 1.2, qty: 1, netPnl: 100,
      rMultiple: 1, compliance: "yes", closedAt: "2026-07-01T10:00:00Z", note: "",
    });
    expect(getCustomTrades()).toHaveLength(1);

    const setPage = vi.fn();
    const clearFilters = vi.fn();
    const comandos = comandosDemo({
      setPage, clearFilters, goDetail: vi.fn(), setFilters: vi.fn(), toggleLang: vi.fn(), toggleTheme: vi.fn(),
      setPalette: vi.fn(), palette: "clasico", paletteOrder: ["clasico"], theme: "light",
    });
    comandos.find((c) => c.id === "reset-demo")!.run();

    expect(getCustomTrades()).toEqual([]);
    expect(window.localStorage.getItem(DEMO_TRADES_KEY)).toBeNull();
    expect(clearFilters).toHaveBeenCalled();
    expect(setPage).toHaveBeenLastCalledWith("dashboard");
  });
});
