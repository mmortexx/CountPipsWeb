import { describe, expect, it } from "vitest";
import { contrasteVentaja } from "@/lib/trading/estadistica";

/* La herramienta comparaba el acierto con el 50 % sin mirar el payoff y
   con un contraste de dos colas: un 35 % de aciertos con 1 R : 1 R salía
   «Ventaja sólida» mientras la expectancy de al lado decía −0,300 R. La
   hipótesis nula es el acierto de equilibrio, el que deja la expectancy
   a cero. */
describe("contrasteVentaja: ventaja frente al acierto de equilibrio", () => {
  it("un acierto por debajo del equilibrio nunca es una ventaja, por grande que sea la muestra", () => {
    expect(contrasteVentaja(200, 35, 1, 1).veredicto).toBe("sin-ventaja");
    expect(contrasteVentaja(50, 35, 1, 1).veredicto).toBe("sin-ventaja");
    const caro = contrasteVentaja(500, 75, 0.5, 3);
    expect(caro.equilibrio).toBeCloseTo(3 / 3.5, 10);
    expect(caro.veredicto).toBe("sin-ventaja");
    expect(caro.potencia).toBe(0);
    expect(caro.muestraPara(95)).toBeNull();
  });

  it("el payoff cuenta: un 40 % con 3 R : 1 R es ventaja y un 60 % con 1 R : 1 R en 20 operaciones no", () => {
    expect(contrasteVentaja(200, 40, 3, 1).veredicto).toBe("solida");
    expect(contrasteVentaja(20, 60, 1, 1).veredicto).toBe("no-significativo");
    expect(contrasteVentaja(50, 58, 2, 1).veredicto).toBe("solida");
  });

  it("la expectancy exactamente a cero no es ventaja", () => {
    expect(contrasteVentaja(500, 50, 1, 1).veredicto).toBe("sin-ventaja");
    expect(contrasteVentaja(500, 25, 0.9, 0.3).veredicto).toBe("sin-ventaja");
  });

  it("por debajo de n·p0·(1−p0) ≥ 5 la aproximación no vale y se dice", () => {
    const c = contrasteVentaja(15, 70, 1, 1);
    expect(c.minimoValido).toBe(20);
    expect(c.veredicto).toBe("muestra-insuficiente");
    expect(contrasteVentaja(20, 70, 1, 1).veredicto).not.toBe("muestra-insuficiente");
    expect(contrasteVentaja(100, 60, 5, 0.25).minimoValido).toBe(Math.ceil(5 / ((0.25 / 5.25) * (5 / 5.25))));
  });

  it("si la muestra alcanza la necesaria al 95 %, el veredicto es significativo: nunca «suficiente» junto a «no significativo»", () => {
    const contradicciones: string[] = [];
    for (let n = 5; n <= 500; n += 5)
      for (let wr = 35; wr <= 75; wr += 1)
        for (const g of [0.5, 1, 1.5, 2, 3, 5])
          for (const l of [0.25, 0.5, 1, 2, 3]) {
            const c = contrasteVentaja(n, wr, g, l);
            const necesaria = c.muestraPara(95);
            if (necesaria !== null && n >= necesaria && c.pValor >= 0.05) contradicciones.push(`${n} ops ${wr} % ${g}:${l}`);
          }
    expect(contradicciones).toEqual([]);
  });

  it("detectar un 52 % frente a un 50 % pide miles de operaciones, no 384", () => {
    const c = contrasteVentaja(390, 52, 1, 1);
    expect(c.veredicto).toBe("no-significativo");
    expect(c.muestraPara(95)).toBeGreaterThan(3000);
    expect(c.muestraPara(90)!).toBeLessThan(c.muestraPara(95)!);
    expect(c.muestraPara(95)!).toBeLessThan(c.muestraPara(99)!);
  });

  it("la potencia crece con la muestra y llega al 80 % justo en la muestra necesaria", () => {
    const n95 = contrasteVentaja(10, 60, 1, 1).muestraPara(95)!;
    const pot = (n: number) => contrasteVentaja(n, 60, 1, 1).potencia;
    expect(pot(30)).toBeLessThan(pot(100));
    expect(pot(100)).toBeLessThan(pot(300));
    expect(pot(n95)).toBeGreaterThanOrEqual(80);
    expect(pot(n95 - 1)).toBeLessThan(80);
  });
});
