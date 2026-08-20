import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Contratos de cromo institucional. Vigilan que no vuelvan los gestos
 * de SaaS de consumo que ya se retiraron: deslizadores en el hero,
 * anillos de coincidencia en %, sombras de acento en tarjetas de demo.
 */

const RAIZ = join(import.meta.dirname, "..");
const leer = (rel: string) => readFileSync(join(RAIZ, rel), "utf8");

function sinComentarios(fuente: string): string {
  return fuente
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

describe("Cromo de mesa", () => {
  it("el hero no monta deslizadores ni HeroMicroCalcs", () => {
    const hero = sinComentarios(leer("src/components/marketing/Hero.tsx"));
    expect(hero).not.toMatch(/HeroMicroCalcs/);
    expect(hero).not.toMatch(/type=["']range["']/);
    expect(hero).not.toMatch(/tj-range/);
  });

  it("el cajón móvil agrupa Producto, Operativa, Laboratorio y Empresa", () => {
    const nav = leer("src/components/marketing/Navbar.tsx");
    expect(nav).toMatch(/id: "producto"/);
    expect(nav).toMatch(/id: "operativa"/);
    expect(nav).toMatch(/id: "laboratorio"/);
    expect(nav).toMatch(/id: "empresa"/);
    expect(nav).toMatch(/DRAWER_GRUPOS\.map/);
  });

  it("el explorador de características no pinta un anillo de coincidencia en %", () => {
    const explorer = sinComentarios(
      leer("src/components/marketing/FeatureExplorer.tsx"),
    );
    expect(explorer).not.toMatch(/\{f\.score\}%/);
    expect(explorer).not.toMatch(/Match score ring/);
    expect(explorer).toMatch(/En este recorte|In this cut/);
  });

  it("la demo lista capacidades como índice, no como tarjetas con sombra de acento", () => {
    const caps = sinComentarios(leer("src/components/demo/DemoCapabilities.tsx"));
    expect(caps).toMatch(/<ol /);
    expect(caps).not.toMatch(/hover:shadow-\[0_8px_24px_-8px_rgb\(var\(--accent-base\)/);
    expect(caps).toMatch(/padStart\(2, "0"\)/);
  });
});
