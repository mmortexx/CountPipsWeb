import { describe, expect, it } from "vitest";
import {
  INSTRUMENT_SPECS,
  UMBRAL_FUGA_ALTA,
  clasificaFugaComisiones,
  diagnosticoFuga,
  resultadoBrutoPorOperacion,
  ticksAUnidades,
} from "../src/lib/trading/fugaComisiones";

/**
 * Fronteras de «Se lo llevan los costes» en CommissionDragCalculator (>30 alto,
 * >15 moderado, resto bajo), en una función pura para no repetir el umbral.
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
 * Los pips se multiplican por lo que vale un pip (10 $ en EUR/USD), no por el
 * tamaño del lote (100.000). Cifras de mercado escritas a mano, no derivadas.
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

// Un objetivo inicial fuera del recorrido pinta el tirador fuera de la pista y salta al tocarlo.
describe("el objetivo de cada instrumento cabe en su deslizador", () => {
  it("el valor inicial está dentro del recorrido y sobre el paso", () => {
    const fuera: string[] = [];
    for (const i of INSTRUMENT_SPECS) {
      const { min, max, paso, inicial } = i.objetivo;
      const pasos = (inicial - min) / paso;
      if (!(min < max) || inicial < min || inicial > max || Math.abs(pasos - Math.round(pasos)) > 1e-9) fuera.push(i.id);
    }
    expect(fuera).toEqual([]);
  });

  it("el recorrido entero da un resultado por operación del orden de lo que vale el tick", () => {
    for (const i of INSTRUMENT_SPECS) {
      const ticksMax = i.objetivo.max / (i.category === "forex" ? 1 : i.tickSize);
      expect(ticksMax, i.id).toBeLessThanOrEqual(500);
      expect(ticksMax, i.id).toBeGreaterThanOrEqual(8);
    }
  });
});

describe("diagnosticoFuga: el texto dice lo mismo que la palabra", () => {
  it.each([0, 10, 15.1, 20, 25.5, 27, 30, 30.1, 45, 99])("con una fuga de %s, «alto» en el texto si y solo si en la palabra", (pct) => {
    expect(diagnosticoFuga(1000, pct) === "alto").toBe(clasificaFugaComisiones(pct) === "alto");
  });

  it("si los costes superan la ganancia, dice que la cuenta pierde", () => {
    expect(diagnosticoFuga(-1, 120)).toBe("pierde");
  });

  it("el umbral que cita el texto es el de la palabra", () => {
    expect(clasificaFugaComisiones(UMBRAL_FUGA_ALTA)).not.toBe("alto");
    expect(clasificaFugaComisiones(UMBRAL_FUGA_ALTA + 0.01)).toBe("alto");
  });
});
