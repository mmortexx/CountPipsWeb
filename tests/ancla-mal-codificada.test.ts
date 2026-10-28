// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";

vi.mock("next/navigation", () => ({ usePathname: () => "/faq/" }));

import { ScrollToTop } from "@/components/tj/ScrollToTop";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * `ScrollToTop` vive en el layout raíz y lee el ancla de la dirección. Con un
 * ancla mal codificada (`/faq/#%`) `decodeURIComponent` lanzaba y se llevaba la
 * página entera: cualquiera podía compartir un enlace que la enseña rota.
 */
describe("un ancla mal codificada no tumba la página", () => {
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
    window.history.replaceState(null, "", "/");
  });

  it.each(["#%", "#%E0%A4%A", "#100%"])("%s", (ancla) => {
    window.history.replaceState(null, "", `/faq/${ancla}`);
    const errores: unknown[] = [];
    const alLanzar = (e: ErrorEvent) => errores.push(e.error);
    window.addEventListener("error", alLanzar);
    try {
      act(() => raiz.render(createElement(ScrollToTop)));
    } catch (e) {
      errores.push(e);
    }
    window.removeEventListener("error", alLanzar);
    expect(errores).toEqual([]);
  });

  it("y un ancla bien codificada sigue llevando a su sección", () => {
    const seccion = document.createElement("section");
    seccion.id = "año";
    document.body.appendChild(seccion);
    window.history.replaceState(null, "", "/faq/#a%C3%B1o");
    const getById = vi.spyOn(document, "getElementById");
    act(() => raiz.render(createElement(ScrollToTop)));
    return new Promise<void>((ok) =>
      requestAnimationFrame(() => {
        expect(getById).toHaveBeenCalledWith("año");
        seccion.remove();
        ok();
      }),
    );
  });
});
