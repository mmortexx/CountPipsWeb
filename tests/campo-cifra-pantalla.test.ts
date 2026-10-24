import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

let ruta = "/";
vi.mock("next/navigation", () => ({ usePathname: () => ruta, useRouter: () => ({ push() {}, replace() {} }) }));

import { LanguageProvider } from "@/lib/i18n";
import { RiskCalculator } from "@/components/marketing/RiskCalculator";
import { cifraReposo } from "@/lib/trading/format";

/** HTML que sale del servidor para una página de la calculadora de riesgo. */
function htmlDe(pathname: string): string {
  ruta = pathname;
  return renderToString(createElement(LanguageProvider, null, createElement(RiskCalculator)));
}

/** Los `value` de los campos de texto, en orden. */
function valores(html: string): string[] {
  return [...html.matchAll(/<input[^>]*type="text"[^>]*>/g)].map((m) => /value="([^"]*)"/.exec(m[0])?.[1] ?? "");
}

describe("campo de cifra en reposo: los millares se escriben", () => {
  it("el balance de la calculadora de riesgo sale con su separador, como el resto de la página", () => {
    const es = valores(htmlDe("/"));
    expect(es[0]).toBe("10.000");
    const en = valores(htmlDe("/en/"));
    expect(en[0]).toBe("10,000");
  });

  it("los precios sin millares no cambian", () => {
    expect(valores(htmlDe("/")).slice(1)).toEqual(["100", "95", "115"]);
  });

  it("al cargar ningún campo está marcado ni lleva aviso", () => {
    const html = htmlDe("/");
    expect(html).not.toContain("aria-invalid");
    expect(html).not.toContain("Escribe una cifra");
  });

  it("cifraReposo agrupa desde cuatro cifras, conserva los decimales que hay y pone el menos tipográfico", () => {
    expect(cifraReposo(1234, "es")).toBe("1.234");
    expect(cifraReposo(1234.5, "es")).toBe("1.234,5");
    expect(cifraReposo(1234567.25, "en")).toBe("1,234,567.25");
    expect(cifraReposo(0.000125, "es")).toBe("0,000125");
    expect(cifraReposo(-38.47, "es")).toBe("−38,47");
    expect(cifraReposo(-0, "es")).toBe("0");
    expect(cifraReposo(Number.NaN, "es")).toBe("");
  });
});
