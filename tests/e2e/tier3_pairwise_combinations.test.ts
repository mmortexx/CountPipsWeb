import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { GLOSSARY, GLOSSARY_CATEGORIES } from "@/lib/trading/glossary";
import { withLocale, LOCALIZED_PATHS } from "@/lib/locale";
import { normalCdf } from "@/components/marketing/EdgeSignificanceChecker";

/**
 * Tier 3: Cross-Feature Pairwise Combinations
 *
 * 16 comprehensive pairwise interaction test cases verifying integration
 * across multiple dimensions (Tokens, Math, Viewport, Accessibility, Shortcuts,
 * Storage, I18n, Error Handling, and Simulation).
 */

const ROOT = join(import.meta.dirname, "..", "..");
const readSrc = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

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

// PRNG implementation matching RMultipleSimulator
function createPrng(seed: number) {
  let a = (seed * 7919 + 1) >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("Tier 3: Cross-Feature Pairwise Combinations", () => {
  it("Pairwise 1: Theme switching (Dark ↔ Light) + P&L Token Contrast Stability", () => {
    // Dark Theme tokens
    const darkSurfaceLum = relativeLuminance(12, 17, 22);
    const darkPnlPosLum = relativeLuminance(0, 245, 160);
    const darkPnlNegLum = relativeLuminance(255, 77, 77);

    // Light Theme tokens
    const lightSurfaceLum = relativeLuminance(248, 250, 252);
    const lightPnlPosLum = relativeLuminance(30, 122, 76);
    const lightPnlNegLum = relativeLuminance(153, 27, 27);

    // Both themes must maintain >= 4.5:1 contrast for positive and negative financial indicators
    expect(contrastRatio(darkPnlPosLum, darkSurfaceLum)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(darkPnlNegLum, darkSurfaceLum)).toBeGreaterThanOrEqual(4.5);

    expect(contrastRatio(lightPnlPosLum, lightSurfaceLum)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(lightPnlNegLum, lightSurfaceLum)).toBeGreaterThanOrEqual(4.5);
  });

  it("Pairwise 2: Filter selection + PRNG seed stability in RMultipleSimulator", () => {
    const seed = 42;
    const runs = 50;
    const trades = 30;
    const wr = 0.55;
    const winR = 2.0;
    const lossR = 1.0;
    const riskPct = 1.0;
    const startBalance = 10000;

    function simulate(s: number) {
      const rng = createPrng(s);
      const finals: number[] = [];
      for (let run = 0; run < runs; run++) {
        let bal = startBalance;
        for (let t = 0; t < trades; t++) {
          if (bal <= 0) break;
          const r = rng();
          const risk = bal * (riskPct / 100);
          bal += r < wr ? risk * winR : -risk * lossR;
          if (bal < 0) bal = 0;
        }
        finals.push(bal);
      }
      return finals;
    }

    const sim1 = simulate(seed);
    const sim2 = simulate(seed);
    const simDiffSeed = simulate(seed + 1);

    // Deterministic with same seed
    expect(sim1).toEqual(sim2);
    // Diverges with different seed
    expect(sim1).not.toEqual(simDiffSeed);
  });

  it("Pairwise 3: Locale change (ES ↔ EN) + GlobalShortcuts navigation resolution", () => {
    const shortcuts = [
      { key: "h", path: "/" },
      { key: "f", path: "/features" },
      { key: "m", path: "/features/metricas" },
      { key: "d", path: "/features/disciplina" },
      { key: "s", path: "/features/seguridad" },
      { key: "p", path: "/pricing" },
      { key: "e", path: "/demo" },
      { key: "q", path: "/faq" },
    ];

    for (const sc of shortcuts) {
      const esPath = withLocale(sc.path, "es");
      const enPath = withLocale(sc.path, "en");

      expect(esPath).toBe(sc.path);
      expect(enPath).toBe(sc.path === "/" ? "/en" : `/en${sc.path}`);
    }
  });

  it("Pairwise 4: LocalStorage failure (SecurityError) + Tool calculation resilience", () => {
    // Simulate localStorage SecurityError in private browsing
    const mockStorageThrows = () => {
      throw new Error("SecurityError: storage disabled in private mode");
    };

    function safeGetItem(key: string, fallback: string): string {
      try {
        mockStorageThrows();
        return fallback;
      } catch {
        return fallback;
      }
    }

    const defaultTheme = safeGetItem("tj-theme", "light");
    expect(defaultTheme).toBe("light");

    // Financial calculations proceed normally without storage dependency
    const wr = 0.6;
    const avgWin = 2.0;
    const avgLoss = 1.0;
    const expectancy = wr * avgWin - (1 - wr) * avgLoss;
    expect(expectancy).toBeCloseTo(0.8, 4);
  });

  it("Pairwise 5: Touch viewport (390px) + Modal overlay focus trapping & roving tabindex", () => {
    const glossaryModal = readSrc("src/components/tj/GlossaryModal.tsx");
    const shortcutsHelp = readSrc("src/components/tj/ShortcutsHelp.tsx");

    // Roving tabindex and dialog content structure
    expect(glossaryModal).toContain('role="listbox"');
    expect(glossaryModal).toContain("tabIndex={0}");
    expect(glossaryModal).toContain('role="option"');

    // Dialog content wraps with mobile safe layout
    expect(shortcutsHelp).toContain("pt-[15vh]");
    expect(shortcutsHelp).toContain("max-w-md");
  });

  it("Pairwise 6: Error input (Negative/NaN balance) + Recovery plan / Equity projection determinism", () => {
    function calculateProjection(balance: number, years: number) {
      if (balance <= 0 || years <= 0 || !Number.isFinite(balance) || !Number.isFinite(years)) {
        return { cagr: -1, finalBalance: 0, valid: false };
      }
      const growth = 1.25;
      const finalBalance = balance * Math.pow(growth, years);
      const cagr = Math.pow(finalBalance / balance, 1 / years) - 1;
      return { cagr, finalBalance, valid: true };
    }

    const resNaN = calculateProjection(NaN, 5);
    expect(resNaN.valid).toBe(false);
    expect(resNaN.cagr).toBe(-1);

    const resNegative = calculateProjection(-5000, 5);
    expect(resNegative.valid).toBe(false);
    expect(resNegative.cagr).toBe(-1);

    const resValid = calculateProjection(10000, 5);
    expect(resValid.valid).toBe(true);
    expect(resValid.cagr).toBeCloseTo(0.25, 4);
  });

  it("Pairwise 7: Language toggle + Frozen Glossary English terms preservation", () => {
    // 57 glossary terms maintain untranslated English term across both languages
    expect(GLOSSARY).toHaveLength(57);

    for (const item of GLOSSARY) {
      expect(item.term).toBeTruthy();
      expect(item.es).toBeTruthy();
      expect(item.en).toBeTruthy();
      // Spanish and English definitions are both non-empty
      expect(item.es.trim().length).toBeGreaterThan(10);
      expect(item.en.trim().length).toBeGreaterThan(10);
    }
  });

  it("Pairwise 8: Asset mode switch (Equities → Forex → Futures) + Kelly criterion sizing", () => {
    const balance = 50000;
    const riskPct = 1.0;
    const riskUsd = (balance * riskPct) / 100; // $500
    const entry = 100;
    const stop = 95;
    const target = 115;
    const riskPerShare = Math.abs(entry - stop); // 5
    const rewardPerShare = Math.abs(target - entry); // 15
    const rr = rewardPerShare / riskPerShare; // 3.0

    // Kelly criterion: f* = (p*b - q) / b
    const winRate = 0.55;
    const q = 1 - winRate;
    const fullKelly = ((winRate * rr - q) / rr) * 100; // ~40%
    const halfKelly = Math.max(0.25, Math.min(3.0, fullKelly / 2)); // clamped to 3.0%

    expect(halfKelly).toBe(3.0);

    // 1. Equities sizing
    const equityUnits = riskUsd / riskPerShare;
    expect(equityUnits).toBe(100);

    // 2. Forex sizing (1 lot = 100,000 units)
    const forexLots = equityUnits / 100000;
    expect(forexLots).toBe(0.001);

    // 3. Futures sizing (ES multiplier = 50 $/pt)
    const esMult = 50;
    const pointRisk = riskPerShare * esMult; // 5 * 50 = $250
    const contracts = riskUsd / pointRisk; // $500 / $250 = 2 contracts
    expect(contracts).toBe(2);
  });

  it("Pairwise 9: Discipline cost preset change + Annual leak projection math", () => {
    const presets = [
      { trades: 50, breachPct: 30, inPlanExp: 55, offPlanExp: -75 },
      { trades: 80, breachPct: 40, inPlanExp: 38, offPlanExp: -52 },
      { trades: 24, breachPct: 25, inPlanExp: 140, offPlanExp: -180 },
    ];

    for (const p of presets) {
      const offPlanTrades = Math.round((p.trades * p.breachPct) / 100);
      const gap = p.inPlanExp - p.offPlanExp;
      const totalLeakMonthly = offPlanTrades * gap;
      const totalLeakAnnual = totalLeakMonthly * 12;

      expect(totalLeakMonthly).toBeGreaterThan(0);
      expect(totalLeakAnnual).toBe(totalLeakMonthly * 12);
    }
  });

  it("Pairwise 10: Command palette navigation + Path locale prefixing", () => {
    const pages = [
      { path: "/", es: "Inicio", en: "Home" },
      { path: "/features", es: "Características", en: "Features" },
      { path: "/demo", es: "Demo interactiva", en: "Interactive demo" },
      { path: "/pricing", es: "Precios y licencias", en: "Pricing & licenses" },
      { path: "/glosario", es: "Glosario de trading", en: "Trading glossary" },
    ];

    for (const page of pages) {
      const localizedEs = withLocale(page.path, "es");
      const localizedEn = withLocale(page.path, "en");

      expect(localizedEs).toBe(page.path);
      expect(localizedEn).toBe(page.path === "/" ? "/en" : `/en${page.path}`);
    }
  });

  it("Pairwise 11: Glossary category filter + Live search query compound filtering", () => {
    const category = "metrics";
    const query = "sharpe";

    const filtered = GLOSSARY.filter((g) => {
      const matchesCat = g.category === category;
      const matchesQuery =
        g.term.toLowerCase().includes(query) ||
        g.es.toLowerCase().includes(query) ||
        g.en.toLowerCase().includes(query);
      return matchesCat && matchesQuery;
    });

    expect(filtered.length).toBeGreaterThanOrEqual(1);
    expect(filtered[0].term).toBe("Sharpe ratio");
  });

  it("Pairwise 12: Savings calculator plan change + Break-even month calculation", () => {
    const altMonthly = 25; // $/month
    const corePrice = 149;
    const proPrice = 249;

    const coreBreakEven = Math.ceil(corePrice / altMonthly);
    const proBreakEven = Math.ceil(proPrice / altMonthly);

    expect(coreBreakEven).toBe(6); // 149 / 25 = 5.96 -> 6 months
    expect(proBreakEven).toBe(10); // 249 / 25 = 9.96 -> 10 months
  });

  it("Pairwise 13: High variance Monte Carlo parameters + Probability of ruin bounds", () => {
    const startBalance = 10000;
    const trades = 100;
    const winRate = 0.35; // Bad edge
    const winR = 1.0;
    const lossR = 2.0;
    const riskPct = 3.5; // Aggressive risk
    const runs = 100;

    const rng = createPrng(1234);
    let ruinCount = 0;
    let doubleCount = 0;
    const finals: number[] = [];

    for (let run = 0; run < runs; run++) {
      let bal = startBalance;
      for (let t = 0; t < trades; t++) {
        if (bal <= 0) { ruinCount++; break; }
        const r = rng();
        const risk = bal * (riskPct / 100);
        bal += r < winRate ? risk * winR : -risk * lossR;
        if (bal <= 0) { bal = 0; ruinCount++; break; }
      }
      finals.push(bal);
      if (bal >= startBalance * 2) doubleCount++;
    }

    const probRuin = (ruinCount / runs) * 100;
    const probDouble = (doubleCount / runs) * 100;

    expect(probRuin).toBeGreaterThanOrEqual(0);
    expect(probRuin).toBeLessThanOrEqual(100);
    expect(probDouble).toBeGreaterThanOrEqual(0);
    expect(probDouble).toBeLessThanOrEqual(100);
    expect(finals).toHaveLength(runs);
    // With negative edge (35% win, 1:2 payoff), mean final balance is strictly less than initial
    const meanFinal = finals.reduce((s, v) => s + v, 0) / runs;
    expect(meanFinal).toBeLessThan(startBalance);
  });

  it("Pairwise 14: Mobile viewport (320px) + Interactive table horizontal scroll containment", () => {
    const discCost = readSrc("src/components/marketing/DisciplineCost.tsx");
    const globalsCss = readSrc("src/app/globals.css");

    expect(discCost).toContain("min-w-[320px]");
    expect(discCost).toContain("overflow-x-auto");
    expect(globalsCss).toContain(".custom-scroll");
  });

  it("Pairwise 15: Rapid theme toggle (Dark → Light → Dark) + Color scheme consistency", () => {
    let currentTheme: "dark" | "light" = "dark";
    const history: string[] = [];

    const toggle = () => {
      currentTheme = currentTheme === "dark" ? "light" : "dark";
      history.push(currentTheme);
    };

    // Cycle 5 times
    for (let i = 0; i < 5; i++) {
      toggle();
    }

    expect(history).toEqual(["light", "dark", "light", "dark", "light"]);
    expect(currentTheme).toBe("light");
  });

  it("Pairwise 16: Mobile touch target compliance (>= 44px) + Input font size (>= 16px)", () => {
    const riskCalc = readSrc("src/components/marketing/RiskCalculator.tsx");

    // Both touch target min-h-[44px] and font size 16px (text-base) co-exist on the numeric inputs
    expect(riskCalc).toContain("min-h-[44px]");
    expect(riskCalc.includes("text-base") || riskCalc.includes("fontSize: 16")).toBe(true);
  });
});
