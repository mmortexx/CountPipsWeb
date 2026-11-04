// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";

let ruta = "/demo";
vi.mock("next/navigation", () => ({ usePathname: () => ruta, useRouter: () => ({ push() {}, replace() {} }) }));

import { LanguageProvider } from "@/lib/i18n";
import { TRADES, type Metrics, type Trade } from "@/lib/trading/data";
import { EquityCurve } from "@/components/charts/EquityCurve";
import { Heatmap } from "@/components/charts/Heatmap";
import { Histogram } from "@/components/charts/Histogram";
import { TradeCandleChart } from "@/components/charts/TradeCandleChart";

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
  ruta = "/demo";
});

function monta(url: string, grafico: ReactElement) {
  ruta = url;
  act(() => raiz.render(createElement(LanguageProvider, null, grafico)));
}

/** Lo que oye un lector de pantalla: el espacio duro de las cifras, como uno normal. */
const plano = (s: string | null) => (s ?? "").replaceAll(String.fromCharCode(0xa0), " ");
const imagen = () => cont.querySelector<Element>('[role="img"]')!;

describe("EquityCurve: el rótulo dice de dónde a dónde va el balance, suba o baje", () => {
  const dia = (n: number) => new Date(Date.UTC(2026, 0, n));
  // Empieza en 10.000, sube a 10.500, cae a 9.000 y acaba en 9.500: ni el primero ni el último son el mínimo y el máximo.
  const curva = [10000, 10500, 9000, 9500].map((balance, i) => ({ date: dia(i + 1), balance, perf: balance - 10000 }));
  const metrics = { equityCurve: curva, drawdownCeiling: [10000, 10500, 10500, 10500] } as unknown as Metrics;

  it("en español", () => {
    monta("/demo", createElement(EquityCurve, { metrics }));
    expect(plano(imagen().getAttribute("aria-label"))).toBe(
      "Curva de capital: balance inicial 10.000 $, balance final 9.500 $, balance mínimo 9.000 $ y balance máximo 10.500 $"
    );
  });

  it("en inglés", () => {
    monta("/en/demo", createElement(EquityCurve, { metrics }));
    expect(plano(imagen().getAttribute("aria-label"))).toBe(
      "Equity curve: starting balance $10,000, final balance $9,500, lowest balance $9,000 and highest balance $10,500"
    );
  });
});

describe("Heatmap: el rótulo resume la mejor y la peor franja", () => {
  // 6 de julio de 2026 es lunes; el sábado queda fuera del mapa.
  const operacion = (d: number, h: number, minuto: number, netPnl: number): Trade => ({
    ...TRADES[0],
    closedAt: new Date(Date.UTC(2026, 6, d, h, minuto)),
    netPnl,
  });
  const trades = [
    operacion(6, 9, 30, 500), // lunes 08–12
    operacion(6, 9, 45, 100), // lunes 08–12: la celda suma 600
    operacion(8, 17, 0, -300), // miércoles 16–20
    operacion(10, 22, 0, 50), // viernes 20–24
    operacion(11, 10, 0, -9999), // sábado: no cuenta
  ];

  it("en español", () => {
    monta("/demo", createElement(Heatmap, { trades }));
    expect(plano(imagen().getAttribute("aria-label"))).toBe(
      "Mapa de calor de rentabilidad por día de la semana y franja horaria. Mejor franja: lunes 08–12, +600 $. Peor franja: miércoles 16–20, −300 $."
    );
  });

  it("en inglés", () => {
    monta("/en/demo", createElement(Heatmap, { trades }));
    expect(plano(imagen().getAttribute("aria-label"))).toBe(
      "Heatmap of profitability by weekday and time band. Best band: Monday 08–12, +$600. Worst band: Wednesday 16–20, −$300."
    );
  });

  it("con una sola franja operada no inventa una peor", () => {
    monta("/demo", createElement(Heatmap, { trades: [operacion(6, 9, 30, 500)] }));
    expect(plano(imagen().getAttribute("aria-label"))).toBe(
      "Mapa de calor de rentabilidad por día de la semana y franja horaria. Solo hay operaciones en lunes 08–12, +500 $."
    );
  });

  it("sin operaciones lo dice", () => {
    monta("/en/demo", createElement(Heatmap, { trades: [] }));
    expect(plano(imagen().getAttribute("aria-label"))).toBe(
      "Heatmap of profitability by weekday and time band. No trades."
    );
  });
});

describe("Histogram: el rótulo da la moda y el total", () => {
  const data = [
    { x: -1, count: 2 },
    { x: 0, count: 7 },
    { x: 1, count: 3 },
  ];
  const formatX = (x: number | string) => `${x}R`;

  it("en español", () => {
    monta("/demo", createElement(Histogram, { data, formatX }));
    expect(plano(imagen().getAttribute("aria-label"))).toBe(
      "Histograma de 3 categorías. Moda: 0R, con 7 operaciones. Total: 12 operaciones."
    );
  });

  it("en inglés, y con un empate gana la primera columna", () => {
    monta("/en/demo", createElement(Histogram, { data: [{ x: "a", count: 4 }, { x: "b", count: 4 }, { x: "c", count: 1 }] }));
    expect(plano(imagen().getAttribute("aria-label"))).toBe("Histogram of 3 categories. Mode: a, with 4 trades. Total: 9 trades.");
  });

  it("una operación se dice en singular", () => {
    monta("/demo", createElement(Histogram, { data: [{ x: "a", count: 1 }, { x: "b", count: 0 }] }));
    expect(plano(imagen().getAttribute("aria-label"))).toBe("Histograma de 2 categorías. Moda: a, con 1 operación. Total: 1 operación.");
  });

  it("sin datos o con todo a cero no inventa una moda", () => {
    monta("/demo", createElement(Histogram, { data: [] }));
    expect(plano(imagen().getAttribute("aria-label"))).toBe("Histograma sin operaciones");
    monta("/en/demo", createElement(Histogram, { data: [{ x: "a", count: 0 }] }));
    expect(plano(imagen().getAttribute("aria-label"))).toBe("Histogram with no trades");
  });
});

describe("TradeCandleChart: el lienzo es una imagen con nombre", () => {
  const trade: Trade = { ...TRADES[0], id: 7, instrument: "EURUSD", direction: "short", entry: 1.085, exit: 1.081, netPnl: 400, rMultiple: 2 };

  it("en español: instrumento, dirección, entrada, salida y resultado", () => {
    monta("/demo", createElement(TradeCandleChart, { trade, decimals: 4 }));
    const svg = cont.querySelector("svg.select-none")!;
    expect(svg.getAttribute("role")).toBe("img");
    expect(plano(svg.getAttribute("aria-label"))).toBe(
      "Gráfico de velas de EURUSD, Short: entrada 1,0850, salida 1,0810, resultado +400 $ (+2,00 R)"
    );
  });

  it("en inglés", () => {
    monta("/en/demo", createElement(TradeCandleChart, { trade, decimals: 4 }));
    expect(plano(cont.querySelector("svg.select-none")!.getAttribute("aria-label"))).toBe(
      "Candlestick chart of EURUSD, Short: entry 1.0850, exit 1.0810, result +$400 (+2.00 R)"
    );
  });
});
