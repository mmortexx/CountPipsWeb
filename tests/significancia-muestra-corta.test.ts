// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";

let ruta = "/";
vi.mock("next/navigation", () => ({ usePathname: () => ruta, useRouter: () => ({ push() {}, replace() {} }) }));

import { LanguageProvider } from "@/lib/i18n";
import { EdgeSignificanceChecker } from "@/components/marketing/EdgeSignificanceChecker";
import { contrasteVentaja } from "@/lib/trading/estadistica";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* Por debajo de n·p0·(1−p0) ≥ 5 no hay contraste: un p-valor de 1,0000 en rojo
   afirmaba una cifra que nadie calculó. */
describe("contrasteVentaja con la muestra por debajo del mínimo", () => {
  it("no da p-valor, y con la muestra válida sí", () => {
    expect(contrasteVentaja(15, 70, 1, 1).pValor).toBeNull();
    expect(contrasteVentaja(20, 70, 1, 1).pValor).toBeCloseTo(0.0368, 3); // z = 0,2·√20 / 0,5 = 1,789
  });

  it("con los valores de inicio (58 %, 2 R : 1 R) cae bajo el mínimo en 20 operaciones", () => {
    const c = contrasteVentaja(20, 58, 2, 1);
    expect(c.minimoValido).toBe(23);
    expect(c.valido).toBe(false);
    expect(c.pValor).toBeNull();
    expect(contrasteVentaja(25, 58, 2, 1).pValor).not.toBeNull();
  });
});

describe("la calculadora de significancia con la muestra insuficiente", () => {
  let cont: HTMLElement;
  let raiz: Root;
  let copiado: string[];

  beforeEach(() => {
    vi.useFakeTimers();
    copiado = [];
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async (t: string) => void copiado.push(t) },
    });
    cont = document.createElement("div");
    document.body.appendChild(cont);
    raiz = createRoot(cont);
  });
  afterEach(() => {
    act(() => raiz.unmount());
    cont.remove();
    vi.useRealTimers();
  });

  function monta(pathname: string, operaciones: number) {
    ruta = pathname;
    act(() => {
      raiz.render(createElement(LanguageProvider, null, createElement(EdgeSignificanceChecker)));
    });
    const n = cont.querySelector<HTMLInputElement>('input[type="range"]')!;
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(n, String(operaciones));
      n.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  const tarjetaP = () =>
    [...cont.querySelectorAll<HTMLElement>(".tj-matriz > div")].find((d) => /^p-(valor|value)/.test(d.firstElementChild?.textContent ?? ""))!;

  async function informe() {
    const boton = [...cont.querySelectorAll("button")].find((b) => /Copiar informe|Copy report/.test(b.textContent ?? ""))!;
    await act(async () => boton.click());
    return copiado[0];
  }

  const idiomas = [
    ["/herramientas/significancia-estadistica/", "Muestra insuficiente"],
    ["/en/herramientas/significancia-estadistica/", "Insufficient sample"],
  ] as const;

  it.each(idiomas)("%s: la tarjeta del p-valor enseña «—»", (pathname, etiqueta) => {
    monta(pathname, 15);
    expect(cont.textContent).toContain(etiqueta);
    expect(tarjetaP().lastElementChild!.textContent).toBe("—");
  });

  it.each(idiomas)("%s: el anuncio no cita ningún p", (pathname, etiqueta) => {
    monta(pathname, 15);
    act(() => void vi.advanceTimersByTime(1000));
    const anuncio = cont.querySelector('[role="status"]')!.textContent!;
    expect(anuncio).toContain(etiqueta);
    expect(anuncio).not.toMatch(/\bp\s*[=<]/);
  });

  it.each(idiomas)("%s: el informe copiado no cita ningún p", async (pathname, etiqueta) => {
    monta(pathname, 15);
    const texto = await informe();
    expect(texto).toContain(etiqueta);
    expect(texto).not.toMatch(/\bp\s*[=<]/);
  });

  it("con muestra suficiente la tarjeta, el anuncio y el informe siguen llevando el p-valor", async () => {
    monta("/herramientas/significancia-estadistica/", 30);
    expect(tarjetaP().lastElementChild!.textContent).toMatch(/^<?\s*0,\d{4}$/);
    act(() => void vi.advanceTimersByTime(1000));
    expect(cont.querySelector('[role="status"]')!.textContent).toMatch(/p [=<]/);
    expect(await informe()).toMatch(/p [=<]/);
  });
});
