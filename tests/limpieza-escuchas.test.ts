// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";

// Como el de Next, el enrutador es el mismo objeto en cada render.
const nav = vi.hoisted(() => {
  const push = vi.fn();
  return { ruta: "/", push, router: { push, replace() {} } };
});
vi.mock("next/navigation", () => ({ usePathname: () => nav.ruta, useRouter: () => nav.router }));

import { LanguageProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import { GlobalShortcuts } from "@/components/tj/GlobalShortcuts";
import { BackToTop } from "@/components/tj/BackToTop";
import { irA } from "@/lib/scroll";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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
  vi.restoreAllMocks();
});

const espera = (ms: number) => act(() => new Promise<void>((r) => setTimeout(r, ms)));

function pulsa(key: string) {
  act(() => {
    document.body.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  });
}

/* El efecto de los atajos se rehace al cambiar de idioma (depende de `lang`).
   Si eso pasa con la «g» pulsada, el plazo de 1 s se cancelaba sin desarmar
   el prefijo: la pista se quedaba en pantalla y la siguiente letra, aunque
   llegase minutos después, navegaba. */
describe("atajo «g» al cambiar de idioma a mitad", () => {
  const montar = () =>
    act(() => raiz.render(createElement(LanguageProvider, null, createElement(ThemeProvider, null, createElement(GlobalShortcuts)))));

  it("el prefijo se desarma y la pista se va", async () => {
    nav.ruta = "/";
    nav.push.mockClear();
    montar();
    pulsa("g");
    await espera(50);
    const pista = () => cont.querySelector<HTMLElement>("[data-visible]");
    expect(pista()?.dataset.visible).toBe("true");

    nav.ruta = "/en/";
    montar();
    await espera(1200);

    expect(pista()?.dataset.visible).toBe("false");
    pulsa("p");
    expect(nav.push).not.toHaveBeenCalled();
  });
});

/** Fotogramas a mano: `cola` guarda los pedidos que nadie ha cancelado. */
function fotogramasManuales() {
  const cola = new Map<number, FrameRequestCallback>();
  let siguiente = 1;
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    cola.set(siguiente, cb);
    return siguiente++;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
    cola.delete(id);
  });
  const avanza = (ahora: number) => {
    const pendientes = [...cola.entries()];
    cola.clear();
    for (const [, cb] of pendientes) cb(ahora);
  };
  return { cola, avanza };
}

describe("BackToTop al desmontarse", () => {
  it("no deja un fotograma pendiente que mida la página sin el botón", () => {
    const { cola } = fotogramasManuales();
    act(() => raiz.render(createElement(LanguageProvider, null, createElement(BackToTop))));
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    expect(cola.size).toBe(1);
    act(() => raiz.unmount());
    raiz = createRoot(cont);
    expect(cola.size).toBe(0);
  });
});

/* `irA` escucha rueda, toque y teclado para soltar la animación al primer
   gesto. Una animación interrumpida por otra (dos clics seguidos) dejaba
   colgadas las escuchas de la primera. */
describe("irA con dos desplazamientos seguidos", () => {
  it("no deja escuchas de rueda, toque ni teclado al acabar", () => {
    const { avanza } = fotogramasManuales();
    Object.defineProperty(document.documentElement, "scrollHeight", { value: 10000, configurable: true });
    vi.spyOn(window, "matchMedia").mockImplementation((q) => ({ matches: false, media: q }) as MediaQueryList);
    let reloj = 0;
    vi.spyOn(performance, "now").mockImplementation(() => reloj);

    const vivas = new Set<string>();
    const clave = (tipo: string, fn: unknown) => `${tipo}:${(fn as { __id?: number }).__id}`;
    let n = 0;
    const GESTOS = ["wheel", "touchstart", "keydown"];
    const add = window.addEventListener.bind(window);
    const remove = window.removeEventListener.bind(window);
    vi.spyOn(window, "addEventListener").mockImplementation((tipo: string, fn: EventListenerOrEventListenerObject, o?: boolean | AddEventListenerOptions) => {
      if (GESTOS.includes(tipo)) {
        (fn as { __id?: number }).__id ??= ++n;
        vivas.add(clave(tipo, fn));
      }
      add(tipo, fn, o);
    });
    vi.spyOn(window, "removeEventListener").mockImplementation((tipo: string, fn: EventListenerOrEventListenerObject, o?: boolean | EventListenerOptions) => {
      if (GESTOS.includes(tipo)) vivas.delete(clave(tipo, fn));
      remove(tipo, fn, o);
    });

    window.scrollTo(0, 0);
    irA(1000);
    reloj = 50;
    avanza(reloj);
    expect(vivas.size).toBe(3);

    irA(0);
    for (reloj = 100; reloj <= 600; reloj += 50) avanza(reloj);

    expect(window.scrollY).toBe(0);
    expect([...vivas]).toEqual([]);
  });
});
