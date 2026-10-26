import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

let ruta = "/";
vi.mock("next/navigation", () => ({ usePathname: () => ruta, useRouter: () => ({ push() {}, replace() {} }) }));

import { LanguageProvider } from "@/lib/i18n";
import { RiskCalculator, rotuloValorEscalon } from "@/components/marketing/RiskCalculator";
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

/* La barra riesgo/beneficio ponía a la izquierda el riesgo sin fricción
   (100,00 $) frente al beneficio con la fricción ya restada, bajo una ficha
   «Riesgo total 100,30 $»; y el porcentaje del centro no decía de qué era. */
describe("calculadora de riesgo: el pie de la barra cuadra con las fichas", () => {
  it("el riesgo de la barra es el riesgo total, con fricción", () => {
    const t = textoDe("/");
    expect(t).toContain("Riesgo total 100,30 $");
    expect(t.match(/100,30 \$/g)?.length).toBe(2);
    expect(t).not.toContain("100,00 $");
  });

  it("el porcentaje del centro es el del objetivo", () => {
    expect(textoDe("/")).toContain("objetivo +3,0 % del balance");
    expect(textoDe("/en/")).toContain("target +3.0% of balance");
  });
});

/* `valorPip` es lo que mueve la posición un escalón de precio: un pip en forex,
   un tick en futuros y un céntimo en acciones. El rótulo nombra ese escalón. */
describe("calculadora de riesgo: el valor por escalón dice qué escalón es", () => {
  it("en acciones, que es el mercado de partida", () => {
    expect(textoDe("/")).toContain("Valor de un céntimo");
    expect(textoDe("/en/")).toContain("One-cent value");
  });

  it.each([
    ["forex", "es", "Valor del pip"],
    ["forex", "en", "Pip value"],
    ["futures", "es", "Valor del tick"],
    ["futures", "en", "Tick value"],
  ] as const)("en %s (%s): «%s»", (mercado, lang, rotulo) => {
    expect(rotuloValorEscalon(mercado, lang)).toBe(rotulo);
  });
});
