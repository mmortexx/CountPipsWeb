import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { GLOSSARY, GLOSSARY_CATEGORIES } from "@/lib/trading/glossary";
import { withLocale } from "@/lib/locale";
import { filtraGlosario } from "@/components/tj/GlossaryModal";
import { PRESETS } from "@/components/marketing/DisciplineCost";
import { riesgoDeKelly } from "@/components/marketing/RiskCalculator";
import { costeIndisciplina } from "@/lib/trading/indisciplina";
import { simulaMonteCarlo, siguienteSemilla, type ParametrosMonteCarlo } from "@/lib/trading/montecarlo";
import { FUTURES_CONTRACTS, PARES_FOREX, calculaPlan, fraccionesKelly, type EntradaPlan } from "@/lib/trading/plan";
import { proyectaCapital, type ParametrosProyeccion } from "@/lib/trading/proyeccion";

/**
 * Nivel 3: combinaciones de dos funciones (tema, matemáticas, viewport,
 * accesibilidad, atajos, idioma y simulación) que se comprueban juntas, con
 * el código real de cada herramienta: `simulaMonteCarlo`, `proyectaCapital`,
 * `calculaPlan` con `fraccionesKelly`, `costeIndisciplina` y `filtraGlosario`.
 * El contraste de los tokens lo mide D8 con los valores de `globals.css`.
 */

const ROOT = join(import.meta.dirname, "..", "..");
const readSrc = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

const MONTE_CARLO: ParametrosMonteCarlo = {
  caminos: 50,
  startBalance: 10000,
  trades: 30,
  winRate: 55,
  avgWinR: 2,
  avgLossR: 1,
  riskPct: 1,
  monthlyWithdrawal: 0,
  seed: 42,
};

const PROYECCION: ParametrosProyeccion = {
  startBalance: 10000,
  tradesPerYear: 200,
  winRate: 55,
  avgWinR: 2,
  avgLossR: 1,
  riskPct: 1,
  years: 5,
  reinvestMode: "compound",
  monthlyContribution: 0,
  frictionR: 0,
};

