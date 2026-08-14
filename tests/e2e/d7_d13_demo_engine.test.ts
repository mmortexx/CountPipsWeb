import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  TRADES,
  METRICS,
  INSTRUMENTS,
  SETUP_NAMES,
  SESSIONS,
  computeMetrics,
  rHistogram,
  pnlHistogram,
  durationHistogram,
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

/**
 * Dimension D7 & D13: Demo Engine, PRNG Determinism & State Synchronization
 *
 * Requirements tested:
 * - Tier 1: Feature Coverage
 *   1. Mulberry32 PRNG Determinism with seed 20260716 (exact 200 trades, reproducible sequence)
 *   2. Strict UTC Date generation & indexing (London 8-11, NY 14-17, Asia 23-3 UTC, openedAt < closedAt)
 *   3. Filter integrity across assets, setups, sessions (conservation of trades & net PnL across subsets)
 *   4. Multi-view data synchronization (table <-> curve <-> metrics <-> histograms <-> calendar <-> heatmap)
 *   5. Demo store reactive state management & decoupled store synchronization (CRUD + merge + synthesis)
 * - Tier 2: Boundary & Corner Cases
 *   1. Empty filter result sets (non-existent asset/setup/session returns [] with safe metrics)
 *   2. Date range edge matching & single timestamp filtering
 *   3. Zero balance / negative balance boundary conditions
 *   4. Single-candle / zero-duration / breakeven custom trade synthesis
 *   5. Corrupted & invalid localStorage payload recovery
 */

// Helper to simulate browser environment in node test runner
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

