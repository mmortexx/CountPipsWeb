// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";

let ruta = "/";
vi.mock("next/navigation", () => ({ usePathname: () => ruta, useRouter: () => ({ push() {}, replace() {}, prefetch() {} }) }));

import { LanguageProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import { Navbar } from "@/components/marketing/Navbar";
import { RMultipleSimulator } from "@/components/marketing/RMultipleSimulator";
import { DataFlowComparison } from "@/components/marketing/DataFlowComparison";
import { AppDemo } from "@/components/demo/AppDemo";
import { resetToSample } from "@/lib/trading/demoStore";
import { contieneEtiqueta, esEstadoDescrito, esEtiqueta } from "../scripts/etiqueta-en-nombre.mjs";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* WCAG 2.5.3: el nombre accesible de un control con texto visible contiene ese
   texto, para que quien dicta «pulsar ES» llegue al botón. `rotulos.mjs` lo mide
   en el HTML compilado; aquí, lo que solo se pinta en el navegador y los casos
   que lo rompían (la comparación es la misma: `scripts/etiqueta-en-nombre.mjs`). */

describe("la comparación del texto visible con el nombre", () => {
  it.each([
    ["Cambiar idioma", "ES", false],
    ["ES: Cambiar idioma", "ES", true],
    ["Otra tirada: volver a simular", "Otra tirada", true],
    ["Volver a simular con otra semilla aleatoria", "Otra tirada", false],
  ])("«%s» y el texto visible «%s»: %s", (nombre, visible, esperado) => {
    expect(contieneEtiqueta(nombre, visible)).toBe(esperado);
  });

  it("no distingue mayúsculas, tildes ni signos", () => {
    expect(contieneEtiqueta("AÑADIR OPERACIÓN y ver el flujo", "Añadir operacion")).toBe(true);
    expect(contieneEtiqueta("Guardar &amp; salir", "Guardar & salir")).toBe(true);
    expect(contieneEtiqueta("Re-roll: re-simulate", "Re–roll")).toBe(true);
  });

  it("cuenta palabras enteras: «es» no está dentro de «reservas», ni «otra» en «otras»", () => {
    expect(contieneEtiqueta("Ver reservas", "ES")).toBe(false);
    expect(contieneEtiqueta("Otras tiradas", "Otra")).toBe(false);
  });

  it("las palabras van seguidas y en orden", () => {
    expect(contieneEtiqueta("Añadir una operación", "Añadir operación")).toBe(false);
    expect(contieneEtiqueta("Operación: añadir", "Añadir operación")).toBe(false);
  });

  it("el texto de estado de un interruptor, dado como su descripción, no es su etiqueta", () => {
    expect(esEstadoDescrito("Con plan", "Con plan")).toBe(true);
    expect(esEstadoDescrito("Otra tirada", "Con plan")).toBe(false);
    expect(esEstadoDescrito("Otra tirada", "")).toBe(false);
  });

  it("solo es etiqueta lo que lleva letras: un icono o una cifra suelta no", () => {
    expect(esEtiqueta("ES")).toBe(true);
    expect(esEtiqueta("1M")).toBe(true);
    for (const icono of ["×", "→", "+", "3", "▲"]) expect(esEtiqueta(icono), icono).toBe(false);
  });
});

/** Texto que se ve de un elemento: sin lo oculto con `aria-hidden` ni lo solo para lectores (`sr-only`). */
function visibleDe(el: Element): string {
  if (el.getAttribute("aria-hidden") === "true" || el.classList.contains("sr-only")) return "";
  return [...el.childNodes].map((n) => (n.nodeType === 3 ? (n.textContent ?? "") : visibleDe(n as Element))).join(" ");
}

const CON_ETIQUETA = 'button, summary, a[href], [role="button"], [role="link"], [role="tab"], [role="menuitem"], [role="radio"], [role="checkbox"], [role="switch"], [role="option"]';

/** Los controles cuyo nombre (`aria-label` o `aria-labelledby`) no contiene su texto visible. */
function sinEtiquetaEnNombre(raiz: ParentNode): string[] {
  const fallos: string[] = [];
  for (const el of raiz.querySelectorAll(CON_ETIQUETA)) {
    const visible = visibleDe(el).replace(/\s+/g, " ").trim();
    const ids = el.getAttribute("aria-labelledby");
    const nombre = ids
      ? ids.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? "").join(" ").trim()
      : (el.getAttribute("aria-label")?.trim() ?? "");
    const descripcion = (el.getAttribute("aria-describedby") ?? "").split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? "").join(" ");
    if (nombre && esEtiqueta(visible) && !contieneEtiqueta(nombre, visible) && !esEstadoDescrito(visible, descripcion))
      fallos.push(`«${visible}» no está en «${nombre}»`);
  }
  return fallos;
}

