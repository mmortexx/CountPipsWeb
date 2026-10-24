import { describe, expect, it } from "vitest";
import { fmtR, signoDeCifra } from "@/lib/trading/format";

describe("signoDeCifra: signo y tono de la cifra tal como se escribe", () => {
  it("lo que redondea a cero no lleva signo ni color: ni «−0,00 R» en rojo ni «+0,00 R» en verde", () => {
    for (const v of [0, -0, 0.004, -0.004, 1e-16, -1e-16, -0.0049]) {
      expect(signoDeCifra(v, 2), String(v)).toEqual({ abs: 0, signo: "", tono: "neutral" });
    }
  });

  it("el primer valor que ya se escribe con una cifra distinta de cero sí lleva signo", () => {
    expect(signoDeCifra(0.005, 2)).toEqual({ abs: 0.01, signo: "+", tono: "pos" });
    expect(signoDeCifra(-0.01, 2)).toEqual({ abs: 0.01, signo: "−", tono: "neg" });
    expect(signoDeCifra(-0.0051, 2)).toEqual({ abs: 0.01, signo: "−", tono: "neg" });
  });

  it("cifras normales", () => {
    expect(signoDeCifra(0.23, 2)).toEqual({ abs: 0.23, signo: "+", tono: "pos" });
    expect(signoDeCifra(-5732.24, 2)).toEqual({ abs: 5732.24, signo: "−", tono: "neg" });
    expect(signoDeCifra(-0.4, 1)).toEqual({ abs: 0.4, signo: "−", tono: "neg" });
  });

  it("según los decimales: -0,04 es cero a un decimal y no a dos", () => {
    expect(signoDeCifra(-0.04, 1)).toEqual({ abs: 0, signo: "", tono: "neutral" });
    expect(signoDeCifra(-0.04, 2)).toEqual({ abs: 0.04, signo: "−", tono: "neg" });
  });

  it("coincide con fmtR: escribe signo solo cuando fmtR lo escribe", () => {
    for (const v of [0, 0.004, -0.004, 0.005, -0.005, 0.5, -0.5, 1e-16, -123.456]) {
      const { signo } = signoDeCifra(v, 2);
      const texto = fmtR(v, "es", 2);
      expect(/^[+−]/.test(texto), `${v} → ${texto}`).toBe(signo !== "");
    }
  });
});
