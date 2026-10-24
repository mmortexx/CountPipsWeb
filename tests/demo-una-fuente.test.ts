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
import { DashboardPage } from "@/components/demo/pages/DashboardPage";
import { AnalyticsPage } from "@/components/demo/pages/AnalyticsPage";
import { TradesPage } from "@/components/demo/pages/TradesPage";
import { TRADES } from "@/lib/trading/data";
import { addTrade, resetToSample } from "@/lib/trading/demoStore";
import { fmtMoney } from "@/lib/trading/format";

// `localStorage` en memoria: la operación se registra por la puerta de verdad (`addTrade`).
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

const NETO_PROPIA = 5000;
beforeAll(() => {
  vi.stubGlobal("window", ventana);
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  resetToSample();
  addTrade({
    instrument: "ES", setup: "Breakout", direction: "long", entry: 5800, exit: 5900, qty: 1, netPnl: NETO_PROPIA,
    rMultiple: 2, compliance: "yes", closedAt: "2026-10-24T10:00:00.000Z", note: "",
  });
});
afterAll(() => {
  resetToSample();
  vi.unstubAllGlobals();
});

const pagina = (p: () => ReturnType<typeof createElement>) =>
  renderToString(createElement(LanguageProvider, null, createElement(DemoProvider, null, p())));

const sinEspacios = (s: string) => s.replace(/\s/g, "");

// El esperado sale de sumar a mano, no de las métricas de la demo.
const total = TRADES.reduce((s, t) => s + t.netPnl, 0) + NETO_PROPIA;
const cuantas = TRADES.length + 1;

describe("Resumen, Analítica y Operaciones dan la misma cuenta, con lo que registra el visitante", () => {
  it("Resumen: el P&L total incluye la operación registrada", () => {
    const html = pagina(() => createElement(DashboardPage));
    const cifra = /P&amp;L total<\/div>.*?>([^<>]+)<\/span><\/div>/.exec(html)?.[1] ?? "";
    expect(sinEspacios(cifra)).toBe(sinEspacios(fmtMoney(total, "es", { sign: true })));
  });

  it("Analítica: las operaciones y el resultado neto incluyen la registrada", () => {
    const html = pagina(() => createElement(AnalyticsPage));
    expect(/Operaciones<\/div>.*?class="sr-only">(\d+)</.exec(html)?.[1]).toBe(String(cuantas));
    expect(sinEspacios(html)).toContain(sinEspacios(fmtMoney(total, "es", { sign: true, decimals: 0 })));
  });

  it("Operaciones: la lista cuenta la registrada", () => {
    expect(pagina(() => createElement(TradesPage))).toContain(`${cuantas} operaciones`);
  });
});