let cont: HTMLElement;
let raiz: Root;

beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal("requestIdleCallback", () => 1);
  vi.stubGlobal("cancelIdleCallback", () => {});
  resetToSample();
  cont = document.createElement("div");
  document.body.appendChild(cont);
  raiz = createRoot(cont);
});
afterEach(() => {
  act(() => raiz.unmount());
  cont.remove();
  vi.unstubAllGlobals();
  ruta = "/";
});

function monta(url: string, componente: ReactElement) {
  ruta = url;
  act(() => raiz.render(createElement(ThemeProvider, null, createElement(LanguageProvider, null, componente))));
}

describe("lo que rompía la regla, ya no", () => {
  it.each([
    ["/", "ES"],
    ["/en", "EN"],
    ["/pt", "PT"],
    ["/fr", "FR"],
    ["/de", "DE"],
    ["/it", "IT"],
  ])("el selector de idioma de la barra en %s empieza por su código (%s)", (url, codigo) => {
    monta(url, createElement(Navbar));
    expect(sinEtiquetaEnNombre(cont)).toEqual([]);
    const selector = [...cont.querySelectorAll("button")].find((b) => b.querySelector(".tnum")?.textContent === codigo)!;
    expect(selector.getAttribute("aria-label")).toMatch(new RegExp(`^${codigo}\\b`));
  });

  it.each(["/herramientas/monte-carlo", "/en/herramientas/monte-carlo"])("«Otra tirada» y «Re-roll» en %s", (url) => {
    monta(url, createElement(RMultipleSimulator));
    expect(sinEtiquetaEnNombre(cont)).toEqual([]);
    const boton = [...cont.querySelectorAll("button")].find((b) => /Otra tirada|Re-roll/.test(b.textContent ?? ""))!;
    expect(boton.getAttribute("aria-label")).toMatch(/^(Otra tirada|Re-roll)\b/);
  });

  it.each(["/features/seguridad", "/en/features/seguridad"])("«Añadir operación» y «Add trade» en %s", (url) => {
    monta(url, createElement(DataFlowComparison));
    expect(sinEtiquetaEnNombre(cont)).toEqual([]);
    const boton = [...cont.querySelectorAll("button")].find((b) => /Añadir operación|Add trade/.test(b.textContent ?? ""))!;
    expect(boton.getAttribute("aria-label")).toMatch(/^(Añadir operación|Add trade)\b/);
  });
});

describe("la demo, que solo existe en el navegador, cumple la regla en todas sus pantallas", () => {
  async function recorre() {
    const hallados: Record<string, string[]> = {};
    const panel = () => cont.querySelector<HTMLElement>("#demo-tabpanel")!;
    const pulsa = (key: string) =>
      act(() => {
        panel().focus();
        panel().dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
      });
    const espera = async (listo: () => boolean) => {
      for (let i = 0; i < 300 && !listo(); i++) await act(() => new Promise((r) => setTimeout(r, 10)));
    };
    const anota = (pantalla: string) => {
      const f = sinEtiquetaEnNombre(document.body);
      if (f.length) hallados[pantalla] = f;
    };
    const elegida = () => [...cont.querySelectorAll("[role='tab']")].findIndex((t) => t.getAttribute("aria-selected") === "true");
    anota("Resumen");
    for (const [tecla, nombre] of [["2", "Operaciones"], ["3", "Analítica"], ["4", "Diario"], ["1", "Resumen"]] as const) {
      pulsa(tecla);
      await espera(() => elegida() === Number(tecla) - 1);
      anota(nombre);
    }
    pulsa("2");
    await espera(() => !!cont.querySelector("tr[data-operacion]"));
    act(() => cont.querySelector<HTMLElement>("tr[data-operacion]")!.click());
    await espera(() => !cont.querySelector("tr[data-operacion]"));
    anota("Detalle de una operación");
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true, cancelable: true }));
    });
    await espera(() => !!document.querySelector("[role='dialog']"));
    anota("Paleta de comandos");
    return hallados;
  }

  it.each(["/demo", "/en/demo"])("en %s", async (url) => {
    monta(url, createElement(AppDemo));
    expect(await recorre()).toEqual({});
  });
});
