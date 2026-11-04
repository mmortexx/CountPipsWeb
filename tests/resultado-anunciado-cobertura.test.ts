import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Todas las calculadoras de marketing/ envuelven su resultado principal con
 * `ResultadoAnunciado` (ver components/tj/ResultadoAnunciado), para que un
 * lector de pantalla lo anuncie al recalcular.
 */
const CALCULADORAS = [
  "RiskCalculator",
  "EquityProjector",
  "EdgeSignificanceChecker",
  "DrawdownRecovery",
  "DisciplineCost",
  "RMultipleSimulator",
  "PropChallengeSimulator",
  "SavingsCalculator",
  "CommissionDragCalculator",
];

describe("Cobertura de ResultadoAnunciado en las calculadoras", () => {
  for (const nombre of CALCULADORAS) {
    it(`${nombre}.tsx importa y usa ResultadoAnunciado`, () => {
      const ruta = resolve(__dirname, `../src/components/marketing/${nombre}.tsx`);
      const src = readFileSync(ruta, "utf8");
      expect(src).toMatch(/import\s*\{\s*ResultadoAnunciado\s*\}\s*from\s*"@\/components\/tj\/ResultadoAnunciado"/);
      expect(src).toMatch(/<ResultadoAnunciado\b/);
    });
  }
});

/**
 * El «Riesgo» del registro rápido de la demo cambia con cada tecla del stop o la
 * cantidad: una región `aria-live` directa lo leería a cada pulsación. Pasa por
 * `ResultadoAnunciado`, que espera a que la cifra se quede quieta. Que lo diga
 * una sola vez tras teclear lo comprueba `demo-composer.test.ts` en un DOM.
 */
describe("Cobertura de ResultadoAnunciado en el registro rápido de la demo", () => {
  const src = readFileSync(resolve(__dirname, "../src/components/demo/pages/DashboardPage.tsx"), "utf8");

  it("DashboardPage.tsx importa y usa ResultadoAnunciado", () => {
    expect(src).toMatch(/import\s*\{\s*ResultadoAnunciado\s*\}\s*from\s*"@\/components\/tj\/ResultadoAnunciado"/);
    expect(src).toMatch(/<ResultadoAnunciado\b/);
  });

  it("y ninguna región aria-live directa queda en esa página", () => {
    expect(src).not.toMatch(/aria-live/);
  });
});
