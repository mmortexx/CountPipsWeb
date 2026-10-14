import { describe, expect, it } from "vitest";
import { notaCorte } from "@/lib/publicacion";
import { deFr } from "@/lib/trading/format";

/**
 * En francés, «de» delante de vocal (o de h) se elide: «d’octobre», pero «de
 * janvier». Lo usan la nota de corte de la portada y la equivalencia en euros.
 */
describe("deFr: «de» con elisión delante de vocal o h", () => {
  it.each([
    ["octobre 2026", "d’octobre 2026"],
    ["avril 2026", "d’avril 2026"],
    ["août 2026", "d’août 2026"],
    ["Été 2026", "d’Été 2026"],
    ["Hôtel 2026", "d’Hôtel 2026"],
    ["janvier 2026", "de janvier 2026"],
    ["mars 2026", "de mars 2026"],
  ])("«%s» → «%s»", (texto, esperado) => {
    expect(deFr(texto)).toBe(esperado);
  });
});

describe("notaCorte: la nota de corte de la banda de cifras", () => {
  const OCTUBRE = "2026-10-15";

  it.each([
    ["es", "Cifras a octubre de 2026."],
    ["en", "Figures as of October 2026."],
    ["pt", "Números em outubro de 2026."],
    ["fr", "Chiffres d’octobre 2026."],
    ["de", "Stand der Zahlen: Oktober 2026."],
    ["it", "Dati a ottobre 2026."],
  ] as const)("%s", (lang, frase) => {
    expect(notaCorte(lang, OCTUBRE)).toBe(frase);
  });

  it("en francés, un mes con consonante lleva «de»", () => {
    expect(notaCorte("fr", "2026-01-10")).toBe("Chiffres de janvier 2026.");
  });

  it("sin fecha de publicación no hay nota", () => {
    for (const lang of ["es", "en", "pt", "fr", "de", "it"] as const) {
      expect(notaCorte(lang, ""), lang).toBe("");
    }
  });
});
