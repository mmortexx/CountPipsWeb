import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

let ruta = "/en/demo";
vi.mock("next/navigation", () => ({ usePathname: () => ruta, useRouter: () => ({ push() {}, replace() {} }) }));
let abierta: number | null = null;
vi.mock("@/components/demo/DemoContext", () => ({
  useDemo: () => ({ selectedTradeId: abierta, goBack() {}, goDetail() {} }),
}));

import { LanguageProvider } from "@/lib/i18n";
import { JournalPage } from "@/components/demo/pages/JournalPage";
import { TradeDetailPage } from "@/components/demo/pages/TradeDetailPage";
import { TRADES, notaEnIdioma } from "@/lib/trading/data";

/**
 * Las notas de la muestra se guardan en español; la demo inglesa las enseña
 * traducidas en el detalle de una operación y en el historial del Diario.
 */
const texto = (lang: "es" | "en", el: () => ReturnType<typeof createElement>) => {
  ruta = lang === "es" ? "/demo" : "/en/demo";
  return renderToString(createElement(LanguageProvider, null, el())).replace(/&amp;/g, "&").replace(/&#x27;/g, "'");
};
const notasEs = [...new Set(TRADES.flatMap((t) => [t.entryNote, t.closeNote]))];

describe("notas de la muestra en la demo inglesa", () => {
  it("el detalle de una operación enseña sus notas de entrada y de cierre en inglés", () => {
    const t = TRADES[0];
    abierta = t.id;
    const en = texto("en", () => createElement(TradeDetailPage));
    expect(en).toContain(notaEnIdioma(t.entryNote, "en"));
    expect(en).toContain(notaEnIdioma(t.closeNote, "en"));
    expect(notasEs.filter((n) => en.includes(n))).toEqual([]);
    const es = texto("es", () => createElement(TradeDetailPage));
    expect(es).toContain(t.entryNote);
  });

  it("el historial del Diario no enseña ninguna nota en español", () => {
    const en = texto("en", () => createElement(JournalPage));
    const inglesas = notasEs.map((n) => notaEnIdioma(n, "en"));
    expect(inglesas.some((n) => en.includes(n))).toBe(true);
    expect(notasEs.filter((n) => en.includes(n))).toEqual([]);
  });
});
