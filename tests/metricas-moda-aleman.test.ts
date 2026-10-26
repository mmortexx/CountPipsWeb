// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

vi.mock("next/navigation", () => ({ usePathname: () => "/de/", useRouter: () => ({ push() {}, replace() {} }) }));

import { LanguageProvider } from "@/lib/i18n";
import { MetricsShowcaseNew } from "@/components/marketing/MetricsShowcaseNew";
import { cifrasMuestra } from "@/lib/trading/cifras-muestra";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* La distribución de R nombra la moda dos veces: en la cifra de lectura y en
   la barra modal. En alemán, las dos con la misma palabra. */
describe("métricas en alemán: la moda", () => {
  const cont = document.createElement("div");
  const raiz = createRoot(cont);
  afterEach(() => act(() => raiz.unmount()));

  it("se llama «Modus» en la lectura y en la barra", () => {
    document.body.appendChild(cont);
    act(() => raiz.render(createElement(LanguageProvider, null, createElement(MetricsShowcaseNew, { cifras: cifrasMuestra(), enPortada: true }))));
    const pestana = [...cont.querySelectorAll("button")].find((b) => b.textContent?.trim() === "R-Verteilung")!;
    act(() => pestana.click());
    const texto = cont.textContent ?? "";
    expect(texto.match(/Modus/g)?.length).toBeGreaterThanOrEqual(2);
    expect(texto).not.toMatch(/Modalwert/);
  });
});
