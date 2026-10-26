import { describe, expect, it } from "vitest";
import { TRADES } from "@/lib/trading/data";

// Las notas de la muestra salían a sorteo sin mirar la operación: una pérdida
// de −1,18 R decía «Salí en objetivo». Comprobación por el texto, no por el
// filtro que las elige, para que un filtro mal escrito no se dé la razón solo.
const ganadoras = TRADES.filter((t) => t.rMultiple > 0);
const perdedoras = TRADES.filter((t) => t.rMultiple < 0);

describe("notas de la muestra coherentes con su operación", () => {
  it("hay de las dos clases", () => {
    expect(ganadoras.length).toBeGreaterThan(50);
    expect(perdedoras.length).toBeGreaterThan(50);
  });

  it("ninguna perdedora cierra en objetivo, en breakeven, con trailing ni dejándola correr", () => {
    const mal = perdedoras.filter((t) => /objetivo|breakeven|trailing|Dejé correr|parcial en \+1R/i.test(t.closeNote));
    expect(mal.map((t) => `#${t.id} ${t.rMultiple}R «${t.closeNote}»`)).toEqual([]);
  });

  it("ninguna ganadora cierra con el stop cazado ni cortando pérdidas", () => {
    const mal = ganadoras.filter((t) => /Stop cazado|corté pérdidas|Stop mental/.test(t.closeNote));
    expect(mal.map((t) => `#${t.id} ${t.rMultiple}R «${t.closeNote}»`)).toEqual([]);
  });

  it("«objetivo» solo cuando la operación llegó a su RR planeado", () => {
    const mal = TRADES.filter((t) => /objetivo/i.test(t.closeNote + " " + t.entryNote) && !/parcial/.test(t.closeNote) && t.rMultiple < t.plannedRr - 0.05);
    expect(mal.map((t) => `#${t.id} ${t.rMultiple}R de ${t.plannedRr}R «${t.entryNote}» «${t.closeNote}»`)).toEqual([]);
  });

  it("la sesión, la dirección y el setup que nombra la nota son los de la operación", () => {
    const mal = TRADES.filter(
      (t) =>
        (/sesión NY/.test(t.closeNote) && t.session !== "NY") ||
        (/alcista|Doble suelo|hasta resistencia/.test(t.entryNote + t.closeNote) && t.direction !== "long") ||
        (/zona de oferta/.test(t.entryNote) && t.direction !== "short") ||
        (/Reversión no funcionó/.test(t.closeNote) && t.setup !== "Reversal")
    );
    expect(mal.map((t) => `#${t.id} ${t.direction} ${t.session} ${t.setup} «${t.entryNote}» «${t.closeNote}»`)).toEqual([]);
  });

  it("las notas cambian, las cifras no: el sorteo gasta lo mismo que antes", () => {
    expect(TRADES).toHaveLength(200);
    expect(TRADES.reduce((s, t) => s + t.netPnl, 0).toFixed(2)).toBe("6807.72");
  });
});
