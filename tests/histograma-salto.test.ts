import { describe, expect, it } from "vitest";
import { saltoRotulos, rotuloCallado } from "@/components/charts/Histogram";

/* Los rótulos del eje se callaban solo por punto de ruptura (móvil). A 1024 px,
   con tres histogramas en fila, los de P&L se montaban 7 px unos sobre otros.
   Ahora el salto sale del ancho de la fila y del rótulo más largo. Se comprueba
   por geometría: el primero va anclado a la izquierda, el último a la derecha y
   el resto centrado en su columna. */
const HUECO_BARRAS = 4;
const MINIMO = 8;

function solapes(n: number, anchoFila: number, rotulo: number) {
  const s = saltoRotulos(n, anchoFila, rotulo);
  const col = (anchoFila - HUECO_BARRAS * (n - 1)) / n;
  const cajas: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    if (rotuloCallado(i, n, s)) continue;
    const centro = i * (col + HUECO_BARRAS) + col / 2;
    cajas.push(i === 0 ? [0, rotulo] : i === n - 1 ? [anchoFila - rotulo, anchoFila] : [centro - rotulo / 2, centro + rotulo / 2]);
  }
  let peor = Infinity;
  for (let k = 1; k < cajas.length; k++) peor = Math.min(peor, cajas[k][0] - cajas[k - 1][1]);
  return { s, peor, visibles: cajas.length };
}

describe("histograma: cuántos rótulos del eje caben", () => {
  it("el caso que se montaba: 10 barras de P&L en 322 px con rótulos de 38 px", () => {
    const { peor, visibles } = solapes(10, 322, 38);
    expect(peor).toBeGreaterThanOrEqual(MINIMO - 1e-6);
    expect(visibles).toBeGreaterThanOrEqual(3);
  });

  it("con sitio de sobra se pintan todos", () => {
    expect(saltoRotulos(6, 600, 30)).toBe(1);
    expect(solapes(6, 600, 30).visibles).toBe(6);
  });

  it("en cualquier ancho y número de barras, ningún par visible queda a menos de 8 px", () => {
    for (let n = 2; n <= 24; n++)
      for (let ancho = 120; ancho <= 1200; ancho += 7)
        for (const rotulo of [18, 30, 38, 52]) {
          if (rotulo * 2 + MINIMO > ancho) continue;
          const { peor } = solapes(n, ancho, rotulo);
          expect(peor, `${n} barras, ${ancho} px, rótulo ${rotulo}`).toBeGreaterThanOrEqual(MINIMO - 1e-6);
        }
  });

  it("el primero y el último se pintan siempre", () => {
    for (const s of [1, 2, 3, 5]) {
      expect(rotuloCallado(0, 10, s)).toBe(false);
      expect(rotuloCallado(9, 10, s)).toBe(false);
    }
  });
});
