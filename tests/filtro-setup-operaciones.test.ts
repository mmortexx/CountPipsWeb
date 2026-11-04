// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";

vi.mock("next/navigation", () => ({ usePathname: () => "/demo", useRouter: () => ({ push() {}, replace() {} }) }));

import { LanguageProvider } from "@/lib/i18n";
import { DemoProvider, useDemo } from "@/components/demo/DemoContext";
import { TradesPage } from "@/components/demo/pages/TradesPage";
import { TRADES } from "@/lib/trading/data";
import { resetToSample } from "@/lib/trading/demoStore";
import { fmtOperaciones } from "@/lib/trading/format";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let cont: HTMLElement;
let raiz: Root;

beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
  resetToSample();
  cont = document.createElement("div");
  document.body.appendChild(cont);
  raiz = createRoot(cont);
});

afterEach(() => {
  act(() => raiz.unmount());
  cont.remove();
  resetToSample();
  vi.unstubAllGlobals();
});

/** Lo que deja fijado Analítica al ir a Operaciones. */
function ConFiltro() {
  const { setFilters, filters } = useDemo();
  useEffect(() => {
    setFilters({ ...filters, setup: "Breakout" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return createElement(TradesPage);
}

describe("Operaciones respeta el setup elegido en Analítica", () => {
  it("cuenta solo las de ese setup, y ofrece quitar el filtro", () => {
    act(() => {
      raiz.render(createElement(LanguageProvider, null, createElement(DemoProvider, null, createElement(ConFiltro))));
    });
    const esperadas = TRADES.filter((t) => t.setup === "Breakout").length;
    expect(esperadas).toBeLessThan(TRADES.length);
    expect(cont.textContent).toContain(fmtOperaciones(esperadas, "es"));
    expect(cont.querySelector('[aria-label="Borrar filtros"], [aria-label="Quitar filtros"], [aria-label="Limpiar filtros"]')).not.toBeNull();
  });
});
