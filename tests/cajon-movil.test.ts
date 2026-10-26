// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";

const empujes: string[] = [];
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: (r: string) => empujes.push(r), replace() {}, prefetch() {} }),
}));

import { LanguageProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import { Navbar } from "@/components/marketing/Navbar";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* El cajón del menú móvil bloquea el scroll de la página y atrapa el foco.
   Cualquier salida que lo deje abierto sin verse deja la web sin scroll. */

let cont: HTMLElement;
let raiz: Root;
let escritorio = false;
const oyentes = new Set<(e: { matches: boolean }) => void>();

const fotogramas = () => act(async () => { await new Promise((r) => setTimeout(r, 60)); });
const botonMenu = () => cont.querySelector<HTMLButtonElement>("button[aria-haspopup='dialog']")!;
const cajon = () => cont.querySelector<HTMLElement>("#mobile-nav-drawer");
const abierto = () => document.body.dataset.drawerOpen === "true";

async function abrir() {
  act(() => botonMenu().click());
  await fotogramas();
  expect(abierto()).toBe(true);
}

beforeEach(() => {
  escritorio = false;
  oyentes.clear();
  empujes.length = 0;
  vi.stubGlobal("matchMedia", (consulta: string) => ({
    get matches() { return consulta.includes("1120") ? escritorio : false; },
    media: consulta,
    addEventListener: (_: string, f: (e: { matches: boolean }) => void) => { if (consulta.includes("1120")) oyentes.add(f); },
    removeEventListener: (_: string, f: (e: { matches: boolean }) => void) => oyentes.delete(f),
  }));
  cont = document.createElement("div");
  document.body.appendChild(cont);
  raiz = createRoot(cont);
  act(() => raiz.render(createElement(ThemeProvider, null, createElement(LanguageProvider, null, createElement(Navbar)))));
});

afterEach(() => {
  act(() => raiz.unmount());
  cont.remove();
  vi.unstubAllGlobals();
});

describe("el cajón del menú móvil", () => {
  it("no apunta con aria-controls a un cajón que aún no existe", () => {
    expect(cajon()).toBeNull();
    expect(botonMenu().getAttribute("aria-controls")).toBeNull();
  });

  it("se cierra y devuelve el scroll si la ventana pasa a escritorio con él abierto", async () => {
    await abrir();
    expect(botonMenu().getAttribute("aria-controls")).toBe("mobile-nav-drawer");
    act(() => {
      escritorio = true;
      for (const f of oyentes) f({ matches: true });
    });
    expect(abierto()).toBe(false);
    expect(document.body.style.position).toBe("");
  });

  it("Escape con el selector de idioma abierto cierra solo el selector", async () => {
    await abrir();
    const idioma = cajon()!.querySelector<HTMLButtonElement>("button[aria-expanded]")!;
    act(() => idioma.click());
    expect(cajon()!.querySelector("[data-panel-idiomas]")).not.toBeNull();
    act(() => { window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })); });
    expect(cajon()!.querySelector("[data-panel-idiomas]")).toBeNull();
    expect(abierto()).toBe(true);
    act(() => { window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })); });
    expect(abierto()).toBe(false);
  });

  it("elegir idioma dentro del cajón lo cierra antes de navegar", async () => {
    await abrir();
    act(() => cajon()!.querySelector<HTMLButtonElement>("button[aria-expanded]")!.click());
    const ingles = cajon()!.querySelector<HTMLAnchorElement>("[data-panel-idiomas] a[lang='en']")!;
    act(() => { ingles.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 })); });
    expect(empujes).toEqual(["/en"]);
    expect(abierto()).toBe(false);
  });
});
