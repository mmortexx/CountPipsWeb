import { describe, expect, it } from "vitest";
import { compararSeleccion, MUESTRA_MINIMA_COMPARAR } from "@/lib/trading/comparacion";
import { TRADES, type Trade } from "@/lib/trading/data";

let sig = 0;
const op = (r: number): Trade => ({ ...TRADES[0], id: 10_000 + sig++, rMultiple: r, netPnl: r * 100 });
const serie = (n: number, base: number, ruido: number) =>
  Array.from({ length: n }, (_, i) => op(base + (i % 2 ? ruido : -ruido)));

describe("esta selección frente al resto", () => {
  it("sin resto o sin selección no hay comparación", () => {
    const todas = serie(30, 0.5, 0.2);
    expect(compararSeleccion(todas, todas)).toBeNull();
    expect(compararSeleccion(todas, [])).toBeNull();
  });

  it("intervalos disjuntos: gana el de arriba, sea cual sea el lado", () => {
    const buena = serie(30, 1, 0.3);
    const mala = serie(30, -0.5, 0.3);
    expect(compararSeleccion([...buena, ...mala], buena)!.veredicto).toBe("gana-seleccion");
    expect(compararSeleccion([...buena, ...mala], mala)!.veredicto).toBe("gana-resto");
  });

  it("solaparse no es empatar: medias distintas con mucho ruido siguen sin veredicto", () => {
    const a = serie(30, 0.4, 2);
    const b = serie(30, 0.1, 2);
    const c = compararSeleccion([...a, ...b], a)!;
    expect(c.seleccion.expectancyR!).toBeGreaterThan(c.resto.expectancyR!);
    expect(c.veredicto).toBe("solapan");
  });

  it("por debajo del mínimo se enseña la cifra pero no se juzga", () => {
    const corta = serie(MUESTRA_MINIMA_COMPARAR - 1, 3, 0.1);
    const larga = serie(40, -1, 0.1);
    const c = compararSeleccion([...corta, ...larga], corta)!;
    expect(c.seleccion.expectancyR).toBeCloseTo(3, 1);
    expect(c.seleccion.icBajo).toBeNull();
    expect(c.veredicto).toBe("insuficiente");
    const justa = serie(MUESTRA_MINIMA_COMPARAR, 3, 0.1);
    expect(compararSeleccion([...justa, ...larga], justa)!.veredicto).toBe("gana-seleccion");
  });

  it("recuentos, win rate y P&L de cada lado salen del complemento exacto", () => {
    const c = compararSeleccion(TRADES, TRADES.slice(0, 10))!;
    expect(c.seleccion.n + c.resto.n).toBe(TRADES.length);
    const pnl = TRADES.reduce((s, t) => s + t.netPnl, 0);
    expect(c.seleccion.pnl + c.resto.pnl).toBeCloseTo(pnl, 6);
  });
});
