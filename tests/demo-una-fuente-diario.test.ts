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
// El detalle lee de aquí qué operación abrir; se fija sin pasar por la lista.
let abierta: number | null = null;
vi.mock("@/components/demo/DemoContext", () => ({
  useDemo: () => ({ selectedTradeId: abierta, goBack() {}, goDetail() {} }),
}));

import { LanguageProvider } from "@/lib/i18n";
import { JournalPage } from "@/components/demo/pages/JournalPage";
import { TradeDetailPage } from "@/components/demo/pages/TradeDetailPage";
import { StatusBar } from "@/components/demo/StatusBar";
import { TRADES } from "@/lib/trading/data";
import { addTrade, resetToSample } from "@/lib/trading/demoStore";
import { fmtPct } from "@/lib/trading/format";

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

/** Operaciones que registra el visitante: todas rompen el plan, para que la disciplina se mueva de verdad. */
const PROPIAS = 40;
let idAntigua = 0;
beforeAll(() => {
  vi.stubGlobal("window", ventana);
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  resetToSample();
  // `addTrade` pone de id la hora: una por milisegundo, para que no se repitan.
  let ms = Date.now();
  vi.spyOn(Date, "now").mockImplementation(() => ms++);
  for (let i = 0; i < PROPIAS; i++) {
    addTrade({
      instrument: "ES", setup: "Breakout", direction: "long", entry: 5800, exit: 5790, qty: 1, netPnl: -100,
      rMultiple: -1, compliance: "no", closedAt: "2026-10-24T10:00:00.000Z", note: "",
    });
  }
  // Más antigua que toda la muestra: en una lista ordenada por fecha va la última.
  idAntigua = addTrade({
    instrument: "ES", setup: "Breakout", direction: "long", entry: 5800, exit: 5790, qty: 1, netPnl: -100,
    rMultiple: -1, compliance: "no", closedAt: "2000-01-03T10:00:00.000Z", note: "",
  }).id;
});
afterAll(() => {
  resetToSample();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const pagina = (p: () => ReturnType<typeof createElement>) => renderToString(createElement(LanguageProvider, null, p()));
const sinEspacios = (s: string) => s.replace(/\s/g, "");

// Los esperados salen de contar a mano la muestra y lo registrado, no de las métricas de la demo.
const cuantas = TRADES.length + PROPIAS + 1;
const nivel = (k: "yes" | "partial" | "no") => TRADES.filter((t) => t.compliance === k).length + (k === "no" ? PROPIAS + 1 : 0);

describe("Diario, barra de estado y detalle cuentan lo que registra el visitante, como Resumen y Operaciones", () => {
  it("la muestra por sí sola no coincide con la cuenta (si no, la prueba no distingue)", () => {
    expect(Math.round((100 * nivel("yes")) / cuantas)).not.toBe(Math.round((100 * TRADES.filter((t) => t.compliance === "yes").length) / TRADES.length));
  });

  it("barra de estado: la disciplina es la de la muestra más lo registrado", () => {
    const html = pagina(() => createElement(StatusBar));
    expect(sinEspacios(html.replace(/<[^>]*>/g, ""))).toContain(sinEspacios(`Disciplina: ${fmtPct(nivel("yes") / cuantas, "es", 0)}`));
  });

  it("Diario: el reparto de cumplimiento y el tamaño de la muestra incluyen lo registrado", () => {
    const html = pagina(() => createElement(JournalPage));
    const cuenta = (etiqueta: string) => Number(new RegExp(`${etiqueta}</span></th><td[^>]*>(\\d+)</td>`).exec(html)?.[1]);
    expect(cuenta("Cumplí el plan")).toBe(nivel("yes"));
    expect(cuenta("Lo cumplí a medias")).toBe(nivel("partial"));
    expect(cuenta("Me salté el plan")).toBe(nivel("no"));
    expect(html).toContain(`${cuantas} operaciones`);
  });

  it("detalle: anterior y siguiente recorren la lista en el orden de Operaciones, por fecha", () => {
    abierta = idAntigua;
    const html = pagina(() => createElement(TradeDetailPage));
    const boton = (etiqueta: string) => new RegExp(`<button[^>]*aria-label="${etiqueta}"[^>]*>`).exec(html)?.[0] ?? "";
    expect(boton("Operación anterior")).not.toContain('disabled=""');
    expect(boton("Operación siguiente")).toContain('disabled=""');
  });
});
