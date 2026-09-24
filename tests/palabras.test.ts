import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Palabras } from "@/components/tj/Palabras";

/* El titular que entra palabra a palabra parte el texto en máscaras. Lo que
   no puede pasar es que el texto cambie, que la puntuación quede en su propia
   máscara (el renglón podría cortarse justo antes del punto) o que el realce
   se pierda al caer a mitad de palabra. */
const DURO = String.fromCharCode(0xa0);
const html = (texto: string, realce?: string) => renderToStaticMarkup(createElement(Palabras, { texto, realce }));
const mascaras = (h: string) => h.split('class="tj-pal"').length - 1;
const texto = (h: string) => h.replace(/<[^>]+>/g, "").replaceAll(DURO, " ");

describe("titular palabra a palabra", () => {
  it("conserva el texto exacto y pone una máscara por palabra", () => {
    const h = html("Opera como una mesa institucional.");
    expect(texto(h)).toBe("Opera como una mesa institucional.");
    expect(mascaras(h)).toBe(5);
  });

  it("el punto final va en la máscara de su palabra, también tras un realce", () => {
    const h = html("Todo lo que necesitas para operar con disciplina.", "operar con disciplina");
    expect(texto(h)).toBe("Todo lo que necesitas para operar con disciplina.");
    expect(h).toMatch(/<span class="text-gradient">disciplina<\/span>\.<\/span><\/span>$/);
    expect(h).not.toMatch(/class="tj-pal"><span[^>]*>\.<\/span>/);
  });

  it("el realce abarca exactamente su tramo, aunque cruce varias máscaras", () => {
    const h = html("El precio, por escrito.", "por escrito");
    const realzado = [...h.matchAll(/<span class="text-gradient">([^<]*)<\/span>/g)].map((m) => m[1]);
    expect(realzado.join(" ")).toBe("por escrito");
    expect(texto(h)).toBe("El precio, por escrito.");
  });

  it("una palabra de una o dos letras sube pegada a la siguiente", () => {
    const h = html("La app, en tu navegador.");
    expect(h).toContain(`en${DURO}tu`);
    expect(h).toContain(`La${DURO}app,`);
    // «tu» también es corta, así que arrastra a «navegador.»: dos máscaras.
    expect(h).toContain(`tu${DURO}navegador.`);
    expect(mascaras(h)).toBe(2);
  });

  it("un realce que no está en el texto no rompe nada", () => {
    const h = html("Diario de trading.", "no aparece");
    expect(texto(h)).toBe("Diario de trading.");
    expect(h).not.toContain("text-gradient");
  });

  it("cada máscara lleva su orden de entrada", () => {
    const orden = [...html("uno dos tres cuatro").matchAll(/--p:(\d+)/g)].map((m) => Number(m[1]));
    expect(orden).toEqual([0, 1, 2, 3]);
  });
});
