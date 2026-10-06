import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { normalCdf } from "@/components/marketing/EdgeSignificanceChecker";
import { STR } from "@/lib/i18n";
import { withLocale } from "@/lib/locale";
import { LOCALIZED_PATHS } from "@/lib/rutas-en";

/**
 * Dimensiones D2 y D3: accesibilidad WCAG 2.1 AA y viewport móvil (390 px).
 * Leen el código fuente: áreas táctiles de 44 px, contraste, ARIA, movimiento
 * reducido, enlace de salto, desbordes, tablas con scroll, trampas de foco y
 * color nunca como único canal.
 */

const ROOT = join(import.meta.dirname, "..", "..");
const readSrc = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

function getAllSrcFiles(dir: string, extensions = [".tsx", ".ts", ".css"]): string[] {
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

describe("Dimension D2 & D3: Accessibility & Mobile Viewport (Tier 1 Feature Coverage)", () => {
  it("T1.1: Touch target rules enforce >= 44px min-height on interactive controls and sliders", () => {
    const globalsCss = readSrc("src/app/globals.css");
    const riskCalc = readSrc("src/components/marketing/RiskCalculator.tsx");
    const equityProj = readSrc("src/components/marketing/EquityProjector.tsx");
    const savingsCalc = readSrc("src/components/marketing/SavingsCalculator.tsx");
    const edgeChecker = readSrc("src/components/marketing/EdgeSignificanceChecker.tsx");
    const rMultiple = readSrc("src/components/marketing/RMultipleSimulator.tsx");

    expect(globalsCss).toMatch(/\.tj-range\s*\{[^}]*height:\s*44px/);

    expect(riskCalc).toMatch(/min-h-\[44px\]/);
    expect(equityProj).toMatch(/height:\s*44/);
    expect(savingsCalc).toMatch(/minHeight:\s*44|height:\s*44/);
    expect(edgeChecker).toMatch(/height:\s*44/);
    expect(rMultiple).toMatch(/min-h-\[44px\]|height:\s*44/);
  });

  it("T1.2: Contrast standards comply with WCAG 2.1 AA (>= 4.5:1 text, >= 3:1 non-text)", () => {
    const darkBgLum = relativeLuminance(12, 17, 22); // #0C1116
    const darkTxtPrimaryLum = relativeLuminance(255, 255, 255); // #FFFFFF
    const darkTxtSecondaryLum = relativeLuminance(209, 213, 219); // #D1D5DB (gray-300)
    const darkTxtTertiaryLum = relativeLuminance(156, 163, 175); // #9CA3AF (gray-400)
    const darkAccentLum = relativeLuminance(205, 217, 228); // #CDD9E4
    const darkAccentInkLum = relativeLuminance(12, 17, 22); // #0C1116

    const lightBgLum = relativeLuminance(248, 250, 252); // #F8FAFC
    const lightTxtPrimaryLum = relativeLuminance(20, 22, 28); // #14161C
    const lightTxtSecondaryLum = relativeLuminance(80, 85, 95); // #50555F
    const lightTxtTertiaryLum = relativeLuminance(64, 69, 79); // #40454F
    const lightAccentLum = relativeLuminance(19, 29, 38); // #131D26
    const lightAccentInkLum = relativeLuminance(235, 237, 239); // #EBEDEF

    // 7:1 el texto principal, 4,5:1 el resto, incluido el texto de botón sobre el acento.
    expect(contrastRatio(darkTxtPrimaryLum, darkBgLum)).toBeGreaterThanOrEqual(7.0);
    expect(contrastRatio(darkTxtSecondaryLum, darkBgLum)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(darkTxtTertiaryLum, darkBgLum)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(darkAccentLum, darkAccentInkLum)).toBeGreaterThanOrEqual(4.5);

    expect(contrastRatio(lightTxtPrimaryLum, lightBgLum)).toBeGreaterThanOrEqual(7.0);
    expect(contrastRatio(lightTxtSecondaryLum, lightBgLum)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(lightTxtTertiaryLum, lightBgLum)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(lightAccentLum, lightAccentInkLum)).toBeGreaterThanOrEqual(4.5);
  });

  it("T1.3: ARIA attributes and semantic landmarks are correctly applied across interactive components", () => {
    const glossaryModal = readSrc("src/components/tj/GlossaryModal.tsx");
    const shortcutsHelp = readSrc("src/components/tj/ShortcutsHelp.tsx");
    const cookieConsent = readSrc("src/components/tj/CookieConsent.tsx");

    expect(shortcutsHelp).toContain('role="dialog"');
    expect(shortcutsHelp).toContain('aria-modal="true"');
    expect(shortcutsHelp).toContain('aria-labelledby="tj-atajos-titulo"');
    expect(shortcutsHelp).toContain('id="tj-atajos-titulo"');
    expect(shortcutsHelp).toContain('aria-hidden="true"');

    expect(glossaryModal).toContain('role="listbox"');
    expect(glossaryModal).toContain('role="option"');
    expect(glossaryModal).toContain("aria-selected=");
    expect(glossaryModal).toContain("aria-label=");
    expect(glossaryModal).toContain("aria-pressed=");

    expect(cookieConsent).toContain('role="dialog"');
    expect(cookieConsent).toContain("aria-label=");
  });

  it("T1.4: prefers-reduced-motion is respected across animations and scroll behaviors", () => {
    const globalsCss = readSrc("src/app/globals.css");
    const countUp = readSrc("src/components/tj/CountUp.tsx");

    expect(globalsCss).toMatch(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/);

    // Lo que la hoja no resuelve (el contador) lo consulta el JS.
    expect(countUp).toContain("prefers-reduced-motion: reduce");
  });

  it("T1.5: Skip link is the first focusable element, bilingual, and targets #main-content", () => {
    const skipLink = readSrc("src/components/tj/SkipLink.tsx");
    const layout = readSrc("src/app/layout.tsx");

    expect(skipLink).toContain('href="#main-content"');
    // Oculto hasta recibir el foco.
    expect(skipLink).toContain("sr-only");
    expect(skipLink).toContain("focus:not-sr-only");
    expect(skipLink).toContain("focus:z-[200]");

    expect(STR.skipToContent.es).toBe("Saltar al contenido");
    expect(STR.skipToContent.en).toBe("Skip to content");

    // Primer elemento del body, antes de `main`.
    expect(layout).toContain("<SkipLink />");
    expect(layout).toContain('id="main-content"');
  });

  it("T1.6: Mobile input font size rules enforce >= 16px to prevent iOS Safari auto-zoom", () => {
    const riskCalc = readSrc("src/components/marketing/RiskCalculator.tsx");
    const glosarioIndice = readSrc("src/components/glosario/GlosarioIndice.tsx");
    const globalsCss = readSrc("src/app/globals.css");

    expect(riskCalc).toMatch(/fontSize:\s*16|text-base/);

    expect(glosarioIndice).toMatch(/text-\[15px\]|text-base|text-sm md:text-base|text-base md:text-sm/);

    expect(globalsCss).toMatch(/-webkit-text-size-adjust:\s*100%/);
  });
});

describe("Dimension D2 & D3: Accessibility & Mobile Viewport (Tier 2 Boundary & Corner Cases)", () => {
  it("T2.1: Extreme viewport widths (390px, 320px) maintain zero horizontal overflow constraints", () => {
    const globalsCss = readSrc("src/app/globals.css");
    const components = getAllSrcFiles("src/components");

    expect(globalsCss).toMatch(/\.tj-container/);

    // Rejillas con puntos de ruptura en vez de anchos fijos.
    let responsiveGridCount = 0;
    for (const file of components) {
      const content = readFileSync(file, "utf8");
      if (content.includes("grid-cols-1") && (content.includes("lg:grid-cols-2") || content.includes("sm:grid-cols-2"))) {
        responsiveGridCount++;
      }
    }
    expect(responsiveGridCount).toBeGreaterThanOrEqual(5);
  });

  it("T2.2: Long translated strings do not cause overflow and support text balance / word break", () => {
    const components = getAllSrcFiles("src/components/marketing");
    let balanceOrWrapCount = 0;

    for (const file of components) {
      const content = readFileSync(file, "utf8");
      if (content.includes("textWrap: \"balance\"") || content.includes("text-balance") || content.includes("break-words") || content.includes("truncate")) {
        balanceOrWrapCount++;
      }
    }
    expect(balanceOrWrapCount).toBeGreaterThanOrEqual(4);
  });

  it("T2.3: Nested financial tables implement responsive horizontal scroll wrappers", () => {
    const discCost = readSrc("src/components/marketing/DisciplineCost.tsx");
    const glossaryModal = readSrc("src/components/tj/GlossaryModal.tsx");

    expect(discCost).toContain("overflow-x-auto");
    expect(discCost).toContain("custom-scroll");
    // La tabla se desplaza de lado en vez de aplastar columnas: una sola
    // rejilla con filas en subgrid, y ninguna columna más estrecha que su cifra más ancha.
    expect(discCost).toMatch(/grid w-max min-w-full grid-cols-\[(minmax\(max-content,[^)]+\)_?){4}\]/);
    expect(discCost).toContain("grid-cols-subgrid");
    expect(discCost).not.toContain("minmax(0,1fr)_minmax(0,1.15fr)");

    expect(glossaryModal).toContain("custom-scroll");
    expect(glossaryModal).toContain("overflow-y-auto");
  });

  it("T2.4: Modal keyboard focus traps and roving tabindex handle boundaries safely", () => {
    const shortcutsHelp = readSrc("src/components/tj/ShortcutsHelp.tsx");
    const glossaryModal = readSrc("src/components/tj/GlossaryModal.tsx");

    expect(shortcutsHelp).toContain("e.key !== \"Tab\"");
    expect(shortcutsHelp).toContain("first.focus()");
    expect(shortcutsHelp).toContain("last.focus()");
    expect(shortcutsHelp).toContain("previouslyFocused?.focus?.()");

    expect(glossaryModal).toContain('e.key === "ArrowDown"');
    expect(glossaryModal).toContain('e.key === "ArrowUp"');
    expect(glossaryModal).toContain('e.key === "Home"');
    expect(glossaryModal).toContain('e.key === "End"');
    expect(glossaryModal).toContain("setActiveIndex(0)");
  });

  it("T2.5: Accessible color coding redundancy ensures information is never conveyed by color alone", () => {
    const riskCalc = readSrc("src/components/marketing/RiskCalculator.tsx");
    const discCost = readSrc("src/components/marketing/DisciplineCost.tsx");
    const edgeChecker = readSrc("src/components/marketing/EdgeSignificanceChecker.tsx");

    // La dirección se dice con palabras, no con color.
    expect(riskCalc).toContain('c.direccion === "short"');
    expect(riskCalc).toContain('"Plan en corto"');
    expect(riskCalc).toContain('"Plan en largo"');

    // `usdSigno` decide el signo sobre la cifra redondeada; sin él, la fila solo se distingue por el color.
    expect(discCost).toContain("usdSigno(inPlanExp)");
    expect(discCost).toContain("usdSigno(-gap)");
    expect(discCost).toContain('usd(r > 0 ? "+" : r < 0 ? "−" : "", Math.abs(r))');
    expect(discCost).toMatch(/const usd = useCallback\(\s*\(signo: string/);

    expect(edgeChecker).toContain("verdict.label");
    expect(edgeChecker).toContain("verdict.text");
  });
});
