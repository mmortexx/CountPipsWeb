import { describe, expect, it } from "vitest";
import { PALABRAS_ES, RE_ES } from "../scripts/palabras-es.mjs";

const halladas = (texto: string) => [...texto.matchAll(RE_ES)].map((m) => m[0]);

describe("palabras españolas del resumen copiado (scripts/palabras-es.mjs)", () => {
  it("cada palabra de la lista se encuentra suelta, entre signos y en mayúsculas", () => {
    const sinVer = PALABRAS_ES.filter((p) => {
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
    const dentro = PALABRAS_ES.filter((p) =>
      [`a${p}`, `${p}a`, `${p}é`, `é${p}`].some((c) => halladas(c).length > 0),
    );
    expect(dentro).toEqual([]);
    expect(halladas("entré, mesa, vendido")).toEqual([]);
  });

  it("el inglés corriente no casa", () => {
    expect(halladas("Net profit: 12.5% of the initial account, per month")).toEqual([]);
  });
});
