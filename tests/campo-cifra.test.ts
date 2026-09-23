import { describe, expect, it } from "vitest";
import { cifraEditable, leeCifra } from "@/lib/trading/format";

describe("cifras en campos editables", () => {
  it("en español el decimal va con coma y sin millares", () => {
    expect(cifraEditable(1.24, "es")).toBe("1,24");
    expect(cifraEditable(20500, "es")).toBe("20500");
    expect(cifraEditable(-38.47, "es")).toBe("-38,47");
  });

  it("en inglés, con punto y sin millares", () => {
    expect(cifraEditable(1.24, "en")).toBe("1.24");
    expect(cifraEditable(20500.5, "en")).toBe("20500.5");
  });

  it("con decimales fijos conserva los ceros, como un precio", () => {
    expect(cifraEditable(21500, "es", 2, 2)).toBe("21500,00");
    expect(cifraEditable(1.085, "es", 4, 4)).toBe("1,0850");
    expect(cifraEditable(1.085, "en", 4, 4)).toBe("1.0850");
    expect(leeCifra(cifraEditable(1.085, "es", 4, 4))).toBe(1.085);
  });

  it("lo que se escribe se lee igual con coma o con punto", () => {
    expect(leeCifra("1,24")).toBe(1.24);
    expect(leeCifra("1.24")).toBe(1.24);
    expect(leeCifra(" −38,47 ")).toBe(-38.47);
    expect(leeCifra("-0,5")).toBe(-0.5);
    expect(leeCifra(",5")).toBe(0.5);
    expect(leeCifra("5,")).toBe(5);
  });

  it("lo que no es una cifra no se toma por una", () => {
    for (const t of ["", "-", ",", "1,2,3", "1.2.3", "1.240,5", "abc", "1e5", "Infinity", "12$"]) {
      expect(leeCifra(t), t).toBeNull();
    }
  });

  it("ida y vuelta: lo que el campo enseña se lee como el mismo número", () => {
    for (const lang of ["es", "en"] as const) {
      for (const v of [0, 1.24, 1.085, -38.47, 20500, 0.000125, 75.2]) {
        expect(leeCifra(cifraEditable(v, lang))).toBe(v);
      }
    }
  });
});
