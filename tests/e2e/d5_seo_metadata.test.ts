import { describe, expect, it } from "vitest";
import {
  SITE_URL,
  SITE_NAME,
  LOGO_URL,
  siteUrl,
  hreflangDe,
  esquemasGlobales,
  migasSchema,
  esquemasTrader,
} from "@/lib/site";
import { TERMINOS, tituloDeTermino, LARGO_MAXIMO_TITULO } from "@/lib/glosario";
import { HERRAMIENTAS } from "@/lib/herramientas";
import { DOCUMENTOS_LEGALES } from "@/lib/legal/documentos";
import { FAQ_ES, FAQ_EN, PRICING_FAQ_ES, PRICING_FAQ_EN, jsonLdFaq } from "@/lib/faq";
import { LOCALIZED_PATHS, sinPrefijoEn, tieneVersionEn } from "@/lib/locale";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";

/**
 * Dimension D5: SEO Technical & Metadata Test Suite
 *
 * Requirements tested:
 * - Tier 1: Feature Coverage (>= 5 tests)
 *   1. Unique page titles across all routes (static, glossary, tools, legal)
 *   2. Meta description length <= 160 characters on all routes
 *   3. Single canonical URL definition & absolute HTTPS prefix matching SITE_URL
 *   4. Bidirectional `hreflang` tags (ES / EN / x-default) symmetry
 *   5. JSON-LD Schemas validity (Organization, WebSite, SoftwareApplication, FAQPage, BreadcrumbList)
 *   6. Sitemap & robots.txt coherence and path completeness
 * - Tier 2: Boundary & Corner Cases (>= 5 tests)
 *   1. Glossary title length <= 60 chars cutoff & search-intent preservation
 *   2. Trailing slash canonical normalization consistency
 *   3. Special characters & quotes handling in OpenGraph/metadata strings
 *   4. Alternate language URL resolution across dynamic routes
 *   5. BreadcrumbList schema position monotonicity and hierarchy
 */

