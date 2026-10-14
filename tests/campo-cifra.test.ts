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
    expect(leeCifra(cifraEditable(1.085, "es", 4, 4), "es", 4)).toBe(1.085);
  });

  it("lo que se escribe se lee igual con coma o con punto", () => {
    expect(leeCifra("1,24", "es", 2)).toBe(1.24);
    expect(leeCifra("1.24", "en", 2)).toBe(1.24);
    expect(leeCifra(" −38,47 ", "es", 2)).toBe(-38.47);
    expect(leeCifra("-0,5", "es", 2)).toBe(-0.5);
    expect(leeCifra(",5", "es", 2)).toBe(0.5);
    expect(leeCifra("5,", "es", 2)).toBe(5);
  });

  it("lo que no es una cifra no se toma por una", () => {
    for (const t of ["", "-", ",", "1,2,3", "1.2.3", "abc", "1e5", "Infinity", "12$"]) {
      expect(leeCifra(t, "es", 2), t).toBeNull();
    }
  });

  it("ida y vuelta: lo que el campo enseña se lee como el mismo número", () => {
    for (const lang of ["es", "en"] as const) {
      for (const v of [0, 1.24, 1.085, -38.47, 20500, 0.000125, 75.2]) {
        expect(leeCifra(cifraEditable(v, lang), lang, 6)).toBe(v);
      }
    }
  });
});

describe("leeCifra según el idioma y los decimales del campo", () => {
  it("sin separadores es un entero, y el cero no sale negativo", () => {
    expect(leeCifra("0", "es", 2)).toBe(0);
    expect(leeCifra("20500", "es", 2)).toBe(20500);
    expect(leeCifra("-0", "es", 2)).toBe(0);
  });

  it("con los dos separadores, el último es el decimal, en cualquier idioma", () => {
    expect(leeCifra("25.000,50", "es", 2)).toBe(25000.5);
    expect(leeCifra("25,000.50", "en", 2)).toBe(25000.5);
    expect(leeCifra("25,000.50", "es", 2)).toBe(25000.5);
    expect(leeCifra("1.240,5", "es", 2)).toBe(1240.5);
    expect(leeCifra("25.000,", "es", 2)).toBe(25000);
    expect(leeCifra("12.34,567", "es", 2)).toBeNull();
    expect(leeCifra("1.000.5,5", "es", 2)).toBeNull();
    expect(leeCifra("25.,5", "es", 2)).toBeNull();
  });

  it("un solo separador repetido es millares si forma grupos de tres", () => {
    expect(leeCifra("1.000.000", "es", 2)).toBe(1000000);
    expect(leeCifra("1,000,000", "en", 2)).toBe(1000000);
    expect(leeCifra("1.000.000", "fr", 2)).toBe(1000000);
    expect(leeCifra("1.2.3", "es", 2)).toBeNull();
    expect(leeCifra("12.34.567", "es", 2)).toBeNull();
    expect(leeCifra("1,2,3", "en", 2)).toBeNull();
  });

  it("un separador suelto que no es de tres cifras detrás es decimal", () => {
    expect(leeCifra("1,24", "es", 2)).toBe(1.24);
    expect(leeCifra("1.24", "es", 2)).toBe(1.24);
    expect(leeCifra(",5", "es", 2)).toBe(0.5);
    expect(leeCifra("5.", "en", 2)).toBe(5);
    expect(leeCifra("0.500", "es", 2)).toBe(0.5);
    expect(leeCifra("1234.567", "es", 2)).toBe(1234.567);
    expect(leeCifra("1.0000", "es", 2)).toBe(1);
  });

  it("con tres cifras detrás, el separador de millares agrupa si el campo admite menos de tres decimales", () => {
    expect(leeCifra("10.000", "es", 2)).toBe(10000);
    expect(leeCifra("1.500", "de", 2)).toBe(1500);
    expect(leeCifra("1.500", "es", 2)).toBe(1500);
    expect(leeCifra("10,000", "en", 0)).toBe(10000);
    expect(leeCifra("1,500", "en", 2)).toBe(1500);
    expect(leeCifra("-10.000", "es", 2)).toBe(-10000);
  });

  it("con tres cifras detrás, el decimal del idioma y el francés leen decimal", () => {
    expect(leeCifra("10.000", "en", 2)).toBe(10);
    expect(leeCifra("10,000", "es", 2)).toBe(10);
    expect(leeCifra("10.000", "fr", 2)).toBe(10);
    expect(leeCifra("1.500", "fr", 2)).toBe(1.5);
  });

  it("con tres o más decimales, un precio de tres cifras sigue siendo decimal", () => {
    expect(leeCifra("151.234", "en", 3)).toBe(151.234);
    expect(leeCifra("151.234", "es", 3)).toBe(151.234);
    expect(leeCifra("1.085", "de", 5)).toBe(1.085);
    expect(leeCifra("1,085", "en", 5)).toBe(1.085);
  });

  it("los espacios y el menos tipográfico se quitan o se cambian antes de leer", () => {
    expect(leeCifra(" −10.000 ", "es", 2)).toBe(-10000);
    expect(leeCifra("1 000,5", "es", 2)).toBe(1000.5);
    expect(leeCifra("1 000,5", "es", 2)).toBe(1000.5);
    expect(leeCifra("1 000", "fr", 2)).toBe(1000);
  });

  it("lo que no es una cifra da null en cualquier idioma", () => {
    for (const t of ["", " ", "-", ",", ".", "--5", "5-", "abc", "1e5", "12$"]) {
      expect(leeCifra(t, "es", 2), t).toBeNull();
      expect(leeCifra(t, "en", 2), t).toBeNull();
    }
  });
});