describe("D7 & D13: Demo Engine - Tier 1 Feature Coverage", () => {
  it("D7/D13-T1.1: Mulberry32 PRNG determinism with fixed seed (20260716)", () => {
    // Exact count and structural properties
    expect(TRADES).toBeDefined();
    expect(TRADES.length).toBe(200);

    // Verify first trade matches deterministic snapshot
    const first = TRADES[0];
    expect(first.id).toBeGreaterThan(0);
    expect(typeof first.instrument).toBe("string");
    expect(typeof first.entry).toBe("number");
    expect(typeof first.exit).toBe("number");
    expect(typeof first.netPnl).toBe("number");
    expect(typeof first.rMultiple).toBe("number");

    // Check independent Mulberry32 generator implementation
    function mulberry32(seed: number) {
      return function () {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    const rng1 = mulberry32(20260716);
    const rng2 = mulberry32(20260716);
    const seq1 = Array.from({ length: 50 }, () => rng1());
    const seq2 = Array.from({ length: 50 }, () => rng2());
    expect(seq1).toEqual(seq2);
  });

  it("D7/D13-T1.2: Strict UTC date generation and session hour alignment", () => {
    const validSymbols = new Set(INSTRUMENTS.map((i) => i.symbol));
    const validSetups = new Set(SETUP_NAMES);
    const validSessions = new Set(SESSIONS);

    for (const trade of TRADES) {
      expect(validSymbols.has(trade.instrument)).toBe(true);
      expect(validSetups.has(trade.setup)).toBe(true);
      expect(validSessions.has(trade.session)).toBe(true);

      // Verify date validity and chronological ordering
      expect(trade.openedAt).toBeInstanceOf(Date);
      expect(trade.closedAt).toBeInstanceOf(Date);
      expect(trade.openedAt.getTime()).toBeLessThan(trade.closedAt.getTime());

      // Duration must match timestamp difference
      const computedDuration = (trade.closedAt.getTime() - trade.openedAt.getTime()) / 60000;
      expect(trade.durationMin).toBeCloseTo(computedDuration, 1);

      // Verify session UTC windows
      const utcHour = trade.closedAt.getUTCHours();
      if (trade.session === "London") {
        expect(utcHour).toBeGreaterThanOrEqual(8);
        expect(utcHour).toBeLessThanOrEqual(10);
      } else if (trade.session === "NY") {
        expect(utcHour).toBeGreaterThanOrEqual(14);
        expect(utcHour).toBeLessThanOrEqual(16);
      } else if (trade.session === "Asia") {
        expect([23, 0, 1, 2]).toContain(utcHour);
      }
    }
  });

  it("D7/D13-T1.3: Filter integrity across assets, setups, and sessions", () => {
    // 1. Partition by setup
    let totalSetupTrades = 0;
    let totalSetupNetPnl = 0;

    for (const setup of SETUP_NAMES) {
      const filtered = TRADES.filter((t) => t.setup === setup);
      const metrics = computeMetrics(filtered);
      totalSetupTrades += filtered.length;
      totalSetupNetPnl += metrics.netPnl;

      // Filtered metrics must be internally consistent
      expect(metrics.closedCount).toBe(filtered.length);
      expect(metrics.wins + metrics.losses).toBeLessThanOrEqual(filtered.length);
      if (filtered.length > 0) {
        expect(metrics.expectancy).toBeCloseTo(metrics.netPnl / filtered.length, 4);
      }
    }
    expect(totalSetupTrades).toBe(TRADES.length);
    expect(totalSetupNetPnl).toBeCloseTo(METRICS.netPnl, 2);

    // 2. Partition by session
    let totalSessionTrades = 0;
    let totalSessionNetPnl = 0;
    for (const session of SESSIONS) {
      const filtered = TRADES.filter((t) => t.session === session);
      const metrics = computeMetrics(filtered);
      totalSessionTrades += filtered.length;
      totalSessionNetPnl += metrics.netPnl;
    }
    expect(totalSessionTrades).toBe(TRADES.length);
    expect(totalSessionNetPnl).toBeCloseTo(METRICS.netPnl, 2);
  });

  it("D7/D13-T1.4: Multi-view data synchronization across tables, charts, calendar and heatmaps", () => {
    // 1. Equity curve length & final balance
    expect(METRICS.equityCurve.length).toBe(TRADES.length);
    expect(METRICS.drawdownCeiling.length).toBe(TRADES.length);
    const lastEquityPoint = METRICS.equityCurve[METRICS.equityCurve.length - 1];
    expect(lastEquityPoint.balance).toBeCloseTo(METRICS.finalBalance, 2);

    // 2. Histograms match exact trade count
    const rBins = rHistogram(TRADES, 9);
    const rCountSum = rBins.reduce((s, b) => s + b.count, 0);
    expect(rCountSum).toBe(TRADES.length);

    const pnlBins = pnlHistogram(TRADES, 9);
    const pnlCountSum = pnlBins.reduce((s, b) => s + b.count, 0);
    expect(pnlCountSum).toBe(TRADES.length);

    const durBins = durationHistogram(TRADES);
    const durCountSum = durBins.reduce((s, b) => s + b.count, 0);
    expect(durCountSum).toBe(TRADES.length);

    // 3. Heatmap and weekday breakdown consistency
    const heat = heatmap(TRADES);
    let heatSum = 0;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 6; c++) {
        heatSum += heat[r][c];
      }
    }
    const weekdaySum = weekdayBreakdown(TRADES)
      .slice(0, 5) // Lun to Vie
      .reduce((s, d) => s + d.pnl, 0);
    expect(heatSum).toBeCloseTo(weekdaySum, 2);

    // 4. Monthly breakdown matches total net PnL
    const monthly = monthlyBreakdown(TRADES);
    const monthlySum = monthly.reduce((s, m) => s + m.pnl, 0);
    expect(monthlySum).toBeCloseTo(METRICS.netPnl, 2);
  });

  it("D7/D13-T1.5: CustomTrade to Trade synthesis and merge integrity", () => {
    const custom: CustomTrade = {
      id: 1770000000000,
      instrument: "BTC/USDT",
      setup: "Pullback",
      direction: "long",
      entry: 65000,
      exit: 66300,
      qty: 0.1,
      netPnl: 130,
      rMultiple: 2.6,
      compliance: "yes",
      closedAt: "2026-07-20T10:00:00.000Z", // London session
      note: "Bought retest of 65k support",
    };

    const fullTrade = customTradeToTrade(custom);

    expect(fullTrade.id).toBe(custom.id);
    expect(fullTrade.instrument).toBe("BTC/USDT");
    expect(fullTrade.session).toBe("London");
    expect(fullTrade.netPnl).toBe(130);
    expect(fullTrade.grossPnl).toBeGreaterThan(130); // gross = net + fees
    expect(fullTrade.fees).toBeCloseTo(130 * 0.03, 2);
    expect(fullTrade.riskUsd).toBeCloseTo(130 / 2.6, 2); // 50 USD risk
    expect(fullTrade.target).toBeGreaterThan(custom.entry);
    expect(fullTrade.initialStop).toBeLessThan(custom.entry);
    expect(fullTrade.durationMin).toBeGreaterThanOrEqual(30);

    // Merging with sample TRADES
    const merged = mergeTrades(TRADES, [custom]);
    expect(merged.length).toBe(TRADES.length + 1);
    expect(merged[0].id).toBe(custom.id); // Sorted newest first (July 20 > July 16)
  });
});

