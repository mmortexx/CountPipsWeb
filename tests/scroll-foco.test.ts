// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StrictMode, act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";

const estado = vi.hoisted(() => ({ ruta: "/a/" }));
vi.mock("next/navigation", () => ({ usePathname: () => estado.ruta }));

import { ScrollToTop } from "@/components/tj/ScrollToTop";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* Al cambiar de página dentro de la app el foco se quedaba en un enlace que ya
   no existe: quien navega con teclado o lector de pantalla volvía a empezar
   desde el principio del documento. Debe ir al contenido principal, sin mover
   el scroll (lo coloca `ScrollToTop`), y solo cuando hay una navegación. */

let cont: HTMLElement;
let raiz: Root;
let main: HTMLElement;
let foco: ReturnType<typeof vi.spyOn>;

const dibuja = (envuelto = false) =>
  act(() => raiz.render(envuelto ? createElement(StrictMode, null, createElement(ScrollToTop)) : createElement(ScrollToTop)));
const navega = (ruta: string, ancla = "") => {
  estado.ruta = ruta;
  window.history.replaceState(null, "", `${ruta}${ancla}`);
  dibuja();
};

beforeEach(() => {
  estado.ruta = "/a/";
  window.history.replaceState(null, "", "/a/");
  vi.stubGlobal("scrollTo", vi.fn());
  main = document.createElement("main");
  main.id = "main-content";
  main.tabIndex = -1;
  document.body.appendChild(main);
  foco = vi.spyOn(main, "focus");
  cont = document.createElement("div");
  document.body.appendChild(cont);
  raiz = createRoot(cont);
});

afterEach(() => {
  act(() => raiz.unmount());
  cont.remove();
  main.remove();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

describe("ScrollToTop y el foco al cambiar de página", () => {
  it("en la primera carga no toca el foco", () => {
    dibuja();
    expect(foco).not.toHaveBeenCalled();
    expect(document.activeElement).not.toBe(main);
  });

  it("en la primera carga tampoco con StrictMode, que ejecuta el efecto dos veces", () => {
    dibuja(true);
    expect(foco).not.toHaveBeenCalled();
  });

  it("al navegar a otra ruta sin ancla, el foco va al contenido principal sin mover el scroll", () => {
    dibuja();
    navega("/b/");
    expect(foco).toHaveBeenCalledTimes(1);
    expect(foco).toHaveBeenCalledWith({ preventScroll: true });
    expect(document.activeElement).toBe(main);
  });

  it("al navegar a una ruta con ancla, el foco no se toca", () => {
    dibuja();
    navega("/b/", "#seccion");
    expect(foco).not.toHaveBeenCalled();
  });

  it("volver a dibujar sin cambiar de ruta no vuelve a mover el foco", () => {
    dibuja();
    navega("/b/");
    foco.mockClear();
    dibuja();
    expect(foco).not.toHaveBeenCalled();
  });

  it("sin contenido principal en la página no falla", () => {
    main.remove();
    dibuja();
    expect(() => navega("/b/")).not.toThrow();
  });
});