describe("Tier 3: Cross-Feature Pairwise Combinations", () => {
  it("Pairwise 2: Seed change + PRNG stability in RMultipleSimulator (simulaMonteCarlo)", () => {
    const sim1 = simulaMonteCarlo(MONTE_CARLO);
    const sim2 = simulaMonteCarlo(MONTE_CARLO);
    // «Otra tirada» del simulador: la semilla siguiente.
    const otraTirada = simulaMonteCarlo({ ...MONTE_CARLO, seed: siguienteSemilla(MONTE_CARLO.seed) });

    // Misma semilla, mismo resultado; otra semilla, otro.
    expect(sim1).toEqual(sim2);
    expect(otraTirada.statsPerTrade).not.toEqual(sim1.statsPerTrade);
    // La esperanza no depende de la tirada.
    expect(otraTirada.expectancyR).toBe(sim1.expectancyR);
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

  it("Pairwise 5: Touch viewport (390px) + Modal overlay focus trapping & roving tabindex", () => {
    const glossaryModal = readSrc("src/components/tj/GlossaryModal.tsx");
    const shortcutsHelp = readSrc("src/components/tj/ShortcutsHelp.tsx");

    expect(glossaryModal).toContain('role="listbox"');
    expect(glossaryModal).toContain("tabIndex={0}");
    expect(glossaryModal).toContain('role="option"');

    expect(shortcutsHelp).toContain("pt-[15vh]");
    expect(shortcutsHelp).toContain("max-w-md");
  });

  it("Pairwise 6: Error input (Negative/NaN balance) + Recovery plan / Equity projection determinism", () => {
    // Un balance NaN no se enseña como cifra: se marca fuera de escala, sin tasa anual.
    const resNaN = proyectaCapital({ ...PROYECCION, startBalance: NaN });
    expect(resNaN.fueraDeEscala).toBe(true);
    expect(resNaN.cagr).toBe(-1);

    // Un balance negativo no da tasa anual, y desde el primer mes la curva no baja de cero.
    const resNegative = proyectaCapital({ ...PROYECCION, startBalance: -5000 });
    expect(resNegative.cagr).toBe(-1);
    expect(resNegative.monthlyPoints.slice(1).every((p) => p.balance >= 0)).toBe(true);
    expect(resNegative.finalBalance).toBe(0);

    // Con datos válidos, la proyección es determinista y sin ventaja no crece.
    expect(proyectaCapital(PROYECCION)).toEqual(proyectaCapital(PROYECCION));
    expect(proyectaCapital(PROYECCION).cagr).toBeGreaterThan(0);
    const sinVentaja = proyectaCapital({ ...PROYECCION, winRate: 50, avgWinR: 1 });
    expect(sinVentaja.cagr).toBe(0);
    expect(sinVentaja.finalBalance).toBe(PROYECCION.startBalance);
  });

  it("Pairwise 7: Language toggle + Frozen Glossary English terms preservation", () => {
    expect(GLOSSARY).toHaveLength(57);

    for (const item of GLOSSARY) {
      expect(item.term).toBeTruthy();
      expect(item.es).toBeTruthy();
      expect(item.en).toBeTruthy();
      expect(item.es.trim().length).toBeGreaterThan(10);
      expect(item.en.trim().length).toBeGreaterThan(10);
    }
  });

  it("Pairwise 8: Asset mode switch (Equities → Forex → Futures) + Kelly criterion sizing", () => {
    // 1 % de 50.000 $ con el stop a un tercio del objetivo (R:R 3), en los tres mercados.
    const base: EntradaPlan = {
      mercado: "equities",
      balance: 50000,
      riesgoPct: 1,
      entrada: 100,
      stop: 95,
      objetivo: 115,
      friccion: false,
      futuro: FUTURES_CONTRACTS.find((f) => f.id === "es")!,
      lote: "standard",
      par: PARES_FOREX.find((p) => p.id === "EUR/USD")!,
      tipoReferencia: null,
    };
    const acciones = calculaPlan(base);
    const futuros = calculaPlan({ ...base, mercado: "futures" });
    const forex = calculaPlan({ ...base, mercado: "forex", entrada: 1.1, stop: 1.095, objetivo: 1.115 });

    expect(acciones.tamano).toBe(100); // 500 $ / 5 $ por acción
    expect(futuros.tamano).toBe(2); // 5 puntos × 50 $ del ES = 250 $ por contrato
    expect(forex.tamano).toBeCloseTo(1, 9); // 50 pips × 10 $ por lote estándar = 500 $

    // Kelly depende del acierto y del R:R, no del mercado.
    const kelly = [acciones, futuros, forex].map((p) => fraccionesKelly(55, p.rr)!);
    for (const k of kelly) {
      expect(k.completo).toBeCloseTo(40, 6); // (0,55·3 − 0,45) / 3
      expect(k.medio).toBeCloseTo(20, 6);
      // El control de riesgo topa el medio Kelly al 3 %.
      expect(riesgoDeKelly(k.medio)).toBe(3);
    }
  });

  it("Pairwise 9: Discipline cost preset change + Annual leak projection math", () => {
    for (const p of PRESETS) {
      const c = costeIndisciplina(p.trades, p.breachPct, p.inPlanExp, p.offPlanExp);
      expect(c.sinCoste, p.id).toBe(false);
      expect(c.offPlanTrades + c.inPlanTrades, p.id).toBe(p.trades);
      expect(c.totalLeakMonthly, p.id).toBeCloseTo(c.offPlanTrades * (p.inPlanExp - p.offPlanExp), 9);
      expect(c.totalLeakMonthly, p.id).toBeGreaterThan(0);
      expect(c.totalLeakAnnual, p.id).toBe(c.totalLeakMonthly * 12);

      // Si fuera de plan rindiera más que dentro, no hay fuga que facturar.
      const alReves = costeIndisciplina(p.trades, p.breachPct, p.offPlanExp, p.inPlanExp);
      expect(alReves.sinCoste, p.id).toBe(true);
      expect(alReves.totalLeakMonthly, p.id).toBe(0);
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
    const sharpe = filtraGlosario("sharpe", "metrics", "es");
    expect(sharpe[0].term).toBe("Sharpe ratio");
    expect(sharpe.every((g) => g.category === "metrics")).toBe(true);
    // Otra familia con la misma búsqueda: nada.
    expect(filtraGlosario("sharpe", "risk", "es")).toEqual([]);
    // Sin mayúsculas ni tildes, en los dos idiomas.
    expect(filtraGlosario("SHARPE", "metrics", "en")).toEqual(sharpe);
    const conTilde = filtraGlosario("estadística", "all", "es");
    expect(conTilde.length).toBeGreaterThan(0);
    expect(filtraGlosario("estadistica", "all", "es")).toEqual(conTilde);

    // Sin búsqueda, cada familia da sus términos y entre todas, el glosario entero.
    expect(filtraGlosario("", "all", "es")).toEqual(GLOSSARY);
    const porFamilia = GLOSSARY_CATEGORIES.filter((c) => c.id !== "all").map((c) => filtraGlosario("", c.id, "es").length);
    expect(porFamilia.reduce((a, b) => a + b, 0)).toBe(GLOSSARY.length);
  });

  it("Pairwise 13: High variance Monte Carlo parameters + Probability of ruin bounds", () => {
    // Ventaja negativa (35 % de acierto, payoff 1:2) y riesgo agresivo del 3,5 %.
    const r = simulaMonteCarlo({
      ...MONTE_CARLO,
      caminos: 100,
      trades: 100,
      winRate: 35,
      avgWinR: 1,
      avgLossR: 2,
      riskPct: 3.5,
      seed: 12,
    });

    expect(r.expectancyR).toBeCloseTo(0.35 * 1 - 0.65 * 2, 12);
    for (const prob of [r.probRuin, r.probDouble, r.analyticalRuinProb]) {
      expect(prob).toBeGreaterThanOrEqual(0);
      expect(prob).toBeLessThanOrEqual(100);
    }
    // Sin ventaja la fórmula da ruina segura, y la simulación la ve en casi todos los caminos.
    expect(r.analyticalRuinProb).toBe(100);
    expect(r.probRuin).toBeGreaterThan(90);
    expect(r.probDouble).toBe(0);
    // El balance medio final baja del inicial.
    expect(r.finalMean).toBeLessThan(MONTE_CARLO.startBalance);
  });

  it("Pairwise 14: Mobile viewport (320px) + Interactive table horizontal scroll containment", () => {
    const discCost = readSrc("src/components/marketing/DisciplineCost.tsx");
    const globalsCss = readSrc("src/app/globals.css");

    // Una sola rejilla con filas en subgrid: un importe grande ensancha la
    // tabla y se desliza, no pisa la columna vecina.
    expect(discCost).toMatch(/grid w-max min-w-full grid-cols-\[(minmax\(max-content,[^)]+\)_?){4}\]/);
    expect(discCost).toContain("grid-cols-subgrid");
    expect(discCost).toContain("overflow-x-auto");
    expect(globalsCss).toContain(".custom-scroll");
  });

  it("Pairwise 16: Mobile touch target compliance (>= 44px) + Input font size (>= 16px)", () => {
    const riskCalc = readSrc("src/components/marketing/RiskCalculator.tsx");

    // Área táctil de 44 px y fuente de 16 px conviven en los campos numéricos.
    expect(riskCalc).toContain("min-h-[44px]");
    expect(riskCalc.includes("text-base") || riskCalc.includes("fontSize: 16")).toBe(true);
  });
});
