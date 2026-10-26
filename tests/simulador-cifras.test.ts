// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";

vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push() {}, replace() {} }) }));

import { LanguageProvider } from "@/lib/i18n";
import { RMultipleSimulator } from "@/components/marketing/RMultipleSimulator";
import { OPERACIONES_POR_MES, terminaPerdiendo } from "@/lib/trading/montecarlo";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("simulador de R: qué percentil sale en rojo", () => {
  const base = { startBalance: 10_000, trades: 12 * OPERACIONES_POR_MES, monthlyWithdrawal: 0 };

  it("sin retiros, rojo es acabar por debajo del capital inicial", () => {
    expect(terminaPerdiendo(9_999, base)).toBe(true);
    expect(terminaPerdiendo(10_000, base)).toBe(false);
  });

  it("con retiros, lo retirado cuenta: 9.000 en cuenta tras sacar 2.400 es ganar", () => {
    const conRetiros = { ...base, monthlyWithdrawal: 200 };
    expect(terminaPerdiendo(9_000, conRetiros)).toBe(false);
    expect(terminaPerdiendo(7_000, conRetiros)).toBe(true);
  });

  it("una cuenta a cero es perder aunque lo retirado supere el capital", () => {
    expect(terminaPerdiendo(0, { ...base, monthlyWithdrawal: 5_000 })).toBe(true);
  });
});

let cont: HTMLElement;
let raiz: Root;

function mueve(etiqueta: string, valor: number) {
  const input = cont.querySelector<HTMLInputElement>(`input[type='range'][aria-label='${etiqueta}']`)!;
  const fijar = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  act(() => {
    fijar.call(input, String(valor));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

beforeEach(() => {
  cont = document.createElement("div");
  document.body.appendChild(cont);
  raiz = createRoot(cont);
  act(() => raiz.render(createElement(LanguageProvider, null, createElement(RMultipleSimulator))));
});

afterEach(() => {
  act(() => raiz.unmount());
  cont.remove();
});

describe("simulador de R: la cifra fuera de escala no se enseña", () => {
  it("ni en la celda ni en su título", () => {
    mueve("Número de operaciones a simular", 300);
    mueve("Porcentaje de aciertos", 75);
    mueve("Ganancia media en R", 5);
    mueve("Pérdida media en R", 0.25);
    mueve("Riesgo por operación", 3.5);
    expect(cont.textContent).toContain("billón de dólares");
    const celdas = [...cont.querySelectorAll<HTMLElement>(".tj-matriz.grid-cols-5 > div")];
    expect(celdas).toHaveLength(5);
    const ocultas = celdas.filter((c) => c.textContent?.includes("—"));
    expect(ocultas.length).toBeGreaterThan(0);
    for (const c of ocultas) expect(c.title).toBe("fuera de escala");
  });
});
