// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";

vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push() {}, replace() {} }) }));

import { LanguageProvider } from "@/lib/i18n";
import { CampoCifra } from "@/components/tj/CampoCifra";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let cont: HTMLElement;
let raiz: Root;
let valores: number[];

type Opciones = { valor?: number; min?: number; max?: number; paso?: number };

/** El campo con un padre que guarda lo que le llega, como hacen las calculadoras. */
function Padre({ valor: inicial = 500, min = 100, max = 1000, paso }: Opciones) {
  const [valor, setValor] = useState(inicial);
  return createElement(CampoCifra, {
    valor,
    min,
    max,
    paso,
    decimales: 0,
    onValor: (n: number) => {
      valores.push(n);
      setValor(n);
    },
  });
}

function monta(props: Opciones = {}) {
  act(() => {
    raiz.render(createElement(LanguageProvider, null, createElement(Padre, props)));
  });
  return cont.querySelector("input") as HTMLInputElement;
}

function enfoca(input: HTMLInputElement) {
  act(() => {
    input.focus();
  });
}

function escribe(input: HTMLInputElement, texto: string) {
  act(() => {
    const poner = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    poner.call(input, texto);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function sale(input: HTMLInputElement) {
  act(() => {
    input.blur();
  });
}

function espera(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  valores = [];
  cont = document.createElement("div");
  document.body.appendChild(cont);
  raiz = createRoot(cont);
});

afterEach(() => {
  act(() => raiz.unmount());
  cont.remove();
  vi.useRealTimers();
});

describe("CampoCifra: lo que hace con lo escrito", () => {
  it("un valor válido llega a onValor al momento y no marca el campo", () => {
    const input = monta();
    enfoca(input);
    escribe(input, "700");
    expect(valores).toEqual([700]);
    espera(2000);
    expect(input.getAttribute("aria-invalid")).toBeNull();
    expect(cont.querySelector('[role="alert"]')).toBeNull();
  });

  it("un valor fuera del rango no llama a onValor", () => {
    const input = monta();
    enfoca(input);
    escribe(input, "5000");
    escribe(input, "abc");
    expect(valores).toEqual([]);
  });

  it("el aviso espera 600 ms sin cambios: antes no hay aria-invalid, después sí, con el rango", () => {
    const input = monta();
    enfoca(input);
    escribe(input, "5");
    espera(599);
    expect(input.getAttribute("aria-invalid")).toBeNull();
    expect(cont.querySelector('[role="alert"]')).toBeNull();
    espera(1);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const alerta = cont.querySelector('[role="alert"]') as HTMLElement;
    expect(alerta.textContent).toBe("Escribe una cifra entre 100 y 1.000.");
    expect(input.getAttribute("aria-describedby")).toBe(alerta.id);
  });

  it("seguir escribiendo reinicia la espera", () => {
    const input = monta();
    enfoca(input);
    escribe(input, "5");
    espera(400);
    escribe(input, "50");
    espera(400);
    expect(input.getAttribute("aria-invalid")).toBeNull();
    espera(200);
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  it("al corregir a un valor válido, el aviso desaparece y el valor llega", () => {
    const input = monta();
    enfoca(input);
    escribe(input, "5");
    espera(600);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    escribe(input, "500");
    expect(valores).toEqual([500]);
    expect(input.getAttribute("aria-invalid")).toBeNull();
    expect(cont.querySelector('[role="alert"]')).toBeNull();
  });

  it("al salir con un valor inválido, el campo vuelve al último valor bueno y se limpia el aviso", () => {
    const input = monta({ valor: 500 });
    enfoca(input);
    escribe(input, "700");
    escribe(input, "5000");
    espera(600);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    sale(input);
    expect(input.getAttribute("aria-invalid")).toBeNull();
    expect(cont.querySelector('[role="alert"]')).toBeNull();
    expect(valores).toEqual([700]);
    expect(input.value).toBe("700");
  });

  it("un campo a medias («-», vacío) no se marca ni llama a onValor", () => {
    const input = monta({ min: -100, max: 100 });
    enfoca(input);
    escribe(input, "-");
    espera(2000);
    escribe(input, "");
    espera(2000);
    expect(valores).toEqual([]);
    expect(input.getAttribute("aria-invalid")).toBeNull();
  });

  it("las flechas suben el paso y no pasan del máximo", () => {
    const input = monta({ valor: 995, paso: 10 });
    enfoca(input);
    act(() => {
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, cancelable: true }));
    });
    expect(valores).toEqual([1000]);
  });
});
