import { describe, expect, it } from "vitest";
import { amortizacion } from "@/lib/precios";

/**
 * Con Pro, 5 $/mes y 1 año, el escenario de coste decía «A partir del mes
 * 50, la suscripción ya ha costado más que el pago único» con el gráfico
 * acabando en el mes 12 y la cifra grande diciendo lo contrario.
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
