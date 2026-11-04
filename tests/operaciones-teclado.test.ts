// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";

let ruta = "/demo";
vi.mock("next/navigation", () => ({ usePathname: () => ruta, useRouter: () => ({ push() {}, replace() {} }) }));

const goDetail = vi.fn();
const FILTROS = { instrument: "all", setup: "all", direction: "all", compliance: "all" };
vi.mock("@/components/demo/DemoContext", () => ({
  useDemo: () => ({ filters: FILTROS, setFilters() {}, clearFilters() {}, goDetail }),
}));

import { LanguageProvider } from "@/lib/i18n";
import { TradesPage } from "@/components/demo/pages/TradesPage";
import { addTrade, resetToSample } from "@/lib/trading/demoStore";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let cont: HTMLElement;
let raiz: Root;

function monta(url: string) {
  ruta = url;
  act(() => {
    raiz.render(createElement(LanguageProvider, null, createElement(TradesPage)));
  });
}

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

const filas = () => [...cont.querySelectorAll<HTMLTableRowElement>("tbody tr[data-operacion]")];

describe("Operaciones: abrir el detalle sin ratón", () => {
  it.each(["/demo", "/en/demo"])("en %s, cada fila trae un botón con su instrumento que abre su detalle una sola vez", (url) => {
    monta(url);
    const fila = filas()[0];
    const boton = fila.querySelector<HTMLButtonElement>("td:nth-child(2) button");
    expect(boton, "la fila no tiene un botón que abra el detalle").not.toBeNull();
    expect(boton!.type).toBe("button");
    expect(boton!.textContent).toBe(fila.querySelectorAll("td")[1].textContent!.trim());
    act(() => boton!.click());
    expect(goDetail).toHaveBeenCalledTimes(1);
    expect(goDetail).toHaveBeenCalledWith(Number(fila.dataset.operacion));
  });

  it("el clic en la fila (ratón) sigue abriendo el detalle, y la casilla no", () => {
    monta("/demo");
    const fila = filas()[1];
    act(() => fila.querySelectorAll("td")[3].click());
    expect(goDetail).toHaveBeenCalledTimes(1);
    expect(goDetail).toHaveBeenCalledWith(Number(fila.dataset.operacion));
    goDetail.mockClear();
    act(() => fila.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click());
    expect(goDetail).not.toHaveBeenCalled();
  });

  it("mientras se confirma el borrado de una operación propia, ni la fila ni el botón navegan", () => {
    addTrade({
      instrument: "ES", setup: "Breakout", direction: "long", entry: 5800, exit: 5810, qty: 1, netPnl: 125,
      rMultiple: 1, compliance: "yes", closedAt: "2031-01-01T10:00:00Z", note: "",
    });
    monta("/demo");
    const fila = filas()[0];
    act(() => fila.querySelector<HTMLButtonElement>('button[aria-label="Eliminar operación"]')!.click());
    act(() => fila.querySelector<HTMLButtonElement>("td:nth-child(2) button")!.click());
    act(() => fila.querySelectorAll("td")[3].click());
    expect(goDetail).not.toHaveBeenCalled();
  });
});
