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
import { normalCdf } from "@/components/marketing/EdgeSignificanceChecker";

/**
 * Nivel 4: ocho escenarios de uso real que cruzan módulos: auditoría de 50
 * operaciones, plan del Guardián tras un 30 % de drawdown, Kelly en tres
 * regímenes, calendario frente a mapa de calor, Monte Carlo, ranking de
 * setups bilingüe, ciclo de operaciones propias y factura de indisciplina.
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

    // Test binomial de la ventaja estadística (H0: p0 = 0,50).
    const n = metrics.closedCount;
    const p0 = 0.50;
    const se = Math.sqrt(n * p0 * (1 - p0)); // sqrt(50 * 0.25) = 3.5355
    const z = (metrics.wins - n * p0) / se; // (29 - 25) / 3.5355 = 1.13137
    const pValue = 2 * (1 - normalCdf(Math.abs(z)));

    expect(z).toBeCloseTo(1.1314, 3);
    expect(pValue).toBeCloseTo(0.2579, 3);
    // Con n = 50, un 58 % de acierto aún no se distingue del azar (alfa 0,05).
    expect(pValue).toBeGreaterThan(0.05);

    // Intervalo del 95 % del profit factor por el método delta.
    const nw = metrics.wins;
    const nl = metrics.losses;
    const wins = sample50.filter((t) => t.netPnl > 0);
    const losses = sample50.filter((t) => t.netPnl < 0);
    const meanW = wins.reduce((s, t) => s + t.netPnl, 0) / nw;
    const meanL = Math.abs(losses.reduce((s, t) => s + t.netPnl, 0)) / nl;
    const varW = wins.reduce((s, t) => s + Math.pow(t.netPnl - meanW, 2), 0) / (nw - 1);
    const varL = losses.reduce((s, t) => s + Math.pow(Math.abs(t.netPnl) - meanL, 2), 0) / (nl - 1);
    const varLnPf = varW / (nw * meanW * meanW) + varL / (nl * meanL * meanL);
    const seLnPf = Math.sqrt(varLnPf);

    expect(varW).toBeGreaterThan(0);
    expect(varL).toBeGreaterThan(0);
    expect(seLnPf).toBeGreaterThan(0);

    const ciLower = metrics.profitFactor * Math.exp(-1.96 * seLnPf);
    const ciUpper = metrics.profitFactor * Math.exp(1.96 * seLnPf);
    expect(ciLower).toBeLessThan(metrics.profitFactor);
    expect(ciUpper).toBeGreaterThan(metrics.profitFactor);
    expect(ciLower).toBeGreaterThan(0);
  });

  it("Scenario 2: Guardian Recovery Sequence from 30% Drawdown", () => {
    // Capital inicial 10.000 $, actual 7.000 $ (30 % de drawdown).
    const initialBalance = 10000;
    const currentBalance = 7000;
    const drawdownUsd = initialBalance - currentBalance; // $3,000
    const drawdownPct = drawdownUsd / initialBalance; // 0.30 (30%)

    // 60 operaciones: en plan +29,73 $ de esperanza; fuera de plan (40 %) −38,47 $.
    const totalTradesMonth = 60;
    const breachRate = 0.40;
    const inPlanExp = 29.73;
    const offPlanExp = -38.47;

    const offPlanTrades = Math.round(totalTradesMonth * breachRate); // 24
    const inPlanTrades = totalTradesMonth - offPlanTrades; // 36
    const gapPerTrade = inPlanExp - offPlanExp; // $68.20
    const monthlyLeak = offPlanTrades * gapPerTrade; // $1,636.80

    expect(offPlanTrades).toBe(24);
    expect(monthlyLeak).toBeCloseTo(1636.80, 2);

    // El Guardián evita el 60 % de las operaciones fuera de plan.
    const recoveredMonthly = monthlyLeak * 0.60; // $982.08 / month
    const dailyRecovery = recoveredMonthly / 30; // $32.736 / day
    const licenseCost = 149;
    const paybackDays = Math.max(1, Math.round(licenseCost / dailyRecovery));

    expect(recoveredMonthly).toBeCloseTo(982.08, 2);
    expect(paybackDays).toBe(5); // se amortiza en 5 días de trading

    // Resultado mensual con el Guardián = enPlan·esperanzaEnPlan + restoFueraDePlan·esperanzaFueraDePlan.
    const remainingOffPlanTrades = offPlanTrades * 0.40; // 9.6 trades
    const projectedNetMonthly = inPlanTrades * inPlanExp + remainingOffPlanTrades * offPlanExp;
    expect(projectedNetMonthly).toBeGreaterThan(0);

    const monthsToFullRecovery = drawdownUsd / projectedNetMonthly;
    expect(monthsToFullRecovery).toBeLessThan(5);
  });

  it("Scenario 3: Kelly Position Sizing Dynamic Recalculation across 3 Market Regimes", () => {
    const calcKellySizing = (winRatePct: number, payoff: number) => {
      const p = winRatePct / 100;
      const q = 1 - p;
      const b = payoff;
      const edge = p * b - q;
      const fullKellyPct = b > 0 && edge > 0 ? (edge / b) * 100 : 0;
      const halfKellyPct = fullKellyPct > 0 ? Math.max(0.25, Math.min(3.0, fullKellyPct / 2)) : 0;
      const quarterKellyPct = fullKellyPct > 0 ? Math.max(0.25, Math.min(3.0, fullKellyPct / 4)) : 0;
      return { edge, fullKellyPct, halfKellyPct, quarterKellyPct };
    };

    // Tendencia alcista (60 % de acierto, payoff 2,2).
    const regimeA = calcKellySizing(60, 2.2);
    expect(regimeA.edge).toBeCloseTo(0.60 * 2.2 - 0.40, 4); // 0.92
    expect(regimeA.fullKellyPct).toBeCloseTo((0.92 / 2.2) * 100, 2); // 41.82%
    expect(regimeA.halfKellyPct).toBe(3.0); // topado al 3 %
    expect(regimeA.quarterKellyPct).toBe(3.0);

    // Lateral (46 %, payoff 1,5).
    const regimeB = calcKellySizing(46, 1.5);
    expect(regimeB.edge).toBeCloseTo(0.46 * 1.5 - 0.54, 4); // 0.15
    expect(regimeB.fullKellyPct).toBeCloseTo((0.15 / 1.5) * 100, 2); // 10.0%
    expect(regimeB.halfKellyPct).toBeCloseTo(3.0, 1); // 5 % topado al 3 %
    expect(regimeB.quarterKellyPct).toBeCloseTo(2.5, 1);

    // Crisis (35 %, payoff 1,2): ventaja negativa, se queda en 0.
    const regimeC = calcKellySizing(35, 1.2);
    expect(regimeC.edge).toBeCloseTo(0.35 * 1.2 - 0.65, 4); // -0.23
    expect(regimeC.fullKellyPct).toBe(0);
    expect(regimeC.halfKellyPct).toBe(0);
    expect(regimeC.quarterKellyPct).toBe(0);
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
    function mulberry32(s: number) {
      let a = s >>> 0;
      return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    const runMonteCarlo = (
      seed: number,
      riskPct: number,
      winRate: number,
      payoff: number,
      tradesCount = 100,
      runs = 300
    ) => {
      const rng = mulberry32(seed);
      let ruinCount = 0;
      let doubleCount = 0;
      const finalBalances: number[] = [];
      const startBalance = 10000;
      const fixedRiskUsd = startBalance * (riskPct / 100);

      for (let r = 0; r < runs; r++) {
        let bal = startBalance;
        for (let t = 0; t < tradesCount; t++) {
          if (bal <= 0) {
            bal = 0;
            break;
          }
          const isWin = rng() < winRate;
          if (isWin) bal += fixedRiskUsd * payoff;
          else bal -= fixedRiskUsd * 1.0;
        }
        if (bal <= 0) ruinCount++;
        if (bal >= startBalance * 2) doubleCount++;
        finalBalances.push(bal);
      }

      finalBalances.sort((a, b) => a - b);
      const p10 = finalBalances[Math.floor(0.10 * runs)];
      const p50 = finalBalances[Math.floor(0.50 * runs)];
      const p90 = finalBalances[Math.floor(0.90 * runs)];
      const ruinProb = (ruinCount / runs) * 100;
      const doubleProb = (doubleCount / runs) * 100;

      return { p10, p50, p90, ruinProb, doubleProb };
    };

    // Disciplinado: 1 % de riesgo (100 $ por operación), 55 % de acierto, payoff 1,8: ventaja positiva.
    const disciplined = runMonteCarlo(12345, 1.0, 0.55, 1.8);
    expect(disciplined.ruinProb).toBe(0);
    expect(disciplined.p10).toBeGreaterThan(10000);
    expect(disciplined.p50).toBeGreaterThan(disciplined.p10);
    expect(disciplined.p90).toBeGreaterThan(disciplined.p50);

    // Arriesgado: 5 % (500 $ por operación), 40 %, payoff 1: ventaja negativa y riesgo alto.
    const highRisk = runMonteCarlo(12345, 5.0, 0.40, 1.0);
    expect(highRisk.ruinProb).toBeGreaterThan(0);
    expect(highRisk.p10).toBe(0); // el percentil 10 queda arruinado
    expect(highRisk.p50).toBeLessThan(10000);
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
    const totalTrades = 60;
    const breachPct = 40;
    const inPlanExp = 29.73;
    const offPlanExp = -38.47;

    const offPlanTrades = Math.round((totalTrades * breachPct) / 100); // 24
    const inPlanTrades = Math.max(0, totalTrades - offPlanTrades); // 36
    const gap = inPlanExp - offPlanExp; // $68.20
    const totalLeakMonthly = offPlanTrades * gap; // $1,636.80
    const totalLeakAnnual = totalLeakMonthly * 12; // $19,641.60

    expect(offPlanTrades).toBe(24);
    expect(inPlanTrades).toBe(36);
    expect(totalLeakMonthly).toBeCloseTo(1636.80, 2);
    expect(totalLeakAnnual).toBeCloseTo(19641.60, 2);

    // Reparto entre las cinco categorías de error.
    const mistakes = [
      { id: "offhours", labelEs: "Operar fuera de horario", labelEn: "Trading off-hours", pct: 32 },
      { id: "oversize", labelEs: "Tamaño excesivo (Oversize)", labelEn: "Oversized position", pct: 27 },
      { id: "nostop", labelEs: "Sin stop loss / omitido", labelEn: "No stop loss / omitted", pct: 18 },
      { id: "chasing", labelEs: "Perseguir el precio (FOMO)", labelEn: "Chasing price (FOMO)", pct: 14 },
      { id: "movingstop", labelEs: "Mover stop loss en contra", labelEn: "Manually moving stop", pct: 9 },
    ];

    const sumPct = mistakes.reduce((s, m) => s + m.pct, 0);
    expect(sumPct).toBe(100);

    // Lo atribuido suma la fuga mensual.
    const attributedLossSum = mistakes.reduce((s, m) => s + (totalLeakMonthly * m.pct) / 100, 0);
    expect(attributedLossSum).toBeCloseTo(totalLeakMonthly, 2);

    const savings50 = totalLeakMonthly * 0.50; // $818.40 / mo
    const savings80 = totalLeakMonthly * 0.80; // $1,309.44 / mo
    expect(savings50).toBeCloseTo(818.40, 2);
    expect(savings80).toBeCloseTo(1309.44, 2);

    const summaryEs = `Factura de Indisciplina (CountPips):\n• Operaciones/mes: ${totalTrades} (${breachPct}% fuera de plan)\n• Expectancy en plan: +${inPlanExp.toFixed(2)} $\n• Expectancy fuera de plan: ${offPlanExp.toFixed(2)} $\n• Brecha por trade: -${gap.toFixed(2)} $\n• Fuga mensual: -${totalLeakMonthly.toFixed(2)} $\n• Fuga anual proyectada: -${totalLeakAnnual.toFixed(2)} $`;
    const summaryEn = `Indiscipline Invoice (CountPips):\n• Trades/month: ${totalTrades} (${breachPct}% off-plan)\n• In-plan expectancy: +${inPlanExp.toFixed(2)} $\n• Off-plan expectancy: ${offPlanExp.toFixed(2)} $\n• Gap per trade: -${gap.toFixed(2)} $\n• Monthly leak: -${totalLeakMonthly.toFixed(2)} $\n• Projected annual leak: -${totalLeakAnnual.toFixed(2)} $`;

    expect(summaryEs).toContain("Fuga mensual: -1636.80 $");
    expect(summaryEn).toContain("Monthly leak: -1636.80 $");
    expect(summaryEs).toContain("Fuga anual proyectada: -19641.60 $");
    expect(summaryEn).toContain("Projected annual leak: -19641.60 $");
  });
});
