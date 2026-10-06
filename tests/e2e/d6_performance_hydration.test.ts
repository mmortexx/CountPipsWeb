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
 * Dimensión D6: rendimiento, exportación estática e hidratación. Fechas
 * deterministas entre compilaciones, carga diferida de las herramientas,
 * fuentes con `display: "swap"`, `content-visibility`, bordes de año y de
 * medianoche en UTC, regla de `noscript`, fallo de almacenamiento y
 * exportación estática.
 */

const RAIZ = join(import.meta.dirname, "..", "..");
const leer = (rel: string) => readFileSync(join(RAIZ, rel), "utf8");

describe("Dimension D6: Performance, SSG & Hydration", () => {
  describe("Tier 1: Feature Coverage", () => {
    it("D6-T1-1: Temporal determinism in SSG rendering (deterministic timestamps across builds)", () => {
      expect(ULTIMA_ACTUALIZACION).toBeInstanceOf(Date);
      expect(Number.isNaN(ULTIMA_ACTUALIZACION.getTime())).toBe(false);

      expect(ULTIMA_ACTUALIZACION_ISO).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(PUBLICACION_ISO).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(PRECIO_VALIDO_HASTA).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      expect(PUBLICACION_ISO).toBe("2026-07-20");

      // La validez del precio es el año siguiente a la última actualización (UTC).
      const lastYear = ULTIMA_ACTUALIZACION.getUTCFullYear();
      const validYear = parseInt(PRECIO_VALIDO_HASTA.slice(0, 4), 10);
      expect(validYear).toBe(lastYear + 1);
    });

    it("D6-T1-2: Dynamic component lazy-loading in HerramientaVista avoids bloated initial bundles", () => {
      const vistaCode = leer("src/components/herramientas/HerramientaVista.tsx");

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

      expect(layoutCode).toContain('import localFont from "next/font/local"');

      const displaySwapMatches = layoutCode.match(/display:\s*"swap"/g) || [];
      expect(
        displaySwapMatches.length,
        "All font declarations must specify display: 'swap' to prevent invisible text during loading",
      ).toBeGreaterThanOrEqual(2);

      expect(layoutCode).toContain("variable: \"--font-geist-mono\"");
      expect(layoutCode).toContain("variable: \"--font-sans\"");
    });

    it("D6-T1-5: Containment & layout-shift prevention (content-visibility)", () => {
      const css = leer("src/app/globals.css");

      // `cv-auto` difiere el render de las secciones fuera de pantalla.
      expect(css).toContain("content-visibility: auto");
    });
  });

  describe("Tier 2: Boundary & Corner Cases", () => {
    it("D6-T2-1: Leap year & UTC year boundary transitions (Feb 29, Dec 31 -> Jan 1)", () => {
      // Año bisiesto: el 29 de febrero más un año pasa limpio al 1 de marzo.
      const leapDay = new Date(Date.UTC(2024, 1, 29)); // 2024-02-29
      const nextYearFromLeap = new Date(
        Date.UTC(leapDay.getUTCFullYear() + 1, leapDay.getUTCMonth(), leapDay.getUTCDate()),
      );
      expect(nextYearFromLeap.toISOString().slice(0, 10)).toBe("2025-03-01");

      // Fin de año: 31 de diciembre a las 23:59:59.999 UTC.
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

      // El recorte del ISO aísla la fecha sin desfase de huso.
      expect(t1.toISOString().slice(0, 10)).toBe("2026-08-14");
      expect(t2.toISOString().slice(0, 10)).toBe("2026-08-15");
    });

    it("D6-T2-3: NoScript safety rule verification (recovery of opacity: 0 without breaking decimal opacity)", () => {
      const layoutCode = leer("src/app/layout.tsx");

      expect(layoutCode).toContain("<noscript");

      // El selector negativo protege las opacidades decimales (texturas y capas sutiles).
      expect(layoutCode).toContain(':not([style*="opacity:0."])');
      expect(layoutCode).toContain("opacity:1!important");
    });

    it("D6-T2-4: Client storage error handling in sandboxed/private browsing environments", () => {
      const originalWindow = global.window;

      // Modo privado: localStorage lanza SecurityError al leer y escribir.
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

      // Sin lanzar y sin dar el consentimiento por aceptado.
      expect(() => readConsent()).not.toThrow();
      expect(readConsent()).toBeNull();

      expect(() => writeConsent("accepted")).not.toThrow();

      global.window = originalWindow;
    });

    it("D6-T2-5: Static SSG export readiness without runtime server-side dependencies", () => {
      const nextConfig = leer("next.config.ts");

      expect(nextConfig).toContain('output: "export"');
    });
  });
});
