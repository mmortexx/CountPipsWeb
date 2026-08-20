import { describe, expect, it } from "vitest";
import { STR, t, tf, type StrKey, type Lang } from "@/lib/i18n";
import { GLOSSARY, type GlossaryTerm, type GlossaryCategory } from "@/lib/trading/glossary";
import { TERMINOS, CATEGORIAS, slugTermino } from "@/lib/glosario";
import { HERRAMIENTAS, type Herramienta } from "@/lib/herramientas";
import { FAQ_ES, FAQ_EN, PRICING_FAQ_ES, PRICING_FAQ_EN, type QA } from "@/lib/faq";
import { DOCUMENTOS_LEGALES, documentoPorSlug, type DocumentoLegal, type Seccion, type Bloque } from "@/lib/legal/documentos";
import { LOCALIZED_PATHS, sinPrefijoEn, tieneVersionEn, withLocale } from "@/lib/locale";

/**
 * Dimension D4: Bilingual Parity (ES / EN)
 *
 * Requirements tested:
 * - Tier 1: Feature Coverage (>= 5 tests)
 *   1. 100% key parity in `STR` dictionary (`src/lib/i18n.tsx`)
 *   2. Glossary parity across all 51 terms and categories (`glosario.ts` & `glossary.ts`)
 *   3. Interactive tools parity across all tool definitions (`herramientas.ts`)
 *   4. FAQ parity across main FAQs and pricing FAQs (`faq.ts`)
 *   5. Legal documents parity across all 4 mandatory legal routes (`documentos.ts`)
 * - Tier 2: Boundary & Corner Cases (>= 5 tests)
 *   1. Translation helper fallback & parameter interpolation (`t()`, `tf()`)
 *   2. Zero empty or whitespace-only strings across all dictionaries & data structures
 *   3. Interpolation placeholder symmetry (`{0}`, `{1}`, `{name}`, etc.)
 *   4. Spanish institutional vocabulary integrity (no spurious raw anglicisms)
 *   5. English technical grammar & no untranslated Spanish text leakage
 *   6. Route and link localization helpers (`sinPrefijoEn`, `tieneVersionEn`, `withLocale`)
 */