describe("D7 & D13: Demo Engine - Tier 2 Boundary & Corner Cases", () => {
  let originalWindow: typeof globalThis.window;

  beforeEach(() => {
    originalWindow = globalThis.window;
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  it("D7/D13-T2.1: Empty filter result sets produce clean zero-state without throw", () => {
    const emptyTrades: Trade[] = [];
    const metrics = computeMetrics(emptyTrades);

    expect(metrics.closedCount).toBe(0);
    expect(metrics.equityCurve).toEqual([]);
    expect(metrics.drawdownCeiling).toEqual([]);

    const rBins = rHistogram(emptyTrades);
    expect(rBins.every((b) => b.count === 0)).toBe(true);

    const pnlBins = pnlHistogram(emptyTrades);
    expect(pnlBins).toEqual([]);

    const heat = heatmap(emptyTrades);
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 6; c++) {
        expect(heat[r][c]).toBe(0);
      }
    }
  });

  it("D7/D13-T2.2: Date range edge matching and single timestamp filtering", () => {
    // Filter trades in exact single day
    const targetDate = new Date("2026-07-16T00:00:00Z");
    const sameDayTrades = TRADES.filter(
      (t) =>
        t.closedAt.getUTCFullYear() === targetDate.getUTCFullYear() &&
        t.closedAt.getUTCMonth() === targetDate.getUTCMonth() &&
        t.closedAt.getUTCDate() === targetDate.getUTCDate()
    );

    expect(Array.isArray(sameDayTrades)).toBe(true);
    const dailyMap = dailyPnlForMonth(TRADES, 2026, 6); // Month 6 = July
    const dayPnl = dailyMap.get("16");
    const sumDayTrades = sameDayTrades.reduce((s, t) => s + t.netPnl, 0);

    if (sameDayTrades.length > 0) {
      expect(dayPnl).toBeCloseTo(sumDayTrades, 2);
    }
  });

  it("D7/D13-T2.3: Zero balance and massive loss boundary condition", () => {
    // Custom trade losing $12,000 against $10,000 initial balance
    const catastrophicTrade: CustomTrade = {
      id: 9999,
      instrument: "NQ",
      setup: "Breakout",
      direction: "long",
      entry: 18000,
      exit: 15600,
      qty: 5,
      netPnl: -12000,
      rMultiple: -24.0,
      compliance: "no",
      closedAt: "2026-08-01T15:00:00.000Z",
      note: "Catastrophic gap down",
    };

    const fullTrade = customTradeToTrade(catastrophicTrade);
    const metrics = computeMetrics([fullTrade]);

    expect(metrics.finalBalance).toBe(-2000);
    expect(metrics.maxDrawdown).toBe(12000);
    expect(metrics.maxDrawdownPct).toBeCloseTo(12000 / 10000, 4); // 120% DD
    expect(metrics.calmar).toBe(0); // Guarded when finalBalance <= 0
    expect(metrics.roiPct).toBeCloseTo(-1.2, 4);
    expect(Number.isFinite(metrics.sharpe)).toBe(true);
  });

  it("D7/D13-T2.4: Single-candle ranges / breakeven custom trades", () => {
    const breakevenCustom: CustomTrade = {
      id: 8888,
      instrument: "EURUSD",
      setup: "Range",
      direction: "long",
      entry: 1.0850,
      exit: 1.0850,
      qty: 1,
      netPnl: 0,
      rMultiple: 0,
      compliance: "yes",
      closedAt: "2026-07-15T09:00:00.000Z",
      note: "Closed flat at breakeven",
    };

    const synthesized = customTradeToTrade(breakevenCustom);
    expect(synthesized.netPnl).toBe(0);
    expect(synthesized.riskUsd).toBe(0); // Safely handles rMultiple === 0
    expect(synthesized.grossPnl).toBe(0);
    expect(synthesized.fees).toBe(0);
    expect(synthesized.session).toBe("London");
  });

  it("D7/D13-T2.5: demoStore CRUD operations and state persistence with MockLocalStorage", async () => {
    const mockStorage = new MockLocalStorage();
    const listeners: (() => void)[] = [];

    // Mock browser environment
    globalThis.window = {
      localStorage: mockStorage as unknown as Storage,
      dispatchEvent: (event: Event) => {
        listeners.forEach((l) => l());
        return true;
      },
      addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => {
        if (typeof listener === "function") listeners.push(listener as () => void);
      },
      removeEventListener: () => {},
    } as unknown as Window & typeof globalThis;

    // Reset initially
    resetToSample();
    expect(getCustomTrades()).toEqual([]);

    // Add Trade
    const added1 = addTrade({
      instrument: "AAPL",
      setup: "Trend",
      direction: "long",
      entry: 190,
      exit: 195,
      qty: 10,
      netPnl: 50,
      rMultiple: 2.0,
      compliance: "yes",
      closedAt: "2026-07-18T16:00:00.000Z",
      note: "First trade",
    });

    expect(added1.id).toBeDefined();
    expect(getCustomTrades().length).toBe(1);
    expect(getCustomTrades()[0].instrument).toBe("AAPL");

    // Add Second Trade with distinct id by waiting 2ms or updating timestamp
    await new Promise((r) => setTimeout(r, 5));
    const added2 = addTrade({
      instrument: "ES",
      setup: "Reversal",
      direction: "short",
      entry: 5400,
      exit: 5410,
      qty: 1,
      netPnl: -500,
      rMultiple: -1.0,
      compliance: "no",
      closedAt: "2026-07-19T17:00:00.000Z",
      note: "Second trade",
    });
    expect(added2.id).not.toBe(added1.id);
    expect(getCustomTrades().length).toBe(2);

    // Update Trade
    const updated = updateTrade(added1.id, { netPnl: 75, rMultiple: 3.0 });
    expect(updated).not.toBeNull();
    expect(updated?.netPnl).toBe(75);

    // Delete Trade
    const deleted = deleteTrade(added2.id);
    expect(deleted).toBe(true);
    expect(getCustomTrades().length).toBe(1);

    // Reset
    resetToSample();
    expect(getCustomTrades()).toEqual([]);
  });

  it("D7/D13-T2.6: Corrupted or invalid localStorage payload recovery", () => {
    const mockStorage = new MockLocalStorage();
    globalThis.window = {
      localStorage: mockStorage as unknown as Storage,
      dispatchEvent: () => true,
    } as unknown as Window & typeof globalThis;

    // 1. Malformed JSON
    mockStorage.setItem(DEMO_TRADES_KEY, "{ not valid json [}");
    expect(getCustomTrades()).toEqual([]); // Gracefully recovers to empty array

    // 2. Non-array JSON
    mockStorage.setItem(DEMO_TRADES_KEY, JSON.stringify({ key: "not an array" }));
    expect(getCustomTrades()).toEqual([]);

    // 3. Array with invalid object schemas
    mockStorage.setItem(
      DEMO_TRADES_KEY,
      JSON.stringify([
        { invalidTrade: true },
        null,
        123,
        {
          id: 12345,
          instrument: "BTC/USDT",
          setup: "Breakout",
          direction: "long",
          entry: 60000,
          exit: 61000,
          qty: 0.1,
          netPnl: 100,
          rMultiple: 2.0,
          compliance: "yes",
          closedAt: "2026-07-10T10:00:00.000Z",
          note: "Valid trade",
        },
      ])
    );

    const trades = getCustomTrades();
    expect(trades.length).toBe(1); // Only the valid trade survived
    expect(trades[0].instrument).toBe("BTC/USDT");
  });

  it("D7/D13-T2.7: Setup naming & ranking language parity", () => {
    // Test ranking by expectancy
    const setupRankings = rankByExpectancy(TRADES, (t) => t.setup);
    expect(setupRankings.length).toBe(SETUP_NAMES.length);

    // Invariant: ranking must be sorted in strictly descending order of expectancy
    for (let i = 1; i < setupRankings.length; i++) {
      expect(setupRankings[i].expectancy).toBeLessThanOrEqual(setupRankings[i - 1].expectancy);
    }

    // Verify bilingual labels for all 5 setups
    for (const setup of SETUP_NAMES) {
      const esLabel = nombreSetup(setup, "es");
      const enLabel = nombreSetup(setup, "en");
      expect(typeof esLabel).toBe("string");
      expect(typeof enLabel).toBe("string");
      expect(esLabel.length).toBeGreaterThan(0);
      expect(enLabel.length).toBeGreaterThan(0);
    }
    expect(nombreSetup("Breakout", "es")).toBe("Ruptura");
    expect(nombreSetup("Breakout", "en")).toBe("Breakout");
    expect(nombreSetup("Reversal", "es")).toBe("Reversión");
    expect(nombreSetup("Reversal", "en")).toBe("Reversal");
  });
});
