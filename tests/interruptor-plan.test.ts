// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, act } from "react";
import { createRoot, type Root } from "react-dom/client";

let ruta = "/demo";
vi.mock("next/navigation", () => ({ usePathname: () => ruta, useRouter: () => ({ push() {}, replace() {} }) }));
vi.mock("@/components/demo/DemoContext", () => ({
  useDemo: () => ({ selectedTradeId: null, goBack() {}, goDetail() {} }),
}));

import { LanguageProvider } from "@/lib/i18n";
import { JournalPage } from "@/components/demo/pages/JournalPage";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let cont: HTMLElement;
let raiz: Root;

function monta(r: string) {
  ruta = r;
  cont = document.createElement("div");
  document.body.appendChild(cont);
  raiz = createRoot(cont);
  act(() => raiz.render(createElement(LanguageProvider, null, createElement(JournalPage))));
}
afterEach(() => {
  act(() => raiz.unmount());
  cont.remove();
});

const interruptor = () => cont.querySelector<HTMLElement>('[role="switch"]')!;
const textos = (ids: string | null) =>
  (ids ?? "").split(/\s+/).filter(Boolean).map((id) => document.getElementById(id)?.textContent?.trim() ?? "");

/* El nombre del interruptor del plan es su etiqueta visible y no cambia: el
   estado lo da aria-checked. Si el nombre incluyera «Con plan»/«Sin plan», el
   lector lo anunciaría como otro control al pulsarlo. */
describe.each([
  ["/demo", "Plan del día"],
  ["/en/demo", "Today’s plan"],
])("interruptor del plan en %s", (r, etiqueta) => {
  beforeEach(() => monta(r));

  it("su nombre es la etiqueta visible, ligado por aria-labelledby", () => {
    const sw = interruptor();
    expect(sw.hasAttribute("aria-label")).toBe(false);
    expect(textos(sw.getAttribute("aria-labelledby"))).toEqual([etiqueta]);
  });

  it("al pulsarlo cambia aria-checked y el nombre sigue igual", () => {
    const sw = interruptor();
    expect(sw.getAttribute("aria-checked")).toBe("true");
    act(() => sw.click());
    expect(interruptor().getAttribute("aria-checked")).toBe("false");
    expect(textos(interruptor().getAttribute("aria-labelledby"))).toEqual([etiqueta]);
  });

  it("el texto del estado va como descripción y cambia con el estado", () => {
    const antes = textos(interruptor().getAttribute("aria-describedby"));
    act(() => interruptor().click());
    const despues = textos(interruptor().getAttribute("aria-describedby"));
    expect(antes).toHaveLength(1);
    expect(despues).toHaveLength(1);
    expect(antes[0]).not.toBe("");
    expect(despues[0]).not.toBe(antes[0]);
  });
});
