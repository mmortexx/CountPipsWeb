import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Contrato de las micro-calculadoras del hero (`HeroMicroCalcs.tsx`).
 *
 * Nacieron como cajas estáticas con un rótulo que prometía simulación y
 * no la había — el único punto del sitio donde la interactividad era
 * fingida. Estas pruebas vigilan que no vuelva a serlo: que los controles
 * existan de verdad (`.tj-range` de 44 px), que la matemática sea la
 * declarada, que los valores por defecto sean deterministas (para el SSG)
 * y que el veredicto se anuncie a lectores de pantalla.
 */

const RAIZ = join(import.meta.dirname, "..");
const leer = (rel: string) => readFileSync(join(RAIZ, rel), "utf8");

function sinComentarios(fuente: string): string {
  return fuente
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

describe("HeroMicroCalcs", () => {
  const codigo = sinComentarios(leer("src/components/marketing/HeroMicroCalcs.tsx"));

  it("calcula la esperanza en R como WR·W − (1−WR)·L con L = 1 R", () => {
    expect(codigo).toMatch(/\(wr \/ 100\) \* payoff - \(1 - wr \/ 100\)/);
    // Valores de referencia de la caja original (55 % · 1:2 → +0,65 R).
    const ev = (wr: number, w: number) => (wr / 100) * w - (1 - wr / 100);
    expect(ev(55, 2)).toBeCloseTo(0.65, 12);
    expect(ev(30, 3)).toBeCloseTo(0.2, 12);
    expect(ev(35, 1)).toBeCloseTo(-0.3, 12);
  });

  it("calcula la recuperación como DD / (1 − DD)", () => {
    expect(codigo).toMatch(/dd \/ 100 \/ \(1 - dd \/ 100\)/);
    const rec = (dd: number) => dd / 100 / (1 - dd / 100);
    expect(rec(20)).toBeCloseTo(0.25, 12);
    expect(rec(40)).toBeCloseTo(2 / 3, 12);
    expect(rec(50)).toBeCloseTo(1, 12);
  });

  it("los deslizadores son tj-range de 44 px (objetivo táctil WCAG)", () => {
    expect(codigo).toMatch(/className="tj-range w-full"/);
    expect(codigo).toMatch(/height: 44/);
  });

  it("los valores iniciales son constantes fijas: determinismo SSG", () => {
    expect(codigo).toMatch(/useState\(55\)/);
    expect(codigo).toMatch(/useState\(2\)/);
    expect(codigo).toMatch(/useState\(20\)/);
    // Nada de azar ni reloj en el primer pintado.
    expect(codigo).not.toMatch(/Math\.random|new Date/);
  });

  it("el veredicto derivado se anuncia (aria-live) y usa tokens de PnL", () => {
    expect(codigo).toMatch(/aria-live="polite"/);
    expect(codigo).toMatch(/var\(--pnl-pos\)/);
    expect(codigo).toMatch(/var\(--pnl-neg\)/);
  });

  it("es bilingüe: formatea por idioma y lee useLang", () => {
    expect(codigo).toMatch(/useLang/);
    expect(codigo).toMatch(/es-ES/);
    expect(codigo).toMatch(/en-US/);
  });
});
