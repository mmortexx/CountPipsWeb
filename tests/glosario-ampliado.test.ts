import { describe, expect, it } from "vitest";
import { GLOSSARY } from "@/lib/trading/glossary";
import { AMPLIADO } from "@/lib/glosario-ampliado";

/**
 * Cada término lleva, además de la definición, un ejemplo con cifras y por qué
 * importa, en los dos idiomas. Sin ellos la página es una definición de dos
 * frases: contenido escaso para un buscador.
 */
describe("glosario ampliado", () => {
  const terminos = GLOSSARY.map((t) => t.term);

  it("cada término tiene su ampliación y no sobra ninguna", () => {
    expect(Object.keys(AMPLIADO).sort()).toEqual([...terminos].sort());
  });

  it.each(terminos)("«%s» trae ejemplo y por qué importa en los dos idiomas", (term) => {
    const a = AMPLIADO[term];
    for (const texto of [a.ejemplo.es, a.ejemplo.en, a.importa.es, a.importa.en]) {
      expect(texto.split(/\s+/).length).toBeGreaterThanOrEqual(18);
    }
  });

  it("casi todos los ejemplos llevan cifras", () => {
    const conCifras = terminos.filter((t) => /\d/.test(AMPLIADO[t].ejemplo.es) && /\d/.test(AMPLIADO[t].ejemplo.en));
    // Los de conducta (tilt, FOMO) se explican con una escena, no con números.
    expect(conCifras.length / terminos.length).toBeGreaterThanOrEqual(0.85);
  });
});
