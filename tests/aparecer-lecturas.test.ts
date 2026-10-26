// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

import { Aparecer } from "@/components/tj/Aparecer";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * `Aparecer` recorre la página al cargar: mide cada bloque y le pone sus
 * atributos `data-tj-*`, que la hoja usa en sus selectores. Si mide después de
 * haber escrito, el navegador tiene que recalcular estilos y maqueta antes de
 * contestar, una vez por pieza: en un móvil lento eran más de 100 ms de la
 * carga. Todas las medidas van primero y todas las escrituras después.
 */

const ATRIBUTOS = "[data-tj-ap], [data-tj-nivel], [data-tj-tipo], [data-tj-paso], [data-tj-dib]";

describe("Aparecer mide todo antes de escribir nada", () => {
  let cont: HTMLElement;
  let raiz: Root;
  let lecturas = 0;
  let lecturasTrasEscribir = 0;
  let midiendo = false;
  const restaurar: Array<() => void> = [];

  const anota = () => {
    if (!midiendo) return;
    lecturas++;
    if (document.querySelector(ATRIBUTOS)) lecturasTrasEscribir++;
  };

  beforeEach(() => {
    lecturas = 0;
    lecturasTrasEscribir = 0;
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("min-width"), addEventListener() {}, removeEventListener() {} }));
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    // happy-dom no calcula estilos: lo que `Aparecer` consulta, con los valores de un navegador.
    vi.stubGlobal("getComputedStyle", () => {
      anota();
      return { display: "block", position: "static", overflowX: "visible", overflowY: "visible" };
    });
    const alto = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      get() {
        anota();
        return 40;
      },
    });
    restaurar.push(() => alto && Object.defineProperty(HTMLElement.prototype, "offsetHeight", alto));
    const rect = Element.prototype.getBoundingClientRect;
    // Todo bajo el pliegue, para que cada pieza quede marcada a la espera.
    Element.prototype.getBoundingClientRect = function () {
      anota();
      return { top: 3000, bottom: 3040, left: 0, right: 100, width: 100, height: 40, x: 0, y: 3000, toJSON() {} } as DOMRect;
    };
    restaurar.push(() => (Element.prototype.getBoundingClientRect = rect));

    document.body.innerHTML = `
      <main id="main-content">
        <section><div class="tj-container">
          <h2>Uno</h2>
          <ul><li>a</li><li>b</li><li>c</li><li>d</li></ul>
          <div class="grid"><div>1</div><div>2</div><div>3</div><figure class="tj-lamina-marco">4</figure></div>
          <svg data-dibuja></svg>
        </div></section>
        <section><div class="tj-container"><p>Dos</p><ol><li>x</li><li>y</li><li>z</li></ol></div></section>
      </main>`;
    cont = document.createElement("div");
    document.body.appendChild(cont);
    raiz = createRoot(cont);
  });

  afterEach(() => {
    act(() => raiz.unmount());
    restaurar.splice(0).forEach((f) => f());
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("ninguna medida llega después de la primera escritura", () => {
    midiendo = true;
    act(() => raiz.render(createElement(Aparecer)));
    midiendo = false;
    const marcados = document.querySelectorAll('[data-tj-ap="0"]').length;
    expect(marcados, "bloques y piezas a la espera de asomar").toBeGreaterThanOrEqual(10);
    expect(lecturas).toBeGreaterThan(marcados);
    expect(lecturasTrasEscribir).toBe(0);
  });

  it("marca las piezas igual que antes: bloque, piezas de lista y lámina", () => {
    act(() => raiz.render(createElement(Aparecer)));
    const ul = document.querySelector("ul")!;
    expect(ul.dataset.tjAp).toBe("0");
    expect(ul.dataset.tjNivel).toBe("1");
    expect([...ul.children].map((li) => (li as HTMLElement).dataset.tjNivel)).toEqual(["2", "2", "2", "2"]);
    expect((document.querySelector("figure") as HTMLElement).dataset.tjTipo).toBe("lamina");
    expect((document.querySelector("[data-dibuja]") as HTMLElement).dataset.tjDib).toBe("0");
    expect((document.querySelector("svg") as unknown as HTMLElement).dataset.tjAp).toBeUndefined();
  });
});
