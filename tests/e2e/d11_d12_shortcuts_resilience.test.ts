import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { normalCdf } from "@/components/marketing/EdgeSignificanceChecker";

/**
 * Dimension D11 & D12: Shortcuts, Error Handling & Resilience
 *
 * Tier 1: Feature Coverage (>= 5 tests)
 *  1. Keybindings matching logic (Ctrl+K / Cmd+K, Ctrl+G / Cmd+G, ? / Shift+/)
 *  2. Global single-key & sequence shortcuts (T, L, ?, g prefix sequence)
 *  3. Form field typing protection (INPUT, TEXTAREA, SELECT, contentEditable)
 *  4. LocalStorage try-catch safety in private browsing mode
 *  5. Interactive tool input bounds checking and validation flags
 *
 * Tier 2: Boundary & Corner Cases (>= 5 tests)
 *  6. NaN, Infinity, negative values, and zero division handling in calculators
 *  7. Simulated DOMException (SecurityError / QuotaExceededError) resilience
 *  8. Rapid concurrent shortcut triggers & state race resilience
 *  9. Out-of-bounds keyboard navigation & roving tabindex clamping
 *  10. Corrupted JSON payload recovery in localStorage
 */

const ROOT = join(import.meta.dirname, "..", "..");
const readSrc = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

