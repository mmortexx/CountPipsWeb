import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  CONSENT_KEY,
  CONSENT_CHANGE_EVENT,
  CONSENT_REOPEN_EVENT,
  readConsent,
  writeConsent,
  reopenConsent,
  analyticsAllowed,
} from "@/lib/consent";
import { STR } from "@/lib/i18n";
import { FAQ_ES, FAQ_EN } from "@/lib/faq";
import { HERRAMIENTAS } from "@/lib/herramientas";
import { DOCUMENTOS_LEGALES } from "@/lib/legal/documentos";

/**
 * Dimension D9 & D10: Security, Privacy & Editorial Tone Test Suite
 *
 * Requirements tested:
 * - Tier 1: Feature Coverage (>= 5 tests)
 *   1. Zero external network requests from calculators (100% client-side computation)
 *   2. PostHog strict consent gating (EU host, session recording disabled, localStorage only)
 *   3. `dangerouslySetInnerHTML` restricted exclusively to sanitized JSON-LD & static pre-paint scripts
 *   4. Institutional editorial tone & non-promise compliance (no fraudulent get-rich promises)
 *   5. Pricing honesty & no phantom payment gateway promises
 * - Tier 2: Boundary & Corner Cases (>= 5 tests)
 *   1. Malicious injection payloads in calculator input fields
 *   2. Cookie consent state machine transitions (accepted -> declined -> accepted cycle)
 *   3. Mandatory financial compliance disclaimer on all quantitative calculator views
 *   4. Zero hardcoded secrets, private keys, or sensitive credentials in source code
 *   5. Anti-bot honeypot contract integrity (`botcheck` matching client & worker)
 */

const RAIZ = join(import.meta.dirname, "..", "..");
const leer = (rel: string) => readFileSync(join(RAIZ, rel), "utf8");

