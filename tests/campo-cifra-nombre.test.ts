// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, act } from "react";
import { createRoot, type Root } from "react-dom/client";

vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push() {}, replace() {} }) }));

import { LanguageProvider } from "@/lib/i18n";
import { RiskCalculator } from "@/components/marketing/RiskCalculator";
import { PARES_FOREX } from "@/lib/trading/plan";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let cont: HTMLElement;
let raiz: Root;

beforeEach(() => {
  cont = document.createElement("div");
  document.body.appendChild(cont);
  raiz = createRoot(cont);
  act(() => raiz.render(createElement(LanguageProvider, null, createElement(RiskCalculator))));
});
afterEach(() => {
  act(() => raiz.unmount());
  cont.remove();
});

function pulsa(texto: string) {
  const boton = [...cont.querySelectorAll("button")].find((b) => b.textContent?.trim() === texto);
  if (!boton) throw new Error(`no hay botón «${texto}»`);
  act(() => boton.click());
}

/** Los campos de cifra que viven dentro de un `<label>`: el aviso de rango va dentro del mismo `<label>`. */
const camposEnLabel = () => [...cont.querySelectorAll<HTMLInputElement>('label input[type="text"]')];

/** El nombre que el campo se da a sí mismo, sin pasar por el contenido del `<label>`. */
function nombrePropio(campo: HTMLInputElement): string | null {
  const por = campo.getAttribute("aria-labelledby");
  if (por) return por.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? "").join(" ").trim() || null;
  return campo.getAttribute("aria-label")?.trim() || null;
}

describe("un campo de cifra dentro de un <label> no deja que su aviso entre en el nombre", () => {
  // El nombre accesible de un campo sale del contenido de su `<label>`, y el aviso
  // (`role="alert"`) vive dentro de él: el lector diría el rango dos veces, una en el
  // nombre y otra por `aria-describedby`. Cada campo fija su nombre sin pasar por ahí.
  it("calculadora de riesgo, acciones: el balance y los tres precios", () => {
    const campos = camposEnLabel();
    expect(campos.length).toBe(4);
    for (const c of campos) expect(nombrePropio(c), c.outerHTML).not.toBeNull();
  });

  it("calculadora de riesgo, forex: además, el tipo de cambio de referencia", () => {
    const par = PARES_FOREX.find((p) => p.referencia);
    expect(par).toBeDefined();
    pulsa("Forex (lotes)");
    pulsa(par!.id);
    const campos = camposEnLabel();
    expect(campos.length).toBe(5);
    for (const c of campos) expect(nombrePropio(c), c.outerHTML).not.toBeNull();
  });

  it("el nombre propio dice qué es el campo, no el rango", () => {
    pulsa("Forex (lotes)");
    pulsa(PARES_FOREX.find((p) => p.referencia)!.id);
    for (const c of camposEnLabel()) expect(nombrePropio(c) ?? "").not.toMatch(/Escribe una cifra/);
  });
});
