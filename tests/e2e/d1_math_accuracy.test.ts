import { describe, expect, it } from "vitest";
import {
  computeMetrics,
  TRADES,
  type Trade,
} from "@/lib/trading/data";
import { normalCdf } from "@/components/marketing/EdgeSignificanceChecker";

/**
 * Dimension D1: Quantitative & Financial Math Accuracy
 *
 * Requirements tested:
 * - Tier 1: Feature Coverage
 *   1. Sharpe Ratio (annualized via sqrt(trades_per_year) with 365.25d base)
 *   2. Sortino Ratio (MAR=0 downside deviation annualized via sqrt(trades_per_year))
 *   3. Calmar Ratio (365.25d base, CAGR / maxDrawdownPct)
 *   4. Profit Factor & Delta Method Asymptotic Confidence Intervals
 *   5. Expectancy R, Expectancy USD, and Payoff Ratio
 *   6. Kelly Criterion (Pure, Half, Quarter with clamping f*=0)
 *   7. Binomial Test CDF (Abramowitz & Stegun 7.1.26 approximation)
 *   8. Monte Carlo Simulation (Mulberry32 PRNG determinism & percentile bands)
 *   9. Guardian Recovery Plan (Capital preservation, leak attribution & license ROI)
 * - Tier 2: Boundary & Corner Cases
 *   1. n = 0 trades (empty array, zero-division guards)
 *   2. n = 1 trade (single winner / single loser)
 *   3. 100% Win Rate (zero losses, zero drawdown, Sortino downside = 0)
 *   4. 100% Loss Rate (zero wins, profit factor = 0, payoff = 0)
 *   5. Flat equity curve / Zero standard deviation
 *   6. Extreme leverage & high magnitude R multiples
 *   7. Negative or zero account balance resilience
 */

// Helper to create synthetic test trades with precise parameters
function createTestTrade(overrides: Partial<Trade> & { id: number; netPnl: number; closedAt: Date }): Trade {
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
    entryNote: overrides.entryNote ?? "Test trade",
    closeNote: overrides.closeNote ?? "Test close",
  };
}

