import { describe, expect, it } from "vitest";
import { LENTES, mapasLente } from "@/lib/lente";

const pixel = (d: Uint8ClampedArray, w: number, x: number, y: number) => {
  const i = (y * w + x) * 4;
  return [d[i], d[i + 1], d[i + 2], d[i + 3]];
};

describe("cristal líquido: mapas de refracción y brillo", () => {
  const w = 200;
  const h = 120;
  const { desp, luz } = mapasLente(w, h, 24, LENTES.panel);

  it("el centro no desplaza ni brilla", () => {
    expect(pixel(desp, w, 100, 60)).toEqual([128, 128, 128, 255]);
    expect(pixel(luz, w, 100, 60)[3]).toBe(0);
  });

  it("el bisel empuja hacia dentro de la superficie", () => {
    const [rIzq] = pixel(desp, w, 2, 60);
    const [rDer] = pixel(desp, w, w - 3, 60);
    const [, gArriba] = pixel(desp, w, 100, 2);
    expect(rIzq).toBeGreaterThan(128);
    expect(rDer).toBeLessThan(128);
    expect(gArriba).toBeGreaterThan(128);
  });

  it("la luz entra por arriba a la izquierda", () => {
    expect(pixel(luz, w, 100, 1)[3]).toBeGreaterThan(pixel(luz, w, 100, h - 2)[3]);
    expect(pixel(luz, w, 1, 60)[3]).toBeGreaterThan(pixel(luz, w, w - 2, 60)[3]);
  });

  it("una cápsula refracta todo su contorno", () => {
    const capsula = mapasLente(400, 48, 999, LENTES.barra);
    expect(pixel(capsula.desp, 400, 200, 46)[1]).toBeLessThan(128);
    expect(pixel(capsula.desp, 400, 2, 24)[0]).toBeGreaterThan(128);
    expect(pixel(capsula.desp, 400, 200, 24)).toEqual([128, 128, 128, 255]);
  });
});
