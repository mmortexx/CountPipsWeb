import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * SavingsCalculator y CommissionDragCalculator recalculaban su resultado
 * principal en cada tecla sin avisar a un lector de pantalla: las otras
 * siete calculadoras de marketing/ ya envuelven su resultado con
 * `ResultadoAnunciado` (ver su cabecera en components/tj/ResultadoAnunciado)
 * y estas dos se habían quedado fuera.
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
