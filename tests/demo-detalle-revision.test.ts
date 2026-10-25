// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";

vi.mock("next/navigation", () => ({ usePathname: () => "/demo", useRouter: () => ({ push() {}, replace() {} }) }));

import { LanguageProvider } from "@/lib/i18n";
import { DemoProvider, useDemo } from "@/components/demo/DemoContext";
import { TradeDetailPage } from "@/components/demo/pages/TradeDetailPage";
import { TRADES } from "@/lib/trading/data";
import { mergeTrades, resetToSample } from "@/lib/trading/demoStore";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* La revisión y las etiquetas son de cada operación: al pasar a la siguiente
   no se arrastran las que el visitante tocó en la anterior. */

const lista = mergeTrades(TRADES, []);
const i = lista.findIndex((t, k) => t.compliance !== "no" && lista[k + 1] && lista[k + 1].compliance !== "no");
const ROTULO = { yes: "Sí", partial: "Parcial", no: "No" } as const;

let cont: HTMLElement;
let raiz: Root;

function Abre({ id }: { id: number }) {
  const { goDetail } = useDemo();
  useEffect(() => goDetail(id), []); // eslint-disable-line react-hooks/exhaustive-deps
  return createElement(TradeDetailPage);
}

const pulsa = (el: Element | null | undefined) => act(() => (el as HTMLElement).click());
const boton = (texto: string) => [...cont.querySelectorAll("button")].find((b) => b.textContent?.trim() === texto);
const revisionMarcada = () =>
  [...cont.querySelectorAll<HTMLButtonElement>("button[aria-pressed='true']")]
    .map((b) => b.textContent?.trim())
    .find((t) => t === "Sí" || t === "Parcial" || t === "No");
const etiquetas = () => cont.querySelectorAll("[aria-label^='Quitar etiqueta']").length;

beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  resetToSample();
  cont = document.createElement("div");
  document.body.appendChild(cont);
  raiz = createRoot(cont);
  act(() => {
    raiz.render(createElement(LanguageProvider, null, createElement(DemoProvider, null, createElement(Abre, { id: lista[i].id }))));
  });
});

afterEach(() => {
  act(() => raiz.unmount());
  cont.remove();
  vi.unstubAllGlobals();
});

describe("el detalle de una operación", () => {
  it("hay dos operaciones seguidas que no se revisaron con «No»", () => {
    expect(i).toBeGreaterThanOrEqual(0);
    expect(revisionMarcada()).toBe(ROTULO[lista[i].compliance]);
  });

  it("al pasar a la siguiente, la revisión es la de esa operación", () => {
    pulsa(boton("No"));
    expect(revisionMarcada()).toBe("No");
    pulsa(cont.querySelector("[aria-label='Operación siguiente']"));
    expect(revisionMarcada()).toBe(ROTULO[lista[i + 1].compliance]);
  });

  it("al pasar a la siguiente, las etiquetas vuelven a las de partida", () => {
    const deSalida = etiquetas();
    expect(deSalida).toBeGreaterThan(0);
    pulsa(cont.querySelector("[aria-label^='Quitar etiqueta']"));
    expect(etiquetas()).toBe(deSalida - 1);
    pulsa(cont.querySelector("[aria-label='Operación siguiente']"));
    expect(etiquetas()).toBe(deSalida);
  });
});
