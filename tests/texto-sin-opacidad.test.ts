// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

let ruta = "/";
vi.mock("next/navigation", () => ({ usePathname: () => ruta, useRouter: () => ({ push() {}, replace() {} }) }));

import { LanguageProvider } from "@/lib/i18n";
import { RMultipleSimulator } from "@/components/marketing/RMultipleSimulator";

/* Un texto con opacidad baja su contraste sin que lo vea la paleta: las notas
   de los perfiles del Monte Carlo llevaban `opacity-70` y no llegaban a AA.
   `scripts/legible.mjs` lo mide sobre el sitio compilado, pero CI no lo corre;
   esto sí: ningún texto del simulador se pinta translúcido. */
function translucidos(html: string): string[] {
  const raiz = document.createElement("div");
  raiz.innerHTML = html;
  const malos: string[] = [];
  for (const el of raiz.querySelectorAll<HTMLElement>("*")) {
    const propio = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim());
    if (!propio) continue;
    for (let p: HTMLElement | null = el; p && p !== raiz; p = p.parentElement) {
      const clase = [...p.classList].find((c) => /^opacity-(\d+)$/.test(c) && Number(c.slice(8)) < 100);
      const enLinea = p.style.opacity !== "" && Number(p.style.opacity) < 1;
      if (clase || enLinea) {
        malos.push(`«${el.textContent?.trim().slice(0, 40)}» (${clase ?? `opacity: ${p.style.opacity}`})`);
        break;
      }
    }
  }
  return malos;
}

describe("el simulador de rachas no pinta texto translúcido", () => {
  it.each(["/", "/en/"])("%s", (r) => {
    ruta = r;
    const html = renderToString(createElement(LanguageProvider, null, createElement(RMultipleSimulator)));
    expect(html.length).toBeGreaterThan(5000);
    expect(translucidos(html)).toEqual([]);
  });

  it("la guarda reconoce la opacidad por clase y en línea", () => {
    expect(translucidos('<p><span class="opacity-70">nota</span></p>')).toHaveLength(1);
    expect(translucidos('<div style="opacity:0.5"><b>cifra</b></div>')).toHaveLength(1);
    expect(translucidos('<span class="opacity-100">entera</span>')).toEqual([]);
  });
});
