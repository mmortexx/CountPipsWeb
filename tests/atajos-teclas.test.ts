// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";

vi.mock("next/navigation", () => ({ usePathname: () => "/demo", useRouter: () => ({ push() {}, replace() {} }) }));

import { pideAyuda } from "@/lib/atajos";
import { LanguageProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import { AppDemo } from "@/components/demo/AppDemo";
import { resetToSample } from "@/lib/trading/demoStore";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* La ayuda se abre por el carácter «?», no por la tecla física: en el teclado
   español «/» es Mayús+7 y «_» sale de la tecla que en el inglés es «/». */
describe("qué tecla abre la ayuda de atajos", () => {
  it.each([
    ["? en el teclado inglés", { key: "?", shiftKey: true, code: "Slash" }, true],
    ["? en el teclado español", { key: "?", shiftKey: true, code: "Minus" }, true],
    ["/ en el teclado español (Mayús+7)", { key: "/", shiftKey: true, code: "Digit7" }, false],
    ["_ en el teclado español", { key: "_", shiftKey: true, code: "Slash" }, false],
    ["/ en el teclado inglés", { key: "/", shiftKey: false, code: "Slash" }, false],
  ])("%s", (_, tecla, abre) => {
    expect(pideAyuda(tecla)).toBe(abre);
  });
});

let cont: HTMLElement;
let raiz: Root;

const panel = () => cont.querySelector<HTMLElement>("#demo-tabpanel")!;
const buscador = () => cont.querySelector<HTMLInputElement>("input[type='search']");
function pulsa(key: string, en: HTMLElement = panel(), shiftKey = false) {
  act(() => {
    en.focus();
    en.dispatchEvent(new KeyboardEvent("keydown", { key, shiftKey, bubbles: true, cancelable: true }));
  });
}
const ayuda = () => cont.querySelector("[role='dialog'][aria-label='Atajos de teclado']")?.textContent ?? "";

beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  resetToSample();
  cont = document.createElement("div");
  document.body.appendChild(cont);
  raiz = createRoot(cont);
  act(() => raiz.render(createElement(ThemeProvider, null, createElement(LanguageProvider, null, createElement(AppDemo)))));
});

afterEach(() => {
  act(() => raiz.unmount());
  cont.remove();
  vi.unstubAllGlobals();
});

describe("«/» en la demo", () => {
  it("en Operaciones lleva el foco al buscador", () => {
    pulsa("2");
    expect(buscador()).not.toBeNull();
    pulsa("/", panel(), true);
    expect(document.activeElement).toBe(buscador());
    expect(ayuda()).toBe("");
  });

  it("la ayuda solo lo anuncia donde hay buscador", () => {
    pulsa("2");
    pulsa("?", panel(), true);
    expect(ayuda()).toContain("Buscar en Operaciones");
    act(() => cont.querySelector<HTMLElement>("[aria-label='Cerrar']")!.click());
    pulsa("1");
    expect(buscador()).toBeNull();
    pulsa("?", panel(), true);
    expect(ayuda()).not.toContain("Buscar en Operaciones");
  });

  it("en el detalle de una operación, que no tiene buscador, ni lo anuncia", () => {
    pulsa("2");
    act(() => cont.querySelector<HTMLElement>("#demo-tabpanel tbody tr")!.click());
    expect(cont.querySelector("[aria-label='Operación siguiente']")).not.toBeNull();
    expect(buscador()).toBeNull();
    pulsa("?", panel(), true);
    expect(ayuda()).toContain("Mostrar esta ayuda");
    expect(ayuda()).not.toContain("Buscar en Operaciones");
  });
});
