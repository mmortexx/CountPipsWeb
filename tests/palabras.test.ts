import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Palabras } from "@/components/tj/Palabras";

/* El titular que entra palabra a palabra parte el texto en máscaras. Lo que
   no puede pasar es que el texto cambie o que la puntuación quede en su
   propia máscara (el renglón podría cortarse justo antes del punto). */
const DURO = String.fromCharCode(0xa0);
const html = (texto: string) => renderToStaticMarkup(createElement(Palabras, { texto }));
const mascaras = (h: string) => h.split('class="tj-pal"').length - 1;
const texto = (h: string) => h.replace(/<[^>]+>/g, "").replaceAll(DURO, " ");

describe("titular palabra a palabra", () => {
  it("conserva el texto exacto y pone una máscara por palabra", () => {
    const h = html("Opera como una mesa institucional.");
    expect(texto(h)).toBe("Opera como una mesa institucional.");
    expect(mascaras(h)).toBe(5);
  });

  it("el punto final va en la máscara de su palabra", () => {
    const h = html("Todo lo que necesitas para operar con disciplina.");
    expect(texto(h)).toBe("Todo lo que necesitas para operar con disciplina.");
    expect(h).toMatch(/>disciplina\.<\/span><\/span>$/);
    expect(h).not.toMatch(/class="tj-pal"><span[^>]*>\.<\/span>/);
  });

  it("una palabra de una o dos letras sube pegada a la siguiente", () => {
    const h = html("La app, en tu navegador.");
    expect(h).toContain(`en${DURO}tu`);
    expect(h).toContain(`La${DURO}app,`);
    // «tu» también es corta, así que arrastra a «navegador.»: dos máscaras.
    expect(h).toContain(`tu${DURO}navegador.`);
    expect(mascaras(h)).toBe(2);
  });

  it("en inglés no pega nada: la norma es del español", () => {
    const h = renderToStaticMarkup(createElement(Palabras, { texto: "Trade like an institutional desk.", lang: "en" }));
    expect(h).not.toContain(DURO);
    expect(mascaras(h)).toBe(5);
  });

  it("cada máscara lleva su orden de entrada", () => {
    const orden = [...html("uno dos tres cuatro").matchAll(/--p:(\d+)/g)].map((m) => Number(m[1]));
    expect(orden).toEqual([0, 1, 2, 3]);
  });
});
