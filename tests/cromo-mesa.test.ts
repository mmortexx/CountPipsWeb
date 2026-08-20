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

  it("el changelog de about es un índice, no una línea de tiempo en zigzag", () => {
    const log = sinComentarios(leer("src/components/marketing/Changelog.tsx"));
    expect(log).toMatch(/<ol /);
    expect(log).not.toMatch(/md:flex-row-reverse/);
    expect(log).not.toMatch(/rounded-full bg-\[rgb\(var\(--accent-base\)\)\]/);
  });

  it("traders no pinta tres tarjetas de icono; usa filas numeradas", () => {
    const traders = sinComentarios(
      leer("src/components/beta/TraderProfilePage.tsx"),
    );
    expect(traders).toMatch(/data\.cards\.map/);
    expect(traders).not.toMatch(/<article key=\{titleEs\}/);
    expect(traders).toMatch(/sm:grid-cols-\[3rem_minmax\(0,14rem\)_minmax\(0,1fr\)\]/);
  });

  it("el test de disciplina y el éxito de beta no usan píldoras redondas", () => {
    const test = sinComentarios(
      leer("src/components/marketing/DisciplineScore.tsx"),
    );
    const beta = sinComentarios(leer("src/components/beta/BetaApplication.tsx"));
    expect(test).not.toMatch(/className="h-1 rounded-full overflow-hidden"/);
    expect(test).not.toMatch(/ml-auto px-2\.5 py-1 rounded-full/);
    expect(beta).not.toMatch(/size-14 place-items-center rounded-full/);
  });

  it("el pie y el atajo global no usan radio de consumo", () => {
    const pie = sinComentarios(leer("src/components/marketing/Footer.tsx"));
    const atajos = sinComentarios(leer("src/components/tj/GlobalShortcuts.tsx"));
    expect(pie).toMatch(/group rounded-\[2px\] -my-2 py-2/);
    expect(pie).not.toMatch(/group rounded-md -my-2 py-2/);
    expect(atajos).toMatch(/rounded-\[2px\] pl-3 pr-3\.5/);
    expect(atajos).not.toMatch(/rounded-full pl-3 pr-3\.5/);
  });

  it("la 404 y el error no pintan orbes borrosos ni tarjetas de destino", () => {
    const nf = sinComentarios(leer("src/components/tj/NotFoundClient.tsx"));
    const err = sinComentarios(leer("src/app/error.tsx"));
    expect(nf).not.toMatch(/blur-\[130px\]/);
    expect(err).not.toMatch(/blur-\[130px\]/);
    expect(nf).toMatch(/<ol[\s>]/);
    expect(nf).toMatch(/padStart\(2, "0"\)/);
    expect(nf).not.toMatch(/hover:shadow-\[0_12px_32px_-8px_rgb\(var\(--accent-base\)/);
  });

  it("precios, comparación y ejes de features no usan sellos redondos ni carrusel de tarjetas", () => {
    const precios = sinComentarios(leer("src/components/marketing/Pricing.tsx"));
    const cmp = sinComentarios(leer("src/components/marketing/Comparison.tsx"));
    const ejes = sinComentarios(
      leer("src/components/marketing/FeaturePageNav.tsx"),
    );
    expect(precios).not.toMatch(/w-5 h-5 rounded-full bg-\[rgb\(var\(--accent-base\)/);
    expect(precios).not.toMatch(/hover:shadow-\[0_6px_16px_rgb\(var\(--accent-base\)/);
    expect(cmp).not.toMatch(/w-5 h-5 rounded-full bg-pnl-pos/);
    expect(ejes).toMatch(/<ol /);
    expect(ejes).toMatch(/padStart\(2, "0"\)/);
    expect(ejes).not.toMatch(/md:grid-cols-3/);
    expect(ejes).not.toMatch(/Desliza para explorar/);
  });

  it("volver arriba y el comparador no llevan sombra de acento", () => {
    const top = sinComentarios(leer("src/components/tj/BackToTop.tsx"));
    const slider = sinComentarios(leer("src/components/tj/ComparisonSlider.tsx"));
    expect(top).not.toMatch(/hover:shadow-\[0_8px_28px_rgb\(var\(--accent-base\)/);
    expect(slider).not.toMatch(/shadow-\[0_8px_24px_-6px_rgb\(var\(--accent-base\)/);
    expect(slider).not.toMatch(/w-11 h-11 rounded-full/);
  });
});
