import { describe, expect, it } from "vitest";
import { amortizacion } from "@/lib/precios";

/**
 * El mes de amortización fuera del horizonte elegido (por ejemplo Pro, 5 $/mes
 * y 1 año) debe decirlo, y no contradecir al gráfico.
 */
describe("amortizacion", () => {
  it("fuera del horizonte elegido lo dice", () => {
    expect(amortizacion(249, 5, 1)).toEqual({ meses: 50, dentro: false });
  });

  it("dentro del horizonte, y justo en el último mes también", () => {
    expect(amortizacion(249, 25, 3)).toEqual({ meses: 10, dentro: true });
    expect(amortizacion(240, 20, 1)).toEqual({ meses: 12, dentro: true });
  });

  it("sin cuota mensual no hay amortización", () => {
    expect(amortizacion(249, 0, 3)).toEqual({ meses: null, dentro: false });
  });
});