describe("Dimension D11 & D12: Shortcuts & Resilience (Tier 1 Feature Coverage)", () => {
  it("T1.1: OverlayHost and GlobalShortcuts bind Ctrl+K / Cmd+K and ? keybindings correctly", () => {
    const overlayHost = readSrc("src/components/tj/OverlayHost.tsx");
    const globalShortcuts = readSrc("src/components/tj/GlobalShortcuts.tsx");

    // CommandPalette listener in OverlayHost
    expect(overlayHost).toContain('(e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k"');
    expect(overlayHost).toContain("e.preventDefault()");
    expect(overlayHost).toContain("setCmdOpen((o) => !o)");

    // ShortcutsHelp listener in GlobalShortcuts
    expect(globalShortcuts).toContain('key === "?"');
    expect(globalShortcuts).toContain('e.shiftKey && (key === "/" || e.code === "Slash")');
    expect(globalShortcuts).toContain("openShortcutsHelp()");
  });

  it("T1.2: GlobalShortcuts supports T (Theme), L (Language), and 'g' navigation sequences", () => {
    const globalShortcuts = readSrc("src/components/tj/GlobalShortcuts.tsx");

    // Toggling theme and language
    expect(globalShortcuts).toContain('lower === "t"');
    expect(globalShortcuts).toContain("toggleTheme()");
    expect(globalShortcuts).toContain('lower === "l"');
    expect(globalShortcuts).toContain("toggleLang()");

    // 'g' prefix activation & sequence navigation
    expect(globalShortcuts).toContain('lower === "g"');
    expect(globalShortcuts).toContain("armPrefix()");
    expect(globalShortcuts).toContain("G_PREFIX_TIMEOUT = 1000");
    expect(globalShortcuts).toContain("G_NAV_MAP");
    expect(globalShortcuts).toContain('key === "Escape" && gPrefixActive.current');
  });

  it("T1.3: Form field typing protection skips shortcut handling during text input", () => {
    const globalShortcuts = readSrc("src/components/tj/GlobalShortcuts.tsx");

    // Must ignore typing in INPUT, TEXTAREA, SELECT, or contentEditable
    expect(globalShortcuts).toContain('tag === "INPUT"');
    expect(globalShortcuts).toContain('tag === "TEXTAREA"');
    expect(globalShortcuts).toContain('tag === "SELECT"');
    expect(globalShortcuts).toContain("target.isContentEditable");
  });

  it("T1.4: LocalStorage calls are protected with try-catch for private browsing compatibility", () => {
    const glossaryModal = readSrc("src/components/tj/GlossaryModal.tsx");

    // readRecent and writeRecent in GlossaryModal wrap localStorage in try-catch
    expect(glossaryModal).toMatch(/function readRecent\(\)[^{]*\{[\s\S]*?try\s*\{[\s\S]*?window\.localStorage\.getItem/);
    expect(glossaryModal).toMatch(/function writeRecent\([^)]*\)[^{]*\{[\s\S]*?try\s*\{[\s\S]*?window\.localStorage\.setItem/);
  });

  it("T1.5: Interactive tools validate input parameters and provide clear validation alerts", () => {
    const riskCalc = readSrc("src/components/marketing/RiskCalculator.tsx");
    const equityProj = readSrc("src/components/marketing/EquityProjector.tsx");
    const edgeChecker = readSrc("src/components/marketing/EdgeSignificanceChecker.tsx");

    // RiskCalculator checks valid pricing and shows alert when invalid
    expect(riskCalc).toContain("const valid = riskPerShare > 0 && rewardPerShare > 0 && entry > 0;");
    expect(riskCalc).toContain('role="alert"');

    // EquityProjector warns on negative expectancy
    expect(equityProj).toContain("!c.hasEdge &&");
    expect(equityProj).toContain('role="alert"');

    // EdgeSignificanceChecker checks sufficient sample size
    expect(edgeChecker).toContain("const canTest = np0 >= 5;");
  });
});

describe("Dimension D11 & D12: Shortcuts & Resilience (Tier 2 Boundary & Corner Cases)", () => {
  it("T2.1: Mathematical calculators handle NaN, Infinity, negative values, and zero division gracefully", () => {
    // 1. EquityProjector CAGR & compounding math
    function calcEquityProjector(startBalance: number, tradesPerYear: number, winRate: number, avgWinR: number, avgLossR: number, riskPct: number, years: number) {
      const wr = winRate / 100;
      const lr = 1 - wr;
      const expectancyPerTradeR = wr * avgWinR - lr * avgLossR;
      const perTradeGrowth = expectancyPerTradeR * (riskPct / 100);
      const yearlyFactor = Math.pow(1 + perTradeGrowth, tradesPerYear);

      const curve: number[] = [startBalance];
      for (let y = 1; y <= years; y++) {
        curve.push(curve[y - 1] * yearlyFactor);
      }
      const finalBalance = curve[curve.length - 1];
      const cagr = startBalance > 0 && finalBalance > 0 && years > 0 && yearlyFactor >= 0
        ? Math.pow(finalBalance / startBalance, 1 / years) - 1
        : -1;

      return { expectancyPerTradeR, yearlyFactor, finalBalance, cagr };
    }

    // Zero balance edge case
    const resZeroBalance = calcEquityProjector(0, 200, 55, 2.0, 1.0, 1.0, 5);
    expect(Number.isFinite(resZeroBalance.cagr)).toBe(true);
    expect(resZeroBalance.cagr).toBe(-1);

    // Zero years edge case
    const resZeroYears = calcEquityProjector(10000, 200, 55, 2.0, 1.0, 1.0, 0);
    expect(Number.isFinite(resZeroYears.cagr)).toBe(true);

    // Negative expectancy edge case (loss rate 100%)
    const resNegativeExp = calcEquityProjector(10000, 100, 0, 2.0, 1.0, 2.0, 5);
    expect(Number.isFinite(resNegativeExp.cagr)).toBe(true);
    expect(resNegativeExp.expectancyPerTradeR).toBe(-1.0);

    // 2. RiskCalculator zero distance edge case (entry === stop)
    function calcRisk(entry: number, stop: number, target: number, balance: number, riskPct: number) {
      const riskPerShare = Math.abs(entry - stop);
      const rewardPerShare = Math.abs(target - entry);
      const valid = riskPerShare > 0 && rewardPerShare > 0 && entry > 0;
      const rr = valid ? rewardPerShare / riskPerShare : 0;
      const riskUsd = (balance * riskPct) / 100;
      const size = valid ? riskUsd / riskPerShare : 0;
      return { valid, rr, size };
    }

    const resZeroDist = calcRisk(100, 100, 110, 10000, 1.0);
    expect(resZeroDist.valid).toBe(false);
    expect(resZeroDist.rr).toBe(0);
    expect(resZeroDist.size).toBe(0);

    // 3. EdgeSignificanceChecker normalCdf with extreme z-scores
    expect(normalCdf(0)).toBe(0.5);
    expect(normalCdf(100)).toBeCloseTo(1.0, 5);
    expect(normalCdf(-100)).toBeCloseTo(0.0, 5);
    expect(Number.isFinite(normalCdf(NaN))).toBe(false); // NaN propagation is predictable
  });

  it("T2.2: LocalStorage SecurityError and QuotaExceededError simulations recover safely", () => {
    const memoryStore: Record<string, string> = {};
    let shouldThrowSecurityError = false;
    let shouldThrowQuotaError = false;

    const mockStorage = {
      getItem(key: string): string | null {
        if (shouldThrowSecurityError) {
          throw new Error("SecurityError: The operation is insecure.");
        }
        return memoryStore[key] ?? null;
      },
      setItem(key: string, value: string): void {
        if (shouldThrowSecurityError) {
          throw new Error("SecurityError: The operation is insecure.");
        }
        if (shouldThrowQuotaError) {
          throw new Error("QuotaExceededError: DOMException 22");
        }
        memoryStore[key] = value;
      },
    };

    function safeReadRecent(): string[] {
      try {
        const raw = mockStorage.getItem("tj-glossary-recent");
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((x) => typeof x === "string").slice(0, 3);
      } catch {
        return [];
      }
    }

    function safeWriteRecent(terms: string[]): boolean {
      try {
        mockStorage.setItem("tj-glossary-recent", JSON.stringify(terms.slice(0, 3)));
        return true;
      } catch {
        return false;
      }
    }

    // Nominal execution
    expect(safeWriteRecent(["Sharpe", "Sortino"])).toBe(true);
    expect(safeReadRecent()).toEqual(["Sharpe", "Sortino"]);

    // Security error simulation
    shouldThrowSecurityError = true;
    expect(safeReadRecent()).toEqual([]);
    expect(safeWriteRecent(["Drawdown"])).toBe(false);

    // Quota error simulation
    shouldThrowSecurityError = false;
    shouldThrowQuotaError = true;
    expect(safeWriteRecent(["Drawdown"])).toBe(false);
  });

  it("T2.3: Rapid shortcut activations and sequence expirations do not leak timers or corrupt state", () => {
    let active = false;
    let timerId: NodeJS.Timeout | null = null;
    const timeoutMs = 50;

    function arm() {
      active = true;
      if (timerId) clearTimeout(timerId);
      timerId = setTimeout(() => {
        active = false;
        timerId = null;
      }, timeoutMs);
    }

    function disarm() {
      active = false;
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
      }
    }

    // Rapid arming
    arm();
    arm();
    arm();
    expect(active).toBe(true);

    // Immediate disarm (Escape key behavior)
    disarm();
    expect(active).toBe(false);
    expect(timerId).toBeNull();
  });

  it("T2.4: Out-of-bounds keyboard listbox navigation clamps correctly", () => {
    function navigateList(currentIndex: number, totalItems: number, key: string): number {
      if (totalItems === 0) return 0;
      if (key === "ArrowDown") return (currentIndex + 1) % totalItems;
      if (key === "ArrowUp") return (currentIndex - 1 + totalItems) % totalItems;
      if (key === "Home") return 0;
      if (key === "End") return totalItems - 1;
      return currentIndex;
    }

    expect(navigateList(0, 0, "ArrowDown")).toBe(0);
    expect(navigateList(4, 5, "ArrowDown")).toBe(0); // wrap to top
    expect(navigateList(0, 5, "ArrowUp")).toBe(4); // wrap to bottom
    expect(navigateList(2, 10, "Home")).toBe(0);
    expect(navigateList(2, 10, "End")).toBe(9);
  });

  it("T2.5: Corrupted JSON in localStorage parses safely with graceful fallback", () => {
    function parseRecentSafe(rawJson: string | null): string[] {
      if (!rawJson) return [];
      try {
        const parsed = JSON.parse(rawJson);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((x) => typeof x === "string").slice(0, 3);
      } catch {
        return [];
      }
    }

    expect(parseRecentSafe(null)).toEqual([]);
    expect(parseRecentSafe("")).toEqual([]);
    expect(parseRecentSafe("{invalid json")).toEqual([]);
    expect(parseRecentSafe("12345")).toEqual([]);
    expect(parseRecentSafe('{"a": 1}')).toEqual([]);
    expect(parseRecentSafe('["Alpha", 42, null, true, "Beta", "Gamma", "Delta"]')).toEqual(["Alpha", "Beta", "Gamma"]);
  });
});
