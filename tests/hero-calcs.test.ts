import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * El hero no lleva deslizadores: las micro-calculadoras se retiraron. Las
 * fórmulas (esperanza en R y recuperación de drawdown) siguen en las
 * herramientas y las prueba `recuperacion.test.ts`; aquí se vigila que no
 * vuelvan al hero.
 */

const RAIZ = join(import.meta.dirname, "..");
const leer = (rel: string) => readFileSync(join(RAIZ, rel), "utf8");

function sinComentarios(fuente: string): string {
  return fuente
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

describe("Hero sin deslizadores", () => {
  const hero = sinComentarios(leer("src/components/marketing/Hero.tsx"));

  it("no importa ni monta HeroMicroCalcs", () => {
    expect(hero).not.toMatch(/HeroMicroCalcs/);
  });

  it("no pinta input range ni pistas .tj-range", () => {
    expect(hero).not.toMatch(/type=["']range["']/);
    expect(hero).not.toMatch(/tj-range/);
  });

  it("conserva los dos CTA", () => {
    expect(hero).toMatch(/\/demo/);
    expect(hero).toMatch(/\/pricing/);
  });
});
