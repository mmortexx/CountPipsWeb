import { describe, expect, it } from "vitest";
import { computeMetrics, drawdownRecoveryRequired, type Trade } from "@/lib/trading/data";
import { normalCdf } from "@/components/marketing/EdgeSignificanceChecker";
import { FUTURES_CONTRACTS } from "@/components/marketing/RiskCalculator";

// Helper to construct synthetic test trades
function makeTrade(overrides: Partial<Trade> & { id: number; netPnl: number; closedAt: Date }): Trade {
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
    entryNote: overrides.entryNote ?? "Stress test trade",
    closeNote: overrides.closeNote ?? "Stress test close",
  };
}

describe("Adversarial Stress Test: Quantitative Mathematical Models", () => {
  const baseDate = new Date("2026-01-01T00:00:00Z");

  it("ADV-1: Extreme boundary n = 0 produces strictly finite 0-state metrics", () => {
    const m = computeMetrics([]);
    expect(m.closedCount).toBe(0);
    expect(m.netPnl).toBe(0);
    expect(m.winRate).toBe(0);
    expect(m.wins).toBe(0);
    expect(m.losses).toBe(0);
    expect(m.expectancy).toBe(0);
    expect(m.expectancyR).toBe(0);
    expect(m.profitFactor).toBe(0);
    expect(m.payoff).toBe(0);
    expect(m.avgWin).toBe(0);
    expect(m.avgLoss).toBe(0);
    expect(m.largestWin).toBe(0);
    expect(m.largestLoss).toBe(0);
    expect(m.maxDrawdown).toBe(0);
    expect(m.maxDrawdownPct).toBe(0);
    expect(m.currentDrawdown).toBe(0);
    expect(m.sharpe).toBe(0);
    expect(m.sortino).toBe(0);
    expect(m.calmar).toBe(0);
    expect(m.omega).toBe(0);
    expect(m.recoveryFactor).toBe(0);
    expect(m.maxWinStreak).toBe(0);
    expect(m.maxLossStreak).toBe(0);
    expect(m.currentStreak).toEqual({ kind: "none", count: 0 });
    expect(m.compliancePct).toBe(0);
    expect(m.costOfIndiscipline).toBe(0);
    expect(m.expectancyInPlan).toBe(0);
    expect(m.expectancyBrokePlan).toBe(0);
    expect(m.equityCurve).toEqual([]);
    expect(m.drawdownCeiling).toEqual([]);
    expect(m.finalBalance).toBe(10000);
    expect(m.roiPct).toBe(0);

    for (const [k, v] of Object.entries(m)) {
      if (typeof v === "number") {
        expect(Number.isFinite(v), `Metric ${k} must be finite`).toBe(true);
      }
    }
  });

  it("ADV-2: Extreme boundary n = 1 single win / loss / breakeven", () => {
    const singleWin = [makeTrade({ id: 1, netPnl: 350, rMultiple: 3.5, closedAt: baseDate })];
    const mWin = computeMetrics(singleWin);
    expect(mWin.closedCount).toBe(1);
    expect(mWin.winRate).toBe(1.0);
    expect(mWin.wins).toBe(1);
    expect(mWin.losses).toBe(0);
    expect(mWin.profitFactor).toBe(350);
    expect(mWin.sharpe).toBe(0); // sd=0 for n=1
    expect(mWin.sortino).toBe(0); // downside=0
    expect(mWin.maxDrawdown).toBe(0);
    expect(mWin.finalBalance).toBe(10350);

    const singleLoss = [makeTrade({ id: 1, netPnl: -150, rMultiple: -1.5, closedAt: baseDate })];
    const mLoss = computeMetrics(singleLoss);
    expect(mLoss.closedCount).toBe(1);
    expect(mLoss.winRate).toBe(0.0);
    expect(mLoss.wins).toBe(0);
    expect(mLoss.losses).toBe(1);
    expect(mLoss.profitFactor).toBe(0);
    expect(mLoss.maxDrawdown).toBe(150);
    expect(mLoss.finalBalance).toBe(9850);

    const singleZero = [makeTrade({ id: 1, netPnl: 0, rMultiple: 0, closedAt: baseDate })];
    const mZero = computeMetrics(singleZero);
    expect(mZero.winRate).toBe(0);
    expect(mZero.wins).toBe(0);
    expect(mZero.losses).toBe(0);
    expect(mZero.netPnl).toBe(0);
    expect(mZero.finalBalance).toBe(10000);
  });

  it("ADV-3: 100% Win Rate & 100% Loss Rate with large sample n = 100", () => {
    const n = 100;
    const wins100 = Array.from({ length: n }, (_, i) =>
      makeTrade({ id: i + 1, netPnl: 100 + i * 2, rMultiple: 1.5, closedAt: new Date(baseDate.getTime() + i * 86400000) })
    );
    const mWins = computeMetrics(wins100);
    expect(mWins.winRate).toBe(1.0);
    expect(mWins.losses).toBe(0);
    expect(mWins.avgLoss).toBe(0);
    expect(mWins.sortino).toBe(0); // Zero downside deviation guard
    expect(mWins.maxDrawdown).toBe(0);
    expect(mWins.maxDrawdownPct).toBe(0);
    expect(mWins.calmar).toBe(0); // Calmar division by zero guard
    expect(mWins.omega).toBe(100); // Fallback omega for 0 gross loss
    expect(Number.isFinite(mWins.sharpe)).toBe(true);

    const losses100 = Array.from({ length: n }, (_, i) =>
      makeTrade({ id: i + 1, netPnl: -(100 + i * 2), rMultiple: -1.0, closedAt: new Date(baseDate.getTime() + i * 86400000) })
    );
    const mLosses = computeMetrics(losses100);
    expect(mLosses.winRate).toBe(0.0);
    expect(mLosses.wins).toBe(0);
    expect(mLosses.avgWin).toBe(0);
    expect(mLosses.profitFactor).toBe(0);
    expect(mLosses.payoff).toBe(0);
    expect(mLosses.sortino).toBeLessThan(0);
    expect(mLosses.omega).toBe(0);
    const totalExpectedLoss = losses100.reduce((s, t) => s + Math.abs(t.netPnl), 0);
    expect(mLosses.maxDrawdown).toBe(totalExpectedLoss);
  });

  it("ADV-4: Zero Standard Deviation (Constant Returns) & Flat Equity Curves", () => {
    const flatPnls = Array.from({ length: 50 }, (_, i) =>
      makeTrade({ id: i + 1, netPnl: 75, rMultiple: 1.0, closedAt: new Date(baseDate.getTime() + i * 86400000) })
    );
    const mFlat = computeMetrics(flatPnls);
    expect(mFlat.sharpe).toBe(0); // sd=0
    expect(mFlat.sortino).toBe(0); // downside=0
    expect(mFlat.expectancy).toBe(75);
    expect(mFlat.expectancyR).toBe(1.0);

    const allZeros = Array.from({ length: 50 }, (_, i) =>
      makeTrade({ id: i + 1, netPnl: 0, rMultiple: 0, closedAt: new Date(baseDate.getTime() + i * 86400000) })
    );
    const mZero = computeMetrics(allZeros);
    expect(mZero.sharpe).toBe(0);
    expect(mZero.sortino).toBe(0);
    expect(mZero.maxDrawdown).toBe(0);
    expect(mZero.maxDrawdownPct).toBe(0);
    expect(mZero.calmar).toBe(0);
    expect(mZero.finalBalance).toBe(10000);
  });

  it("ADV-5: Massive dataset stress (n = 10,000 trades) performs in sub-second time without precision leak", () => {
    const largeN = 10000;
    const largeTrades: Trade[] = [];
    let net = 0;
    for (let i = 0; i < largeN; i++) {
      const pnl = (i % 2 === 0 ? 120 : -80);
      net += pnl;
      largeTrades.push(
        makeTrade({
          id: i + 1,
          netPnl: pnl,
          rMultiple: i % 2 === 0 ? 1.5 : -1.0,
          closedAt: new Date(baseDate.getTime() + i * 3600000),
        })
      );
    }

    const t0 = performance.now();
    const m = computeMetrics(largeTrades);
    const duration = performance.now() - t0;

    expect(m.closedCount).toBe(10000);
    expect(m.winRate).toBe(0.5);
    expect(m.netPnl).toBe(net);
    expect(Number.isFinite(m.sharpe)).toBe(true);
    expect(Number.isFinite(m.sortino)).toBe(true);
    expect(Number.isFinite(m.calmar)).toBe(true);
    expect(duration).toBeLessThan(1000); // Under 1000ms
  });

  it("ADV-6: Half Kelly Position Sizing [0.25%, 3.0%] and Quarter Kelly Bounds", () => {
    function calcKelly(wrPct: number, rr: number) {
      const p = wrPct / 100;
      const q = 1 - p;
      const b = rr > 0 ? rr : 1;
      const fullKellyPct = b > 0 ? Math.max(0, ((p * b - q) / b) * 100) : 0;
      const halfKellyPct = fullKellyPct > 0 ? Math.max(0.25, Math.min(3.0, fullKellyPct / 2)) : 0;
      const quarterKellyPct = fullKellyPct > 0 ? Math.max(0.25, Math.min(3.0, fullKellyPct / 4)) : 0;
      return { fullKellyPct, halfKellyPct, quarterKellyPct };
    }

    // Infinite payoff (b -> infinity): f* -> p
    const kInf = calcKelly(50, 1e9);
    expect(kInf.fullKellyPct).toBeCloseTo(50.0, 3);
    expect(kInf.halfKellyPct).toBe(3.0); // Clamped to 3.0% max
    expect(kInf.quarterKellyPct).toBe(3.0); // Clamped to 3.0% max

    // Zero payoff (b -> 0): f* -> 0
    const kZero = calcKelly(99, 1e-9);
    expect(kZero.fullKellyPct).toBe(0);
    expect(kZero.halfKellyPct).toBe(0);
    expect(kZero.quarterKellyPct).toBe(0);

    // Negative payoff / edge: f* <= 0 -> clamped to 0%
    const kNeg = calcKelly(40, 1.0);
    expect(kNeg.fullKellyPct).toBe(0);
    expect(kNeg.halfKellyPct).toBe(0);
    expect(kNeg.quarterKellyPct).toBe(0);

    // Break-even edge: f* = 0 -> clamped to 0%
    const kEven = calcKelly(50, 1.0);
    expect(kEven.fullKellyPct).toBe(0);
    expect(kEven.halfKellyPct).toBe(0);

    // Micro-edge: f* = 0.2% -> Half Kelly = 0.1% -> clamped to min 0.25%
    const kMicro = calcKelly(50.1, 1.0);
    expect(kMicro.fullKellyPct).toBeCloseTo(0.2, 4);
    expect(kMicro.halfKellyPct).toBe(0.25);
    expect(kMicro.quarterKellyPct).toBe(0.25);

    // Moderate edge: 52% WR, 1.5 RR -> f* = (0.52 * 1.5 - 0.48) / 1.5 = 0.30 / 1.5 = 20%
    const kMod = calcKelly(52, 1.5);
    expect(kMod.fullKellyPct).toBeCloseTo(20.0, 4);
    expect(kMod.halfKellyPct).toBe(3.0); // 10% clamped to 3.0%
    expect(kMod.quarterKellyPct).toBe(3.0); // 5% clamped to 3.0%

    // Small edge: 51% WR, 1.0 RR -> f* = 2% -> Half Kelly = 1.0%, Quarter Kelly = 0.5%
    const kSmall = calcKelly(51, 1.0);
    expect(kSmall.fullKellyPct).toBeCloseTo(2.0, 4);
    expect(kSmall.halfKellyPct).toBeCloseTo(1.0, 4);
    expect(kSmall.quarterKellyPct).toBeCloseTo(0.5, 4);
  });

  it("ADV-7: Wilson 95% Score Confidence Interval mathematical bounds and monotonicity", () => {
    function calcWilson(wrPct: number, n: number) {
      const wr = wrPct / 100;
      const z95 = 1.96;
      const zSq = z95 * z95;
      const denom = 1 + zSq / n;
      const center = (wr + zSq / (2 * n)) / denom;
      const margin = (z95 * Math.sqrt((wr * (1 - wr)) / n + zSq / (4 * n * n))) / denom;
      const wilsonLower = Math.max(0, center - margin) * 100;
      const wilsonUpper = Math.min(1, center + margin) * 100;
      return { wilsonLower, wilsonUpper, center: center * 100, margin: margin * 100 };
    }

    // Boundary p = 0: Lower = 0, Upper = 1 - 1/(1 + z^2/n) ~ z^2/(n + z^2)
    const w0 = calcWilson(0, 10);
    expect(w0.wilsonLower).toBe(0);
    expect(w0.wilsonUpper).toBeCloseTo((1.96 * 1.96 / (10 + 1.96 * 1.96)) * 100, 4);
    expect(w0.wilsonUpper).toBeLessThan(30);

    // Boundary p = 1: Upper = 100%, Lower ~ 100 - Upper(p=0)
    const w1 = calcWilson(100, 10);
    expect(w1.wilsonUpper).toBe(100);
    expect(w1.wilsonLower).toBeCloseTo(100 - w0.wilsonUpper, 4);

    // Boundary n = 1: Valid finite non-NaN interval
    const wN1 = calcWilson(100, 1);
    expect(wN1.wilsonUpper).toBe(100);
    expect(wN1.wilsonLower).toBeGreaterThan(0);
    expect(Number.isFinite(wN1.wilsonLower)).toBe(true);

    // Asymptotic n -> infinity: Margin -> 0, interval collapses to observed p
    const wInf = calcWilson(58, 1000000);
    expect(wInf.wilsonLower).toBeCloseTo(58.0, 0);
    expect(wInf.wilsonUpper).toBeCloseTo(58.0, 0);
    expect(wInf.wilsonUpper - wInf.wilsonLower).toBeLessThan(0.25);

    // Monotonicity of sample size: larger n -> narrower confidence interval
    const w50 = calcWilson(55, 50);
    const w200 = calcWilson(55, 200);
    const w1000 = calcWilson(55, 1000);
    const span50 = w50.wilsonUpper - w50.wilsonLower;
    const span200 = w200.wilsonUpper - w200.wilsonLower;
    const span1000 = w1000.wilsonUpper - w1000.wilsonLower;
    expect(span200).toBeLessThan(span50);
    expect(span1000).toBeLessThan(span200);
  });

  it("ADV-8: Abramowitz & Stegun Normal CDF (7.1.26) Precision & Asymptotics", () => {
    // Reference tabulated values from NIST DLMF / Abramowitz & Stegun Handbook
    const standardTable = [
      { z: 0.0, phi: 0.5000000 },
      { z: 0.25, phi: 0.5987063 },
      { z: 0.50, phi: 0.6914625 },
      { z: 0.75, phi: 0.7733726 },
      { z: 1.00, phi: 0.8413447 },
      { z: 1.281552, phi: 0.9000000 },
      { z: 1.644853, phi: 0.9500000 },
      { z: 1.959964, phi: 0.9750000 },
      { z: 2.00, phi: 0.9772499 },
      { z: 2.326348, phi: 0.9900000 },
      { z: 2.575829, phi: 0.9950000 },
      { z: 3.00, phi: 0.9986501 },
      { z: 3.50, phi: 0.9997674 },
      { z: 4.00, phi: 0.9999683 },
      { z: 5.00, phi: 0.9999997 },
    ];

    for (const { z, phi } of standardTable) {
      const computed = normalCdf(z);
      expect(Math.abs(computed - phi)).toBeLessThan(1.5e-5);
      // Symmetry test
      expect(Math.abs(normalCdf(z) + normalCdf(-z) - 1.0)).toBeLessThan(1e-7);
    }

    // Monotonicity check across dense grid
    let prev = 0;
    for (let z = -5.0; z <= 5.0; z += 0.1) {
      const cur = normalCdf(z);
      expect(cur).toBeGreaterThanOrEqual(prev);
      expect(cur).toBeGreaterThanOrEqual(0.0);
      expect(cur).toBeLessThanOrEqual(1.0);
      prev = cur;
    }

    // Extreme z values without overflow/underflow or NaN
    expect(normalCdf(10)).toBeCloseTo(1.0, 7);
    expect(normalCdf(-10)).toBeCloseTo(0.0, 7);
    expect(normalCdf(100)).toBe(1.0);
    expect(normalCdf(-100)).toBe(0.0);
  });

  it("ADV-9: Mulberry32 PRNG Determinism, Distribution and Period Stability", () => {
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

    // Two instances with the same seed generate bitwise identical sequence
    const rngA = mulberry32(20260716);
    const rngB = mulberry32(20260716);
    const sampleSize = 50000;
    let sum = 0;
    for (let i = 0; i < sampleSize; i++) {
      const valA = rngA();
      const valB = rngB();
      expect(valA).toBe(valB);
      expect(valA).toBeGreaterThanOrEqual(0);
      expect(valA).toBeLessThan(1);
      sum += valA;
    }

    // Uniform distribution check: mean should be ~0.5 (+/- 0.01)
    const sampleMean = sum / sampleSize;
    expect(sampleMean).toBeGreaterThan(0.49);
    expect(sampleMean).toBeLessThan(0.51);
  });

  it("ADV-10: Drawdown recovery formula drawdownRecoveryRequired handles all percentages and fractions", () => {
    // Percentage input (e.g. 10 for 10%)
    expect(drawdownRecoveryRequired(0)).toBe(0);
    expect(drawdownRecoveryRequired(10)).toBeCloseTo(11.1111, 4);
    expect(drawdownRecoveryRequired(20)).toBeCloseTo(25.0, 4);
    expect(drawdownRecoveryRequired(33.3333)).toBeCloseTo(50.0, 2);
    expect(drawdownRecoveryRequired(50)).toBeCloseTo(100.0, 4);
    expect(drawdownRecoveryRequired(75)).toBeCloseTo(300.0, 4);
    expect(drawdownRecoveryRequired(90)).toBeCloseTo(900.0, 4);
    expect(drawdownRecoveryRequired(95)).toBeCloseTo(1900.0, 4);
    expect(drawdownRecoveryRequired(100)).toBe(Infinity);
    expect(drawdownRecoveryRequired(105)).toBe(Infinity);

    // Fraction input (e.g. 0.10 for 10%)
    expect(drawdownRecoveryRequired(0.10)).toBeCloseTo(0.10 / 0.90, 4);
    expect(drawdownRecoveryRequired(0.50)).toBeCloseTo(1.0, 4);
    expect(drawdownRecoveryRequired(1.0)).toBe(Infinity);

    // Negative input guard
    expect(drawdownRecoveryRequired(-10)).toBe(0);
  });

  it("ADV-11: Official CME / NYMEX Futures Contract Specifications Multipliers", () => {
    const contracts = FUTURES_CONTRACTS;
    const findContract = (id: string) => contracts.find((c) => c.id === id);

    // E-mini S&P 500 (ES) -> $50 / pt, tickSize 0.25 ($12.50 / tick)
    const es = findContract("es");
    expect(es).toBeDefined();
    expect(es?.mult).toBe(50);
    expect(es?.tickSize).toBe(0.25);

    // E-mini Nasdaq-100 (NQ) -> $20 / pt, tickSize 0.25 ($5.00 / tick)
    const nq = findContract("nq");
    expect(nq).toBeDefined();
    expect(nq?.mult).toBe(20);
    expect(nq?.tickSize).toBe(0.25);

    // Micro E-mini S&P 500 (MES) -> $5 / pt, tickSize 0.25 ($1.25 / tick)
    const mes = findContract("mes");
    expect(mes).toBeDefined();
    expect(mes?.mult).toBe(5);
    expect(mes?.tickSize).toBe(0.25);

    // Micro E-mini Nasdaq-100 (MNQ) -> $2 / pt, tickSize 0.25 ($0.50 / tick)
    const mnq = findContract("mnq");
    expect(mnq).toBeDefined();
    expect(mnq?.mult).toBe(2);
    expect(mnq?.tickSize).toBe(0.25);

    // E-mini Russell 2000 (RTY) -> $50 / pt, tickSize 0.1 ($5.00 / tick)
    const rty = findContract("rty");
    expect(rty).toBeDefined();
    expect(rty?.mult).toBe(50);
    expect(rty?.tickSize).toBe(0.1);

    // Gold (GC) -> $100 / pt, tickSize 0.1 ($10.00 / tick)
    const gc = findContract("gc");
    expect(gc).toBeDefined();
    expect(gc?.mult).toBe(100);
    expect(gc?.tickSize).toBe(0.1);

    // Crude Oil (CL) -> $1000 / pt, tickSize 0.01 ($10.00 / tick)
    const cl = findContract("cl");
    expect(cl).toBeDefined();
    expect(cl?.mult).toBe(1000);
    expect(cl?.tickSize).toBe(0.01);
  });
});
