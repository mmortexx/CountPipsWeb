// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";

vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push() {}, replace() {} }) }));

import { LanguageProvider } from "@/lib/i18n";
import { EquityProjector } from "@/components/marketing/EquityProjector";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* El gráfico se dibuja al ancho de su caja, que vigila un ResizeObserver. La
   caja se desmonta en la vista «Por años»: al volver a «Curva» hay que vigilar
   la caja nueva, o el gráfico se queda con el ancho de antes. */

let cont: HTMLElement;
let raiz: Root;
const vigilados = new Set<Element>();

beforeEach(() => {
  vigilados.clear();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      private propios: Element[] = [];
      observe(el: Element) { vigilados.add(el); this.propios.push(el); }
      disconnect() { for (const el of this.propios) vigilados.delete(el); }
      unobserve() {}
    },
  );
  cont = document.createElement("div");
  document.body.appendChild(cont);
  raiz = createRoot(cont);
  act(() => raiz.render(createElement(LanguageProvider, null, createElement(EquityProjector))));
});

afterEach(() => {
  act(() => raiz.unmount());
  cont.remove();
  vi.unstubAllGlobals();
});

const boton = (texto: string) =>
  [...cont.querySelectorAll<HTMLButtonElement>("button")].find((b) => b.textContent?.trim() === texto)!;

describe("proyector: el gráfico sigue el ancho de su caja", () => {
  it("tras pasar por «Por años» y volver a «Curva», vigila la caja que está en la página", () => {
    expect([...vigilados].some((el) => el.isConnected)).toBe(true);
    act(() => boton("Por años").click());
    act(() => boton("Curva").click());
    const vivos = [...vigilados].filter((el) => el.isConnected);
    expect(vivos).toHaveLength(1);
  });
});

describe("proyector: el gráfico y la tabla se dejan leer con tacto y con lector de pantalla", () => {
  const grafico = () => cont.querySelector<SVGElement>("svg[aria-label='Gráfico interactivo de proyección']")!;

  it("el gráfico es una imagen con nombre", () => {
    expect(grafico().getAttribute("role")).toBe("img");
  });

  it("el dedo pasa en vertical por encima del gráfico: la página sigue pudiendo desplazarse", () => {
    const caja = grafico().parentElement!;
    expect(caja.classList.contains("touch-pan-y")).toBe(true);
    expect(caja.classList.contains("touch-none")).toBe(false);
  });

  it("cada cabecera de la tabla por años lo es de su columna", () => {
    act(() => boton("Por años").click());
    const cabeceras = [...cont.querySelectorAll("table th")];
    expect(cabeceras.length).toBe(5);
    expect(cabeceras.map((th) => th.getAttribute("scope"))).toEqual(Array(5).fill("col"));
  });
});
