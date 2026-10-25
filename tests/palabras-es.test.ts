import { describe, expect, it } from "vitest";
import { PALABRAS_ES, PALABRAS_ES_PAGINA, RE_ES, RE_ES_PAGINA } from "../scripts/palabras-es.mjs";

const LISTAS = [
  { nombre: "resumen copiado (copiado.mjs)", palabras: PALABRAS_ES, re: RE_ES },
  { nombre: "páginas /en (cifras.mjs)", palabras: PALABRAS_ES_PAGINA, re: RE_ES_PAGINA },
];

for (const { nombre, palabras, re } of LISTAS) {
  const halladas = (texto: string) => [...texto.matchAll(re)].map((m) => m[0]);

  describe(`palabras españolas del ${nombre}`, () => {
    it("cada palabra de la lista se encuentra suelta, entre signos y en mayúsculas", () => {
      const sinVer = palabras.filter((p) => {
        const casos = [`x ${p} y`, `(${p})`, `¿${p}?`, `${p}.`, p.toUpperCase()];
        return casos.some((c) => halladas(c).length !== 1);
      });
      expect(sinVer).toEqual([]);
    });

    it("«así» se encuentra al final de la frase aunque acabe en vocal con tilde", () => {
      expect(halladas("Lo hice así.")).toEqual(["así"]);
      expect(halladas("Así lo hice")).toEqual(["Así"]);
    });

    it("no casa dentro de una palabra más larga, tenga o no tilde pegada", () => {
      const dentro = palabras.filter((p) =>
        [`a${p}`, `${p}a`, `${p}é`, `é${p}`].some((c) => halladas(c).length > 0),
      );
      expect(dentro).toEqual([]);
      expect(halladas("entré, mesa, vendido")).toEqual([]);
    });

    it("el inglés corriente no casa", () => {
      expect(halladas("Net profit: 12.5% of the initial account, per month")).toEqual([]);
    });
  });
}
