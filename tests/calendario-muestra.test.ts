import { describe, expect, it } from "vitest";
import { getCal, getSetups } from "@/lib/trading/fixtures";
import { TRADES } from "@/lib/trading/data";

const CRIPTO = new Set(["BTC/USDT", "ETH/USDT"]);
const AHORA = new Date("2026-07-16T18:00:00Z");

/* El calendario de /features ponía el 1 de julio de 2026 en sábado y
   terminaba en el 30: el desfase iba escrito a mano, y con él salían
   operaciones en fin de semana. */
describe("el calendario de muestra es un mes de verdad", () => {
  const { cells, label } = getCal();
  const dias = cells.filter((c) => c.day !== "");

  it("julio de 2026 empieza en miércoles y tiene 31 días", () => {
    expect(label.es).toBe("julio 2026");
    const primero = cells.findIndex((c) => c.day === "1");
    expect(primero % 7).toBe((new Date(Date.UTC(2026, 6, 1)).getUTCDay() + 6) % 7);
    expect(dias.map((c) => Number(c.day))).toEqual(Array.from({ length: 31 }, (_, i) => i + 1));
  });

  it("las semanas van completas", () => {
    expect(cells.length % 7).toBe(0);
  });
});

/* El generador repartía los cierres por los 180 días sin mirar el
   calendario: 58 de 200 caían en sábado o domingo, con el índice, el
   oro o el EURUSD cerrados. Sólo la cripto cotiza el fin de semana. */
/* La ficha de playbooks era una maqueta con +2,1R por operación. Ahora
   sale de la muestra, y su titular promete «cuáles no»: tiene que haber
   alguno que no dé ventaja. */
describe("los setups de /features son los de la muestra", () => {
  const setups = getSetups();

  it("cubren todas las operaciones, de mejor a peor", () => {
    expect(setups.reduce((s, x) => s + x.n, 0)).toBe(TRADES.length);
    const r = setups.map((s) => s.expectativaR);
    expect(r).toEqual([...r].sort((a, b) => b - a));
  });

  it("hay alguno con ventaja y alguno sin ella, en cifras creíbles", () => {
    expect(setups.some((s) => s.expectativaR > 0)).toBe(true);
    expect(setups.some((s) => s.expectativaR <= 0)).toBe(true);
    expect(setups.every((s) => Math.abs(s.expectativaR) < 1)).toBe(true);
  });
});

describe("la muestra no opera con el mercado cerrado", () => {
  it("ningún cierre en fin de semana salvo cripto", () => {
    const enFinde = TRADES.filter(
      (t) => [0, 6].includes(t.closedAt.getUTCDay()) && !CRIPTO.has(t.instrument)
    );
    expect(enFinde.map((t) => t.closedAt.toISOString().slice(0, 10))).toEqual([]);
  });

  it("mover la fecha no toca el sorteo: mismas operaciones, mismo resultado", () => {
    expect(TRADES).toHaveLength(200);
    expect(TRADES.reduce((s, t) => s + t.netPnl, 0).toFixed(2)).toBe("6807.72");
    expect(TRADES.every((t) => t.closedAt.getTime() <= AHORA.getTime())).toBe(true);
  });
});
