// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";

/* La demo viajaba en un solo trozo con sus cinco páginas (55 KB comprimidos),
   y en un móvil el Resumen esperaba a que llegaran y se compilaran las otras
   cuatro. Ahora el Resumen va con la demo y el resto se trae aparte
   (`cargaPaginas.ts`). Se sabe qué página se ha cargado porque su módulo se
   evalúa: cada `vi.mock` lo anota y devuelve el módulo real. En un caso
   Operaciones espera a una puerta que cierra y abre la prueba, para que llegue
   después que otra pedida más tarde.
   Una página que llega se queda cargada para el resto del fichero: los casos van
   en orden y cada uno usa páginas que aún no han llegado. */
const estado = vi.hoisted(() => ({
  evaluadas: new Set<string>(),
  puerta: Promise.resolve(),
  abre: () => {},
  cierra() {
    this.puerta = new Promise<void>((r) => (this.abre = r));
  },
}));
vi.mock("@/components/demo/pages/TradesPage", async (real) => {
  estado.evaluadas.add("trades");
  await estado.puerta;
  return real();
});
vi.mock("@/components/demo/pages/TradeDetailPage", async (real) => (estado.evaluadas.add("detail"), real()));
vi.mock("@/components/demo/pages/AnalyticsPage", async (real) => (estado.evaluadas.add("analytics"), real()));
vi.mock("@/components/demo/pages/JournalPage", async (real) => (estado.evaluadas.add("journal"), real()));
vi.mock("next/navigation", () => ({ usePathname: () => "/demo", useRouter: () => ({ push() {}, replace() {} }) }));

import { LanguageProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import { AppDemo } from "@/components/demo/AppDemo";
import { cargaPagina } from "@/components/demo/cargaPaginas";
import { resetToSample } from "@/lib/trading/demoStore";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let cont: HTMLElement;
let raiz: Root;
let enReposo: (() => void)[] = [];

const panel = () => cont.querySelector<HTMLElement>("#demo-tabpanel")!;
const pestana = () => cont.querySelector("[role='tab'][aria-selected='true']")?.textContent ?? "";
function pulsa(key: string) {
  act(() => {
    panel().focus();
    panel().dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  });
}
/** Deja correr las importaciones pendientes (el módulo real tarda) hasta que se cumpla `listo`, con tope de 2 s. */
async function hasta(listo: () => boolean) {
  for (let i = 0; i < 200 && !listo(); i++) await act(() => new Promise((r) => setTimeout(r, 10)));
}
async function llega(rotulo: string) {
  await hasta(() => pestana().includes(rotulo));
  expect(pestana()).toContain(rotulo);
}

beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  // El reposo lo dispara la prueba: así se ve qué se carga antes y qué después.
  enReposo = [];
  vi.stubGlobal("requestIdleCallback", (fn: () => void) => (enReposo.push(fn), enReposo.length));
  vi.stubGlobal("cancelIdleCallback", () => {});
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

describe("la demo trae aparte las páginas que no enseña al abrir", () => {
  it("al montarla solo está el Resumen", () => {
    expect(pestana()).toContain("Resumen");
    expect(panel().textContent).not.toBe("");
    expect([...estado.evaluadas]).toEqual([]);
  });

  it("dos cambios seguidos acaban en el último, aunque el primero llegue después", async () => {
    estado.cierra();
    pulsa("2");
    pulsa("3");
    await llega("Analítica");
    expect(estado.evaluadas.has("trades")).toBe(true);
    estado.abre();
    await act(() => cargaPagina("trades"));
    expect(pestana()).toContain("Analítica");
    pulsa("1");
    expect(pestana()).toContain("Resumen");
  });

  it("pedir una página que aún no ha llegado deja la actual entera a la vista y luego la cambia", async () => {
    expect(estado.evaluadas.has("journal")).toBe(false);
    const resumen = panel().textContent;
    pulsa("4");
    // Nunca un panel vacío mientras llega: la página de antes sigue entera.
    expect(panel().textContent).toBe(resumen);
    expect(pestana()).toContain("Resumen");
    await llega("Diario");
  });

  it("en reposo llegan las que faltaban", async () => {
    expect(estado.evaluadas.has("detail")).toBe(false);
    expect(enReposo.length).toBeGreaterThan(0);
    act(() => enReposo.forEach((fn) => fn()));
    await hasta(() => estado.evaluadas.size === 4);
    expect([...estado.evaluadas].sort()).toEqual(["analytics", "detail", "journal", "trades"]);
  });
});
