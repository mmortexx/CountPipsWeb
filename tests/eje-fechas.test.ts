import { describe, expect, it } from "vitest";
import { fmtDiaMes } from "@/lib/trading/format";

const UNO_DE_FEBRERO = new Date(Date.UTC(2026, 1, 1));
const QUINCE_DE_SEPTIEMBRE = new Date(Date.UTC(2026, 8, 15));

// `Intl` en pt-BR escribe «1 de fev»: el eje lo quita, con su mes corto, y los demás idiomas siguen como estaban.
describe("el eje de fechas escribe el día y el mes corto, sin « de » entre ambos", () => {
  it.each([
    ["es", "1 feb", "15 sept"],
    ["en", "1 Feb", "15 Sept"],
    ["pt", "1 fev", "15 set"],
    ["fr", "1 févr", "15 sept"],
    ["de", "1 Feb.", "15 Sept."],
    ["it", "1 feb", "15 set"],
  ] as const)("%s", (lang, primero, segundo) => {
    expect([fmtDiaMes(UNO_DE_FEBRERO, lang), fmtDiaMes(QUINCE_DE_SEPTIEMBRE, lang)]).toEqual([primero, segundo]);
  });
});
