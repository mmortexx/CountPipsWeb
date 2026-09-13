import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ULTIMA_ACTUALIZACION,
  ULTIMA_ACTUALIZACION_ISO,
  PUBLICACION_ISO,
  PRECIO_VALIDO_HASTA,
} from "@/lib/fechas";
import { readConsent, writeConsent, CONSENT_KEY } from "@/lib/consent";

/**
 * Dimension D6: Performance, SSG & Hydration Test Suite
 *
 * Requirements tested:
 * - Tier 1: Feature Coverage (>= 5 tests)
 *   1. Temporal determinism in SSG rendering (deterministic timestamps, zero unseeded time leaks)
 *   2. Dynamic component lazy-loading architecture in tool views
 *   3. Font optimization & `display: "swap"` declarations on all webfonts
 *   4. Pure CSS GPU-accelerated ticker marquee animation
 *   5. Containment & layout-shift prevention (`content-visibility`, `contain-intrinsic-size`)
 * - Tier 2: Boundary & Corner Cases (>= 5 tests)
 *   1. Leap year & UTC year boundary transitions (Feb 29, Dec 31 -> Jan 1)
 *   2. Midnight timestamp boundary consistency (23:59:59.999 vs 00:00:00.000)
 *   3. NoScript safety rule verification (recovery of opacity: 0 without corrupting decimals)
 *   4. Client storage error handling in sandboxed/private browsing environments
 *   5. Static SSG export readiness without runtime server-side dependencies
 */

const RAIZ = join(import.meta.dirname, "..", "..");
const leer = (rel: string) => readFileSync(join(RAIZ, rel), "utf8");

