import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  TRADES,
  METRICS,
  INSTRUMENTS,
  SETUP_NAMES,
  SESSIONS,
  computeMetrics,
  heatmap,
  weekdayBreakdown,
  monthlyBreakdown,
  dailyPnlForMonth,
  rankByExpectancy,
  nombreSetup,
  type Trade,
} from "@/lib/trading/data";
import {
  DEMO_TRADES_KEY,
  customTradeToTrade,
  mergeTrades,
  getCustomTrades,
  addTrade,
  updateTrade,
  deleteTrade,
  resetToSample,
  type CustomTrade,
} from "@/lib/trading/demoStore";
import { ERRORES_INDISCIPLINA } from "@/components/marketing/DisciplineCost";
import { riesgoDeKelly } from "@/components/marketing/RiskCalculator";
import { contrasteVentaja, UMBRAL_RUINA_PCT } from "@/lib/trading/estadistica";
import { costeIndisciplina } from "@/lib/trading/indisciplina";
import { simulaMonteCarlo, type ParametrosMonteCarlo } from "@/lib/trading/montecarlo";
import { fraccionesKelly } from "@/lib/trading/plan";

/**
 * Nivel 4: escenarios de uso real que cruzan módulos: auditoría de 50
 * operaciones con el contraste de ventaja, Kelly en varios regímenes con el
 * tope del control de riesgo, calendario frente a mapa de calor, Monte Carlo,
 * ranking de setups bilingüe, ciclo de operaciones propias y factura de
 * indisciplina. Cada cifra sale de la función que usa la herramienta.
 */

// localStorage en memoria para el ejecutor de pruebas en Node.
class MockLocalStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

function createSyntheticTrade(overrides: Partial<Trade> & { id: number; netPnl: number; closedAt: Date }): Trade {
  const isWin = overrides.netPnl > 0;
  const entry = overrides.entry ?? 100;
  const exit = overrides.exit ?? (isWin ? 110 : 90);
  const rMultiple = overrides.rMultiple ?? (isWin ? 2.0 : -1.0);
  const fees = overrides.fees ?? Math.abs(overrides.netPnl) * 0.03;
  const grossPnl = overrides.grossPnl ?? overrides.netPnl + fees;
  const openedAt = overrides.openedAt ?? new Date(overrides.closedAt.getTime() - 3600000);

  return {
    id: overrides.id,
    instrument: overrides.instrument ?? "NQ",
    setup: overrides.setup ?? "Breakout",
    direction: overrides.direction ?? "long",
    session: overrides.session ?? "NY",
    entry,
    exit,
    qty: overrides.qty ?? 1,
    grossPnl,
    fees,
    netPnl: overrides.netPnl,
    rMultiple,
    riskUsd: overrides.riskUsd ?? (rMultiple !== 0 ? Math.abs(overrides.netPnl / rMultiple) : 50),
    plannedRr: overrides.plannedRr ?? 2.0,
    mae: overrides.mae ?? (isWin ? -0.2 : -1.0),
    mfe: overrides.mfe ?? (isWin ? 2.2 : 0.2),
    initialStop: overrides.initialStop ?? 95,
    target: overrides.target ?? 110,
    compliance: overrides.compliance ?? "yes",
    openedAt,
    closedAt: overrides.closedAt,
    durationMin: overrides.durationMin ?? 60,
    dayScore: overrides.dayScore ?? 10,
    entryNote: overrides.entryNote ?? "Synthetic trade",
    closeNote: overrides.closeNote ?? "Synthetic close",
  };
}