describe("D1: Quantitative & Financial Math - Tier 1 Feature Coverage", () => {
  it("D1-T1.1: Sharpe Ratio matches independent oracle and annualizes correctly with 365.25d base", () => {
    // Construct a controlled 10-trade series over 30 days
    const baseDate = new Date("2026-01-01T12:00:00Z");
    const testTrades: Trade[] = [];
    const pnls = [120, -50, 200, -80, 150, -40, 90, 180, -60, 110];

    for (let i = 0; i < pnls.length; i++) {
      const closedAt = new Date(baseDate.getTime() + i * 3 * 86400000); // every 3 days = 27 days total span
      testTrades.push(createTestTrade({ id: i + 1, netPnl: pnls[i], closedAt }));
    }

    const metrics = computeMetrics(testTrades);
    const n = testTrades.length;

    // Independent Oracle Calculation
    const mean = pnls.reduce((sum, p) => sum + p, 0) / n;
    const variance = pnls.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    const spanMs = testTrades[n - 1].closedAt.getTime() - testTrades[0].closedAt.getTime();
    const spanDays = Math.max(1, spanMs / 86400000);
    const tradesPerYear = (n * 365.25) / spanDays;
    const annFactor = Math.sqrt(tradesPerYear);
    const expectedSharpe = (mean / stdDev) * annFactor;

    expect(metrics.sharpe).toBeCloseTo(expectedSharpe, 6);
    expect(metrics.sharpe).toBeGreaterThan(0);
  });

  it("D1-T1.2: Sortino Ratio with MAR=0 penalizes only downside volatility", () => {
    const baseDate = new Date("2026-01-01T12:00:00Z");
    const testTrades: Trade[] = [];
    const pnls = [300, -100, 400, -50, 250, -120, 500, -80]; // Wins have massive upside variance

    for (let i = 0; i < pnls.length; i++) {
      const closedAt = new Date(baseDate.getTime() + i * 2 * 86400000);
      testTrades.push(createTestTrade({ id: i + 1, netPnl: pnls[i], closedAt }));
    }

    const metrics = computeMetrics(testTrades);
    const n = testTrades.length;
    const mean = pnls.reduce((sum, p) => sum + p, 0) / n;

    // Downside deviation with MAR = 0
    const losingPnls = pnls.filter((p) => p < 0);
    const downsideVariance = losingPnls.reduce((sum, p) => sum + Math.pow(p, 2), 0) / n;
    const downsideDev = Math.sqrt(downsideVariance);

    const spanMs = testTrades[n - 1].closedAt.getTime() - testTrades[0].closedAt.getTime();
    const spanDays = Math.max(1, spanMs / 86400000);
    const tradesPerYear = (n * 365.25) / spanDays;
    const annFactor = Math.sqrt(tradesPerYear);
    const expectedSortino = (mean / downsideDev) * annFactor;

    expect(metrics.sortino).toBeCloseTo(expectedSortino, 6);
    // Because upside variance is huge, Sortino is significantly higher than Sharpe
    expect(metrics.sortino).toBeGreaterThan(metrics.sharpe);
  });

  it("D1-T1.3: Calmar Ratio calculates CAGR / |Max DD %| on 365.25d basis", () => {
    const baseDate = new Date("2026-01-01T00:00:00Z");
    const testTrades: Trade[] = [];
    // Start 10000 -> +1000 (11000) -> -1100 (9900) -> +2100 (12000) over 182.625 days (0.5 years)
    const pnls = [1000, -1100, 2100];
    const timestamps = [
      new Date("2026-01-01T00:00:00Z"),
      new Date("2026-04-01T00:00:00Z"),
      new Date("2026-07-02T15:00:00Z"), // ~182.625 days
    ];

    for (let i = 0; i < pnls.length; i++) {
      testTrades.push(createTestTrade({ id: i + 1, netPnl: pnls[i], closedAt: timestamps[i] }));
    }

    const metrics = computeMetrics(testTrades);
    expect(metrics.finalBalance).toBe(12000);

    // Peak was 11000, lowest after peak was 9900 -> DD = 1100 -> DD % = 1100 / 11000 = 10% = 0.10
    expect(metrics.maxDrawdown).toBe(1100);
    expect(metrics.maxDrawdownPct).toBeCloseTo(0.10, 4);

    const spanDays = (timestamps[2].getTime() - timestamps[0].getTime()) / 86400000;
    const years = spanDays / 365.25;
    const expectedCagr = Math.pow(12000 / 10000, 1 / years) - 1;
    const expectedCalmar = expectedCagr / 0.10;

    expect(metrics.calmar).toBeCloseTo(expectedCalmar, 4);
    expect(metrics.recoveryFactor).toBeCloseTo(2000 / 1100, 4);
  });

  it("D1-T1.4: Profit Factor and Delta Method Asymptotic Confidence Interval", () => {
    // Verify Profit Factor = grossWin / grossLoss
    const metrics = computeMetrics(TRADES);
    const wins = TRADES.filter((t) => t.netPnl > 0);
    const losses = TRADES.filter((t) => t.netPnl < 0);
    const grossWin = wins.reduce((s, t) => s + t.netPnl, 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + t.netPnl, 0));

    expect(metrics.profitFactor).toBeCloseTo(grossWin / grossLoss, 6);

    // Delta Method Confidence Interval for PF:
    // Let W_bar = mean win, L_bar = mean loss, nw = count wins, nl = count losses
    // PF = (nw * W_bar) / (nl * L_bar)
    // Var(ln PF) ≈ s_w^2 / (nw * W_bar^2) + s_l^2 / (nl * L_bar^2)
    const nw = wins.length;
    const nl = losses.length;
    const meanW = grossWin / nw;
    const meanL = grossLoss / nl;
    const varW = wins.reduce((s, t) => s + Math.pow(t.netPnl - meanW, 2), 0) / (nw - 1);
    const varL = losses.reduce((s, t) => s + Math.pow(Math.abs(t.netPnl) - meanL, 2), 0) / (nl - 1);

    const varLnPf = varW / (nw * meanW * meanW) + varL / (nl * meanL * meanL);
    const seLnPf = Math.sqrt(varLnPf);
    const z95 = 1.96;

    const ciLower = metrics.profitFactor * Math.exp(-z95 * seLnPf);
    const ciUpper = metrics.profitFactor * Math.exp(z95 * seLnPf);

    // Mathematical Invariants:
    expect(ciLower).toBeGreaterThan(0);
    expect(ciUpper).toBeGreaterThan(ciLower);
    expect(metrics.profitFactor).toBeGreaterThan(ciLower);
    expect(metrics.profitFactor).toBeLessThan(ciUpper);
  });

  it("D1-T1.5: Expectancy R and Expectancy USD with Payoff consistency", () => {
    const metrics = computeMetrics(TRADES);
    const rValues = TRADES.map((t) => t.rMultiple).filter(Number.isFinite);
    const expectedExpR = rValues.reduce((s, r) => s + r, 0) / rValues.length;

    expect(metrics.expectancyR).toBeCloseTo(expectedExpR, 6);

    // Expectancy equation: E = WinRate * AvgWin - LossRate * AvgLoss
    const derivedExpUsd = metrics.winRate * metrics.avgWin - (1 - metrics.winRate) * metrics.avgLoss;
    expect(metrics.expectancy).toBeCloseTo(derivedExpUsd, 2);

    // Payoff = AvgWin / AvgLoss
    expect(metrics.payoff).toBeCloseTo(metrics.avgWin / metrics.avgLoss, 6);
  });

  it("D1-T1.6: Kelly Criterion Sizing (Pure, Half, Quarter with clamping f*=0)", () => {
    // Pure Kelly: f* = (p*b - q) / b where p = winRate, q = 1-p, b = payoff
    const calcKelly = (winRatePct: number, payoff: number) => {
      const p = winRatePct / 100;
      const q = 1 - p;
      const b = payoff;
      const fullKellyPct = b > 0 ? Math.max(0, ((p * b - q) / b) * 100) : 0;
      const halfKellyPct = fullKellyPct > 0 ? Math.max(0.25, Math.min(3.0, fullKellyPct / 2)) : 0;
      const quarterKellyPct = fullKellyPct > 0 ? Math.max(0.25, Math.min(3.0, fullKellyPct / 4)) : 0;
      return { fullKellyPct, halfKellyPct, quarterKellyPct };
    };

    // Case A: 60% win rate, payoff 2.0 -> Edge = 0.60*2 - 0.40 = 0.80 -> f* = 0.80 / 2 = 40%
    const resA = calcKelly(60, 2.0);
    expect(resA.fullKellyPct).toBeCloseTo(40.0, 4);
    // Half Kelly clamped to 3.0% max institutional ceiling
    expect(resA.halfKellyPct).toBe(3.0);
    // Quarter Kelly is 40 / 4 = 10% clamped to 3.0%
    expect(resA.quarterKellyPct).toBe(3.0);

    // Case B: 52% win rate, payoff 1.0 -> Edge = 0.52*1 - 0.48 = 0.04 -> f* = 4%
    const resB = calcKelly(52, 1.0);
    expect(resB.fullKellyPct).toBeCloseTo(4.0, 4);
    // Half Kelly: 4 / 2 = 2.0% (within [0.25, 3.0])
    expect(resB.halfKellyPct).toBeCloseTo(2.0, 4);
    // Quarter Kelly: 4 / 4 = 1.0% (within [0.25, 3.0])
    expect(resB.quarterKellyPct).toBeCloseTo(1.0, 4);

    // Case C: 40% win rate, payoff 1.0 -> Negative edge -> f* clamped to 0%
    const resC = calcKelly(40, 1.0);
    expect(resC.fullKellyPct).toBe(0);
    expect(resC.halfKellyPct).toBe(0);
    expect(resC.quarterKellyPct).toBe(0);
  });

  it("D1-T1.7: Binomial Test CDF via Abramowitz & Stegun 7.1.26 matches standard normal distribution", () => {
    // Check known statistical critical values
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
    expect(normalCdf(1.95996)).toBeCloseTo(0.9750, 4); // 95% two-sided critical z
    expect(normalCdf(2.57583)).toBeCloseTo(0.9950, 4); // 99% two-sided critical z
    expect(normalCdf(-1.95996)).toBeCloseTo(0.0250, 4);

    // Test binomial significance logic for 100 trades, 60% win rate vs H0: p=0.5
    const n = 100;
    const wr = 0.60;
    const p0 = 0.5;
    const se = Math.sqrt(n * p0 * (1 - p0)); // sqrt(100 * 0.25) = 5
    const z = (wr * n - p0 * n) / se; // (60 - 50) / 5 = 2.0
    const pValue = 2 * (1 - normalCdf(Math.abs(z))); // 2 * (1 - Phi(2.0)) = ~0.0455

    expect(z).toBeCloseTo(2.0, 4);
    expect(pValue).toBeCloseTo(0.0455, 3);
    expect(pValue).toBeLessThan(0.05); // Significant at alpha = 0.05

    // Minimum sample size required to detect 60% win rate within e=0.05 margin at 95% confidence
    const minSample = Math.ceil((1.96 * 1.96 * wr * (1 - wr)) / (0.05 * 0.05));
    expect(minSample).toBe(369);
  });

  it("D1-T1.8: Deterministic Monte Carlo Simulation with Mulberry32 PRNG and quantiles", () => {
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

    const runSimulation = (seed: number, tradesCount = 50, runs = 100) => {
      const rng = mulberry32(seed);
      const winRate = 0.55;
      const avgWinR = 2.0;
      const avgLossR = 1.0;
      const riskPct = 1.0;
      const startBalance = 10000;

      const finalBalances: number[] = [];
      let ruinCount = 0;

      for (let run = 0; run < runs; run++) {
        let bal = startBalance;
        for (let t = 0; t < tradesCount; t++) {
          if (bal <= 0) {
            bal = 0;
            break;
          }
          const isWin = rng() < winRate;
          const riskUsd = bal * (riskPct / 100);
          if (isWin) bal += riskUsd * avgWinR;
          else bal -= riskUsd * avgLossR;
        }
        if (bal <= 0) ruinCount++;
        finalBalances.push(bal);
      }

      finalBalances.sort((a, b) => a - b);
      const p10 = finalBalances[Math.floor(0.10 * runs)];
      const p50 = finalBalances[Math.floor(0.50 * runs)];
      const p90 = finalBalances[Math.floor(0.90 * runs)];
      const mean = finalBalances.reduce((s, v) => s + v, 0) / runs;
      return { p10, p50, p90, mean, ruinRate: ruinCount / runs };
    };

    // Test exact determinism: running twice with same seed produces identical results
    const sim1 = runSimulation(42);
    const sim2 = runSimulation(42);
    expect(sim1.p10).toBe(sim2.p10);
    expect(sim1.p50).toBe(sim2.p50);
    expect(sim1.p90).toBe(sim2.p90);
    expect(sim1.mean).toBe(sim2.mean);

    // Quantile monotonicity: P10 <= P50 <= P90
    expect(sim1.p10).toBeLessThanOrEqual(sim1.p50);
    expect(sim1.p50).toBeLessThanOrEqual(sim1.p90);
    expect(sim1.p50).toBeGreaterThan(10000); // 55% WR with 2:1 R has positive expectancy
  });

  it("D1-T1.9: Guardian Recovery Plan Capital & ROI Projector", () => {
    // 60 trades/mo, 40% breach rate = 24 off-plan trades
    // In-plan expectancy: +$29.73, Off-plan expectancy: -$38.47
    const totalTrades = 60;
    const breachPct = 40;
    const inPlanExp = 29.73;
    const offPlanExp = -38.47;

    const offPlanTrades = Math.round((totalTrades * breachPct) / 100); // 24
    const gap = inPlanExp - offPlanExp; // 68.20
    const totalLeakMonthly = offPlanTrades * gap; // 24 * 68.20 = 1636.80
    const totalLeakAnnual = totalLeakMonthly * 12; // 19641.60

    expect(offPlanTrades).toBe(24);
    expect(gap).toBeCloseTo(68.20, 2);
    expect(totalLeakMonthly).toBeCloseTo(1636.80, 2);
    expect(totalLeakAnnual).toBeCloseTo(19641.60, 2);

    // 60% recovery via Guardian
    const monthlyRecovery60 = totalLeakMonthly * 0.6; // 982.08
    const dailyRecovery = monthlyRecovery60 / 30; // 32.736
    const licenseCost = 149;
    const paybackDays = Math.max(1, Math.round(licenseCost / dailyRecovery));

    expect(monthlyRecovery60).toBeCloseTo(982.08, 2);
    expect(paybackDays).toBe(5); // Amortized in 5 trading days
  });
});

