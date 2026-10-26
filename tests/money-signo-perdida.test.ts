import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push() {}, replace() {} }) }));

import { LanguageProvider } from "@/lib/i18n";
import { Money } from "@/components/tj/Money";

const pinta = (props: Parameters<typeof Money>[0]) =>
  renderToString(createElement(LanguageProvider, null, createElement(Money, props)));

// Media perdedora y max drawdown llegan como magnitudes positivas con tono de
// pérdida: se leían «+126 $» en rojo junto a «Mayor pérdida −260 $».
describe("Money con tono de pérdida", () => {
  it("una magnitud positiva con signo se pinta con menos, en rojo", () => {
    const html = pinta({ value: 126, sign: true, tone: "neg", decimals: 0 });
    expect(html).toContain("text-pnl-neg");
    expect(html).not.toContain("+");
    expect(html).toMatch(/[−-]\s?126/);
  });

  it("una cifra ya negativa no cambia ni se queda con doble signo", () => {
    const html = pinta({ value: -260, sign: true, tone: "neg", decimals: 0 });
    expect(html).toMatch(/[−-]\s?260/);
    expect(html).not.toMatch(/[−-]\s?[−-]/);
  });

  it("sin tono forzado, una ganancia sigue con más", () => {
    expect(pinta({ value: 190, sign: true, colorizeSign: true, decimals: 0 })).toContain("+");
  });
});
