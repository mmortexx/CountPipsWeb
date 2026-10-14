import { describe, expect, it } from "vitest";
import { equivalenciaEur, PRECIO_CORE, PRECIO_PRO } from "@/lib/precios";

/**
 * La equivalencia en euros de la tarjeta de precios: en los idiomas de la zona
 * euro, con su propia frase y su mes; en inglés y portugués (Brasil), no.
 */
describe("equivalencia en euros", () => {
  const casos = [
    ["es", "al cambio de septiembre de 2026"],
    ["fr", "au taux de change de septembre 2026"],
    ["de", "zum Wechselkurs vom September 2026"],
    ["it", "al cambio di settembre 2026"],
  ] as const;

  it.each(casos)("%s la enseña con su frase", (lang, frase) => {
    for (const precio of [PRECIO_CORE, PRECIO_PRO]) {
      const texto = equivalenciaEur(precio, lang);
      expect(texto, lang).toMatch(/^≈\u00a0\d+\u00a0€ /);
      expect(texto, lang).toContain(frase);
    }
  });

  it("inglés y portugués no la enseñan", () => {
    expect(equivalenciaEur(PRECIO_CORE, "en")).toBeNull();
    expect(equivalenciaEur(PRECIO_CORE, "pt")).toBeNull();
  });
});
