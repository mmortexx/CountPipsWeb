import { describe, expect, it } from "vitest";
import { INSTRUMENT_SPECS, comisionVigente } from "@/lib/trading/fugaComisiones";

const spec = (id: string) => INSTRUMENT_SPECS.find((i) => i.id === id)!;

describe("comisión de la calculadora de costes: la que escribes se conserva al cambiar de instrumento", () => {
  it("sin comisión propia, la habitual de cada instrumento", () => {
    expect(comisionVigente(null, spec("MNQ"))).toBe(spec("MNQ").defaultCommissionRT);
    expect(comisionVigente(null, spec("ES"))).toBe(spec("ES").defaultCommissionRT);
    expect(spec("MNQ").defaultCommissionRT).not.toBe(spec("ES").defaultCommissionRT);
  });

  it("con comisión propia, la misma en cualquier instrumento", () => {
    for (const inst of INSTRUMENT_SPECS) expect(comisionVigente(2.25, inst), inst.id).toBe(2.25);
  });

  it("un cero escrito a mano es una comisión propia, no «sin comisión propia»", () => {
    expect(comisionVigente(0, spec("ES"))).toBe(0);
  });
});