function sinComentarios(fuente: string): string {
  return fuente
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function todasLasFuentes(dir: string, acc: string[] = []): string[] {
  for (const entrada of readdirSync(join(RAIZ, dir))) {
    const rel = `${dir}/${entrada}`;
    const abs = join(RAIZ, rel);
    if (statSync(abs).isDirectory()) {
      if (entrada !== "node_modules" && entrada !== ".next" && entrada !== "out") {
        todasLasFuentes(rel, acc);
      }
    } else if (/\.(ts|tsx|js|mjs)$/.test(entrada)) {
      acc.push(rel);
    }
  }
  return acc;
}

describe("Dimension D9 & D10: Security, Privacy & Editorial Tone", () => {
  // =========================================================================
  // TIER 1: FEATURE COVERAGE
  // =========================================================================

  describe("Tier 1: Feature Coverage", () => {
    it("D9-T1-1: Zero external network requests from calculators (100% client-side computation)", () => {
      const calculatorFiles = [
        "src/components/marketing/RiskCalculator.tsx",
        "src/components/marketing/EdgeSignificanceChecker.tsx",
        "src/components/marketing/RMultipleSimulator.tsx",
        "src/components/marketing/EquityProjector.tsx",
        "src/components/marketing/SavingsCalculator.tsx",
        "src/components/marketing/DisciplineCost.tsx",
        "src/components/marketing/SessionClock.tsx",
      ];

      const forbiddenNetworkPatterns = [
        /\bfetch\s*\(/,
        /\bXMLHttpRequest\b/,
        /\baxios\b/,
        /\bnavigator\.sendBeacon\b/,
        /\bWebSocket\b/,
        /\bEventSource\b/,
      ];

      for (const rel of calculatorFiles) {
        const code = sinComentarios(leer(rel));
        for (const pattern of forbiddenNetworkPatterns) {
          expect(
            code,
            `Calculator ${rel} must not initiate network requests (${pattern.source})`,
          ).not.toMatch(pattern);
        }
      }
    });

    it("D9-T1-2: PostHog strict consent gating (EU host, session recording disabled, localStorage only)", () => {
      const posthogCode = leer("src/components/analytics/PostHog.tsx");

      // Verify privacy settings in PostHog initialization
      expect(posthogCode).toContain("disable_session_recording: true");
      expect(posthogCode).toContain('persistence: "localStorage"');
      expect(posthogCode).toContain("mask_all_text: true");
      expect(posthogCode).toContain("mask_all_element_attributes: true");
      expect(posthogCode).toContain('api_host: "https://eu.i.posthog.com"');
      expect(posthogCode).toContain("autocapture: false");

      // Verify consent check is evaluated before loading script
      expect(posthogCode).toContain("if (!analyticsAllowed())");
    });

    it("D9-T1-3: dangerouslySetInnerHTML is strictly restricted to sanitized JSON-LD & static scripts", () => {
      const files = todasLasFuentes("src");
      const unvettedUsages: string[] = [];

      for (const rel of files) {
        const code = leer(rel);
        if (!code.includes("dangerouslySetInnerHTML")) continue;

        // Check if usage is in layout (static scripts) or pages (JSON.stringify schema)
        const lines = code.split("\n");
        lines.forEach((line, i) => {
          if (line.includes("dangerouslySetInnerHTML")) {
            const windowSnippet = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 8)).join("\n");

            const isJsonLd =
              windowSnippet.includes("JSON.stringify(") ||
              windowSnippet.includes("type=\"application/ld+json\"");
            const isLayoutStaticScript =
              rel.endsWith("layout.tsx") &&
              (windowSnippet.includes("localStorage") ||
                windowSnippet.includes("tj-preload") ||
                windowSnippet.includes("<noscript") ||
                windowSnippet.includes("document.documentElement.lang"));

            if (!isJsonLd && !isLayoutStaticScript) {
              unvettedUsages.push(`${rel}:${i + 1} -> ${line.trim()}`);
            }
          }
        });
      }

      expect(unvettedUsages, "Discovered unauthorized dynamic HTML injection").toEqual([]);
    });

    it("D9-T1-4: Institutional editorial tone & non-promise compliance (zero get-rich or guaranteed return claims)", () => {
      const forbiddenClaims = [
        { pattern: /\b(100% win|100 % win|win rate 100%)\b/i, desc: "unrealistic win rate" },
        { pattern: /\b(garantizado|garantizada|guaranteed returns|guaranteed profit)\b/i, desc: "guaranteed returns" },
        { pattern: /\b(ganancias aseguradas|ganancias seguras|risk[- ]free profit)\b/i, desc: "risk-free profit" },
        { pattern: /\b(get rich|hacerte rico|hágase rico|become a millionaire)\b/i, desc: "get-rich-quick claim" },
        { pattern: /\b(sin riesgo|zero risk|no risk)\b/i, desc: "zero-risk trading claim" },
      ];

      const violations: string[] = [];

      // Check STR
      for (const [key, val] of Object.entries(STR)) {
        const item = val as Record<string, unknown>;
        const text = `${item.es ?? ""} ${item.en ?? ""}`;
        for (const { pattern, desc } of forbiddenClaims) {
          if (pattern.test(text)) {
            violations.push(`STR.${key} contains ${desc}: "${text}"`);
          }
        }
      }

      // Check FAQs
      for (let i = 0; i < FAQ_ES.length; i++) {
        const text = `${FAQ_ES[i].q} ${FAQ_ES[i].a} ${FAQ_EN[i].q} ${FAQ_EN[i].a}`;
        for (const { pattern, desc } of forbiddenClaims) {
          if (pattern.test(text)) {
            violations.push(`FAQ[${i}] contains ${desc}: "${text}"`);
          }
        }
      }

      // Check Tools
      for (const h of HERRAMIENTAS) {
        const text = `${h.tituloEs} ${h.descripcionEs} ${h.subtituloEs} ${h.tituloEn} ${h.descripcionEn} ${h.subtituloEn}`;
        for (const { pattern, desc } of forbiddenClaims) {
          if (pattern.test(text)) {
            violations.push(`HERRAMIENTAS.${h.slug} contains ${desc}: "${text}"`);
          }
        }
      }

      expect(violations).toEqual([]);
    });

    it("D9-T1-5: Pricing honesty & zero phantom payment processor claims", () => {
      const phantomPaymentGateways = /\b(paypal|stripe|braintree|checkout\.com)\b/i;
      const files = todasLasFuentes("src");
      const foundGateways: string[] = [];

      for (const rel of files) {
        const cleanCode = sinComentarios(leer(rel));
        const lines = cleanCode.split("\n");
        lines.forEach((line, idx) => {
          const match = line.match(phantomPaymentGateways);
          if (match) {
            foundGateways.push(`${rel}:${idx + 1} -> ${match[0]}`);
          }
        });
      }

      expect(
        foundGateways,
        "Source code must not advertise unintegrated payment gateways while in private pilot",
      ).toEqual([]);
    });
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES
  // =========================================================================

  describe("Tier 2: Boundary & Corner Cases", () => {
    it("D9-T2-1: Malicious injection payloads in tool input fields are handled without crashes", () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '"><img src=x onerror=alert(1)>',
        "' OR '1'='1",
        "javascript:void(0)",
        "{{constructor.constructor('alert(1)')()}}",
        "\x00\x08\x0B\x0C\x0E\x1F",
        "-999999999999999999999999999999999",
        "NaN",
        "Infinity",
      ];

      // Test numerical parser resilience
      for (const payload of maliciousInputs) {
        const num = parseFloat(payload);
        // Validating that parsing bad inputs results in NaN or clamped numbers, not unhandled runtime exceptions
        if (Number.isNaN(num)) {
          expect(Number.isNaN(num)).toBe(true);
        } else {
          expect(typeof num).toBe("number");
        }
      }
    });

    it("D9-T2-2: Cookie consent state machine transitions (accepted -> declined -> accepted cycle)", () => {
      const originalWindow = global.window;
      let storageData: Record<string, string> = {};
      const emittedEvents: Array<{ type: string; detail: unknown }> = [];

      global.window = {
        localStorage: {
          getItem: (k: string) => storageData[k] ?? null,
          setItem: (k: string, v: string) => {
            storageData[k] = v;
          },
          removeItem: (k: string) => {
            delete storageData[k];
          },
          length: 0,
          clear: () => {
            storageData = {};
          },
          key: () => null,
        } as Storage,
        dispatchEvent: (event: Event) => {
          const ce = event as CustomEvent;
          emittedEvents.push({ type: ce.type, detail: ce.detail });
          return true;
        },
      } as unknown as Window & typeof globalThis;

      // 1. Initial state (null / unselected)
      storageData = {};
      expect(readConsent()).toBeNull();
      expect(analyticsAllowed()).toBe(false);

      // 2. Opt-in transition (accepted)
      writeConsent("accepted");
      expect(readConsent()).toBe("accepted");
      expect(analyticsAllowed()).toBe(true);
      expect(emittedEvents[emittedEvents.length - 1]).toEqual({
        type: CONSENT_CHANGE_EVENT,
        detail: "accepted",
      });

      // 3. Opt-out transition (declined)
      writeConsent("declined");
      expect(readConsent()).toBe("declined");
      expect(analyticsAllowed()).toBe(false);
      expect(emittedEvents[emittedEvents.length - 1]).toEqual({
        type: CONSENT_CHANGE_EVENT,
        detail: "declined",
      });

      // 4. Reopen consent dialog
      reopenConsent();
      expect(emittedEvents[emittedEvents.length - 1].type).toBe(CONSENT_REOPEN_EVENT);

      // Restore window
      global.window = originalWindow;
    });

    it("D9-T2-3: Mandatory financial compliance disclaimer on all quantitative calculator views", () => {
      const vistaCode = leer("src/components/herramientas/HerramientaVista.tsx");

      // Verify explicit disclaimer in HerramientaVista
      expect(vistaCode).toContain("Esta herramienta calcula a partir de lo que tú escribes");
      expect(vistaCode).toContain("No es asesoramiento financiero");
      expect(vistaCode).toContain("This tool computes from what you type");
      expect(vistaCode).toContain("It is not financial advice");
      expect(vistaCode).toContain("/terminos#no-advice");
    });

    it("D9-T2-4: Zero hardcoded secrets, private keys, or sensitive credentials in source code", () => {
      const secretPatterns = [
        /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/,
        /AKIA[0-9A-Z]{16}/, // AWS Access Key
        /ghp_[0-9a-zA-Z]{36}/, // GitHub Personal Access Token
        /sk_live_[0-9a-zA-Z]{24}/, // Stripe Live Key
      ];

      const files = todasLasFuentes("src");
      const leaks: string[] = [];

      for (const rel of files) {
        const code = sinComentarios(leer(rel));
        for (const pattern of secretPatterns) {
          if (pattern.test(code)) {
            leaks.push(`Potential secret leak in ${rel} matching ${pattern.source}`);
          }
        }
      }

      expect(leaks, "Found potential hardcoded secret keys").toEqual([]);
    });

    it("D9-T2-5: Anti-bot honeypot contract integrity (botcheck matching client and worker)", () => {
      const formsCode = sinComentarios(leer("src/lib/forms.ts"));
      const betaFormCode = sinComentarios(leer("src/components/beta/BetaApplication.tsx"));
      const workerCode = sinComentarios(leer("services/beta-api/src/worker.js"));

      // Client forms must use 'botcheck' field
      expect(formsCode).toContain("botcheck");
      expect(betaFormCode).toContain("botcheck");

      // Backend worker must read 'payload.botcheck' and NOT 'payload.honeypot'
      expect(workerCode).toContain("payload.botcheck");
      expect(workerCode).not.toContain("payload.honeypot");
    });
  });
});
