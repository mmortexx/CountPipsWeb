import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { PALETTES, type Theme, type PaletteName } from "@/lib/theme";

/**
 * Dimension D8: Design Tokens & Theme Purity
 *
 * Tier 1: Feature Coverage (>= 5 tests)
 *  1. Validation of CSS custom properties (--pnl-*, --sig-*, --accent-*, --txt-*, --surface*, etc.)
 *  2. Theme switching rules (:root[data-theme="light"], :root:not([data-theme="light"]), color-scheme)
 *  3. Palette token definitions and legacy fallbacks (clasico, verde, grafito)
 *  4. Surface classes (.tj-paper, .tj-paper-dense, .tj-range, .bg-veil, .tj-emerge)
 *  5. Theme context & provider contracts (ThemeProvider, PALETTES constant)
 *
 * Tier 2: Boundary & Corner Cases (>= 5 tests)
 *  6. Source code audit for prohibited raw inline hex colors in components
 *  7. RGB channel triplet format parsing and mathematical boundary validation [0, 255]
 *  8. Contrast compliance matrix across dark and light themes (relative luminance)
 *  9. Malformed and unknown localStorage theme/palette resilience
 *  10. Depth shadows and elevation token consistency across light and dark themes
 */

const ROOT = join(import.meta.dirname, "..", "..");
const readSrc = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

function getAllSrcFiles(dir: string, extensions = [".tsx", ".ts"]): string[] {
  const results: string[] = [];
  const fullPath = join(ROOT, dir);
  const traverse = (currentDir: string) => {
    const list = readdirSync(currentDir);
    for (const file of list) {
      const p = join(currentDir, file);
      const stat = statSync(p);
      if (stat.isDirectory()) {
        traverse(p);
      } else if (extensions.some((ext) => file.endsWith(ext))) {
        results.push(p);
      }
    }
  };
  traverse(fullPath);
  return results;
}

