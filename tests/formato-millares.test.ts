import { describe, expect, it } from "vitest";
import { fmtCifraCorta, fmtInt, fmtMoney, fmtNum, fmtPrice, fmtR } from "@/lib/trading/format";

/* `Intl` en español no agrupa las cifras de cuatro dígitos («1234»). La web
   mezclaba «2350,00» con «18.200,0» en la misma tabla y «1234,56 $» en una
   calculadora con «12.345,67 $» en otra. Toda cifra agrupa igual. */
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

/* La app de escritorio escribe «+1,50 R» (FormatR, TradesViewModel.cs). La web
   escribía «+1,50R», y dos calculadoras componían la R a mano. */
describe("la R va tras un espacio duro, como en la app", () => {
  it("con signo y en los dos idiomas", () => {
    expect(fmtR(1.5, "es")).toBe("+1,50 R");
    expect(fmtR(-0.38, "en", 3)).toBe("−0.380 R");
    expect(fmtR(-0.0001, "es")).toBe("0,00 R");
  });
});