describe("Tier 4: Real-World Application Workloads & User Journeys", () => {
  let originalWindow: typeof globalThis.window;

  beforeEach(() => {
    originalWindow = globalThis.window;
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  it("Scenario 1: 50-Trade Sample Import and Comprehensive Statistical Audit", () => {
    const baseDate = new Date("2026-03-01T08:00:00Z");
    const sample50: Trade[] = [];

    // 29 ganadoras (58 %) y 21 perdedoras; ganancias de 160 a 240 $, pérdidas de −80 a −125 $.
    for (let i = 0; i < 50; i++) {
      const isWin = i < 29;
      const netPnl = isWin ? 160 + (i % 5) * 20 : -80 - (i % 4) * 15;
      const rMultiple = isWin ? +(netPnl / 100).toFixed(2) : +(netPnl / 100).toFixed(2);
      const closedAt = new Date(baseDate.getTime() + i * 86400000);
      sample50.push(
        createSyntheticTrade({
          id: i + 1,
          netPnl,
          rMultiple,
          closedAt,
          instrument: i % 2 === 0 ? "NQ" : "EURUSD",
        })
      );
    }

    const metrics = computeMetrics(sample50);

    expect(metrics.closedCount).toBe(50);
    expect(metrics.winRate).toBeCloseTo(0.58, 4);
    expect(metrics.wins).toBe(29);
    expect(metrics.losses).toBe(21);
    expect(metrics.expectancyR).toBeGreaterThan(0.5);
    expect(metrics.profitFactor).toBeGreaterThan(1.5);

    // ¿Ventaja o azar?, con el contraste de EdgeSignificanceChecker. Frente a un
    // 50 % (payoff 1:1), un 58 % de acierto con n = 50 aún no se distingue del azar.
    const unoAUno = contrasteVentaja(metrics.closedCount, metrics.winRate * 100, 1, 1);
    expect(unoAUno.z).toBeCloseTo(1.1314, 3); // (0,58 − 0,5)·√50 / 0,5
    expect(unoAUno.pValor).toBeCloseTo(0.1289, 3); // una cola
    expect(unoAUno.veredicto).toBe("no-significativo");

    // Con el payoff real de la muestra el acierto de equilibrio baja a 1 / (1 + payoff)
    // (≈ 34 %) y el mismo 58 % ya es ventaja sólida.
    expect(metrics.payoff).toBeGreaterThan(1.5);
    const conSuPayoff = contrasteVentaja(metrics.closedCount, metrics.winRate * 100, metrics.payoff, 1);
    expect(conSuPayoff.equilibrio).toBeCloseTo(1 / (1 + metrics.payoff), 12);
    expect(conSuPayoff.veredicto).toBe("solida");
  });

  it("Scenario 3: Kelly Position Sizing Dynamic Recalculation across Market Regimes", () => {
    // Kelly de la calculadora de riesgo y el riesgo que aplica su botón: medio
    // Kelly al paso de 0,05 y dentro del control (0,25-3 %).
    // Tendencia alcista (60 % de acierto, payoff 2,2): topado al 3 %.
    const regimeA = fraccionesKelly(60, 2.2);
    expect(regimeA.completo).toBeCloseTo((0.92 / 2.2) * 100, 9); // 41,82 %
    expect(regimeA.medio).toBeCloseTo(regimeA.completo / 2, 12);
    expect(regimeA.cuarto).toBeCloseTo(regimeA.completo / 4, 12);
    expect(riesgoDeKelly(regimeA.medio)).toBe(3);

    // Lateral (46 %, payoff 1,5): completo 10 %, medio 5 %, topado al 3 %.
    const regimeB = fraccionesKelly(46, 1.5);
    expect(regimeB.completo).toBeCloseTo(10, 9);
    expect(riesgoDeKelly(regimeB.medio)).toBe(3);

    // Ventaja escasa (51 %, 1:1): medio 1 %, dentro del control.
    expect(riesgoDeKelly(fraccionesKelly(51, 1).medio)).toBe(1);
    // Casi sin ventaja (50,2 %, 1:1): medio 0,2 %, sube al mínimo del control.
    expect(riesgoDeKelly(fraccionesKelly(50.2, 1).medio)).toBe(0.25);
    // Fuera del paso se redondea al más cercano.
    expect(riesgoDeKelly(1.23)).toBe(1.25);

    // Crisis (35 %, payoff 1,2): ventaja negativa, cero en todo.
    const regimeC = fraccionesKelly(35, 1.2);
    expect(regimeC).toEqual({ completo: 0, medio: 0, cuarto: 0 });
    expect(riesgoDeKelly(regimeC.medio)).toBe(0);
  });

  it("Scenario 4: Multi-Month Calendar PnL Rollups and Heatmap Cross-Verification", () => {
    // La suma mensual coincide con el resultado neto.
    const months = monthlyBreakdown(TRADES);
    expect(months.length).toBeGreaterThanOrEqual(1);
    const sumMonthly = months.reduce((s, m) => s + m.pnl, 0);
    expect(sumMonthly).toBeCloseTo(METRICS.netPnl, 2);

    // El desglose diario de julio de 2026 suma el total mensual.
    const julyDailyMap = dailyPnlForMonth(TRADES, 2026, 6); // Month index 6 = July
    let sumJulyDaily = 0;
    for (const val of julyDailyMap.values()) {
      sumJulyDaily += val;
    }
    const julyMonthObj = months.find((m) => m.month === "Jul");
    if (julyMonthObj) {
      expect(sumJulyDaily).toBeCloseTo(julyMonthObj.pnl, 2);
    }

    // El mapa de calor (5 días x 6 franjas) suma todas las operaciones entre semana.
    const grid = heatmap(TRADES);
    let totalHeatmapPnl = 0;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 6; c++) {
        totalHeatmapPnl += grid[r][c];
      }
    }

    const weekdayTrades = TRADES.filter((t) => {
      const day = t.closedAt.getUTCDay();
      return day >= 1 && day <= 5; // lunes a viernes
    });
    const expectedWeekdayPnl = weekdayTrades.reduce((s, t) => s + t.netPnl, 0);
    expect(totalHeatmapPnl).toBeCloseTo(expectedWeekdayPnl, 2);
  });

  it("Scenario 5: Monte Carlo Risk of Ruin & Tail Risk Stress Testing", () => {
    const base: ParametrosMonteCarlo = {
      caminos: 300,
      startBalance: 10000,
      trades: 100,
      winRate: 55,
      avgWinR: 1.8,
      avgLossR: 1,
      riskPct: 1,
      monthlyWithdrawal: 0,
      seed: 45,
    };

    // Disciplinado: 1 % de riesgo, 55 % de acierto, payoff 1,8: ventaja positiva.
    const disciplined = simulaMonteCarlo(base);
    expect(disciplined.probRuin).toBe(0);
    expect(disciplined.analyticalRuinProb).toBeLessThan(0.01);
    expect(disciplined.finalP5).toBeGreaterThan(base.startBalance);
    expect(disciplined.finalP50).toBeGreaterThan(disciplined.finalP5);
    expect(disciplined.finalP95).toBeGreaterThan(disciplined.finalP50);

    // Arriesgado: 5 %, 40 %, payoff 1: ventaja negativa y riesgo alto.
    const highRisk = simulaMonteCarlo({ ...base, winRate: 40, avgWinR: 1, riskPct: 5 });
    expect(highRisk.analyticalRuinProb).toBe(100);
    expect(highRisk.probRuin).toBeGreaterThan(50);
    // El percentil 5 acaba por debajo del umbral de ruina, y la mediana pierde.
    expect(highRisk.finalP5).toBeLessThan(base.startBalance * (1 - UMBRAL_RUINA_PCT / 100));
    expect(highRisk.finalP50).toBeLessThan(base.startBalance);
  });

  it("Scenario 6: Bilingual Trade Setup Ranking and Translation Parity", () => {
    const setupRankings = rankByExpectancy(TRADES, (t) => t.setup);
    expect(setupRankings.length).toBe(SETUP_NAMES.length);

    for (let i = 1; i < setupRankings.length; i++) {
      expect(setupRankings[i].expectancy).toBeLessThanOrEqual(setupRankings[i - 1].expectancy);
    }

    for (const row of setupRankings) {
      const esName = nombreSetup(row.name, "es");
      const enName = nombreSetup(row.name, "en");

      expect(typeof esName).toBe("string");
      expect(typeof enName).toBe("string");
      expect(esName.length).toBeGreaterThan(0);
      expect(enName.length).toBeGreaterThan(0);

      // Las métricas del setup no dependen del idioma.
      const setupTrades = TRADES.filter((t) => t.setup === row.name);
      const metrics = computeMetrics(setupTrades);
      expect(row.expectancy).toBeCloseTo(metrics.expectancy, 4);
      expect(row.totalPnl).toBeCloseTo(metrics.netPnl, 2);
      expect(row.count).toBe(setupTrades.length);
    }
  });

  it("Scenario 7: Full Lifecycle Custom Trade Logging, Synchronization, and Journal Reset", async () => {
    const mockStorage = new MockLocalStorage();
    const listeners: (() => void)[] = [];

    globalThis.window = {
      localStorage: mockStorage as unknown as Storage,
      dispatchEvent: () => {
        listeners.forEach((l) => l());
        return true;
      },
      addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => {
        if (typeof listener === "function") listeners.push(listener as () => void);
      },
      removeEventListener: () => {},
    } as unknown as Window & typeof globalThis;

    resetToSample();
    expect(getCustomTrades()).toEqual([]);

    // Tres operaciones propias, una tras otra.
    const t1 = addTrade({
      instrument: "BTC/USDT",
      setup: "Breakout",
      direction: "long",
      entry: 65000,
      exit: 66500,
      qty: 0.1,
      netPnl: 150,
      rMultiple: 3.0,
      compliance: "yes",
      closedAt: "2026-07-25T10:00:00.000Z",
      note: "Clean breakout on H1",
    });

    await new Promise((r) => setTimeout(r, 5));
    const t2 = addTrade({
      instrument: "ETH/USDT",
      setup: "Pullback",
      direction: "short",
      entry: 3200,
      exit: 3250,
      qty: 1.0,
      netPnl: -50,
      rMultiple: -1.0,
      compliance: "partial",
      closedAt: "2026-07-26T15:00:00.000Z",
      note: "Stopped out on pullback",
    });

    await new Promise((r) => setTimeout(r, 5));
    const t3 = addTrade({
      instrument: "NQ",
      setup: "Trend",
      direction: "long",
      entry: 18500,
      exit: 18600,
      qty: 1,
      netPnl: 200,
      rMultiple: 2.0,
      compliance: "yes",
      closedAt: "2026-07-27T16:00:00.000Z",
      note: "Followed the NY trend",
    });

    const customList = getCustomTrades();
    expect(customList.length).toBe(3);
    // La más reciente primero.
    expect(customList[0].id).toBe(t3.id);
    expect(customList[1].id).toBe(t2.id);
    expect(customList[2].id).toBe(t1.id);

    // Mezcla con las 200 operaciones de muestra.
    const merged = mergeTrades(TRADES, customList);
    expect(merged.length).toBe(203);

    const mergedMetrics = computeMetrics(merged);
    const expectedPnl = METRICS.netPnl + 150 - 50 + 200;
    expect(mergedMetrics.netPnl).toBeCloseTo(expectedPnl, 2);

    // Edición de la segunda.
    const updatedT2 = updateTrade(t2.id, { netPnl: -25, rMultiple: -0.5, note: "Partial exit reduced loss" });
    expect(updatedT2?.netPnl).toBe(-25);
    expect(getCustomTrades().find((t) => t.id === t2.id)?.netPnl).toBe(-25);

    // Borrado de la primera.
    const deleteSuccess = deleteTrade(t1.id);
    expect(deleteSuccess).toBe(true);
    expect(getCustomTrades().length).toBe(2);

    // Vuelta a la muestra.
    resetToSample();
    expect(getCustomTrades().length).toBe(0);
    const restoredMerged = mergeTrades(TRADES, getCustomTrades());
    expect(restoredMerged.length).toBe(200);
  });

  it("Scenario 8: Discipline Breakdown Invoice and Cost of Indiscipline Attribution", () => {
    // Los valores con que arranca la calculadora de indisciplina.
    const c = costeIndisciplina(60, 40, 29.73, -38.47);

    expect(c.offPlanTrades).toBe(24);
    expect(c.inPlanTrades).toBe(36);
    expect(c.gap).toBeCloseTo(68.2, 9);
    expect(c.totalLeakMonthly).toBeCloseTo(1636.8, 9);
    expect(c.totalLeakAnnual).toBeCloseTo(19641.6, 9);
    expect(c.inPlanTotal).toBeCloseTo(36 * 29.73, 9);
    expect(c.offPlanTotal).toBeCloseTo(24 * -38.47, 9);

    // El reparto entre los cinco tipos de fallo suma el 100 %: la factura
    // desglosada suma la fuga mensual entera.
    expect(ERRORES_INDISCIPLINA).toHaveLength(5);
    expect(ERRORES_INDISCIPLINA.reduce((suma, m) => suma + m.pct, 0)).toBe(100);
    const atribuido = ERRORES_INDISCIPLINA.reduce((suma, m) => suma + (c.totalLeakMonthly * m.pct) / 100, 0);
    expect(atribuido).toBeCloseTo(c.totalLeakMonthly, 9);
  });
});
