import { describe, expect, it, vi } from "vitest";
import { TRADES, nombreSetup, type Trade } from "@/lib/trading/data";
import { coincideOperacion } from "@/lib/trading/filtros";
import { comandosDemo, filtraComandos } from "@/components/demo/DemoCommandPalette";

const operacion = (cambios: Partial<Trade> = {}): Trade => ({
  ...TRADES[0],
  instrument: "ES",
  setup: "Breakout",
  entryNote: "Entrada tardía tras el retroceso",
  closeNote: "Salida por objetivo",
  ...cambios,
});

describe("búsqueda de Operaciones: sin tildes, sin mayúsculas, cualquier orden", () => {
  const rotulo = "Ruptura";

  it("«tardia» encuentra «tardía»", () => {
    expect(coincideOperacion(operacion(), "tardia", rotulo)).toBe(true);
    expect(coincideOperacion(operacion(), "TARDÍA", rotulo)).toBe(true);
  });

  it("encuentra por instrumento, clave del setup, rótulo visible y notas", () => {
    for (const q of ["es", "breakout", "ruptura", "retroceso", "objetivo"]) {
      expect(coincideOperacion(operacion(), q, rotulo), q).toBe(true);
    }
  });

  it("varias palabras, en cualquier orden y repartidas entre campos", () => {
    expect(coincideOperacion(operacion(), "ruptura es", rotulo)).toBe(true);
    expect(coincideOperacion(operacion(), "retroceso  tardia", rotulo)).toBe(true);
  });

  it("lo que no está, no coincide; la consulta vacía lo deja todo", () => {
    expect(coincideOperacion(operacion(), "tardia nq", rotulo)).toBe(false);
    expect(coincideOperacion(operacion(), "zzz", rotulo)).toBe(false);
    expect(coincideOperacion(operacion(), "   ", rotulo)).toBe(true);
  });

  it("el rótulo visible con tilde se encuentra sin ella", () => {
    expect(coincideOperacion(operacion(), "reversion", "Reversión a la media")).toBe(true);
  });

  it("con la muestra de la demo, buscar el rótulo de cada setup encuentra su operación", () => {
    for (const t of TRADES.slice(0, 40)) {
      expect(coincideOperacion(t, nombreSetup(t.setup, "es"), nombreSetup(t.setup, "es")), t.setup).toBe(true);
    }
  });
});

describe("paleta de la demo: el filtro ignora tildes", () => {
  const comandos = comandosDemo({
    setPage: vi.fn(), clearFilters: vi.fn(), goDetail: vi.fn(), setFilters: vi.fn(), toggleLang: vi.fn(),
    toggleTheme: vi.fn(), setPalette: vi.fn(), palette: "clasico", paletteOrder: ["clasico"], theme: "light",
    lang: "es", confirmar: () => true,
  });
  const ids = (q: string) => filtraComandos(comandos, q).map((c) => c.id);

  it("«analitica» encuentra «Ir a Analítica»", () => {
    expect(ids("analitica")).toContain("go-analytics");
    expect(ids("ANALÍTICA")).toContain("go-analytics");
  });

  it("sigue encontrando por el rótulo en inglés y por el id", () => {
    expect(ids("analytics")).toContain("go-analytics");
    expect(ids("go-analytics")).toContain("go-analytics");
  });

  it("varias palabras en cualquier orden", () => {
    expect(ids("analitica ir")).toContain("go-analytics");
    expect(ids("fuera plan")).toContain(comandos.find((c) => c.labelEs.startsWith("Filtrar: Operaciones fuera de plan"))!.id);
  });

  it("vacío lo devuelve todo y lo inexistente, nada", () => {
    expect(filtraComandos(comandos, "  ")).toEqual(comandos);
    expect(filtraComandos(comandos, "zzzz")).toEqual([]);
  });
});