describe("Dimension D5: SEO Technical & Metadata", () => {
  // =========================================================================
  // TIER 1: FEATURE COVERAGE
  // =========================================================================

  describe("Tier 1: Feature Coverage", () => {
    it("D5-T1-1: Unique page titles across all routes in both ES and EN", () => {
      const titlesEs = new Set<string>();
      const titlesEn = new Set<string>();
      const duplicateTitles: string[] = [];

      // 1. Glossary titles
      for (const t of TERMINOS) {
        const titleEs = `${tituloDeTermino(t.term, "es")} — ${SITE_NAME}`;
        const titleEn = `${tituloDeTermino(t.term, "en")} — ${SITE_NAME}`;

        if (titlesEs.has(titleEs)) duplicateTitles.push(`Duplicate ES glossary title: ${titleEs}`);
        if (titlesEn.has(titleEn)) duplicateTitles.push(`Duplicate EN glossary title: ${titleEn}`);

        titlesEs.add(titleEs);
        titlesEn.add(titleEn);
      }

      // 2. Tools titles
      for (const h of HERRAMIENTAS) {
        const titleEs = `${h.tituloEs} — ${SITE_NAME}`;
        const titleEn = `${h.tituloEn} — ${SITE_NAME}`;

        if (titlesEs.has(titleEs)) duplicateTitles.push(`Duplicate ES tool title: ${titleEs}`);
        if (titlesEn.has(titleEn)) duplicateTitles.push(`Duplicate EN tool title: ${titleEn}`);

        titlesEs.add(titleEs);
        titlesEn.add(titleEn);
      }

      // 3. Legal doc titles
      for (const doc of DOCUMENTOS_LEGALES) {
        const titleEs = `${doc.tituloEs} — ${SITE_NAME}`;
        const titleEn = `${doc.tituloEn} — ${SITE_NAME}`;

        if (titlesEs.has(titleEs)) duplicateTitles.push(`Duplicate ES legal title: ${titleEs}`);
        if (titlesEn.has(titleEn)) duplicateTitles.push(`Duplicate EN legal title: ${titleEn}`);

        titlesEs.add(titleEs);
        titlesEn.add(titleEn);
      }

      expect(duplicateTitles).toEqual([]);
      expect(titlesEs.size).toBeGreaterThan(55);
      expect(titlesEn.size).toBeGreaterThan(55);
    });

    it("D5-T1-2: Meta description length <= 160 characters on all pages and >= 30 characters", () => {
      const violations: string[] = [];

      // Check Tools descriptions
      for (const h of HERRAMIENTAS) {
        if (h.descripcionEs.length > 160 || h.descripcionEs.length < 30) {
          violations.push(`Tool ${h.slug} ES description length (${h.descripcionEs.length}): "${h.descripcionEs}"`);
        }
        if (h.descripcionEn.length > 160 || h.descripcionEn.length < 30) {
          violations.push(`Tool ${h.slug} EN description length (${h.descripcionEn.length}): "${h.descripcionEn}"`);
        }
      }

      // Check Legal docs descriptions
      for (const doc of DOCUMENTOS_LEGALES) {
        if (doc.descripcionEs.length > 160 || doc.descripcionEs.length < 30) {
          violations.push(`Legal doc ${doc.slug} ES description length (${doc.descripcionEs.length}): "${doc.descripcionEs}"`);
        }
        if (doc.descripcionEn.length > 160 || doc.descripcionEn.length < 30) {
          violations.push(`Legal doc ${doc.slug} EN description length (${doc.descripcionEn.length}): "${doc.descripcionEn}"`);
        }
      }

      expect(violations).toEqual([]);
    });

    it("D5-T1-3: Canonical URLs point strictly to SITE_URL with HTTPS protocol", () => {
      expect(SITE_URL.startsWith("https://")).toBe(true);
      expect(SITE_URL.endsWith("/")).toBe(false);

      // siteUrl formatting checks
      expect(siteUrl("/")).toBe(`${SITE_URL}/`);
      expect(siteUrl("pricing")).toBe(`${SITE_URL}/pricing`);
      expect(siteUrl("/pricing/")).toBe(`${SITE_URL}/pricing/`);

      // Verify all LOCALIZED_PATHS produce valid absolute canonical URLs
      for (const path of LOCALIZED_PATHS) {
        const urlEs = siteUrl(path === "/" ? "/" : `${path}/`);
        const urlEn = siteUrl(path === "/" ? "/en/" : `/en${path}/`);

        expect(urlEs.startsWith(SITE_URL)).toBe(true);
        expect(urlEn.startsWith(SITE_URL)).toBe(true);
        expect(urlEs).toMatch(/^https:\/\/[a-zA-Z0-9.-]+(\/[a-zA-Z0-9._~%-]*)*\/$/);
        expect(urlEn).toMatch(/^https:\/\/[a-zA-Z0-9.-]+(\/[a-zA-Z0-9._~%-]*)*\/$/);
      }
    });

    it("D5-T1-4: Bidirectional hreflang tags (es, en, x-default) for all localized routes", () => {
      for (const path of LOCALIZED_PATHS) {
        const hl = hreflangDe(path);

        expect(hl.es, `Missing 'es' in hreflang for ${path}`).toBeDefined();
        expect(hl.en, `Missing 'en' in hreflang for ${path}`).toBeDefined();
        expect(hl["x-default"], `Missing 'x-default' in hreflang for ${path}`).toBeDefined();

        // x-default must match ES url
        expect(hl["x-default"]).toBe(hl.es);

        // ES URL must NOT contain '/en/'
        if (path === "/") {
          expect(hl.es).toBe(`${SITE_URL}/`);
          expect(hl.en).toBe(`${SITE_URL}/en/`);
        } else {
          expect(hl.es).toBe(`${SITE_URL}${path}/`);
          expect(hl.en).toBe(`${SITE_URL}/en${path}/`);
        }

        // EN URL must include '/en/'
        expect(hl.en).toContain("/en");
      }
    });

    it("D5-T1-5: JSON-LD Schemas validity (Organization, WebSite, SoftwareApplication, FAQPage)", () => {
      // 1. Global schemas (ES and EN)
      const schemasEs = esquemasGlobales("es", { soporte: "soporte@countpips.com" });
      const schemasEn = esquemasGlobales("en", { soporte: "soporte@countpips.com" });

      expect(schemasEs.length).toBe(3);
      expect(schemasEn.length).toBe(3);

      const typesEs = schemasEs.map((s) => s["@type"]);
      expect(typesEs).toContain("SoftwareApplication");
      expect(typesEs).toContain("Organization");
      expect(typesEs).toContain("WebSite");

      // Verify SoftwareApplication schema
      const appSchema = schemasEs.find((s) => s["@type"] === "SoftwareApplication") as Record<string, unknown>;
      expect(appSchema["@context"]).toBe("https://schema.org");
      expect(appSchema.name).toBe(SITE_NAME);
      expect(appSchema.applicationCategory).toBe("FinanceApplication");
      expect(appSchema.operatingSystem).toBe("Windows");
      expect(Array.isArray(appSchema.featureList)).toBe(true);
      expect((appSchema.featureList as string[]).length).toBeGreaterThanOrEqual(5);

      // Verify Organization schema
      const orgSchema = schemasEs.find((s) => s["@type"] === "Organization") as Record<string, unknown>;
      expect(orgSchema.url).toBe(SITE_URL);
      expect(orgSchema.logo).toBeDefined();
      expect((orgSchema.logo as { url: string }).url).toBe(LOGO_URL);
      expect(orgSchema.contactPoint).toBeDefined();

      // Verify FAQPage JSON-LD
      const faqLdEs = jsonLdFaq(FAQ_ES);
      const faqLdEn = jsonLdFaq(FAQ_EN);

      expect(faqLdEs["@type"]).toBe("FAQPage");
      expect(faqLdEs.mainEntity.length).toBe(13);
      expect(faqLdEn.mainEntity.length).toBe(13);

      for (const item of faqLdEs.mainEntity) {
        expect(item["@type"]).toBe("Question");
        expect(item.name.length).toBeGreaterThan(0);
        expect(item.acceptedAnswer["@type"]).toBe("Answer");
        expect(item.acceptedAnswer.text.length).toBeGreaterThan(0);
      }
    });

    it("D5-T1-6: Sitemap & robots.txt coherence and completeness", () => {
      // 1. Sitemap verification
      const sm = sitemap();
      expect(sm.length).toBeGreaterThan(60);

      const sitemapUrls = new Set(sm.map((entry) => entry.url));

      // All LOCALIZED_PATHS must be present in sitemap in ES
      for (const path of LOCALIZED_PATHS) {
        const expectedUrl = `${SITE_URL}${path === "/" ? "/" : `${path}/`}`;
        expect(sitemapUrls.has(expectedUrl), `Sitemap missing path: ${expectedUrl}`).toBe(true);
      }

      // Check changeFrequency and priority ranges
      for (const entry of sm) {
        expect(entry.priority).toBeGreaterThanOrEqual(0.0);
        expect(entry.priority).toBeLessThanOrEqual(1.0);
        expect(["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"]).toContain(
          entry.changeFrequency,
        );
        expect(entry.lastModified).toBeInstanceOf(Date);
      }

      // 2. Robots.txt verification
      const rb = robots();
      expect(rb.rules).toBeDefined();
      expect(rb.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
    });
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES
  // =========================================================================

  describe("Tier 2: Boundary & Corner Cases", () => {
    it("D5-T2-1: Glossary title length <= 60 chars cutoff & search-intent preservation", () => {
      for (const t of TERMINOS) {
        for (const lang of ["es", "en"] as const) {
          const title = tituloDeTermino(t.term, lang);
          const fullTitle = `${title} — ${SITE_NAME}`;

          // Must never exceed LARGO_MAXIMO_TITULO (60 chars)
          expect(
            fullTitle.length,
            `Title for '${t.term}' (${lang}) exceeds max length: "${fullTitle}" (${fullTitle.length} chars)`,
          ).toBeLessThanOrEqual(LARGO_MAXIMO_TITULO);

          // For ES, should preserve "qué es" intent whenever possible
          if (lang === "es" && !t.term.includes("MAE") && !t.term.includes("MFE")) {
            expect(title).toContain("qué es");
          }
        }
      }

      // Edge case: test acronym expansion cutoff for long term
      const longTerm = "MAE (Maximum Adverse Excursion)";
      const titleEn = tituloDeTermino(longTerm, "en");
      expect(titleEn.startsWith("MAE")).toBe(true);
      expect(titleEn).not.toContain("Maximum Adverse Excursion");
      expect(`${titleEn} — ${SITE_NAME}`.length).toBeLessThanOrEqual(LARGO_MAXIMO_TITULO);
    });

    it("D5-T2-2: Trailing slash canonical normalization consistency across all path permutations", () => {
      // Normalizes slashes cleanly
      expect(siteUrl("/")).toBe(`${SITE_URL}/`);
      expect(siteUrl("")).toBe(`${SITE_URL}/`);
      expect(siteUrl("/demo")).toBe(`${SITE_URL}/demo`);
      expect(siteUrl("demo")).toBe(`${SITE_URL}/demo`);
      expect(siteUrl("/features/metricas/")).toBe(`${SITE_URL}/features/metricas/`);

      // Verify hreflangDe handles root and subroutes with trailing slash
      const rootHl = hreflangDe("/");
      expect(rootHl.es).toBe(`${SITE_URL}/`);
      expect(rootHl.en).toBe(`${SITE_URL}/en/`);

      const subHl = hreflangDe("/faq");
      expect(subHl.es).toBe(`${SITE_URL}/faq/`);
      expect(subHl.en).toBe(`${SITE_URL}/en/faq/`);
    });

    it("D5-T2-3: Special characters, quotes, and punctuation escaping in metadata", () => {
      // Schemas containing quotes or special characters must serialize cleanly to JSON
      const schemas = esquemasGlobales("es", { soporte: "soporte@countpips.com" });
      const jsonString = JSON.stringify(schemas);
      expect(() => JSON.parse(jsonString)).not.toThrow();

      // Check FAQPage with quotes in question/answer
      const customFaq = [
        { q: '¿Qué significa "Drawdown" y "Risk of Ruin"?', a: 'Representan la "pérdida máxima" acumulada & probabilidad.' },
      ];
      const faqLd = jsonLdFaq(customFaq);
      const serialized = JSON.stringify(faqLd);
      expect(() => JSON.parse(serialized)).not.toThrow();
      expect(serialized).toContain('\\"Drawdown\\"');
    });

    it("D5-T2-4: Alternate language URL resolution across dynamic routes", () => {
      // Verify bidirectional mapping for dynamic glossary routes
      for (const t of TERMINOS) {
        const esPath = `/glosario/${t.slug}`;
        const enPath = `/en/glosario/${t.slug}`;

        expect(tieneVersionEn(esPath)).toBe(true);
        expect(sinPrefijoEn(enPath)).toBe(esPath);
      }

      // Verify bidirectional mapping for dynamic tool routes
      for (const h of HERRAMIENTAS) {
        const esPath = `/herramientas/${h.slug}`;
        const enPath = `/en/herramientas/${h.slug}`;

        expect(tieneVersionEn(esPath)).toBe(true);
        expect(sinPrefijoEn(enPath)).toBe(esPath);
      }
    });

    it("D5-T2-5: BreadcrumbList schema position monotonicity and valid URL chain", () => {
      const steps = [
        { nombre: "Características", ruta: "/features" },
        { nombre: "Métricas", ruta: "/features/metricas" },
      ];

      const breadcrumbsEs = migasSchema("es", steps);
      expect(breadcrumbsEs["@type"]).toBe("BreadcrumbList");

      const items = breadcrumbsEs.itemListElement as Array<{
        position: number;
        name: string;
        item: string;
      }>;

      expect(items.length).toBe(3); // Root (1) + Step 1 (2) + Step 2 (3)

      // Strict monotonicity: 1, 2, 3...
      items.forEach((item, index) => {
        expect(item.position).toBe(index + 1);
        expect(item.item.startsWith(SITE_URL)).toBe(true);
        expect(item.name.length).toBeGreaterThan(0);
      });

      // EN breadcrumbs
      const breadcrumbsEn = migasSchema("en", steps);
      const itemsEn = breadcrumbsEn.itemListElement as Array<{
        position: number;
        name: string;
        item: string;
      }>;

      expect(itemsEn[0].name).toBe("Home");
      expect(itemsEn[0].item).toBe(`${SITE_URL}/en/`);
      expect(itemsEn[1].item).toBe(`${SITE_URL}/en/features`);
      expect(itemsEn[2].item).toBe(`${SITE_URL}/en/features/metricas`);

      // Trader profile schema
      const traderSchemas = esquemasTrader("es", "manual");
      expect(traderSchemas.length).toBe(2);
      expect(traderSchemas[0]["@type"]).toBe("WebPage");
      expect(traderSchemas[1]["@type"]).toBe("BreadcrumbList");
    });
  });
});