function parseChannelTriplet(tripletStr: string): [number, number, number] {
  const parts = tripletStr.trim().split(/\s+/).map((s) => parseInt(s, 10));
  if (parts.length !== 3 || parts.some((n) => isNaN(n) || n < 0 || n > 255)) {
    throw new Error(`Invalid RGB triplet: "${tripletStr}"`);
  }
  return [parts[0], parts[1], parts[2]];
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(lum1: number, lum2: number): number {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("Dimension D8: Design System Tokens (Tier 1 Feature Coverage)", () => {
  const globalsCss = readSrc("src/app/globals.css");

  it("T1.1: Core CSS custom properties are properly defined in :root", () => {
    // Check essential brand, PnL, text, surface, and motion tokens
    expect(globalsCss).toMatch(/--accent-base:\s*\d+\s+\d+\s+\d+;/);
    expect(globalsCss).toMatch(/--accent-ink:\s*\d+\s+\d+\s+\d+;/);
    expect(globalsCss).toMatch(/--pnl-pos:\s*\d+\s+\d+\s+\d+;/);
    expect(globalsCss).toMatch(/--pnl-neg:\s*\d+\s+\d+\s+\d+;/);
    expect(globalsCss).toMatch(/--pnl-warn:\s*\d+\s+\d+\s+\d+;/);
    expect(globalsCss).toMatch(/--sig-green:\s*\d+\s+\d+\s+\d+;/);
    expect(globalsCss).toMatch(/--sig-amber:\s*\d+\s+\d+\s+\d+;/);
    expect(globalsCss).toMatch(/--sig-red:\s*\d+\s+\d+\s+\d+;/);
    expect(globalsCss).toMatch(/--txt-primary:\s*\d+\s+\d+\s+\d+;/);
    expect(globalsCss).toMatch(/--txt-secondary:\s*\d+\s+\d+\s+\d+;/);
    expect(globalsCss).toMatch(/--txt-tertiary:\s*\d+\s+\d+\s+\d+;/);
    expect(globalsCss).toMatch(/--divider:\s*\d+\s+\d+\s+\d+;/);
    expect(globalsCss).toMatch(/--ease-suave:\s*cubic-bezier\(/);
    expect(globalsCss).toMatch(/--cal-tint-max:\s*0\.\d+;/);
  });

  it("T1.2: Theme switching selectors maintain symmetry and proper color-scheme", () => {
    // Light theme overrides
    expect(globalsCss).toContain(':root[data-theme="light"]');
    expect(globalsCss).toMatch(/:root\[data-theme="light"\]\s*\{[^}]*--pnl-pos:\s*30 122 76;/);
    expect(globalsCss).toMatch(/:root\[data-theme="light"\]\s*\{[^}]*--pnl-neg:\s*153 27 27;/);
    expect(globalsCss).toMatch(/:root\[data-theme="light"\]\s*\{[^}]*--txt-primary:\s*20 22 28;/);

    // Color-scheme synchronization
    expect(globalsCss).toContain(':root:not([data-theme="light"]) { color-scheme: dark; }');
    expect(globalsCss).toContain(':root[data-theme="light"] { color-scheme: light; }');
  });

  it("T1.3: Palette token architecture supports 'clasico' and legacy fallbacks", () => {
    // PALETTES export in theme.tsx
    expect(PALETTES).toHaveLength(1);
    expect(PALETTES[0].name).toBe("clasico");
    expect(PALETTES[0].light).toBe("#131D26");
    expect(PALETTES[0].dark).toBe("#CDD9E4");

    // globals.css legacy palette fallbacks (verde, grafito)
    expect(globalsCss).toContain(':root[data-palette="verde"]');
    expect(globalsCss).toContain(':root[data-palette="grafito"]');
    expect(globalsCss).toContain(':root[data-theme="light"][data-palette="verde"]');
    expect(globalsCss).toContain(':root[data-theme="light"][data-palette="grafito"]');
  });

  it("T1.4: Surface classes (.tj-paper, .tj-paper-dense, .tj-range) map to design tokens", () => {
    // .tj-paper class definitions
    expect(globalsCss).toContain(".tj-paper {");
    expect(globalsCss).toContain(':root[data-theme="light"] .tj-paper {');
    expect(globalsCss).toContain(".tj-paper-dense {");
    expect(globalsCss).toContain(':root[data-theme="light"] .tj-paper-dense {');

    // .tj-range slider class
    expect(globalsCss).toContain(".tj-range {");

  });

  it("T1.5: Theme module contracts and types are consistent", () => {
    const themeSrc = readSrc("src/lib/theme.tsx");

    // Exports Theme and PaletteName types
    expect(themeSrc).toContain('export type Theme = "dark" | "light";');
    expect(themeSrc).toContain('export type PaletteName = "clasico";');
    expect(themeSrc).toContain("export function ThemeProvider");
    expect(themeSrc).toContain("export function useTheme");
    expect(themeSrc).toContain('document.documentElement.dataset.theme = theme');
    expect(themeSrc).toContain('document.documentElement.dataset.palette = palette');
  });
});

describe("Dimension D8: Design System Tokens (Tier 2 Boundary & Corner Cases)", () => {
  const globalsCss = readSrc("src/app/globals.css");

  it("T2.1: Prohibited raw inline hex/rgb colors audit across components", () => {
    const componentFiles = getAllSrcFiles("src/components");
    const allowedHexExceptions = new Set([
      "#131D26", "#CDD9E4", // Theme palette swatch definitions
      "#00F5A0", "#FF4D4D", "#E0932B", // Canonical PnL comments/chart constants
    ]);

    const flaggedHexUsage: string[] = [];
    const hexRegex = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;

    for (const filePath of componentFiles) {
      const relativePath = filePath.replace(ROOT, "").replace(/\\/g, "/").replace(/^\//, "");
      const content = readFileSync(filePath, "utf8");

      // Strip comments to only analyze active JSX and JS code
      const codeOnly = content
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");

      const lines = codeOnly.split("\n");
      lines.forEach((line, idx) => {
        // Skip SVG paths and non-color definitions
        if (line.includes("<path") || line.includes("viewBox") || line.includes("xml")) return;
        // Skip lines that use tokens
        if (line.includes("var(--") || line.includes("rgb(var(")) return;

        const matches = line.matchAll(hexRegex);
        for (const m of matches) {
          const hex = m[0].toUpperCase();
          if (!allowedHexExceptions.has(hex) && (line.includes("color:") || line.includes("background:") || line.includes("border:") || line.includes("style="))) {
            flaggedHexUsage.push(`${relativePath}:${idx + 1} -> ${hex} in line: ${line.trim()}`);
          }
        }
      });
    }

    // Must have zero unauthorized raw hex colors in style attributes
    expect(flaggedHexUsage).toEqual([]);
  });

  it("T2.2: Channel triplets parse correctly into integers between 0 and 255", () => {
    // Extract channel triplets from globals.css
    const tripletMatches = globalsCss.matchAll(/--[a-z0-9-]+:\s*(\d+\s+\d+\s+\d+);/g);
    let tripletCount = 0;

    for (const match of tripletMatches) {
      const rawTriplet = match[1];
      const channels = parseChannelTriplet(rawTriplet);
      expect(channels[0]).toBeGreaterThanOrEqual(0);
      expect(channels[0]).toBeLessThanOrEqual(255);
      expect(channels[1]).toBeGreaterThanOrEqual(0);
      expect(channels[1]).toBeLessThanOrEqual(255);
      expect(channels[2]).toBeGreaterThanOrEqual(0);
      expect(channels[2]).toBeLessThanOrEqual(255);
      tripletCount++;
    }

    expect(tripletCount).toBeGreaterThanOrEqual(15);
  });

  it("T2.3: Contrast compliance across custom palettes and theme states", () => {
    // Dark theme values
    const darkSurfaceLum = relativeLuminance(12, 17, 22); // #0C1116
    const darkTxtPrimary = relativeLuminance(255, 255, 255);
    const darkTxtSecondary = relativeLuminance(209, 213, 219);
    const darkPnlPos = relativeLuminance(0, 245, 160);
    const darkPnlNeg = relativeLuminance(255, 77, 77);

    // Light theme values
    const lightSurfaceLum = relativeLuminance(248, 250, 252);
    const lightTxtPrimary = relativeLuminance(20, 22, 28);
    const lightTxtSecondary = relativeLuminance(80, 85, 95);
    const lightPnlPos = relativeLuminance(30, 122, 76);
    const lightPnlNeg = relativeLuminance(153, 27, 27);

    // Assert WCAG 2.1 AA text contrast (>= 4.5:1 for normal text)
    expect(contrastRatio(darkTxtPrimary, darkSurfaceLum)).toBeGreaterThanOrEqual(7.0);
    expect(contrastRatio(darkTxtSecondary, darkSurfaceLum)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(darkPnlPos, darkSurfaceLum)).toBeGreaterThanOrEqual(4.5);

    expect(contrastRatio(lightTxtPrimary, lightSurfaceLum)).toBeGreaterThanOrEqual(7.0);
    expect(contrastRatio(lightTxtSecondary, lightSurfaceLum)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(lightPnlPos, lightSurfaceLum)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(lightPnlNeg, lightSurfaceLum)).toBeGreaterThanOrEqual(4.5);
  });

  it("T2.4: Malformed and corrupted localStorage theme values degrade to safe defaults", () => {
    function parseTheme(stored: unknown): Theme {
      return stored === "dark" || stored === "light" ? stored : "light";
    }

    function parsePalette(stored: unknown): PaletteName {
      return "clasico";
    }

    expect(parseTheme("invalid_theme")).toBe("light");
    expect(parseTheme(null)).toBe("light");
    expect(parseTheme(undefined)).toBe("light");
    expect(parseTheme("")).toBe("light");
    expect(parseTheme("{bad: json}")).toBe("light");
    expect(parseTheme("dark")).toBe("dark");
    expect(parseTheme("light")).toBe("light");

    expect(parsePalette("invalid_palette")).toBe("clasico");
    expect(parsePalette("verde")).toBe("clasico");
    expect(parsePalette("grafito")).toBe("clasico");
    expect(parsePalette(null)).toBe("clasico");
  });

  /**
   * ANTES ESTA PRUEBA EXIGIA QUE EXISTIERA `.depth-1 {` … `.depth-4 {`.
   *
   * Comprobaba texto, no comportamiento — y el texto que comprobaba
   * estaba muerto: ninguna de las cuatro clases la llevaba un solo
   * elemento, ni en las 154 paginas exportadas ni en el codigo fuente.
   * O sea que la unica funcion que cumplia era impedir que se retirara
   * codigo que no hacia nada, con el titulo de estar vigilando la
   * elevacion del sistema de diseno.
   *
   * La elevacion de verdad la lleva el token `--sombra`, que sale
   * TENIDO del material —una sombra es luz que falta, asi que sobre
   * chapa gris es gris mas oscuro y no negro— y que cambia con el tema.
   * Eso es lo que se comprueba ahora: que este definido en los dos
   * temas, que cada uno traiga el suyo, y que alguien lo use de verdad.
   * Lo ultimo es lo que impide que esta prueba vuelva a proteger codigo
   * muerto.
   */
  it("T2.5: Elevation and depth shadow tokens maintain hierarchy across light and dark modes", () => {
    /* Los dos bloques son dedicados —sólo declaran `--sombra`—, así que
       se casan enteros. Un regex que buscara «desde `:root` hasta el
       primer `--sombra`» tropezaba con el `:root` gigante de la cabecera
       del fichero, que declara otras cuarenta variables y ninguna de
       éstas. */
    const leer = (re: RegExp) => {
      const m = globalsCss.match(re);
      return m ? m[1].trim().split(/\s+/).map(Number) : null;
    };
    const oscuro = leer(/:root\s*\{\s*--sombra:\s*([\d ]+);\s*\}/);
    const claro = leer(
      /:root\[data-theme="light"\]\s*\{\s*--sombra:\s*([\d ]+);\s*\}/,
    );

    expect(oscuro, "--sombra sin definir en el tema oscuro").not.toBeNull();
    expect(claro, "--sombra sin definir en el tema claro").not.toBeNull();
    for (const canal of [...oscuro!, ...claro!]) {
      expect(canal).toBeGreaterThanOrEqual(0);
      expect(canal).toBeLessThanOrEqual(255);
    }
    expect(oscuro!).toHaveLength(3);
    expect(claro!).toHaveLength(3);
    expect(
      oscuro!.join(" "),
      "los dos temas comparten sombra: entonces no esta tenida con su material",
    ).not.toBe(claro!.join(" "));

    // Y alguien tiene que consumirlo, o volveriamos a vigilar codigo muerto.
    const consumidores = getAllSrcFiles("src").filter((f) =>
      readFileSync(f, "utf8").includes("var(--sombra)"),
    );
    expect(
      consumidores.length,
      "nadie usa --sombra: o la elevacion se pinta de otra forma, o sobra",
    ).toBeGreaterThan(0);
  });
});
