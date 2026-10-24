import { describe, expect, it } from "vitest";
import { leeBorrador, mensajeRango } from "@/lib/trading/campo";

describe("leeBorrador: lo escrito en un campo de cifra, contra su rango", () => {
  it("una cifra dentro del rango se acepta tal cual, límites incluidos", () => {
    expect(leeBorrador("100", "es", 2, 100, 1000)).toEqual({ tipo: "valor", valor: 100 });
    expect(leeBorrador("1000", "es", 2, 100, 1000)).toEqual({ tipo: "valor", valor: 1000 });
    expect(leeBorrador("1.000", "es", 2, 100, 1000)).toEqual({ tipo: "valor", valor: 1000 });
    expect(leeBorrador("250,5", "es", 2, 100, 1000)).toEqual({ tipo: "valor", valor: 250.5 });
    expect(leeBorrador("-0", "es", 2, 0, 10)).toEqual({ tipo: "valor", valor: 0 });
  });

  it("fuera del rango no se recorta: es inválida, también en el vecino inmediato del límite", () => {
    expect(leeBorrador("99,99", "es", 2, 100, 1000)).toEqual({ tipo: "invalida" });
    expect(leeBorrador("1000,01", "es", 2, 100, 1000)).toEqual({ tipo: "invalida" });
    expect(leeBorrador("-5", "es", 2, 0, 10)).toEqual({ tipo: "invalida" });
    expect(leeBorrador("5.000.000.000", "es", 2, 0, 1e9)).toEqual({ tipo: "invalida" });
  });

  it("lo que no es una cifra es inválida", () => {
    for (const t of ["abc", "1e5", "1.2.3", "12 USD", "--5", "5-", "Infinity"]) {
      expect(leeBorrador(t, "es", 2, 0, 1000), t).toEqual({ tipo: "invalida" });
    }
  });

  it("lo que aún no es una cifra pero puede llegar a serlo (vacío, «-», «,») está en curso", () => {
    for (const t of ["", "  ", "-", "−", ",", ".", "$", "+", "-,", "%"]) {
      expect(leeBorrador(t, "es", 2, -10, 1000), t).toEqual({ tipo: "en-curso" });
    }
  });

  it("sin límites acepta cualquier cifra", () => {
    expect(leeBorrador("-123456", "es", 2)).toEqual({ tipo: "valor", valor: -123456 });
  });
});

describe("mensajeRango: dice el rango válido", () => {
  it("con los dos límites, en cada idioma y con su formato", () => {
    expect(mensajeRango(100, 1_000_000_000, "es")).toBe("Escribe una cifra entre 100 y 1.000.000.000.");
    expect(mensajeRango(100, 1_000_000_000, "en")).toBe("Enter a number between 100 and 1,000,000,000.");
    expect(mensajeRango(-1_000_000, 1_000_000, "es")).toBe("Escribe una cifra entre −1.000.000 y 1.000.000.");
    expect(mensajeRango(0.0001, 1000, "es")).toBe("Escribe una cifra entre 0,0001 y 1.000.");
  });

  it("con un solo límite o ninguno", () => {
    expect(mensajeRango(undefined, 10, "es")).toBe("Escribe una cifra de hasta 10.");
    expect(mensajeRango(0, undefined, "en")).toBe("Enter a number of at least 0.");
    expect(mensajeRango(undefined, undefined, "es")).toBe("Escribe una cifra.");
    expect(mensajeRango(Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, "en")).toBe("Enter a number.");
  });
});
