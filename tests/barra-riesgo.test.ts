import { describe, expect, it } from "vitest";
import { tramosRiesgoBeneficio } from "../src/lib/trading/estadistica";

/**
 * La barra riesgo/beneficio de la calculadora tenía los dos tramos anclados a
 * los bordes del carril y escalados de 0 a 100. Con eso, el mayor de los dos
 * ocupaba el carril entero y tapaba al otro: con un 3:1 —100 $ de riesgo
 * frente a 300 $ de beneficio— la parte roja no se veía.
 *
 * Ahora los dos crecen desde el centro, cada uno hacia su lado, así que
 * ninguno puede pasar del 50 % y ninguno puede esconder al otro. Lo que estas
 * pruebas vigilan es justo eso: el techo del 50 %, que los dos se vean
 * siempre que valgan algo, y que la proporción entre ellos sea la del R:R.
 */
describe("Tramos de la barra riesgo/beneficio", () => {
  it("con 3:1 el riesgo ocupa la tercera parte de lo que ocupa el beneficio", () => {
    const t = tramosRiesgoBeneficio(100, 300);
    expect(t.beneficio).toBeCloseTo(50, 5);
    expect(t.riesgo).toBeCloseTo(50 / 3, 5);
    expect(t.beneficio / t.riesgo).toBeCloseTo(3, 5);
  });

  it("con el riesgo por encima del beneficio se invierten, sin caso especial", () => {
    const t = tramosRiesgoBeneficio(300, 100);
    expect(t.riesgo).toBeCloseTo(50, 5);
    expect(t.beneficio).toBeCloseTo(50 / 3, 5);
  });

  it("ninguno de los dos pasa nunca del 50 %, que es su media calle", () => {
    const casos: [number, number][] = [
      [1, 1_000_000],
      [1_000_000, 1],
      [0.01, 0.02],
      [7, 7],
      [250, 249.9],
    ];
    for (const [r, b] of casos) {
      const t = tramosRiesgoBeneficio(r, b);
      expect(t.riesgo).toBeLessThanOrEqual(50);
      expect(t.beneficio).toBeLessThanOrEqual(50);
    }
  });

  it("si los dos valen algo, los dos se ven", () => {
    const t = tramosRiesgoBeneficio(100, 300);
    expect(t.riesgo).toBeGreaterThan(0);
    expect(t.beneficio).toBeGreaterThan(0);
  });

  it("iguales dan tramos iguales", () => {
    const t = tramosRiesgoBeneficio(500, 500);
    expect(t.riesgo).toBeCloseTo(50, 5);
    expect(t.beneficio).toBeCloseTo(50, 5);
  });

  it("entradas imposibles no rompen ni devuelven basura", () => {
    for (const [r, b] of [[0, 0], [-40, 80], [NaN, 100], [100, Infinity]] as [number, number][]) {
      const t = tramosRiesgoBeneficio(r, b);
      expect(Number.isFinite(t.riesgo)).toBe(true);
      expect(Number.isFinite(t.beneficio)).toBe(true);
      expect(t.riesgo).toBeGreaterThanOrEqual(0);
      expect(t.beneficio).toBeGreaterThanOrEqual(0);
      expect(t.riesgo).toBeLessThanOrEqual(50);
      expect(t.beneficio).toBeLessThanOrEqual(50);
    }
  });
});