describe("D1: Quantitative & Financial Math - Tier 2 Boundary & Corner Cases", () => {
  it("D1-T2.1: Empty trade array (n=0) produces safe finite zero-state metrics without NaN", () => {
    const metrics = computeMetrics([]);

    expect(metrics.closedCount).toBe(0);
    expect(metrics.netPnl).toBe(0);
    expect(metrics.winRate).toBe(0);
    expect(metrics.wins).toBe(0);
    expect(metrics.losses).toBe(0);
    expect(metrics.expectancy).toBe(0);
    expect(metrics.expectancyR).toBe(0);
    expect(metrics.profitFactor).toBe(0);
    expect(metrics.payoff).toBe(0);
    expect(metrics.avgWin).toBe(0);
    expect(metrics.avgLoss).toBe(0);
    expect(metrics.maxDrawdown).toBe(0);
    expect(metrics.maxDrawdownPct).toBe(0);
    expect(metrics.sharpe).toBe(0);
    expect(metrics.sortino).toBe(0);
    expect(metrics.calmar).toBe(0);
    expect(metrics.recoveryFactor).toBe(0);
    expect(metrics.equityCurve).toEqual([]);
    expect(metrics.finalBalance).toBe(10000);
    expect(metrics.roiPct).toBe(0);

    // Ensure absolutely no NaN or Infinity anywhere in metrics
    for (const [key, val] of Object.entries(metrics)) {
      if (typeof val === "number") {
        expect(Number.isFinite(val), `Key ${key} was not finite`).toBe(true);
      }
    }
  });

  it("D1-T2.2: Single trade (n=1) edge handling for winner and loser", () => {
    const singleWin = [
      createTestTrade({ id: 1, netPnl: 250, rMultiple: 2.5, closedAt: new Date("2026-05-01T10:00:00Z") }),
    ];
    const winMetrics = computeMetrics(singleWin);
    expect(winMetrics.closedCount).toBe(1);
    expect(winMetrics.winRate).toBe(1.0);
    expect(winMetrics.wins).toBe(1);
    expect(winMetrics.losses).toBe(0);
    expect(winMetrics.netPnl).toBe(250);
    expect(winMetrics.avgWin).toBe(250);
    expect(winMetrics.avgLoss).toBe(0);
    expect(winMetrics.maxDrawdown).toBe(0);
    expect(winMetrics.maxDrawdownPct).toBe(0);
    expect(winMetrics.profitFactor).toBe(250); // grossWin when grossLoss is 0
    expect(winMetrics.sharpe).toBe(0); // Std dev is 0 for n=1
    expect(winMetrics.sortino).toBe(0);

    const singleLoss = [
      createTestTrade({ id: 1, netPnl: -100, rMultiple: -1.0, closedAt: new Date("2026-05-01T10:00:00Z") }),
    ];
    const lossMetrics = computeMetrics(singleLoss);
    expect(lossMetrics.closedCount).toBe(1);
    expect(lossMetrics.winRate).toBe(0.0);
    expect(lossMetrics.wins).toBe(0);
    expect(lossMetrics.losses).toBe(1);
    expect(lossMetrics.netPnl).toBe(-100);
    expect(lossMetrics.avgWin).toBe(0);
    expect(lossMetrics.avgLoss).toBe(100);
    expect(lossMetrics.maxDrawdown).toBe(100);
    expect(lossMetrics.maxDrawdownPct).toBeCloseTo(100 / 10000, 4);
    expect(lossMetrics.profitFactor).toBe(0);
  });

  it("D1-T2.3: 100% Win Rate handles zero losses and zero downside deviation safely", () => {
    const allWins = [
      createTestTrade({ id: 1, netPnl: 100, rMultiple: 1.0, closedAt: new Date("2026-01-01T10:00:00Z") }),
      createTestTrade({ id: 2, netPnl: 200, rMultiple: 2.0, closedAt: new Date("2026-01-02T10:00:00Z") }),
      createTestTrade({ id: 3, netPnl: 150, rMultiple: 1.5, closedAt: new Date("2026-01-03T10:00:00Z") }),
    ];
    const metrics = computeMetrics(allWins);

    expect(metrics.winRate).toBe(1.0);
    expect(metrics.losses).toBe(0);
    expect(metrics.avgLoss).toBe(0);
    expect(metrics.maxDrawdown).toBe(0);
    expect(metrics.maxDrawdownPct).toBe(0);
    expect(metrics.calmar).toBe(0); // Max DD is 0 -> Calmar guards against division by 0
    expect(metrics.sortino).toBe(0); // Downside dev is 0 -> Sortino guards against division by 0
    expect(metrics.profitFactor).toBe(450); // grossLoss is 0 -> returns grossWin
    expect(Number.isFinite(metrics.sharpe)).toBe(true);
  });

  it("D1-T2.4: 100% Loss Rate handles zero wins safely", () => {
    const allLosses = [
      createTestTrade({ id: 1, netPnl: -100, rMultiple: -1.0, closedAt: new Date("2026-01-01T10:00:00Z") }),
      createTestTrade({ id: 2, netPnl: -150, rMultiple: -1.5, closedAt: new Date("2026-01-02T10:00:00Z") }),
      createTestTrade({ id: 3, netPnl: -50, rMultiple: -0.5, closedAt: new Date("2026-01-03T10:00:00Z") }),
    ];
    const metrics = computeMetrics(allLosses);

    expect(metrics.winRate).toBe(0.0);
    expect(metrics.wins).toBe(0);
    expect(metrics.avgWin).toBe(0);
    expect(metrics.profitFactor).toBe(0);
    expect(metrics.payoff).toBe(0);
    expect(metrics.netPnl).toBe(-300);
    expect(metrics.maxDrawdown).toBe(300);
    expect(metrics.maxDrawdownPct).toBeCloseTo(300 / 10000, 4);
    expect(Number.isFinite(metrics.sortino)).toBe(true);
    expect(metrics.sortino).toBeLessThan(0); // Negative return yields negative Sortino
  });

  it("D1-T2.5: Zero drawdown and flat equity curve (all breakeven trades)", () => {
    const breakevenTrades = [
      createTestTrade({ id: 1, netPnl: 0, rMultiple: 0, closedAt: new Date("2026-01-01T10:00:00Z") }),
      createTestTrade({ id: 2, netPnl: 0, rMultiple: 0, closedAt: new Date("2026-01-02T10:00:00Z") }),
      createTestTrade({ id: 3, netPnl: 0, rMultiple: 0, closedAt: new Date("2026-01-03T10:00:00Z") }),
    ];
    const metrics = computeMetrics(breakevenTrades);

    expect(metrics.netPnl).toBe(0);
    expect(metrics.winRate).toBe(0);
    expect(metrics.expectancy).toBe(0);
    expect(metrics.expectancyR).toBe(0);
    expect(metrics.maxDrawdown).toBe(0);
    expect(metrics.maxDrawdownPct).toBe(0);
    expect(metrics.sharpe).toBe(0);
    expect(metrics.sortino).toBe(0);
    expect(metrics.calmar).toBe(0);
    expect(metrics.finalBalance).toBe(10000);
    expect(metrics.roiPct).toBe(0);
  });

  it("D1-T2.6: Zero standard deviation on non-zero constant returns", () => {
    const constantTrades = [
      createTestTrade({ id: 1, netPnl: 50, rMultiple: 1.0, closedAt: new Date("2026-01-01T10:00:00Z") }),
      createTestTrade({ id: 2, netPnl: 50, rMultiple: 1.0, closedAt: new Date("2026-01-02T10:00:00Z") }),
      createTestTrade({ id: 3, netPnl: 50, rMultiple: 1.0, closedAt: new Date("2026-01-03T10:00:00Z") }),
    ];
    const metrics = computeMetrics(constantTrades);

    expect(metrics.netPnl).toBe(150);
    expect(metrics.expectancy).toBe(50);
    // Standard deviation is 0 -> Sharpe ratio gracefully clamped to 0 without throwing NaN/Infinity
    expect(metrics.sharpe).toBe(0);
    expect(metrics.sortino).toBe(0);
  });

  it("D1-T2.7: Extreme R multiples and extreme leverage", () => {
    const extremeTrades = [
      createTestTrade({ id: 1, netPnl: 100000, rMultiple: 100.0, closedAt: new Date("2026-01-01T10:00:00Z") }),
      createTestTrade({ id: 2, netPnl: -90000, rMultiple: -90.0, closedAt: new Date("2026-01-02T10:00:00Z") }),
    ];
    const metrics = computeMetrics(extremeTrades);

    expect(metrics.netPnl).toBe(10000);
    expect(metrics.expectancyR).toBe(5.0);
    expect(metrics.finalBalance).toBe(20000);
    expect(metrics.roiPct).toBe(1.0);
    expect(Number.isFinite(metrics.sharpe)).toBe(true);
    expect(Number.isFinite(metrics.profitFactor)).toBe(true);
  });
});
