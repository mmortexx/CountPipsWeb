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

  const unaOperacion = () =>
    addTrade({
      instrument: "EURUSD", setup: "Breakout", direction: "long", entry: 1.1, exit: 1.2, qty: 1, netPnl: 100,
      rMultiple: 1, compliance: "yes", closedAt: "2026-07-01T10:00:00Z", note: "",
    });

  function reiniciar(confirmar: (texto: string) => boolean, lang: "es" | "en" = "es") {
    const setPage = vi.fn();
    const clearFilters = vi.fn();
    const comandos = comandosDemo({
      setPage, clearFilters, goDetail: vi.fn(), setFilters: vi.fn(), toggleLang: vi.fn(), toggleTheme: vi.fn(),
      setPalette: vi.fn(), palette: "clasico", paletteOrder: ["clasico"], theme: "light", lang, confirmar,
    });
    comandos.find((c) => c.id === "reset-demo")!.run();
    return { setPage, clearFilters };
  }

  it("con operaciones propias, si se confirma, las borra, quita los filtros y vuelve al resumen", () => {
    unaOperacion();
    const confirmar = vi.fn((_texto: string) => true);
    const { setPage, clearFilters } = reiniciar(confirmar);

    expect(confirmar).toHaveBeenCalledOnce();
    expect(getCustomTrades()).toEqual([]);
    expect(window.localStorage.getItem(DEMO_TRADES_KEY)).toBeNull();
    expect(clearFilters).toHaveBeenCalled();
    expect(setPage).toHaveBeenLastCalledWith("dashboard");
  });

  it("si no se confirma, no toca nada: borrar no se puede deshacer", () => {
    unaOperacion();
    unaOperacion();
    const confirmar = vi.fn((_texto: string) => false);
    const { setPage, clearFilters } = reiniciar(confirmar);

    expect(confirmar.mock.calls[0][0]).toMatch(/2 operaciones.*No se puede deshacer/);
    expect(getCustomTrades()).toHaveLength(2);
    expect(clearFilters).not.toHaveBeenCalled();
    expect(setPage).not.toHaveBeenCalled();
  });

  it("el aviso va en el idioma de la demo", () => {
    unaOperacion();
    const confirmar = vi.fn((_texto: string) => false);
    reiniciar(confirmar, "en");
    // Con una sola, sin el número: «deletes the 1 trade you added» no se dice.
    expect(confirmar.mock.calls[0][0]).toMatch(/deletes the trade you added.*can.t be undone/);
  });

  it("con una sola operación propia, el aviso español habla de «la operación»", () => {
    unaOperacion();
    const confirmar = vi.fn((_texto: string) => false);
    reiniciar(confirmar);
    expect(confirmar.mock.calls[0][0]).toMatch(/borra la operación que has añadido/);
  });

  it("sin operaciones propias no hay nada que perder y no pregunta", () => {
    const confirmar = vi.fn((_texto: string) => false);
    const { setPage, clearFilters } = reiniciar(confirmar);

    expect(confirmar).not.toHaveBeenCalled();
    expect(clearFilters).toHaveBeenCalled();
    expect(setPage).toHaveBeenLastCalledWith("dashboard");
  });
});
