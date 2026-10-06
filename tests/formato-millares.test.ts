import { describe, expect, it } from "vitest";
import { fmtCifraCorta, fmtInt, fmtMoney, fmtNum, fmtOperaciones, fmtPct, fmtPrice, fmtR } from "@/lib/trading/format";

describe("el recuento de operaciones concuerda en número", () => {
  it("singular con una, plural con el resto, millares agrupados", () => {
    expect(fmtOperaciones(1, "es")).toBe("1 operación");
    expect(fmtOperaciones(0, "es")).toBe("0 operaciones");
    expect(fmtOperaciones(2, "es")).toBe("2 operaciones");
    expect(fmtOperaciones(1234, "es")).toBe("1.234 operaciones");
    expect(fmtOperaciones(1, "en")).toBe("1 trade");
    expect(fmtOperaciones(1234, "en")).toBe("1,234 trades");
  });
});

// `Intl` en español no agrupa las cifras de cuatro dígitos («1234»): toda cifra debe agrupar igual.
describe("los formateadores agrupan millares también con cuatro dígitos", () => {
  it("en español", () => {
    expect(fmtInt(1234, "es")).toBe("1.234");
    expect(fmtPrice(2350, 2, "es")).toBe("2.350,00");
    expect(fmtNum(1234.5, "es", 1)).toBe("1.234,5");
    expect(fmtMoney(1234.56, "es")).toBe("1.234,56 $");
  });

  it("la cifra corta de las celdas usa la coma española", () => {
    expect(fmtCifraCorta(1234, "es")).toBe("+1,2k");
    expect(fmtCifraCorta(-1234, "en")).toBe("−1.2k");
    expect(fmtCifraCorta(-845.4, "es")).toBe("−845");
  });

  it("en inglés", () => {
    expect(fmtInt(1234, "en")).toBe("1,234");
    expect(fmtPrice(2350, 2, "en")).toBe("2,350.00");
    expect(fmtMoney(-1234.56, "en")).toBe("−$1,234.56");
  });
});

// La app de escritorio escribe «+1,50 R» (FormatR, TradesViewModel.cs).
describe("la R va tras un espacio duro, como en la app", () => {
  it("con signo y en los dos idiomas", () => {
    expect(fmtR(1.5, "es")).toBe("+1,50 R");
    expect(fmtR(-0.38, "en", 3)).toBe("−0.380 R");
    expect(fmtR(-0.0001, "es")).toBe("0,00 R");
  });
});

// `Intl` escribe el negativo con el guion del teclado (U+002D) y deja «-0,0»
// al redondear a cero: el signo es el menos tipográfico y el cero no lo lleva.
describe("el signo menos es tipográfico y el cero no lo lleva", () => {
  it("fmtNum y fmtPct, en los dos idiomas", () => {
    expect(fmtNum(-2.5, "es", 1)).toBe("\u22122,5");
    expect(fmtNum(-1234.5, "en", 1)).toBe("\u22121,234.5");
    expect(fmtNum(-0.04, "es", 1)).toBe("0,0");
    expect(fmtNum(-0, "en", 2)).toBe("0.00");
    expect(fmtPct(-0.025, "es")).toBe("\u22122,5\u00a0%");
    expect(fmtPct(-0.0004, "en")).toBe("0.0%");
    expect(fmtInt(-1234, "es")).toBe("\u22121.234");
  });
});