describe("Dimension D4: Bilingual Parity (ES / EN)", () => {
  // =========================================================================
  // TIER 1: FEATURE COVERAGE
  // =========================================================================

  describe("Tier 1: Feature Coverage", () => {
    it("D4-T1-1: 100% key parity in STR dictionary (every key has valid ES and EN strings)", () => {
      const keys = Object.keys(STR) as StrKey[];
      expect(keys.length).toBeGreaterThanOrEqual(30);

      const missingKeys: string[] = [];
      const nonStringKeys: string[] = [];

      for (const key of keys) {
        const item = STR[key] as { es: unknown; en: unknown };

        if (!("es" in item) || item.es === undefined || item.es === null) {
          missingKeys.push(`STR.${key}.es missing`);
        }
        if (!("en" in item) || item.en === undefined || item.en === null) {
          missingKeys.push(`STR.${key}.en missing`);
        }

        if (typeof item.es !== "string" && typeof item.es !== "function") {
          nonStringKeys.push(`STR.${key}.es is not a string/formatter`);
        }
        if (typeof item.en !== "string" && typeof item.en !== "function") {
          nonStringKeys.push(`STR.${key}.en is not a string/formatter`);
        }
      }

      expect(missingKeys, "Missing language variants in STR dictionary").toEqual([]);
      expect(nonStringKeys, "Non-string/non-function values in STR dictionary").toEqual([]);
    });

    it("D4-T1-2: Glossary parity across all 57 terms and all 5 categories", () => {
      // 1. Total count check (exactly 57 frozen terms)
      expect(GLOSSARY.length).toBe(57);
      expect(TERMINOS.length).toBe(57);

      // 2. Categories integrity check
      const expectedCategories: GlossaryCategory[] = [
        "basics",
        "risk",
        "psychology",
        "metrics",
        "execution",
      ];
      for (const cat of expectedCategories) {
        expect(CATEGORIAS[cat], `Missing category '${cat}' in CATEGORIAS`).toBeDefined();
        expect(CATEGORIAS[cat].es.trim().length).toBeGreaterThan(0);
        expect(CATEGORIAS[cat].en.trim().length).toBeGreaterThan(0);
        expect(CATEGORIAS[cat].descEs.trim().length).toBeGreaterThan(0);
        expect(CATEGORIAS[cat].descEn.trim().length).toBeGreaterThan(0);
      }

      // 3. Each glossary term has valid bilingual content and slug
      const seenSlugs = new Set<string>();
      const seenTerms = new Set<string>();

      for (const term of GLOSSARY) {
        expect(term.term.trim().length).toBeGreaterThan(0);
        expect(term.es.trim().length).toBeGreaterThan(10);
        expect(term.en.trim().length).toBeGreaterThan(10);
        expect(expectedCategories).toContain(term.category);

        const slug = slugTermino(term.term);
        expect(slug.length).toBeGreaterThan(0);
        expect(slug).toMatch(/^[a-z0-9-]+$/);
        expect(seenSlugs.has(slug), `Duplicate glossary slug: ${slug}`).toBe(false);
        expect(seenTerms.has(term.term.toLowerCase()), `Duplicate glossary term: ${term.term}`).toBe(false);

        seenSlugs.add(slug);
        seenTerms.add(term.term.toLowerCase());
      }
    });

    it("D4-T1-3: Tools parity across all 7 tool definitions in herramientas.ts", () => {
      expect(HERRAMIENTAS.length).toBeGreaterThanOrEqual(6);

      const requiredFields: (keyof Herramienta)[] = [
        "slug",
        "componente",
        "tituloEs",
        "tituloEn",
        "h1Es",
        "h1En",
        "resaltaEs",
        "resaltaEn",
        "subtituloEs",
        "subtituloEn",
        "resumenEs",
        "resumenEn",
        "descripcionEs",
        "descripcionEn",
      ];

      const seenSlugs = new Set<string>();

      for (const tool of HERRAMIENTAS) {
        for (const field of requiredFields) {
          const val = tool[field];
          expect(typeof val === "string" && val.trim().length > 0, `Tool ${tool.slug} missing field ${field}`).toBe(true);
        }

        expect(seenSlugs.has(tool.slug), `Duplicate tool slug: ${tool.slug}`).toBe(false);
        seenSlugs.add(tool.slug);

        // Verify title & description differ between ES and EN
        expect(tool.tituloEs).not.toEqual(tool.tituloEn);
        expect(tool.subtituloEs).not.toEqual(tool.subtituloEn);
        expect(tool.descripcionEs).not.toEqual(tool.descripcionEn);
      }
    });

    it("D4-T1-4: FAQ parity across main FAQs and pricing FAQs", () => {
      // Main FAQ parity
      expect(FAQ_ES.length).toBe(13);
      expect(FAQ_EN.length).toBe(13);

      for (let i = 0; i < FAQ_ES.length; i++) {
        const es = FAQ_ES[i];
        const en = FAQ_EN[i];

        expect(es.q.trim().length).toBeGreaterThan(5);
        expect(es.a.trim().length).toBeGreaterThan(15);
        expect(en.q.trim().length).toBeGreaterThan(5);
        expect(en.a.trim().length).toBeGreaterThan(15);

        // Questions and answers must not be identical across languages
        expect(es.q).not.toEqual(en.q);
        expect(es.a).not.toEqual(en.a);
      }

      // Pricing FAQ parity
      expect(PRICING_FAQ_ES.length).toBe(4);
      expect(PRICING_FAQ_EN.length).toBe(4);

      for (let i = 0; i < PRICING_FAQ_ES.length; i++) {
        const es = PRICING_FAQ_ES[i];
        const en = PRICING_FAQ_EN[i];

        expect(es.q.trim().length).toBeGreaterThan(5);
        expect(es.a.trim().length).toBeGreaterThan(15);
        expect(en.q.trim().length).toBeGreaterThan(5);
        expect(en.a.trim().length).toBeGreaterThan(15);

        expect(es.q).not.toEqual(en.q);
        expect(es.a).not.toEqual(en.a);
      }
    });

    it("D4-T1-5: Legal documents parity across all 4 mandatory legal routes", () => {
      expect(DOCUMENTOS_LEGALES.length).toBe(4);

      const requiredSlugs = ["privacidad", "cookies", "terminos", "aviso-legal"];
      const actualSlugs = DOCUMENTOS_LEGALES.map((d) => d.slug);

      for (const slug of requiredSlugs) {
        expect(actualSlugs).toContain(slug);
        const doc = documentoPorSlug(slug);
        expect(doc, `Missing legal doc for slug: ${slug}`).toBeDefined();

        if (doc) {
          expect(doc.tituloEs.trim().length).toBeGreaterThan(0);
          expect(doc.tituloEn.trim().length).toBeGreaterThan(0);
          expect(doc.entradaEs.trim().length).toBeGreaterThan(0);
          expect(doc.entradaEn.trim().length).toBeGreaterThan(0);
          expect(doc.descripcionEs.trim().length).toBeGreaterThan(0);
          expect(doc.descripcionEn.trim().length).toBeGreaterThan(0);
          expect(doc.secciones.length).toBeGreaterThan(0);

          for (const seccion of doc.secciones) {
            expect(seccion.id.trim().length).toBeGreaterThan(0);
            expect(seccion.tituloEs.trim().length).toBeGreaterThan(0);
            expect(seccion.tituloEn.trim().length).toBeGreaterThan(0);
            expect(seccion.bloques.length).toBeGreaterThan(0);

            for (const bloque of seccion.bloques) {
              if (bloque.tipo === "parrafo") {
                expect(bloque.es.trim().length).toBeGreaterThan(0);
                expect(bloque.en.trim().length).toBeGreaterThan(0);
              } else if (bloque.tipo === "lista") {
                expect(bloque.es.length).toBe(bloque.en.length);
                expect(bloque.es.length).toBeGreaterThan(0);
                bloque.es.forEach((item) => expect(item.trim().length).toBeGreaterThan(0));
                bloque.en.forEach((item) => expect(item.trim().length).toBeGreaterThan(0));
              } else if (bloque.tipo === "tabla") {
                expect(bloque.cabecerasEs.length).toBe(bloque.cabecerasEn.length);
                expect(bloque.filas.length).toBeGreaterThan(0);
                bloque.filas.forEach((fila) => {
                  expect(fila.es.length).toBe(fila.en.length);
                  fila.es.forEach((cell) => expect(cell.trim().length).toBeGreaterThan(0));
                  fila.en.forEach((cell) => expect(cell.trim().length).toBeGreaterThan(0));
                });
              }
            }
          }
        }
      }
    });
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES
  // =========================================================================

  describe("Tier 2: Boundary & Corner Cases", () => {
    it("D4-T2-1: Translation helper t() and tf() handle valid keys and formatters accurately", () => {
      // 1. Nominal string resolution
      expect(t("appName", "es")).toBe("CountPips");
      expect(t("appName", "en")).toBe("CountPips");
      expect(t("tagline", "es")).toBe("Tu operativa, medida.");
      expect(t("tagline", "en")).toBe("Your trading, measured.");
      expect(t("buyNow", "es")).toBe("Solicitar acceso anticipado");
      expect(t("buyNow", "en")).toBe("Request early access");

      // 2. Both languages return defined string for every key in STR
      for (const key of Object.keys(STR) as StrKey[]) {
        const valEs = t(key, "es");
        const valEn = t(key, "en");
        if (typeof valEs === "string") {
          expect(valEs.length).toBeGreaterThan(0);
        }
        if (typeof valEn === "string") {
          expect(valEn.length).toBeGreaterThan(0);
        }
      }
    });

    it("D4-T2-2: Zero empty or whitespace-only strings across all dictionaries & data structures", () => {
      const whitespaceViolations: string[] = [];

      // Check STR
      for (const [k, v] of Object.entries(STR)) {
        const item = v as Record<string, unknown>;
        for (const lang of ["es", "en"] as const) {
          const val = item[lang];
          if (typeof val === "string" && val.trim().length === 0) {
            whitespaceViolations.push(`STR.${k}.${lang} is empty`);
          }
        }
      }

      // Check GLOSSARY
      for (const t of GLOSSARY) {
        if (t.term.trim().length === 0) whitespaceViolations.push(`GLOSSARY term '${t.term}' has empty name`);
        if (t.es.trim().length === 0) whitespaceViolations.push(`GLOSSARY term '${t.term}' has empty ES definition`);
        if (t.en.trim().length === 0) whitespaceViolations.push(`GLOSSARY term '${t.term}' has empty EN definition`);
      }

      // Check HERRAMIENTAS
      for (const h of HERRAMIENTAS) {
        for (const [field, val] of Object.entries(h)) {
          if (typeof val === "string" && val.trim().length === 0) {
            whitespaceViolations.push(`HERRAMIENTAS.${h.slug}.${field} is empty`);
          }
        }
      }

      // Check FAQs
      for (let i = 0; i < FAQ_ES.length; i++) {
        if (FAQ_ES[i].q.trim().length === 0) whitespaceViolations.push(`FAQ_ES[${i}].q is empty`);
        if (FAQ_ES[i].a.trim().length === 0) whitespaceViolations.push(`FAQ_ES[${i}].a is empty`);
        if (FAQ_EN[i].q.trim().length === 0) whitespaceViolations.push(`FAQ_EN[${i}].q is empty`);
        if (FAQ_EN[i].a.trim().length === 0) whitespaceViolations.push(`FAQ_EN[${i}].a is empty`);
      }

      expect(whitespaceViolations).toEqual([]);
    });

    it("D4-T2-3: Interpolation placeholder symmetry ({0}, {1}, {name}, etc.) between ES and EN variants", () => {
      const placeholderRegex = /\{([a-zA-Z0-9_]+)\}/g;
      const mismatchedPlaceholders: string[] = [];

      function extractPlaceholders(text: string): string[] {
        const matches = text.match(placeholderRegex) || [];
        return matches.sort();
      }

      // Check STR
      for (const [k, v] of Object.entries(STR)) {
        const item = v as Record<string, unknown>;
        if (typeof item.es === "string" && typeof item.en === "string") {
          const phEs = extractPlaceholders(item.es);
          const phEn = extractPlaceholders(item.en);
          if (JSON.stringify(phEs) !== JSON.stringify(phEn)) {
            mismatchedPlaceholders.push(`STR.${k}: ES=${JSON.stringify(phEs)} vs EN=${JSON.stringify(phEn)}`);
          }
        }
      }

      // Check FAQ
      for (let i = 0; i < FAQ_ES.length; i++) {
        const phEsQ = extractPlaceholders(FAQ_ES[i].q);
        const phEnQ = extractPlaceholders(FAQ_EN[i].q);
        if (JSON.stringify(phEsQ) !== JSON.stringify(phEnQ)) {
          mismatchedPlaceholders.push(`FAQ Q[${i}]: ES=${JSON.stringify(phEsQ)} vs EN=${JSON.stringify(phEnQ)}`);
        }
        const phEsA = extractPlaceholders(FAQ_ES[i].a);
        const phEnA = extractPlaceholders(FAQ_EN[i].a);
        if (JSON.stringify(phEsA) !== JSON.stringify(phEnA)) {
          mismatchedPlaceholders.push(`FAQ A[${i}]: ES=${JSON.stringify(phEsA)} vs EN=${JSON.stringify(phEnA)}`);
        }
      }

      expect(mismatchedPlaceholders).toEqual([]);
    });

    it("D4-T2-4: Spanish institutional vocabulary integrity (no spurious raw anglicisms)", () => {
      // Forbidden untranslated anglicisms in Spanish copy:
      // - "journal" / "journals" (must be "diario")
      // - "override" / "overrides" (must be "excepción" / "excepciones")
      // - "command palette" (must be "paleta de comandos")
      const forbiddenAnglicisms = [
        { regex: /\bjournals?\b/i, name: "journal" },
        { regex: /\boverrides?\b/i, name: "override" },
        { regex: /\bcommand palette\b/i, name: "command palette" },
      ];

      const violations: string[] = [];

      // Check Spanish strings in STR
      for (const [k, v] of Object.entries(STR)) {
        const item = v as Record<string, unknown>;
        if (typeof item.es === "string") {
          for (const { regex, name } of forbiddenAnglicisms) {
            if (regex.test(item.es)) {
              violations.push(`STR.${k}.es contains forbidden anglicism '${name}': "${item.es}"`);
            }
          }
        }
      }

      // Check Spanish strings in HERRAMIENTAS
      for (const h of HERRAMIENTAS) {
        const texts = [h.tituloEs, h.h1Es, h.subtituloEs, h.resumenEs, h.descripcionEs];
        for (const t of texts) {
          for (const { regex, name } of forbiddenAnglicisms) {
            if (regex.test(t)) {
              violations.push(`HERRAMIENTAS.${h.slug} ES contains '${name}': "${t}"`);
            }
          }
        }
      }

      // Check Spanish strings in FAQ_ES
      for (let i = 0; i < FAQ_ES.length; i++) {
        const text = `${FAQ_ES[i].q} ${FAQ_ES[i].a}`;
        for (const { regex, name } of forbiddenAnglicisms) {
          if (regex.test(text)) {
            violations.push(`FAQ_ES[${i}] contains '${name}': "${text}"`);
          }
        }
      }

      expect(violations).toEqual([]);
    });

    it("D4-T2-5: English technical grammar & no untranslated Spanish copy in English fields", () => {
      // Common Spanish marker words that should never appear in English copy
      const spanishMarkers = [
        /\bdiario\b/i,
        /\boperativa\b/i,
        /\bcaracterísticas\b/i,
        /\bprecios\b/i,
        /\bpreguntas\b/i,
        /\baviso\b/i,
        /\bpolítica\b/i,
        /\bherramientas\b/i,
        /\bguiada\b/i,
        /\bcomprobado\b/i,
      ];

      const englishViolations: string[] = [];

      // Check STR English strings
      for (const [k, v] of Object.entries(STR)) {
        const item = v as Record<string, unknown>;
        if (typeof item.en === "string") {
          for (const marker of spanishMarkers) {
            if (marker.test(item.en)) {
              englishViolations.push(`STR.${k}.en has untranslated Spanish text: "${item.en}"`);
            }
          }
        }
      }

      // Check HERRAMIENTAS English strings
      for (const h of HERRAMIENTAS) {
        const texts = [h.tituloEn, h.h1En, h.subtituloEn, h.resumenEn, h.descripcionEn];
        for (const t of texts) {
          for (const marker of spanishMarkers) {
            if (marker.test(t)) {
              englishViolations.push(`HERRAMIENTAS.${h.slug} EN has Spanish text: "${t}"`);
            }
          }
        }
      }

      // Check FAQ_EN
      for (let i = 0; i < FAQ_EN.length; i++) {
        const text = `${FAQ_EN[i].q} ${FAQ_EN[i].a}`;
        for (const marker of spanishMarkers) {
          if (marker.test(text)) {
            englishViolations.push(`FAQ_EN[${i}] has Spanish text: "${text}"`);
          }
        }
      }

      expect(englishViolations).toEqual([]);
    });

    it("D4-T2-6: Route and link localization helpers handle edge cases (sinPrefijoEn, tieneVersionEn, withLocale)", () => {
      // 1. sinPrefijoEn
      expect(sinPrefijoEn("/en")).toBe("/");
      expect(sinPrefijoEn("/en/")).toBe("/");
      expect(sinPrefijoEn("/en/pricing")).toBe("/pricing");
      expect(sinPrefijoEn("/en/glosario/drawdown")).toBe("/glosario/drawdown");
      expect(sinPrefijoEn("/pricing")).toBe("/pricing");
      expect(sinPrefijoEn("/")).toBe("/");

      // 2. tieneVersionEn
      expect(tieneVersionEn("/")).toBe(true);
      expect(tieneVersionEn("/pricing")).toBe(true);
      expect(tieneVersionEn("/features/metricas")).toBe(true);
      expect(tieneVersionEn("/glosario/drawdown")).toBe(true);
      expect(tieneVersionEn("/herramientas/calculadora-de-riesgo")).toBe(true);
      expect(tieneVersionEn("/non-existent-page-xyz")).toBe(false);

      // 3. withLocale
      expect(withLocale("/pricing", "es")).toBe("/pricing");
      expect(withLocale("/pricing", "en")).toBe("/en/pricing");
      expect(withLocale("/", "en")).toBe("/en");
      expect(withLocale("https://example.com/external", "en")).toBe("https://example.com/external");
      expect(withLocale("#section-1", "en")).toBe("#section-1");
      expect(withLocale("/en/pricing", "en")).toBe("/en/pricing");
      expect(withLocale("/pricing?ref=banner#calc", "en")).toBe("/en/pricing?ref=banner#calc");
    });
  });
});