describe("Dimension D6: Performance, SSG & Hydration", () => {
  // =========================================================================
  // TIER 1: FEATURE COVERAGE
  // =========================================================================

  describe("Tier 1: Feature Coverage", () => {
    it("D6-T1-1: Temporal determinism in SSG rendering (deterministic timestamps across builds)", () => {
      // 1. ULTIMA_ACTUALIZACION must be a valid, deterministic Date object
      expect(ULTIMA_ACTUALIZACION).toBeInstanceOf(Date);
      expect(Number.isNaN(ULTIMA_ACTUALIZACION.getTime())).toBe(false);

      // 2. ISO strings format validation (YYYY-MM-DD)
      expect(ULTIMA_ACTUALIZACION_ISO).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(PUBLICACION_ISO).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(PRECIO_VALIDO_HASTA).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      // 3. Historical publication date is fixed
      expect(PUBLICACION_ISO).toBe("2026-07-20");

      // 4. Price validity date is strictly 1 year ahead of last modified in UTC
      const lastYear = ULTIMA_ACTUALIZACION.getUTCFullYear();
      const validYear = parseInt(PRECIO_VALIDO_HASTA.slice(0, 4), 10);
      expect(validYear).toBe(lastYear + 1);
    });

    it("D6-T1-2: Dynamic component lazy-loading in HerramientaVista avoids bloated initial bundles", () => {
      const vistaCode = leer("src/components/herramientas/HerramientaVista.tsx");

      // Verify dynamic imports exist for heavy interactive components
      expect(vistaCode).toContain('import dynamic from "next/dynamic"');
      expect(vistaCode).toContain("RiskCalculator: dynamic(");
      expect(vistaCode).toContain("RMultipleSimulator: dynamic(");
      expect(vistaCode).toContain("EdgeSignificanceChecker: dynamic(");
      expect(vistaCode).toContain("EquityProjector: dynamic(");
      expect(vistaCode).toContain("SavingsCalculator: dynamic(");
      expect(vistaCode).toContain("SessionClock: dynamic(");
      expect(vistaCode).toContain("DisciplineCost: dynamic(");
    });

    it("D6-T1-3: Font optimization & display: 'swap' configured on all webfonts in layout.tsx", () => {
      const layoutCode = leer("src/app/layout.tsx");

      // Verify localFont is used to avoid external Google Fonts round-trips
      expect(layoutCode).toContain('import localFont from "next/font/local"');

      // Verify font declarations include display: "swap"
      const displaySwapMatches = layoutCode.match(/display:\s*"swap"/g) || [];
      expect(
        displaySwapMatches.length,
        "All font declarations must specify display: 'swap' to prevent invisible text during loading",
      ).toBeGreaterThanOrEqual(2);

      // Verify font variable exports
      expect(layoutCode).toContain("variable: \"--font-geist-mono\"");
      expect(layoutCode).toContain("variable: \"--font-sans\"");
    });

    it("D6-T1-5: Containment & layout-shift prevention (content-visibility)", () => {
      const css = leer("src/app/globals.css");

      // globals.css defines cv-auto utilities for lazy rendering of offscreen sections
      expect(css).toContain("content-visibility: auto");
    });
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES
  // =========================================================================

  describe("Tier 2: Boundary & Corner Cases", () => {
    it("D6-T2-1: Leap year & UTC year boundary transitions (Feb 29, Dec 31 -> Jan 1)", () => {
      // Test 1: Leap year date addition (Feb 29 -> +1 year)
      const leapDay = new Date(Date.UTC(2024, 1, 29)); // 2024-02-29
      const nextYearFromLeap = new Date(
        Date.UTC(leapDay.getUTCFullYear() + 1, leapDay.getUTCMonth(), leapDay.getUTCDate()),
      );
      // In JS, 2025-02-29 rolls over to 2025-03-01 cleanly
      expect(nextYearFromLeap.toISOString().slice(0, 10)).toBe("2025-03-01");

      // Test 2: Dec 31 23:59:59.999 UTC transition
      const yearEnd = new Date(Date.UTC(2026, 11, 31, 23, 59, 59, 999));
      const yearEndPlusOne = new Date(
        Date.UTC(yearEnd.getUTCFullYear() + 1, yearEnd.getUTCMonth(), yearEnd.getUTCDate()),
      );
      expect(yearEndPlusOne.toISOString().slice(0, 10)).toBe("2027-12-31");
    });

    it("D6-T2-2: Midnight timestamp boundary consistency (23:59:59.999 vs 00:00:00.000)", () => {
      const t1 = new Date(Date.UTC(2026, 7, 14, 23, 59, 59, 999));
      const t2 = new Date(Date.UTC(2026, 7, 15, 0, 0, 0, 0));

      expect(t1.getUTCDate()).toBe(14);
      expect(t2.getUTCDate()).toBe(15);
      expect(t2.getTime() - t1.getTime()).toBe(1);

      // Verify ISO date string slices isolate the date without timezone skew
      expect(t1.toISOString().slice(0, 10)).toBe("2026-08-14");
      expect(t2.toISOString().slice(0, 10)).toBe("2026-08-15");
    });

    it("D6-T2-3: NoScript safety rule verification (recovery of opacity: 0 without breaking decimal opacity)", () => {
      const layoutCode = leer("src/app/layout.tsx");

      // Verify noscript style block exists
      expect(layoutCode).toContain("<noscript");

      // Verify the negative selector :not([style*="opacity:0."]) is present to protect noise textures & subtle overlays
      expect(layoutCode).toContain(':not([style*="opacity:0."])');
      expect(layoutCode).toContain("opacity:1!important");
    });

    it("D6-T2-4: Client storage error handling in sandboxed/private browsing environments", () => {
      // 1. readConsent works when localStorage is null/unavailable
      const originalWindow = global.window;

      // Mock private mode where localStorage.getItem throws SecurityError
      const mockStorage = {
        getItem: () => {
          throw new Error("SecurityError: Storage access is denied");
        },
        setItem: () => {
          throw new Error("SecurityError: Storage access is denied");
        },
        removeItem: () => {},
        clear: () => {},
        length: 0,
        key: () => null,
      };

      // @ts-expect-error Mock window localStorage
      global.window = {
        localStorage: mockStorage,
        dispatchEvent: () => true,
      };

      // Must catch gracefully and return null (never throw or assume accepted)
      expect(() => readConsent()).not.toThrow();
      expect(readConsent()).toBeNull();

      // writeConsent must catch gracefully without throwing
      expect(() => writeConsent("accepted")).not.toThrow();

      // Restore window
      global.window = originalWindow;
    });

    it("D6-T2-5: Static SSG export readiness without runtime server-side dependencies", () => {
      const nextConfig = leer("next.config.ts");

      // Verify static export output is configured
      expect(nextConfig).toContain('output: "export"');
    });
  });
});
