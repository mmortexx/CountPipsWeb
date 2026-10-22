import { describe, expect, it } from "vitest";
import { GLOSSARY, SQN_BUENO } from "@/lib/trading/glossary";
import { fmtNum } from "@/lib/trading/format";
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

describe("SQN: un solo umbral de «bueno»", () => {
  const ficha = GLOSSARY.find((t) => t.term.startsWith("SQN"))!;
  const ampliado = AMPLIADO[ficha.term];

  it.each(["es", "en"] as const)("la definición y «por qué importa» citan SQN_BUENO (%s)", (lang) => {
    const umbral = fmtNum(SQN_BUENO, lang, 1);
    expect(ficha[lang]).toContain(umbral);
    expect(ampliado.importa[lang]).toContain(umbral);
  });
});
