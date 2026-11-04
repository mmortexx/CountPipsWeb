// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

let ruta = "/demo";
vi.mock("next/navigation", () => ({ usePathname: () => ruta, useRouter: () => ({ push() {}, replace() {} }) }));

const goDetail = vi.hoisted(() => vi.fn());
const demo = vi.hoisted(() => ({
  selectedTradeId: 0 as number | null,
  filters: { instrument: "all", setup: "all", direction: "all", compliance: "all" },
}));
vi.mock("@/components/demo/DemoContext", () => ({
  useDemo: () => ({ ...demo, setFilters() {}, clearFilters() {}, goDetail, goBack() {} }),
}));

import { LanguageProvider } from "@/lib/i18n";
import { TRADES } from "@/lib/trading/data";
import { TradesPage } from "@/components/demo/pages/TradesPage";
import { TradeDetailPage } from "@/components/demo/pages/TradeDetailPage";
import { resetToSample } from "@/lib/trading/demoStore";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* WCAG 2.5.8: un control de menos de 24 × 24 px necesita 24 px de zona de toque
   a su alrededor. La casilla de cada fila (14 px) y «Quitar etiqueta» (16 px) no
   pueden crecer sin mover el diseño: crece un pseudoelemento (`.tj-area-24`). */

const css = readFileSync(resolve(__dirname, "../src/app/globals.css"), "utf8");

describe("la regla .tj-area-24 de globals.css", () => {
  const regla = (selector: string) => {
    const i = css.indexOf(`${selector} {`);
    return i < 0 ? "" : css.slice(i, css.indexOf("}", i));
  };

  it("el pseudoelemento mide 24 px como mínimo en las dos medidas y se centra en el control", () => {
    const antes = regla(".tj-area-24::before");
    expect(antes).toMatch(/width:\s*max\(100%,\s*24px\)/);
    expect(antes).toMatch(/height:\s*max\(100%,\s*24px\)/);
    expect(antes).toMatch(/position:\s*absolute/);
    expect(antes).toMatch(/top:\s*50%/);
    expect(antes).toMatch(/left:\s*50%/);
    expect(antes).toMatch(/translate\(-50%,\s*-50%\)/);
  });

  it("el control es el contexto de posición del pseudoelemento", () => {
    expect(regla(".tj-area-24")).toMatch(/position:\s*relative/);
  });
});

let cont: HTMLElement;
let raiz: Root;

beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
  resetToSample();
  goDetail.mockClear();
  cont = document.createElement("div");
  document.body.appendChild(cont);
  raiz = createRoot(cont);
});
afterEach(() => {
  act(() => raiz.unmount());
  cont.remove();
  resetToSample();
  vi.unstubAllGlobals();
  ruta = "/demo";
});

function monta(url: string, pagina: ReactElement) {
  ruta = url;
  act(() => raiz.render(createElement(LanguageProvider, null, pagina)));
}

describe("Operaciones: la casilla de cada fila tiene zona de 24 px", () => {
  it("va dentro de una etiqueta con la zona, y pulsarla marca la fila sin abrir el detalle", () => {
    monta("/demo", createElement(TradesPage));
    const fila = cont.querySelector<HTMLTableRowElement>("tbody tr[data-operacion]")!;
    const casilla = fila.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    const zona = casilla.closest("label")!;
    expect(zona, "la casilla no está dentro de una etiqueta").not.toBeNull();
    expect(zona.classList.contains("tj-area-24")).toBe(true);
    expect(casilla.checked).toBe(false);
    act(() => zona.click());
    expect(fila.querySelector<HTMLInputElement>('input[type="checkbox"]')!.checked).toBe(true);
    act(() => fila.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click());
    expect(goDetail).not.toHaveBeenCalled();
  });

  it("conserva su nombre: la etiqueta que la envuelve no añade texto", () => {
    monta("/demo", createElement(TradesPage));
    const casilla = cont.querySelector<HTMLInputElement>('tbody tr[data-operacion] input[type="checkbox"]')!;
    expect(casilla.closest("label")!.textContent).toBe("");
    expect(casilla.getAttribute("aria-label")).toMatch(/^\S+ Seleccionar operación$/);
  });
});

describe("Detalle: «Quitar etiqueta» dice qué etiqueta quita y tiene zona de 24 px", () => {
  const quitar = () => [...cont.querySelectorAll<HTMLButtonElement>("button")].filter((b) => /^(Quitar etiqueta|Remove tag)/.test(b.getAttribute("aria-label") ?? ""));

  it.each([
    ["/demo", ["Quitar etiqueta «Buena entrada»", "Quitar etiqueta «Calma»"]],
    ["/en/demo", ["Remove tag “Good entry”", "Remove tag “Calm”"]],
  ])("en %s", (url, nombres) => {
    demo.selectedTradeId = TRADES[0].id;
    monta(url, createElement(TradeDetailPage));
    expect(quitar().map((b) => b.getAttribute("aria-label"))).toEqual(nombres);
    for (const b of quitar()) expect(b.classList.contains("tj-area-24")).toBe(true);
  });

  it("al quitar una, la otra conserva su nombre", () => {
    demo.selectedTradeId = TRADES[0].id;
    monta("/demo", createElement(TradeDetailPage));
    act(() => quitar()[0].click());
    expect(quitar().map((b) => b.getAttribute("aria-label"))).toEqual(["Quitar etiqueta «Calma»"]);
  });
});
