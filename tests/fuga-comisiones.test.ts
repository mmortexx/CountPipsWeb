import { describe, expect, it } from "vitest";
import { clasificaFugaComisiones } from "../src/lib/trading/fugaComisiones";

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
