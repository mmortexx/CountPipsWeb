// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";

let ruta = "/demo";
vi.mock("next/navigation", () => ({ usePathname: () => ruta, useRouter: () => ({ push() {}, replace() {} }) }));

import { LanguageProvider } from "@/lib/i18n";
import { DemoProvider } from "@/components/demo/DemoContext";
import { DashboardPage } from "@/components/demo/pages/DashboardPage";
import { toast, useToast } from "@/hooks/use-toast";
import { addTrade, customTradeToTrade, getCustomTrades, resetToSample } from "@/lib/trading/demoStore";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let cont: HTMLElement;
let raiz: Root;

/** Los avisos que muestra la demo, leídos del mismo almacén que pinta el Toaster. */
function Avisos() {
  const { toasts } = useToast();
  return createElement("div", { id: "avisos" }, toasts.map((a) => createElement("p", { key: a.id }, String(a.title))));
}

function monta() {
  act(() => {
    raiz.render(
      createElement(LanguageProvider, null, createElement(DemoProvider, null, createElement(DashboardPage), createElement(Avisos)))
    );
  });
}

const campo = (id: string) => cont.querySelector<HTMLInputElement>(`#${id}`)!;

function escribe(id: string, texto: string) {
  act(() => {
    const poner = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    poner.call(campo(id), texto);
    campo(id).dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function registra() {
  act(() => {
    cont.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}

beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  resetToSample();
  // El almacén de avisos es global: uno en blanco desplaza el de la prueba anterior.
  act(() => {
    toast({ title: "" });
  });
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

describe("el registro rápido guarda el plan que el visitante tecleó", () => {
  it("el stop y el objetivo escritos llegan al detalle, con su R:R planificado", () => {
    monta();
    escribe("d-entry", "100,0");
    escribe("d-stop", "98,5");
    escribe("d-target", "104,0");
    escribe("d-exit", "103,0");
    escribe("d-qty", "1");
    registra();

    const guardada = getCustomTrades();
    expect(guardada).toHaveLength(1);
    const detalle = customTradeToTrade(guardada[0]);
    expect(detalle.initialStop).toBe(98.5);
    expect(detalle.target).toBe(104);
    // (104 − 100) / (100 − 98,5) = 4 / 1,5
    expect(detalle.plannedRr).toBeCloseTo(8 / 3, 9);
  });

  const base = {
    id: 1, instrument: "ES", setup: "Breakout", direction: "long", entry: 100, exit: 110, qty: 1, netPnl: 100,
    rMultiple: 2, compliance: "yes", closedAt: "2026-07-01T10:00:00.000Z", note: "",
  } as const;

  it("un corto con stop y objetivo propios los conserva", () => {
    const t = customTradeToTrade({ ...base, direction: "short", exit: 96, stop: 102, target: 96 });
    expect(t.initialStop).toBe(102);
    expect(t.target).toBe(96);
    expect(t.plannedRr).toBe(2);
  });

  it("sin objetivo, el stop tecleado manda y el objetivo se sintetiza a esa distancia", () => {
    const t = customTradeToTrade({ ...base, stop: 98 });
    expect(t.initialStop).toBe(98);
    // Gana con r = 2: plannedRr = 2,5 y objetivo = 100 + 2 · 2,5.
    expect(t.plannedRr).toBe(2.5);
    expect(t.target).toBe(105);
  });

  it("un stop o un objetivo inservibles (iguales a la entrada, cero, texto) se tratan como ausentes", () => {
    const sintetica = customTradeToTrade(base);
    const rota = customTradeToTrade({ ...base, stop: 100, target: "x" as unknown as number });
    expect(rota.initialStop).toBe(sintetica.initialStop);
    expect(rota.target).toBe(sintetica.target);
    expect(rota.plannedRr).toBe(sintetica.plannedRr);
  });

  it("con el stop tecleado, el riesgo es distancia al stop × cantidad × multiplicador, también a la par", () => {
    // ES vale 50 $ por punto: 2 puntos × 1 contrato × 50.
    expect(customTradeToTrade({ ...base, exit: 100, netPnl: 0, rMultiple: 0, stop: 98 }).riskUsd).toBe(100);
    // R guardado con dos decimales (1 / 3 → 0,33): 50 / 0,33 daría 151,52 $.
    expect(customTradeToTrade({ ...base, exit: 101, netPnl: 50, rMultiple: 0.33, stop: 97 }).riskUsd).toBe(150);
  });

  it("registrada sin salida, el detalle enseña el riesgo que el composer anunciaba", () => {
    monta();
    escribe("d-entry", "100,0");
    escribe("d-stop", "98,5");
    escribe("d-exit", "");
    escribe("d-qty", "2");
    registra();
    const guardada = getCustomTrades();
    expect(guardada).toHaveLength(1);
    expect(guardada[0].rMultiple).toBe(0);
    // BTC/USDT, multiplicador 1: 1,5 × 2.
    expect(customTradeToTrade(guardada[0]).riskUsd).toBe(3);
  });

  it("una operación guardada antes de este campo conserva la síntesis de siempre", () => {
    const antigua = customTradeToTrade({
      id: 1, instrument: "ES", setup: "Breakout", direction: "long", entry: 5000, exit: 5100, qty: 1, netPnl: 100,
      rMultiple: 2, compliance: "yes", closedAt: "2026-07-01T10:00:00.000Z", note: "",
    });
    // Stop al 1 % de la entrada; R planificado = max(r + 0,5; 1,5) = 2,5.
    expect(antigua.initialStop).toBe(4950);
    expect(antigua.plannedRr).toBe(2.5);
    expect(antigua.target).toBe(5125);
  });
});

const TITULO_ERROR = "Faltan campos obligatorios";
const TITULO_OK = "Operación registrada";

const avisos = () => cont.querySelector("#avisos")!.textContent;

function eligeDireccion(indice: number) {
  act(() => {
    cont.querySelectorAll<HTMLElement>('[role="radio"]')[indice].click();
  });
}

const NBSP = String.fromCharCode(0xa0);
const MENOS = String.fromCharCode(0x2212);

/** El R:R planificado que enseña el composer («3,00 R», con espacio duro y menos tipográfico). */
function rrMostrado() {
  const celda = [...cont.querySelectorAll("span")].find((s) => new RegExp(`^[${MENOS}-]?\\d[\\d.,]*${NBSP}R$`).test(s.textContent ?? ""));
  return celda?.textContent?.replace(NBSP, " ");
}

/** El contador del pie del composer, con su rótulo («2registradas»: sin espacio, son dos elementos). */
function contador() {
  const cifra = [...cont.querySelectorAll("span.tnum")].find((s) => s.nextElementSibling?.classList.contains("uppercase"));
  return cifra?.parentElement?.textContent;
}

describe("el contador del pie no promete lo que no sabe", () => {
  const previa = {
    instrument: "ES", setup: "Breakout", direction: "long", entry: 5800, exit: 5810, qty: 1, netPnl: 125,
    rMultiple: 1, compliance: "yes", closedAt: "2026-07-01T10:00:00.000Z", note: "",
  } as const;

  it.each([
    ["/demo", "2registradas"],
    ["/en/demo", "2logged"],
  ])("con dos operaciones de una visita anterior (%s) no dice que sean «de la sesión»", (url, esperado) => {
    ruta = url;
    addTrade(previa);
    addTrade({ ...previa, closedAt: "2026-07-02T10:00:00.000Z" });
    monta();
    expect(contador()).toBe(esperado);
  });
});

describe("el registro rápido valida el plan según la dirección", () => {
  it("al pasar a corto, el stop y el objetivo por defecto se reflejan al otro lado de la entrada y se registra", () => {
    monta();
    eligeDireccion(1);
    // Entrada 65000: stop 64480 → 65520 y objetivo 66560 → 63440.
    expect(campo("d-stop").value).toBe("65520,0");
    expect(campo("d-target").value).toBe("63440,0");
    expect(rrMostrado()).toBe("3,00 R");
    registra();
    expect(getCustomTrades()).toHaveLength(1);
    expect(avisos()).toBe(TITULO_OK);
  });

  it("volver a largo deshace el reflejo y repetir la dirección no cambia nada", () => {
    monta();
    eligeDireccion(1);
    eligeDireccion(1);
    expect(campo("d-stop").value).toBe("65520,0");
    eligeDireccion(0);
    expect(campo("d-stop").value).toBe("64480,0");
    expect(campo("d-target").value).toBe("66560,0");
  });

  it("un precio que ya está del lado de la nueva dirección, uno vacío o uno que quedaría negativo no se tocan", () => {
    monta();
    escribe("d-stop", "65520,0");
    escribe("d-target", "");
    escribe("d-entry", "10,0");
    eligeDireccion(1);
    expect(campo("d-stop").value).toBe("65520,0");
    expect(campo("d-target").value).toBe("");
    escribe("d-entry", "65000,0");
    escribe("d-stop", "1000,0");
    eligeDireccion(0);
    escribe("d-entry", "100,0");
    escribe("d-target", "300,0");
    eligeDireccion(1);
    // 2 · 100 − 300 < 0: el objetivo se queda como estaba y el registro avisa.
    expect(campo("d-target").value).toBe("300,0");
  });

  it("un corto con el stop por debajo de la entrada no se registra y avisa", () => {
    monta();
    eligeDireccion(1);
    escribe("d-stop", "64480,0");
    registra();
    expect(getCustomTrades()).toHaveLength(0);
    expect(avisos()).toBe(TITULO_ERROR);
  });

  it("un corto bien planteado se registra y su R:R sale en positivo", () => {
    monta();
    eligeDireccion(1);
    // Entrada 65000: stop 520 por encima y objetivo 1560 por debajo, 1560 / 520 = 3.
    escribe("d-stop", "65520,0");
    escribe("d-target", "63440,0");
    expect(rrMostrado()).toBe("3,00 R");
    registra();
    expect(getCustomTrades()).toHaveLength(1);
    expect(avisos()).toBe(TITULO_OK);
  });

  it("un largo con el objetivo por debajo de la entrada no se registra y su R:R sale en negativo", () => {
    monta();
    // Stop por defecto a 520 de la entrada; objetivo 1000 por debajo: −1000 / 520.
    escribe("d-target", "64000,0");
    expect(rrMostrado()).toBe("−1,92 R");
    registra();
    expect(getCustomTrades()).toHaveLength(0);
    expect(avisos()).toBe(TITULO_ERROR);
  });

  it("un largo con el stop por encima de la entrada no se registra", () => {
    monta();
    escribe("d-stop", "65520,0");
    registra();
    expect(getCustomTrades()).toHaveLength(0);
    expect(avisos()).toBe(TITULO_ERROR);
  });

  it("los valores por defecto de un largo se registran", () => {
    monta();
    registra();
    expect(getCustomTrades()).toHaveLength(1);
    expect(avisos()).toBe(TITULO_OK);
  });

  it("el objetivo es opcional: vacío, el largo se registra sin él", () => {
    monta();
    escribe("d-target", "");
    registra();
    const guardada = getCustomTrades();
    expect(guardada).toHaveLength(1);
    expect(guardada[0].target).toBeUndefined();
    expect(avisos()).toBe(TITULO_OK);
  });
});
