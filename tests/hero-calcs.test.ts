import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * El hero no lleva deslizadores. Las micro-calculadoras que ocupaban
 * el centro de la primera pantalla —dos pistas con bolita, sin gráfico—
 * se retiraron: tapaban el grabado del atlas y se leían como un widget
 * de consumo delante de una mesa institucional.
 *
 * Las fórmulas (esperanza en R y recuperación de drawdown) siguen
 * vivas en las herramientas; aquí se vigila que no vuelvan al hero.
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

describe("Esperanza y recuperación (fórmulas de las herramientas)", () => {
  it("la esperanza en R es WR·W − (1−WR)·L con L = 1 R", () => {
    const ev = (wr: number, w: number) => (wr / 100) * w - (1 - wr / 100);
    expect(ev(55, 2)).toBeCloseTo(0.65, 12);
    expect(ev(30, 3)).toBeCloseTo(0.2, 12);
    expect(ev(35, 1)).toBeCloseTo(-0.3, 12);
  });

  it("la recuperación es DD / (1 − DD)", () => {
    const rec = (dd: number) => dd / 100 / (1 - dd / 100);
    expect(rec(20)).toBeCloseTo(0.25, 12);
    expect(rec(40)).toBeCloseTo(2 / 3, 12);
    expect(rec(50)).toBeCloseTo(1, 12);
  });
});
