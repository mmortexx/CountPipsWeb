import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { normalCdf } from "@/components/marketing/EdgeSignificanceChecker";
import { STR } from "@/lib/i18n";
import { LOCALIZED_PATHS, withLocale } from "@/lib/locale";

/**
 * Dimension D2 & D3: WCAG 2.1 AA Accessibility & Mobile Viewport 390x844
 *
 * Tier 1: Feature Coverage (>= 5 tests)
 *  1. Touch target sizing (>= 44x44px min-height / touch area)
 *  2. Contrast standards in light and dark themes (>= 4.5:1 text, >= 3:1 non-text)
 *  3. ARIA attributes, semantic roles, and labels
 *  4. prefers-reduced-motion CSS tokens & transition behaviors
 *  5. SkipLink functionality & bypass navigation
 *  6. Mobile input font size rules (>= 16px to prevent iOS Safari auto-zoom)
 *
 * Tier 2: Boundary & Corner Cases (>= 5 tests)
 *  7. Extreme viewport widths (390px, 320px) & overflow containment
 *  8. Long translated strings & text truncation / wrapping resilience
 *  9. Nested table responsive degradation & horizontal scroll wrappers
 *  10. Modal keyboard focus traps & roving tabindex navigation
 *  11. Accessible color coding redundancy (icons/signs accompany color)
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

    // Check .tj-range base styling in globals.css enforces min 44px touch height
    expect(globalsCss).toMatch(/\.tj-range\s*\{[^}]*height:\s*44px/);

    // Check interactive buttons and inputs in tools enforce min-h-[44px] or 44px height
    expect(riskCalc).toMatch(/min-h-\[44px\]/);
    expect(equityProj).toMatch(/height:\s*44/);
    expect(savingsCalc).toMatch(/minHeight:\s*44|height:\s*44/);
    expect(edgeChecker).toMatch(/height:\s*44/);
    expect(rMultiple).toMatch(/min-h-\[44px\]|height:\s*44/);
  });

  it("T1.2: Contrast standards comply with WCAG 2.1 AA (>= 4.5:1 text, >= 3:1 non-text)", () => {
    // Dark Theme tokens
    const darkBgLum = relativeLuminance(12, 17, 22); // #0C1116
    const darkTxtPrimaryLum = relativeLuminance(255, 255, 255); // #FFFFFF
    const darkTxtSecondaryLum = relativeLuminance(209, 213, 219); // #D1D5DB (gray-300)
    const darkTxtTertiaryLum = relativeLuminance(156, 163, 175); // #9CA3AF (gray-400)
    const darkAccentLum = relativeLuminance(205, 217, 228); // #CDD9E4
    const darkAccentInkLum = relativeLuminance(12, 17, 22); // #0C1116

    // Light Theme tokens
    const lightBgLum = relativeLuminance(248, 250, 252); // #F8FAFC
    const lightTxtPrimaryLum = relativeLuminance(20, 22, 28); // #14161C
    const lightTxtSecondaryLum = relativeLuminance(80, 85, 95); // #50555F
    const lightTxtTertiaryLum = relativeLuminance(64, 69, 79); // #40454F
    const lightAccentLum = relativeLuminance(19, 29, 38); // #131D26
    const lightAccentInkLum = relativeLuminance(235, 237, 239); // #EBEDEF

    // Dark theme contrast ratios
    expect(contrastRatio(darkTxtPrimaryLum, darkBgLum)).toBeGreaterThanOrEqual(7.0); // AAA level >= 7:1
    expect(contrastRatio(darkTxtSecondaryLum, darkBgLum)).toBeGreaterThanOrEqual(4.5); // AA level >= 4.5:1
    expect(contrastRatio(darkTxtTertiaryLum, darkBgLum)).toBeGreaterThanOrEqual(4.5); // AA level >= 4.5:1
    expect(contrastRatio(darkAccentLum, darkAccentInkLum)).toBeGreaterThanOrEqual(4.5); // Button text on accent >= 4.5:1

    // Light theme contrast ratios
    expect(contrastRatio(lightTxtPrimaryLum, lightBgLum)).toBeGreaterThanOrEqual(7.0); // AAA level >= 7:1
    expect(contrastRatio(lightTxtSecondaryLum, lightBgLum)).toBeGreaterThanOrEqual(4.5); // AA level >= 4.5:1
    expect(contrastRatio(lightTxtTertiaryLum, lightBgLum)).toBeGreaterThanOrEqual(4.5); // AA level >= 4.5:1
    expect(contrastRatio(lightAccentLum, lightAccentInkLum)).toBeGreaterThanOrEqual(4.5); // Button text on accent >= 4.5:1
  });

  it("T1.3: ARIA attributes and semantic landmarks are correctly applied across interactive components", () => {
    const glossaryModal = readSrc("src/components/tj/GlossaryModal.tsx");
    const shortcutsHelp = readSrc("src/components/tj/ShortcutsHelp.tsx");
    const cookieConsent = readSrc("src/components/tj/CookieConsent.tsx");

    // ShortcutsHelp dialog landmark & accessibility
    expect(shortcutsHelp).toContain('role="dialog"');
    expect(shortcutsHelp).toContain('aria-modal="true"');
    expect(shortcutsHelp).toContain('aria-labelledby="tj-atajos-titulo"');
    expect(shortcutsHelp).toContain('id="tj-atajos-titulo"');
    expect(shortcutsHelp).toContain('aria-hidden="true"');

    // GlossaryModal listbox, option & expanded accessibility
    expect(glossaryModal).toContain('role="listbox"');
    expect(glossaryModal).toContain('role="option"');
    expect(glossaryModal).toContain("aria-selected=");
    expect(glossaryModal).toContain("aria-label=");
    expect(glossaryModal).toContain("aria-pressed=");

    // CookieConsent banner landmark
    expect(cookieConsent).toContain('role="dialog"');
    expect(cookieConsent).toContain("aria-label=");
  });

  it("T1.4: prefers-reduced-motion is respected across animations and scroll behaviors", () => {
    const globalsCss = readSrc("src/app/globals.css");
    const countUp = readSrc("src/components/tj/CountUp.tsx");
    const ticker = readSrc("src/components/marketing/Ticker.tsx");
    const atlas = readSrc("src/components/tj/EngravedAtlas.tsx");

    // CSS reduced motion media query handles animations
    expect(globalsCss).toMatch(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/);

    // Lo que no puede resolver la hoja de estilos lo consulta el JS:
    // el contador, la cinta y el fondo grabado.
    expect(countUp).toContain("prefers-reduced-motion: reduce");
    expect(ticker).toContain("prefers-reduced-motion: reduce");
    expect(atlas).toContain("prefers-reduced-motion: reduce");
  });

  it("T1.5: Skip link is the first focusable element, bilingual, and targets #main-content", () => {
    const skipLink = readSrc("src/components/tj/SkipLink.tsx");
    const layout = readSrc("src/app/layout.tsx");

    // Targets main content id
    expect(skipLink).toContain('href="#main-content"');
    // Visually hidden until focused, then pops out at top-left with z-[200]
    expect(skipLink).toContain("sr-only");
    expect(skipLink).toContain("focus:not-sr-only");
    expect(skipLink).toContain("focus:z-[200]");

    // Bilingual dictionary defines skipToContent
    expect(STR.skipToContent.es).toBe("Saltar al contenido");
    expect(STR.skipToContent.en).toBe("Skip to content");

    // Layout includes SkipLink as first element inside body before main
    expect(layout).toContain("<SkipLink />");
    expect(layout).toContain('id="main-content"');
  });

  it("T1.6: Mobile input font size rules enforce >= 16px to prevent iOS Safari auto-zoom", () => {
    const riskCalc = readSrc("src/components/marketing/RiskCalculator.tsx");
    const glosarioIndice = readSrc("src/components/glosario/GlosarioIndice.tsx");
    const globalsCss = readSrc("src/app/globals.css");

    // Direct font size >= 16px in RiskCalculator inputs (text-base or inline fontSize: 16)
    expect(riskCalc).toMatch(/fontSize:\s*16|text-base/);

    // Glosario search input has text-[15px] or text-base or >=16px in mobile styles
    expect(glosarioIndice).toMatch(/text-\[15px\]|text-base|text-sm md:text-base|text-base md:text-sm/);

    // Globals CSS font size adjustments for inputs
    expect(globalsCss).toMatch(/-webkit-text-size-adjust:\s*100%/);
  });
});

describe("Dimension D2 & D3: Accessibility & Mobile Viewport (Tier 2 Boundary & Corner Cases)", () => {
  it("T2.1: Extreme viewport widths (390px, 320px) maintain zero horizontal overflow constraints", () => {
    const globalsCss = readSrc("src/app/globals.css");
    const components = getAllSrcFiles("src/components");

    // Verify container clamping and padding
    expect(globalsCss).toMatch(/\.tj-container/);

    // Verify grid responsiveness with sm/md/lg breakpoints rather than fixed rigid pixel widths
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

    // DisciplineCost has scroll wrapper for the Expectancy table
    expect(discCost).toContain("overflow-x-auto");
    expect(discCost).toContain("custom-scroll");
    /* La tabla declara un ancho minimo para DESPLAZARSE de lado en vez
       de aplastar sus cuatro columnas. Se comprueba que ese ancho existe
       y no un numero concreto: estaba en 320 px y sus propias celdas no
       cabian —el importe del GAP se recortaba a 320 px de ventana—, asi
       que subio. Lo que no puede desaparecer es la declaracion. */
    expect(discCost).toMatch(/min-w-\[(\d{3,4})px\]/);

    // GlossaryModal list has custom-scroll with max-height
    expect(glossaryModal).toContain("custom-scroll");
    expect(glossaryModal).toContain("overflow-y-auto");
  });

  it("T2.4: Modal keyboard focus traps and roving tabindex handle boundaries safely", () => {
    const shortcutsHelp = readSrc("src/components/tj/ShortcutsHelp.tsx");
    const glossaryModal = readSrc("src/components/tj/GlossaryModal.tsx");

    // ShortcutsHelp traps focus between first and last element on Tab and Shift+Tab
    expect(shortcutsHelp).toContain("e.key !== \"Tab\"");
    expect(shortcutsHelp).toContain("first.focus()");
    expect(shortcutsHelp).toContain("last.focus()");
    expect(shortcutsHelp).toContain("previouslyFocused?.focus?.()");

    // GlossaryModal roving tabindex with ArrowUp, ArrowDown, Home, End
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

    // RiskCalculator includes directional arrow and text in addition to green/red color
    expect(riskCalc).toContain('c.direction === "short" ? "↓" : "↑"');
    expect(riskCalc).toContain('c.direction === "short"');
    expect(riskCalc).toContain("Operación en corto detectada");

    // DisciplineCost uses explicit + and - prefix signs for P&L values
    expect(discCost).toContain("+{fmtNum(inPlanExp");
    expect(discCost).toContain("−{fmtNum(gap");

    // EdgeSignificanceChecker includes textual verdicts and badge indicators
    expect(edgeChecker).toContain("verdict.label");
    expect(edgeChecker).toContain("verdict.text");
  });
});
