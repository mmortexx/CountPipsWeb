import { describe, expect, it } from "vitest";
import { FAQ_EN, FAQ_ES, type QA } from "@/lib/faq";

/**
 * La pregunta de métodos de pago tiene que contestarse: la respuesta no arranca
 * hablando de la demo y nombra lo que se pregunta. Se busca por el texto de la
 * pregunta y no por su posición, para que reordenar la FAQ no cambie lo vigilado.
 */

function buscar(faq: QA[], pregunta: string): QA {
  const qa = faq.find((x) => x.q === pregunta);
  if (!qa) throw new Error(`no está la pregunta «${pregunta}»`);
  return qa;
}

const casos = [
  {
    idioma: "es",
    faq: FAQ_ES,
    pregunta: "¿Qué métodos de pago se aceptan?",
    inicioProhibido: "La demo",
    nombra: "métodos de pago",
  },
  {
    idioma: "en",
    faq: FAQ_EN,
    pregunta: "What payment methods do you accept?",
    inicioProhibido: "The demo",
    nombra: "Payment methods",
  },
];

for (const c of casos) {
  describe(`FAQ ${c.idioma} «${c.pregunta}»`, () => {
    it("existe", () => {
      expect(c.faq.some((x) => x.q === c.pregunta)).toBe(true);
    });

    it(`la respuesta no empieza por «${c.inicioProhibido}»`, () => {
      const { a } = buscar(c.faq, c.pregunta);
      expect(a.startsWith(c.inicioProhibido), a).toBe(false);
    });

    it(`la respuesta nombra «${c.nombra}»`, () => {
      const { a } = buscar(c.faq, c.pregunta);
      expect(a.toLowerCase(), a).toContain(c.nombra.toLowerCase());
    });
  });
}
