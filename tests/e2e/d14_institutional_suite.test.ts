import { describe, expect, it } from "vitest";
import {
  TRADES,
  INSTRUMENT_MULTIPLIERS,
  getInstrumentMultiplier,
  computeSqn,
  computeUlcerIndex,
  computeDrawdownSkewness,
  computeHalfKelly,
  computeWilsonCI,
  computeGainToPain,
  type Trade,
} from "@/lib/trading/data";
import { GLOSSARY } from "@/lib/trading/glossary";
import { HERRAMIENTAS, herramientaPorSlug } from "@/lib/herramientas";
import { TERMINOS, terminoPorSlug, tituloDeTermino, CATEGORIAS } from "@/lib/glosario";
import { customTradeToTrade, mergeTrades, type CustomTrade } from "@/lib/trading/demoStore";

describe("D14: Suite Cuantitativa Institucional Integral", () => {
  describe("1. Directorio de 8 Herramientas Interactivas", () => {
    it("contiene exactamente 8 herramientas con sus slugs y componentes definidos", () => {
      expect(HERRAMIENTAS).toHaveLength(8);
      const slugs = [
        "calculadora-de-riesgo",
        "significancia-estadistica",
        "monte-carlo",
        "proyector-de-capital",
        "coste-de-indisciplina",
        "reloj-de-sesiones",
        "ahorro-vs-suscripcion",
        "impacto-de-comisiones",
      ];
      for (const s of slugs) {
        const h = herramientaPorSlug(s);
        expect(h, `Herramienta ${s} no encontrada`).toBeDefined();
        expect(h?.slug).toBe(s);
        expect(h?.tituloEs.length).toBeGreaterThan(0);
        expect(h?.tituloEn.length).toBeGreaterThan(0);
        expect(h?.h1Es.length).toBeGreaterThan(0);
        expect(h?.h1En.length).toBeGreaterThan(0);
        expect(h?.descripcionEs.length).toBeGreaterThan(0);
        expect(h?.descripcionEn.length).toBeGreaterThan(0);
      }
    });
  });

  describe("2. Glosario Cuantitativo Bilingüe de 57 Términos", () => {
    it("mantiene 57 términos congelados en inglés con definiciones simétricas ES y EN", () => {
      expect(GLOSSARY).toHaveLength(57);
      expect(TERMINOS).toHaveLength(57);

      for (const t of TERMINOS) {
        expect(t.slug.length).toBeGreaterThan(0);
        expect(t.term.length).toBeGreaterThan(0);
        expect(t.es.length).toBeGreaterThan(10);
        expect(t.en.length).toBeGreaterThan(10);
        expect(CATEGORIAS[t.category], `Categoría ${t.category} no existe`).toBeDefined();

        const titEs = tituloDeTermino(t.term, "es");
        const titEn = tituloDeTermino(t.term, "en");
        expect(titEs.length).toBeLessThanOrEqual(60);
        expect(titEn.length).toBeLessThanOrEqual(60);
      }
    });

    it("resuelve términos por slug y devuelve las voces cuantitativas recién añadidas", () => {
      expect(terminoPorSlug("sqn-system-quality-number")).toBeDefined();
      expect(terminoPorSlug("ulcer-index")).toBeDefined();
      expect(terminoPorSlug("drawdown-skewness")).toBeDefined();
      expect(terminoPorSlug("gain-to-pain-ratio")).toBeDefined();
      expect(terminoPorSlug("wald-wolfowitz-runs-test")).toBeDefined();
      expect(terminoPorSlug("wilson-score-interval")).toBeDefined();
    });
  });

  describe("3. Motor Cuantitativo y Fórmulas Institucionales", () => {
    it("SQN produce números finitos ante casos normales y 0 ante muestras pequeñas o sigma=0", () => {
      expect(computeSqn([])).toBe(0);
      expect(computeSqn([mockTrade()])).toBe(0);
      expect(computeSqn([mockTrade({ rMultiple: 1 }), mockTrade({ rMultiple: 1 })])).toBe(0);

      const realSqn = computeSqn(TRADES);
      expect(Number.isFinite(realSqn)).toBe(true);
      expect(realSqn).toBeGreaterThan(1.0);
    });

    it("Ulcer Index calcula la severidad cuadrática del drawdown con precisión", () => {
      expect(computeUlcerIndex([])).toBe(0);

      const flatTrades = [
        mockTrade({ id: 1, netPnl: 100, closedAt: new Date("2026-01-01T00:00:00Z") }),
        mockTrade({ id: 2, netPnl: 200, closedAt: new Date("2026-01-02T00:00:00Z") }),
      ];
      expect(computeUlcerIndex(flatTrades, 10000)).toBe(0);

      const realUI = computeUlcerIndex(TRADES, 10000);
      expect(Number.isFinite(realUI)).toBe(true);
      expect(realUI).toBeGreaterThan(0);
    });

    it("Drawdown Skewness evalúa la asimetría de cola de caídas", () => {
      expect(computeDrawdownSkewness([])).toBe(0);
      expect(computeDrawdownSkewness([mockTrade()])).toBe(0);
      expect(computeDrawdownSkewness([mockTrade(), mockTrade()])).toBe(0);

      const realSkew = computeDrawdownSkewness(TRADES, 10000);
      expect(Number.isFinite(realSkew)).toBe(true);
    });

    it("Half Kelly aplica el dimensionamiento óptimo de capital de forma conservadora", () => {
      // 55% win rate, payoff 1.5 -> b = 1.5, p = 0.55, q = 0.45
      // f* = (0.55 * 1.5 - 0.45) / 1.5 = (0.825 - 0.45) / 1.5 = 0.375 / 1.5 = 0.25 (25%)
      // Half Kelly = 25% / 2 = 12.5%
      const hk = computeHalfKelly(55, 1.5);
      expect(hk).toBeCloseTo(12.5, 2);

      // Sin ventaja (40% win rate, payoff 1.0) -> f* <= 0 -> 0%
      expect(computeHalfKelly(40, 1.0)).toBe(0);
    });

    it("Wilson Score Interval 95% proporciona cotas probabilísticas exactas", () => {
      const w = computeWilsonCI(50, 100); // 50% de 100
      expect(w.center).toBeCloseTo(50.0, 1);
      expect(w.lower).toBeGreaterThan(39.0);
      expect(w.upper).toBeLessThan(61.0);
      expect(w.margin).toBeGreaterThan(0);
    });

    it("Gain-to-Pain Ratio evalúa el retorno acumulado frente a pérdidas brutas", () => {
      const gpr = computeGainToPain(TRADES);
      expect(Number.isFinite(gpr)).toBe(true);
      expect(gpr).toBeGreaterThan(0);
    });

    it("Multiplicadores multi-activo oficiales cubren futuros CME y Forex estándar", () => {
      expect(INSTRUMENT_MULTIPLIERS["ES"]).toBe(50);
      expect(INSTRUMENT_MULTIPLIERS["NQ"]).toBe(20);
      expect(INSTRUMENT_MULTIPLIERS["MES"]).toBe(5);
      expect(INSTRUMENT_MULTIPLIERS["MNQ"]).toBe(2);
      expect(INSTRUMENT_MULTIPLIERS["RTY"]).toBe(50);
      expect(INSTRUMENT_MULTIPLIERS["GC"]).toBe(100);
      expect(INSTRUMENT_MULTIPLIERS["CL"]).toBe(1000);
      expect(INSTRUMENT_MULTIPLIERS["GER40"]).toBe(25);
      expect(INSTRUMENT_MULTIPLIERS["EURUSD"]).toBe(100000);

      expect(getInstrumentMultiplier("ES")).toBe(50);
      expect(getInstrumentMultiplier("UNKNOWN", "forex")).toBe(100000);
      expect(getInstrumentMultiplier("UNKNOWN", "futures")).toBe(50);
      expect(getInstrumentMultiplier("UNKNOWN", "stock")).toBe(1);
    });
  });

  describe("4. Reactividad y Conversión de Almacén de Demo", () => {
    it("sintetiza campos completos desde CustomTrade a Trade sin NaN", () => {
      const custom: CustomTrade = {
        id: 999999,
        instrument: "NQ",
        setup: "Breakout",
        direction: "long",
        entry: 18500,
        exit: 18550,
        qty: 2,
        netPnl: 2000,
        rMultiple: 2.5,
        compliance: "yes",
        closedAt: "2026-07-16T14:30:00.000Z",
        note: "Entrada limpia en rotura de máximos",
      };

      const trade = customTradeToTrade(custom);
      expect(trade.id).toBe(999999);
      expect(trade.instrument).toBe("NQ");
      expect(trade.session).toBe("NY");
      expect(trade.grossPnl).toBeGreaterThan(trade.netPnl);
      expect(trade.fees).toBeGreaterThan(0);
      expect(trade.riskUsd).toBe(800); // 2000 / 2.5
      expect(trade.initialStop).toBeLessThan(trade.entry);
      expect(trade.target).toBeGreaterThan(trade.entry);
      expect(Number.isFinite(trade.durationMin)).toBe(true);
    });

    it("combina operaciones de muestra con personalizadas ordenadas cronológicamente", () => {
      const custom: CustomTrade = {
        id: 999999,
        instrument: "ES",
        setup: "Pullback",
        direction: "short",
        entry: 5400,
        exit: 5380,
        qty: 1,
        netPnl: 1000,
        rMultiple: 2,
        compliance: "yes",
        closedAt: "2026-07-17T15:00:00.000Z", // Más reciente que TRADES (julio 16)
        note: "Operación de prueba",
      };

      const merged = mergeTrades(TRADES, [custom]);
      expect(merged.length).toBe(TRADES.length + 1);
      expect(merged[0].id).toBe(999999); // La primera por ser la más reciente
    });
  });
});

function mockTrade(overrides: Partial<Trade> = {}): Trade {
  return {
    id: 1,
    instrument: "ES",
    setup: "Breakout",
    direction: "long",
    session: "NY",
    entry: 5400,
    exit: 5420,
    qty: 1,
    grossPnl: overrides.netPnl ?? 1000,
    fees: 50,
    netPnl: overrides.netPnl ?? 950,
    rMultiple: overrides.rMultiple ?? 2,
    riskUsd: overrides.riskUsd ?? 500,
    plannedRr: 2.5,
    mae: -0.2,
    mfe: 2.2,
    initialStop: 5390,
    target: 5425,
    compliance: overrides.compliance ?? "yes",
    openedAt: overrides.openedAt ?? new Date("2026-01-01T14:30:00Z"),
    closedAt: overrides.closedAt ?? new Date("2026-01-01T15:30:00Z"),
    durationMin: 60,
    dayScore: 10,
    entryNote: "",
    closeNote: "",
    ...overrides,
  };
}
