import { describe, expect, it } from "vitest";
import { anchoMono, ladoRotuloSalida, type VelaPx } from "@/components/charts/TradeCandleChart";

// Velas cada 5 px, como en un móvil: el rótulo abarca muchas. `y` crece hacia abajo.
const serie = (centros: number[]): VelaPx[] => centros.map((y, i) => ({ x: 10 + i * 5, alto: y - 4, bajo: y + 4 }));
const ANCHO = anchoMono("Salida −1,18 R");

describe("ladoRotuloSalida", () => {
  it("sube el rótulo cuando las velas de antes caen justo debajo de la salida", () => {
    // Tendencia que sube hasta la vela 26: las anteriores quedan más abajo en pantalla.
    const velas = serie(Array.from({ length: 35 }, (_, i) => (i <= 26 ? 200 - i * 3 : 120)));
    expect(ladoRotuloSalida(velas, 26, ANCHO, "middle", 1.5, 300)).toBe("encima");
  });

  it("lo deja debajo cuando debajo está libre", () => {
    // Tendencia que baja hasta la salida: debajo no hay nada.
    const velas = serie(Array.from({ length: 35 }, (_, i) => (i <= 26 ? 100 + i * 3 : 180)));
    expect(ladoRotuloSalida(velas, 26, ANCHO, "middle", 1.5, 300)).toBe("debajo");
  });

  it("con los dos lados libres, se queda debajo", () => {
    const velas = serie(Array.from({ length: 35 }, () => 150));
    expect(ladoRotuloSalida(velas, 26, ANCHO, "middle", 1.5, 300)).toBe("debajo");
  });

  it("no lo saca del lienzo aunque debajo pise velas", () => {
    // Tendencia que sube hasta pegarse al borde de arriba: encima no cabe.
    const velas = serie(Array.from({ length: 35 }, (_, i) => (i <= 26 ? 200 - i * 6.5 : 31)));
    expect(ladoRotuloSalida(velas, 26, ANCHO, "middle", 1.5, 300)).toBe("debajo");
  });
});
