import { describe, expect, it } from "vitest";
import { marcasRedondas, pasoRedondo } from "@/lib/marcasEje";

describe("marcas de eje en cifras redondas", () => {
  it("el caso que se leía mal: de 0 a 3,93 M salen 1, 2 y 3 M", () => {
    expect(marcasRedondas(0, 3_930_000)).toEqual([0, 1_000_000, 2_000_000, 3_000_000]);
  });

  it("el paso siempre es 1, 2, 2,5 o 5 por una potencia de diez", () => {
    for (const rango of [0.37, 7, 13, 99, 480, 2_600, 55_555, 1.2e7]) {
      const paso = pasoRedondo(rango);
      const mantisa = paso / 10 ** Math.floor(Math.log10(paso));
      expect([1, 2, 2.5, 5]).toContain(Math.round(mantisa * 1000) / 1000);
    }
  });

  it("todas las marcas caen dentro del rango y hay entre 2 y 6", () => {
    for (const [a, b] of [[0, 11_000], [-3_200, 18_400], [9_500, 23_700], [0, 1]]) {
      const m = marcasRedondas(a, b);
      expect(m.length).toBeGreaterThanOrEqual(2);
      expect(m.length).toBeLessThanOrEqual(6);
      for (const v of m) {
        expect(v).toBeGreaterThanOrEqual(a);
        expect(v).toBeLessThanOrEqual(b);
      }
    }
  });

  it("no revienta con rangos imposibles", () => {
    expect(marcasRedondas(5, 5)).toEqual([]);
    expect(marcasRedondas(10, 2)).toEqual([]);
    expect(marcasRedondas(0, Infinity)).toEqual([]);
    expect(marcasRedondas(Number.NaN, 4)).toEqual([]);
    expect(pasoRedondo(0)).toBe(1);
  });

  it("sin errores de coma flotante en las marcas", () => {
    expect(marcasRedondas(0, 0.7)).toEqual([0, 0.2, 0.4, 0.6]);
  });
});
