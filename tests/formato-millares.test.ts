import { describe, expect, it } from "vitest";
import { fmtInt, fmtMoney, fmtNum, fmtPrice } from "@/lib/trading/format";

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

  it("en inglés", () => {
    expect(fmtInt(1234, "en")).toBe("1,234");
    expect(fmtPrice(2350, 2, "en")).toBe("2,350.00");
    expect(fmtMoney(-1234.56, "en")).toBe("−$1,234.56");
  });
});
