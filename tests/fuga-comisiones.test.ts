import { describe, expect, it } from "vitest";
import {
  INSTRUMENT_SPECS,
  clasificaFugaComisiones,
  resultadoBrutoPorOperacion,
  ticksAUnidades,
} from "../src/lib/trading/fugaComisiones";

/**
 * «Parte de la ganancia» en CommissionDragCalculator se coloreaba rojo,
 * ámbar o verde sin ninguna palabra: mismas fronteras que ya pintaba el
 * componente (>30 alto, >15 moderado, resto bajo), ahora en una función
 * pura para no repetir el umbral suelto en dos sitios.
 */
describe("clasificaFugaComisiones", () => {
  it("por debajo de 15 es bajo", () => {
    expect(clasificaFugaComisiones(0)).toBe("bajo");
    expect(clasificaFugaComisiones(15)).toBe("bajo");
    expect(clasificaFugaComisiones(14.9)).toBe("bajo");
  });

  it("entre 15 (exclusivo) y 30 (inclusivo) es moderado", () => {
    expect(clasificaFugaComisiones(15.1)).toBe("moderado");
    expect(clasificaFugaComisiones(30)).toBe("moderado");
  });

  it("por encima de 30 es alto", () => {
    expect(clasificaFugaComisiones(30.1)).toBe("alto");
    expect(clasificaFugaComisiones(100)).toBe("alto");
  });
});

/**
 * Con EUR/USD la calculadora multiplicaba los pips por el tamaño del lote
 * (100.000) en vez de por lo que vale un pip (10 $): 15 pips con 2 lotes
 * salían 3.000.000 $ por operación. Y el equilibrio en pips salía
 * multiplicado por 0,0001. Cifras de mercado a mano, no derivadas.
 */
describe("valor del objetivo por instrumento", () => {
  const inst = (id: string) => INSTRUMENT_SPECS.find((i) => i.id === id)!;

  it.each([
    ["EURUSD", 15, 2, 300],
    ["NQ", 20, 1, 400],
    ["MNQ", 20, 2, 80],
    ["ES", 6, 1, 300],
    ["CL", 0.5, 1, 500],
    ["GC", 5, 1, 500],
  ] as const)("%s: %s unidades × %s contratos = %s $", (id, unidades, contratos, dolares) => {
    expect(resultadoBrutoPorOperacion(inst(id), unidades, contratos)).toBeCloseTo(dolares, 6);
  });

  it.each([
    ["EURUSD", 1.5, 1.5],
    ["NQ", 2, 0.5],
    ["CL", 3, 0.03],
  ] as const)("%s: %s ticks son %s unidades del objetivo", (id, ticks, unidades) => {
    expect(ticksAUnidades(inst(id), ticks)).toBeCloseTo(unidades, 9);
  });

  it("en todos los instrumentos, un tick de objetivo vale lo que vale un tick", () => {
    for (const i of INSTRUMENT_SPECS) {
      expect(resultadoBrutoPorOperacion(i, ticksAUnidades(i, 1), 1), i.id).toBeCloseTo(i.tickValue, 9);
    }
  });
});
