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
import { sinPrefijoEn, tieneVersionEn } from "@/lib/locale";
import { LOCALIZED_PATHS } from "@/lib/rutas-en";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";

/**
 * Dimensión D5: SEO técnico y metadatos. Títulos únicos, descripciones de
 * hasta 160 caracteres, canónicas absolutas en HTTPS, hreflang simétrico,
 * JSON-LD válido, sitemap y robots coherentes, y los bordes de títulos del
 * glosario, barras finales, escapes y migas de pan.
 */

describe("Dimension D5: SEO Technical & Metadata", () => {
  describe("Tier 1: Feature Coverage", () => {
    it("D5-T1-1: Unique page titles across all routes in both ES and EN", () => {
      const titlesEs = new Set<string>();
      const titlesEn = new Set<string>();
      const duplicateTitles: string[] = [];

      for (const t of TERMINOS) {
        const titleEs = `${tituloDeTermino(t.term, "es")} — ${SITE_NAME}`;
        const titleEn = `${tituloDeTermino(t.term, "en")} — ${SITE_NAME}`;

        if (titlesEs.has(titleEs)) duplicateTitles.push(`Duplicate ES glossary title: ${titleEs}`);
        if (titlesEn.has(titleEn)) duplicateTitles.push(`Duplicate EN glossary title: ${titleEn}`);

        titlesEs.add(titleEs);
        titlesEn.add(titleEn);
      }

      for (const h of HERRAMIENTAS) {
        const titleEs = `${h.tituloEs} — ${SITE_NAME}`;
        const titleEn = `${h.tituloEn} — ${SITE_NAME}`;

        if (titlesEs.has(titleEs)) duplicateTitles.push(`Duplicate ES tool title: ${titleEs}`);
        if (titlesEn.has(titleEn)) duplicateTitles.push(`Duplicate EN tool title: ${titleEn}`);

        titlesEs.add(titleEs);
        titlesEn.add(titleEn);
      }

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

      for (const h of HERRAMIENTAS) {
        if (h.descripcionEs.length > 160 || h.descripcionEs.length < 30) {
          violations.push(`Tool ${h.slug} ES description length (${h.descripcionEs.length}): "${h.descripcionEs}"`);
        }
        if (h.descripcionEn.length > 160 || h.descripcionEn.length < 30) {
          violations.push(`Tool ${h.slug} EN description length (${h.descripcionEn.length}): "${h.descripcionEn}"`);
        }
      }

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

      expect(siteUrl("/")).toBe(`${SITE_URL}/`);
      expect(siteUrl("pricing")).toBe(`${SITE_URL}/pricing`);
      expect(siteUrl("/pricing/")).toBe(`${SITE_URL}/pricing/`);

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

        // `x-default` apunta a la versión española.
        expect(hl["x-default"]).toBe(hl.es);

        if (path === "/") {
          expect(hl.es).toBe(`${SITE_URL}/`);
          expect(hl.en).toBe(`${SITE_URL}/en/`);
        } else {
          expect(hl.es).toBe(`${SITE_URL}${path}/`);
          expect(hl.en).toBe(`${SITE_URL}/en${path}/`);
        }

        expect(hl.en).toContain("/en");
      }
    });

    it("D5-T1-5: JSON-LD Schemas validity (Organization, WebSite, SoftwareApplication, FAQPage)", () => {
      const schemasEs = esquemasGlobales("es", { soporte: "soporte@countpips.com" });
      const schemasEn = esquemasGlobales("en", { soporte: "soporte@countpips.com" });

      expect(schemasEs.length).toBe(3);
      expect(schemasEn.length).toBe(3);

      const typesEs = schemasEs.map((s) => s["@type"]);
      expect(typesEs).toContain("SoftwareApplication");
      expect(typesEs).toContain("Organization");
      expect(typesEs).toContain("WebSite");

      const appSchema = schemasEs.find((s) => s["@type"] === "SoftwareApplication") as Record<string, unknown>;
      expect(appSchema["@context"]).toBe("https://schema.org");
      expect(appSchema.name).toBe(SITE_NAME);
      expect(appSchema.applicationCategory).toBe("FinanceApplication");
      expect(appSchema.operatingSystem).toBe("Windows");
      expect(Array.isArray(appSchema.featureList)).toBe(true);
      expect((appSchema.featureList as string[]).length).toBeGreaterThanOrEqual(5);

      const orgSchema = schemasEs.find((s) => s["@type"] === "Organization") as Record<string, unknown>;
      expect(orgSchema.url).toBe(SITE_URL);
      expect(orgSchema.logo).toBeDefined();
      expect((orgSchema.logo as { url: string }).url).toBe(LOGO_URL);
      expect(orgSchema.contactPoint).toBeDefined();

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
      const sm = sitemap();
      expect(sm.length).toBeGreaterThan(60);

      const sitemapUrls = new Set(sm.map((entry) => entry.url));

      for (const path of LOCALIZED_PATHS) {
        const expectedUrl = `${SITE_URL}${path === "/" ? "/" : `${path}/`}`;
        expect(sitemapUrls.has(expectedUrl), `Sitemap missing path: ${expectedUrl}`).toBe(true);
      }

      for (const entry of sm) {
        expect(entry.priority).toBeGreaterThanOrEqual(0.0);
        expect(entry.priority).toBeLessThanOrEqual(1.0);
        expect(["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"]).toContain(
          entry.changeFrequency,
        );
        expect(entry.lastModified).toBeInstanceOf(Date);
      }

      const rb = robots();
      expect(rb.rules).toBeDefined();
      expect(rb.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
    });
  });

  describe("Tier 2: Boundary & Corner Cases", () => {
    it("D5-T2-1: Glossary title length <= 60 chars cutoff & search-intent preservation", () => {
      for (const t of TERMINOS) {
        for (const lang of ["es", "en"] as const) {
          const title = tituloDeTermino(t.term, lang);
          const fullTitle = `${title} — ${SITE_NAME}`;

          expect(
            fullTitle.length,
            `Title for '${t.term}' (${lang}) exceeds max length: "${fullTitle}" (${fullTitle.length} chars)`,
          ).toBeLessThanOrEqual(LARGO_MAXIMO_TITULO);

          // En español se conserva «qué es», salvo en MAE y MFE.
          if (lang === "es" && !t.term.includes("MAE") && !t.term.includes("MFE")) {
            expect(title).toContain("qué es");
          }
        }
      }

      // Con un término largo se conserva la sigla y se recorta la expansión.
      const longTerm = "MAE (Maximum Adverse Excursion)";
      const titleEn = tituloDeTermino(longTerm, "en");
      expect(titleEn.startsWith("MAE")).toBe(true);
      expect(titleEn).not.toContain("Maximum Adverse Excursion");
      expect(`${titleEn} — ${SITE_NAME}`.length).toBeLessThanOrEqual(LARGO_MAXIMO_TITULO);
    });

    it("D5-T2-2: Trailing slash canonical normalization consistency across all path permutations", () => {
      expect(siteUrl("/")).toBe(`${SITE_URL}/`);
      expect(siteUrl("")).toBe(`${SITE_URL}/`);
      expect(siteUrl("/demo")).toBe(`${SITE_URL}/demo`);
      expect(siteUrl("demo")).toBe(`${SITE_URL}/demo`);
      expect(siteUrl("/features/metricas/")).toBe(`${SITE_URL}/features/metricas/`);

      const rootHl = hreflangDe("/");
      expect(rootHl.es).toBe(`${SITE_URL}/`);
      expect(rootHl.en).toBe(`${SITE_URL}/en/`);

      const subHl = hreflangDe("/faq");
      expect(subHl.es).toBe(`${SITE_URL}/faq/`);
      expect(subHl.en).toBe(`${SITE_URL}/en/faq/`);
    });

    it("D5-T2-3: Special characters, quotes, and punctuation escaping in metadata", () => {
      const schemas = esquemasGlobales("es", { soporte: "soporte@countpips.com" });
      const jsonString = JSON.stringify(schemas);
      expect(() => JSON.parse(jsonString)).not.toThrow();

      const customFaq = [
        { q: '¿Qué significa "Drawdown" y "Risk of Ruin"?', a: 'Representan la "pérdida máxima" acumulada & probabilidad.' },
      ];
      const faqLd = jsonLdFaq(customFaq);
      const serialized = JSON.stringify(faqLd);
      expect(() => JSON.parse(serialized)).not.toThrow();
      expect(serialized).toContain('\\"Drawdown\\"');
    });

    it("D5-T2-4: Alternate language URL resolution across dynamic routes", () => {
      for (const t of TERMINOS) {
        const esPath = `/glosario/${t.slug}`;
        const enPath = `/en/glosario/${t.slug}`;

        expect(tieneVersionEn(esPath)).toBe(true);
        expect(sinPrefijoEn(enPath)).toBe(esPath);
      }

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

      expect(items.length).toBe(3); // inicio + dos pasos

      items.forEach((item, index) => {
        expect(item.position).toBe(index + 1);
        expect(item.item.startsWith(SITE_URL)).toBe(true);
        expect(item.name.length).toBeGreaterThan(0);
      });

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

      const traderSchemas = esquemasTrader("es", "manual");
      expect(traderSchemas.length).toBe(2);
      expect(traderSchemas[0]["@type"]).toBe("WebPage");
      expect(traderSchemas[1]["@type"]).toBe("BreadcrumbList");
    });
  });
});
