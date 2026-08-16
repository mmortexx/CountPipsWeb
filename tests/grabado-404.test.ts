import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Contrato de `Grabado404` — la lámina grabada de la página que no
 * existe.
 *
 * Sustituyó a las velas desplazándose y a la constelación de puntos
 * (los dos fondos genéricos del sector) porque eran el único rincón
 * del sitio que no hablaba el idioma del papel entintado. Estas
 * pruebas vigilan que siga siendo lo que pretende ser: una lámina del
 * atlas hecha con las primitivas del atlas, con las disciplinas de
 * rendimiento del atlas, y que los fondos genéricos no vuelvan.
 */

const RAIZ = join(import.meta.dirname, "..");
const leer = (rel: string) => readFileSync(join(RAIZ, rel), "utf8");

function sinComentarios(fuente: string): string {
  return fuente
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

describe("Grabado404", () => {
  const codigo = sinComentarios(leer("src/components/tj/Grabado404.tsx"));

  it("dibuja con las primitivas del atlas, no con un estilo propio", () => {
    expect(codigo).toMatch(/from "\.\/EngravedAtlas"/);
    expect(codigo).toMatch(/\bplateChrome\b/);
    expect(codigo).toMatch(/\bhandRect\b/);
    expect(codigo).toMatch(/\bengraveLine\b/);
  });

  it("temblor determinista: nada de Math.random", () => {
    expect(codigo).not.toMatch(/Math\.random/);
  });

  it("respeta prefers-reduced-motion dibujando la figura entera", () => {
    expect(codigo).toMatch(/prefers-reduced-motion/);
    expect(codigo).toMatch(/reduce[\s\S]{0,80}pintar\(1\)/);
  });

  it("el bucle se detiene al converger (coste cero parado)", () => {
    expect(codigo).toMatch(/terminado = true/);
    expect(codigo).toMatch(/raf = 0/);
  });

  it("dpr con techo de 1,5, como el atlas", () => {
    expect(codigo).toMatch(/Math\.min\(devicePixelRatio \|\| 1, 1\.5\)/);
  });

  it("la tinta sigue al tema en caliente", () => {
    expect(codigo).toMatch(/attributeFilter: \["data-theme", "data-palette"\]/);
  });

  it("se carga bajo demanda: nunca en el paquete del layout", () => {
    const nf = leer("src/components/tj/NotFoundClient.tsx");
    expect(nf).toMatch(/dynamicImport\(\s*\(\) => import\("\.\/Grabado404"\)/);
    expect(nf).toMatch(/ssr: false/);
    // Y el layout no lo referencia.
    const layout = leer("src/app/layout.tsx");
    expect(layout).not.toMatch(/Grabado404/);
  });

  it("los fondos genéricos retirados no vuelven al sitio", () => {
    expect(existsSync(join(RAIZ, "src/components/tj/MarketBackground.tsx"))).toBe(false);
    expect(existsSync(join(RAIZ, "src/components/tj/ParticleField.tsx"))).toBe(false);
    const nf = leer("src/components/tj/NotFoundClient.tsx");
    expect(nf).not.toMatch(/MarketBackground|ParticleField/);
  });
});
