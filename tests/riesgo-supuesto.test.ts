import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

let ruta = "/";
vi.mock("next/navigation", () => ({ usePathname: () => ruta, useRouter: () => ({ push() {}, replace() {} }) }));

import { LanguageProvider } from "@/lib/i18n";
import { RiskCalculator } from "@/components/marketing/RiskCalculator";
import { UMBRAL_RUINA_PCT } from "@/lib/trading/estadistica";

/** Texto visible de la calculadora tal como sale del servidor, con la Kelly plegada. */
function textoDe(pathname: string): string {
  ruta = pathname;
  const html = renderToString(createElement(LanguageProvider, null, createElement(RiskCalculator)));
  return html.replace(/<[^>]+>/g, " ").replace(/&[^;]+;/g, " ").replace(/\s+/g, " ");
}

/**
 * «Riesgo de ruina» y «Medio Kelly» salen de un win rate que solo se ve al
 * desplegar Kelly. Con la ficha plegada, cada cifra tiene que decir de qué
 * acierto sale.
 */
describe("calculadora de riesgo: ruina y medio Kelly dicen de qué win rate salen", () => {
  it("en español", () => {
    const t = textoDe("/");
    expect(t).toContain(`Riesgo de ruina (−${UMBRAL_RUINA_PCT} %) con un 55 % de aciertos`);
    expect(t).toContain("Medio Kelly con un 55 % de aciertos:");
  });

  it("en inglés", () => {
    const t = textoDe("/en/");
    expect(t).toContain(`Risk of ruin (−${UMBRAL_RUINA_PCT}%) at a 55% win rate`);
    expect(t).toContain("Half-Kelly at a 55% win rate:");
  });
});
