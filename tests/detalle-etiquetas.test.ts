// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";

vi.mock("next/navigation", () => ({ usePathname: () => "/demo", useRouter: () => ({ push() {}, replace() {} }) }));

import { LanguageProvider } from "@/lib/i18n";
import { DemoProvider, useDemo } from "@/components/demo/DemoContext";
import { precargaPaginas } from "@/components/demo/cargaPaginas";
import { TradeDetailPage } from "@/components/demo/pages/TradeDetailPage";
import { TRADES } from "@/lib/trading/data";
import { mergeTrades, resetToSample } from "@/lib/trading/demoStore";
import { canalesDe, contrastRatio, relativeLuminance, tokensEfectivos } from "./utils/tokens-tema";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* Una etiqueta se pinta con un token de color, un borde al 30 % y un fondo al 8 %.
   Un color con el paréntesis mal cerrado lo descarta el navegador entero: la
   etiqueta se queda sin borde ni fondo. Y un tinte nunca puede restar lectura. */

const lista = mergeTrades(TRADES, []);
const TOKENS_DE_ETIQUETA = ["--pnl-neg", "--pnl-pos", "--accent-base", "--txt-tertiary"];

let cont: HTMLElement;
let raiz: Root;

function Abre({ id }: { id: number }) {
  const { goDetail } = useDemo();
  useEffect(() => goDetail(id), []); // eslint-disable-line react-hooks/exhaustive-deps
  return createElement(TradeDetailPage);
}

const etiquetas = () =>
  [...cont.querySelectorAll("[aria-label^='Quitar etiqueta']")].map((b) => b.parentElement as HTMLElement);

/** Declaraciones de `style` tal como las lee el navegador, con el espacio normalizado. */
function estilo(el: HTMLElement): Record<string, string> {
  const salida: Record<string, string> = {};
  for (const decl of (el.getAttribute("style") ?? "").split(";")) {
    const corte = decl.indexOf(":");
    if (corte > 0) salida[decl.slice(0, corte).trim()] = decl.slice(corte + 1).replace(/\s+/g, " ").trim();
  }
  return salida;
}

beforeEach(async () => {
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  await precargaPaginas();
  resetToSample();
  cont = document.createElement("div");
  document.body.appendChild(cont);
  raiz = createRoot(cont);
  act(() => {
    raiz.render(createElement(LanguageProvider, null, createElement(DemoProvider, null, createElement(Abre, { id: lista[0].id }))));
  });
});

afterEach(() => {
  act(() => raiz.unmount());
  cont.remove();
  vi.unstubAllGlobals();
});

describe("las etiquetas del detalle de una operación", () => {
  it("cada una declara color, borde y fondo con CSS válido del mismo token", () => {
    act(() => (cont.querySelector("[aria-label='Añadir etiqueta']") as HTMLElement).click());
    const pildoras = etiquetas();
    expect(pildoras.length).toBeGreaterThanOrEqual(3);
    for (const p of pildoras) {
      const e = estilo(p);
      const token = e["color"]?.match(/^rgb\(var\((--[\w-]+)\)\)$/)?.[1];
      expect(token, `color de «${p.textContent}»: ${e["color"]}`).toBeDefined();
      expect(TOKENS_DE_ETIQUETA).toContain(token);
      expect(e["border-color"], `borde de «${p.textContent}»`).toBe(`rgb(var(${token}) / 0.3)`);
      expect(e["background-color"], `fondo de «${p.textContent}»`).toBe(`rgb(var(${token}) / 0.08)`);
    }
  });

  it("el texto se lee sobre su propio tinte al 8 % en los dos temas", () => {
    const css = readFileSync(resolve(__dirname, "../src/app/globals.css"), "utf8");
    for (const tema of ["dark", "light"] as const) {
      const tokens = tokensEfectivos(css, tema);
      for (const superficie of ["--bg", "--surface", "--raised"]) {
        const base = canalesDe(tokens, superficie);
        for (const nombre of TOKENS_DE_ETIQUETA) {
          const tinta = canalesDe(tokens, nombre);
          const tinte = base.map((c, k) => 0.92 * c + 0.08 * tinta[k]) as [number, number, number];
          const ratio = contrastRatio(relativeLuminance(...tinta), relativeLuminance(...tinte));
          expect(ratio, `${tema}: ${nombre} sobre su tinte en ${superficie} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });
});
