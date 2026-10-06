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
