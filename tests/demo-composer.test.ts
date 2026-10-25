// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";

vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push() {}, replace() {} }) }));

import { LanguageProvider } from "@/lib/i18n";
import { DemoProvider } from "@/components/demo/DemoContext";
import { DashboardPage } from "@/components/demo/pages/DashboardPage";
import { useToast } from "@/hooks/use-toast";
import { customTradeToTrade, getCustomTrades, resetToSample } from "@/lib/trading/demoStore";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let cont: HTMLElement;
let raiz: Root;

/** Los avisos que muestra la demo, leídos del mismo almacén que pinta el Toaster. */
function Avisos() {
  const { toasts } = useToast();
  return createElement("div", { id: "avisos" }, toasts.map((a) => createElement("p", { key: a.id }, String(a.title))));
}

function monta() {
  act(() => {
    raiz.render(
      createElement(LanguageProvider, null, createElement(DemoProvider, null, createElement(DashboardPage), createElement(Avisos)))
    );
  });
}

const campo = (id: string) => cont.querySelector<HTMLInputElement>(`#${id}`)!;

function escribe(id: string, texto: string) {
  act(() => {
    const poner = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    poner.call(campo(id), texto);
    campo(id).dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function registra() {
  act(() => {
    cont.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}

beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
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

describe("el registro rápido guarda el plan que el visitante tecleó", () => {
  it("el stop y el objetivo escritos llegan al detalle, con su R:R planificado", () => {
    monta();
    escribe("d-entry", "100,0");
    escribe("d-stop", "98,5");
    escribe("d-target", "104,0");
    escribe("d-exit", "103,0");
    escribe("d-qty", "1");
    registra();

    const guardada = getCustomTrades();
    expect(guardada).toHaveLength(1);
    const detalle = customTradeToTrade(guardada[0]);
    expect(detalle.initialStop).toBe(98.5);
    expect(detalle.target).toBe(104);
    // (104 − 100) / (100 − 98,5) = 4 / 1,5
    expect(detalle.plannedRr).toBeCloseTo(8 / 3, 9);
  });

  const base = {
    id: 1, instrument: "ES", setup: "Breakout", direction: "long", entry: 100, exit: 110, qty: 1, netPnl: 100,
    rMultiple: 2, compliance: "yes", closedAt: "2026-07-01T10:00:00.000Z", note: "",
  } as const;

  it("un corto con stop y objetivo propios los conserva", () => {
    const t = customTradeToTrade({ ...base, direction: "short", exit: 96, stop: 102, target: 96 });
    expect(t.initialStop).toBe(102);
    expect(t.target).toBe(96);
    expect(t.plannedRr).toBe(2);
  });

  it("sin objetivo, el stop tecleado manda y el objetivo se sintetiza a esa distancia", () => {
    const t = customTradeToTrade({ ...base, stop: 98 });
    expect(t.initialStop).toBe(98);
    // Gana con r = 2: plannedRr = 2,5 y objetivo = 100 + 2 · 2,5.
    expect(t.plannedRr).toBe(2.5);
    expect(t.target).toBe(105);
  });

  it("un stop o un objetivo inservibles (iguales a la entrada, cero, texto) se tratan como ausentes", () => {
    const sintetica = customTradeToTrade(base);
    const rota = customTradeToTrade({ ...base, stop: 100, target: "x" as unknown as number });
    expect(rota.initialStop).toBe(sintetica.initialStop);
    expect(rota.target).toBe(sintetica.target);
    expect(rota.plannedRr).toBe(sintetica.plannedRr);
  });

  it("una operación guardada antes de este campo conserva la síntesis de siempre", () => {
    const antigua = customTradeToTrade({
      id: 1, instrument: "ES", setup: "Breakout", direction: "long", entry: 5000, exit: 5100, qty: 1, netPnl: 100,
      rMultiple: 2, compliance: "yes", closedAt: "2026-07-01T10:00:00.000Z", note: "",
    });
    // Stop al 1 % de la entrada; R planificado = max(r + 0,5; 1,5) = 2,5.
    expect(antigua.initialStop).toBe(4950);
    expect(antigua.plannedRr).toBe(2.5);
    expect(antigua.target).toBe(5125);
  });
});
