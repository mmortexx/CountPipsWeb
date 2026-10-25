// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";

let ruta = "/";
vi.mock("next/navigation", () => ({ usePathname: () => ruta, useRouter: () => ({ push() {}, replace() {} }) }));

import { LanguageProvider } from "@/lib/i18n";
import { SavingsCalculator } from "@/components/marketing/SavingsCalculator";
import { fmtMoney } from "@/lib/trading/format";
import { PRECIO_PRO } from "@/lib/precios";
import { TASA_REINVERSION_ANUAL } from "@/lib/supuestos";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** Cuota mensual al inicio de cada mes, a interés compuesto mensual: renta anticipada en forma cerrada. */
function reinvertido(mensual: number, anios: number): number {
  const r = TASA_REINVERSION_ANUAL / 12;
  return (mensual * (1 + r) * ((1 + r) ** (anios * 12) - 1)) / r;
}

const IDIOMAS = [
  ["es", "/herramientas/ahorro-vs-suscripcion/"],
  ["en", "/en/herramientas/ahorro-vs-suscripcion/"],
] as const;

describe("el ahorro reinvertido enseña lo reinvertido, no lo reinvertido menos el precio", () => {
  let cont: HTMLElement;
  let raiz: Root;

  beforeEach(() => {
    cont = document.createElement("div");
    document.body.appendChild(cont);
    raiz = createRoot(cont);
  });
  afterEach(() => {
    act(() => raiz.unmount());
    cont.remove();
  });

  function monta(pathname: string, mensual: number, anios: number) {
    ruta = pathname;
    act(() => {
      raiz.render(createElement(LanguageProvider, null, createElement(SavingsCalculator)));
    });
    const [m, a] = cont.querySelectorAll<HTMLInputElement>('input[type="range"]');
    const poner = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    for (const [input, valor] of [[m, mensual], [a, anios]] as const)
      act(() => {
        poner.call(input, String(valor));
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
  }

  const tarjeta = () =>
    [...cont.querySelectorAll<HTMLElement>("div")].find((d) => /^(Reinvertido|Compounded)/.test(d.firstElementChild?.textContent ?? "") && d.children.length === 2)!;
  const usd = (n: number, lang: "es" | "en") => fmtMoney(n, lang, { decimals: 0 });

  it.each(IDIOMAS)("%s: 25 $/mes a 3 años, la tarjeta es lo reinvertido", (lang, pathname) => {
    monta(pathname, 25, 3);
    const esperado = reinvertido(25, 3);
    expect(esperado).toBeGreaterThan(1000); // a mano: 25 · 1,00667 · (1,00667^36 − 1) / 0,00667 ≈ 1.019
    expect(esperado).toBeLessThan(1030);
    expect(tarjeta().lastElementChild!.textContent).toBe(usd(esperado, lang));
  });

  it.each(IDIOMAS)("%s: 5 $/mes a 1 año, con el precio por encima de lo reinvertido, no se recorta a cero", (lang, pathname) => {
    monta(pathname, 5, 1);
    const esperado = reinvertido(5, 1);
    expect(esperado).toBeLessThan(PRECIO_PRO);
    expect(tarjeta().lastElementChild!.textContent).toBe(usd(esperado, lang));
  });

  it.each(IDIOMAS)("%s: la frase cita lo reinvertido y, aparte, la ventaja sobre el pago único", (lang, pathname) => {
    monta(pathname, 25, 3);
    const invertido = reinvertido(25, 3);
    const frase = [...cont.querySelectorAll("p")].find((p) => /\b(mes|month)\b.*8\s?%/.test(p.textContent ?? ""))!.textContent!;
    expect(frase).toContain(usd(invertido, lang));
    expect(frase).toContain(usd(invertido - PRECIO_PRO, lang));
  });
});
