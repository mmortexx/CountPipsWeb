// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";

let ruta = "/demo";
vi.mock("next/navigation", () => ({ usePathname: () => ruta, useRouter: () => ({ push() {}, replace() {} }) }));

const goDetail = vi.fn();
const FILTROS = { instrument: "all", setup: "all", direction: "all", compliance: "all" };
vi.mock("@/components/demo/DemoContext", () => ({
  useDemo: () => ({ filters: FILTROS, setFilters() {}, clearFilters() {}, goDetail }),
}));

import { LanguageProvider } from "@/lib/i18n";
import { TradesPage } from "@/components/demo/pages/TradesPage";
import { addTrade, resetToSample } from "@/lib/trading/demoStore";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let cont: HTMLElement;
let raiz: Root;

function monta(url: string) {
  ruta = url;
  act(() => {
    raiz.render(createElement(LanguageProvider, null, createElement(TradesPage)));
  });
}

beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
  resetToSample();
  goDetail.mockClear();
  cont = document.createElement("div");
  document.body.appendChild(cont);
  raiz = createRoot(cont);
});

afterEach(() => {
  act(() => raiz.unmount());
  cont.remove();
  resetToSample();
  vi.unstubAllGlobals();
  ruta = "/demo";
});

const filas = () => [...cont.querySelectorAll<HTMLTableRowElement>("tbody tr[data-operacion]")];

describe("Operaciones: abrir el detalle sin ratón", () => {
  it.each(["/demo", "/en/demo"])("en %s, cada fila trae un botón con su instrumento que abre su detalle una sola vez", (url) => {
    monta(url);
    const fila = filas()[0];
    const boton = fila.querySelector<HTMLButtonElement>("td:nth-child(2) button");
    expect(boton, "la fila no tiene un botón que abra el detalle").not.toBeNull();
    expect(boton!.type).toBe("button");
    expect(boton!.textContent).toBe(fila.querySelectorAll("td")[1].textContent!.trim());
    act(() => boton!.click());
    expect(goDetail).toHaveBeenCalledTimes(1);
    expect(goDetail).toHaveBeenCalledWith(Number(fila.dataset.operacion));
  });

  it("el clic en la fila (ratón) sigue abriendo el detalle, y la casilla no", () => {
    monta("/demo");
    const fila = filas()[1];
    act(() => fila.querySelectorAll("td")[3].click());
    expect(goDetail).toHaveBeenCalledTimes(1);
    expect(goDetail).toHaveBeenCalledWith(Number(fila.dataset.operacion));
    goDetail.mockClear();
    act(() => fila.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click());
    expect(goDetail).not.toHaveBeenCalled();
  });

  it("mientras se confirma el borrado de una operación propia, ni la fila ni el botón navegan", () => {
    addTrade({
      instrument: "ES", setup: "Breakout", direction: "long", entry: 5800, exit: 5810, qty: 1, netPnl: 125,
      rMultiple: 1, compliance: "yes", closedAt: "2031-01-01T10:00:00Z", note: "",
    });
    monta("/demo");
    const fila = filas()[0];
    act(() => fila.querySelector<HTMLButtonElement>('button[aria-label="Eliminar operación"]')!.click());
    act(() => fila.querySelector<HTMLButtonElement>("td:nth-child(2) button")!.click());
    act(() => fila.querySelectorAll("td")[3].click());
    expect(goDetail).not.toHaveBeenCalled();
  });
});

describe("Operaciones: la columna ordenada lo dice con aria-sort", () => {
  const COLUMNA = { instrumento: 1, duracion: 5, cierre: 6, pnl: 7, r: 8 };
  const cabeceras = () => [...cont.querySelectorAll<HTMLTableCellElement>("thead th")];
  const ordena = (columna: number) => act(() => cabeceras()[columna].querySelector("button")!.click());
  /** Índice de columna y valor de cada cabecera que declara su orden. */
  const ordenadas = () =>
    cabeceras().flatMap((th, i) => (th.hasAttribute("aria-sort") ? [`${i}:${th.getAttribute("aria-sort")}`] : []));

  it.each(["/demo", "/en/demo"])("en %s, solo la columna activa lleva aria-sort y cambia con la dirección", (url) => {
    monta(url);
    expect(ordenadas()).toEqual([`${COLUMNA.cierre}:descending`]);
    ordena(COLUMNA.instrumento);
    expect(ordenadas()).toEqual([`${COLUMNA.instrumento}:ascending`]);
    ordena(COLUMNA.instrumento);
    expect(ordenadas()).toEqual([`${COLUMNA.instrumento}:descending`]);
    ordena(COLUMNA.duracion);
    expect(ordenadas()).toEqual([`${COLUMNA.duracion}:descending`]);
    ordena(COLUMNA.pnl);
    ordena(COLUMNA.r);
    expect(ordenadas()).toEqual([`${COLUMNA.r}:descending`]);
  });
});

describe("Operaciones: el recuento y la selección se anuncian una vez, cuando quedan quietos", () => {
  const estados = () => [...cont.querySelectorAll('[role="status"].sr-only')].map((e) => e.textContent);
  const pasa = (ms: number) =>
    act(() => {
      vi.advanceTimersByTime(ms);
    });
  const busca = (texto: string) =>
    act(() => {
      const campo = cont.querySelector<HTMLInputElement>('input[type="search"]')!;
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(campo, texto);
      campo.dispatchEvent(new Event("input", { bubbles: true }));
    });
  const marca = (fila: number) => act(() => filas()[fila].querySelector<HTMLInputElement>('input[type="checkbox"]')!.click());

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it.each([
    ["/demo", "0 operaciones"],
    ["/en/demo", "0 trades"],
  ])("el recuento, en %s: nada al cargar y la cifra nueva tras la espera", (url, frase) => {
    monta(url);
    expect(estados()).toEqual(["", ""]);
    busca("zzzz");
    // La búsqueda filtra a los 150 ms y desde ahí ResultadoAnunciado espera 700 ms: antes no dice nada.
    pasa(150);
    pasa(699);
    expect(estados()).toEqual(["", ""]);
    pasa(1);
    expect(estados()).toEqual([frase, ""]);
  });

  it.each([
    ["/demo", "2 operaciones seleccionadas"],
    ["/en/demo", "2 trades selected"],
  ])("la selección, en %s: ni cada marca ni al cargar, sino «%s» al quedarse quieta", (url, frase) => {
    monta(url);
    marca(0);
    pasa(600);
    expect(estados()[1]).toBe("");
    marca(1);
    pasa(699);
    expect(estados()[1]).toBe("");
    pasa(1);
    expect(estados()[1]).toBe(frase);
  });

  it("una operación seleccionada se dice en singular, y al limpiar la selección no queda nada dicho", () => {
    monta("/demo");
    marca(0);
    pasa(700);
    expect(estados()[1]).toBe("1 operación seleccionada");
    marca(0);
    pasa(700);
    expect(estados()[1]).toBe("");
  });
});
