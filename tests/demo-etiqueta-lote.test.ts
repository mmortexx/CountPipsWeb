// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";

let ruta = "/demo";
vi.mock("next/navigation", () => ({ usePathname: () => ruta, useRouter: () => ({ push() {}, replace() {} }) }));

import { LanguageProvider } from "@/lib/i18n";
import { DemoProvider } from "@/components/demo/DemoContext";
import { TradesPage } from "@/components/demo/pages/TradesPage";
import { toast, useToast } from "@/hooks/use-toast";
import { resetToSample } from "@/lib/trading/demoStore";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let cont: HTMLElement;
let raiz: Root;

/** Los avisos que muestra la demo, leídos del mismo almacén que pinta el Toaster. */
function Avisos() {
  const { toasts } = useToast();
  return createElement("div", { id: "avisos" }, toasts.map((a) => createElement("p", { key: a.id }, String(a.title))));
}

beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
  resetToSample();
  // El almacén de avisos es global: uno en blanco desplaza el de la prueba anterior.
  act(() => {
    toast({ title: "" });
  });
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

/** Selecciona todas las filas visibles, escribe la etiqueta y pulsa el botón; devuelve el aviso. */
function aplicaEtiqueta(url: string, boton: string, etiqueta: string) {
  ruta = url;
  act(() => {
    raiz.render(createElement(LanguageProvider, null, createElement(DemoProvider, null, createElement(TradesPage), createElement(Avisos))));
  });
  act(() => {
    cont.querySelector<HTMLInputElement>('thead input[type="checkbox"]')!.click();
  });
  const campo = cont.querySelector<HTMLInputElement>('input[aria-label="Etiqueta en lote"], input[aria-label="Bulk tag"]')!;
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(campo, etiqueta);
    campo.dispatchEvent(new Event("input", { bubbles: true }));
  });
  act(() => {
    [...cont.querySelectorAll("button")].find((b) => b.textContent === boton)!.click();
  });
  return cont.querySelector("#avisos")!.textContent;
}

describe("el aviso de las etiquetas en lote no promete lo que la demo no hace (no se guardan)", () => {
  it.each(["Añadir", "Quitar"])("en español, «%s» dice que la demo no guarda etiquetas", (boton) => {
    expect(aplicaEtiqueta("/demo", boton, "urgente")).toBe("Etiqueta «urgente»: en la demo las etiquetas no se guardan");
  });

  it.each(["Add", "Remove"])("en inglés, «%s» dice que la demo no guarda etiquetas", (boton) => {
    expect(aplicaEtiqueta("/en/demo", boton, "urgent")).toBe("Tag “urgent”: the demo doesn’t save tags");
  });
});
