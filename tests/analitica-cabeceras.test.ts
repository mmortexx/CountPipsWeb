import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push() {}, replace() {} }) }));
// En el servidor `useSyncExternalStore` lee el snapshot vacío; aquí se lee el del cliente, el que ve el visitante tras hidratar.
vi.mock("react", async (original) => {
  const react = await original<typeof import("react")>();
  const delCliente = <T,>(_suscribe: unknown, snapshot: () => T): T => snapshot();
  return { ...react, useSyncExternalStore: delCliente, default: { ...react, useSyncExternalStore: delCliente } };
});

import { LanguageProvider } from "@/lib/i18n";
import { DemoProvider } from "@/components/demo/DemoContext";
import { AnalyticsPage } from "@/components/demo/pages/AnalyticsPage";
import { resetToSample } from "@/lib/trading/demoStore";

const datos = new Map<string, string>();
const ventana = {
  localStorage: {
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
    removeItem: (k: string) => void datos.delete(k),
  },
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};

beforeAll(() => {
  vi.stubGlobal("window", ventana);
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  resetToSample();
});
afterAll(() => {
  resetToSample();
  vi.unstubAllGlobals();
});

describe("Analítica: las tablas dicen de qué columna es cada cabecera", () => {
  it("todas las cabeceras llevan scope=\"col\"", () => {
    const html = renderToString(createElement(LanguageProvider, null, createElement(DemoProvider, null, createElement(AnalyticsPage))));
    const cabeceras = html.match(/<th\b[^>]*>/g) ?? [];
    expect(cabeceras.length).toBeGreaterThanOrEqual(6);
    expect(cabeceras.filter((th) => !/\sscope="col"/.test(th))).toEqual([]);
  });
});
