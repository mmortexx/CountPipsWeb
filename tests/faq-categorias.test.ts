import { describe, expect, it } from "vitest";
import { FAQ_EN, FAQ_ES, jsonLdFaq } from "@/lib/faq";

/**
 * Cada pregunta de la FAQ lleva su categoría escrita en `src/lib/faq.ts`, y la
 * página filtra por ella. La asignación se fija por el texto de la pregunta
 * española: si alguien reordena o añade preguntas, ninguna cambia de categoría
 * en silencio.
 */

const CATEGORIAS = ["security", "access", "product"] as const;

const CATEGORIA_POR_PREGUNTA: Record<string, (typeof CATEGORIAS)[number]> = {
  "¿Ya se puede comprar?": "access",
  "¿Mis datos están seguros?": "security",
  "¿Puedo exportar mis datos?": "security",
  "¿Funciona en Mac o Linux?": "product",
  "¿Puedo importar de otro diario?": "product",
  "¿Cómo se selecciona el acceso anticipado?": "access",
  "¿Qué está listo y qué se está validando?": "access",
  "¿Qué métodos de pago aceptáis?": "access",
  "¿Puedo ver el producto antes de solicitar acceso?": "access",
  "¿Cuál es la diferencia entre Core y Pro?": "product",
  "¿Qué datos pide esta web?": "security",
  "¿Podré usarlo en varios ordenadores?": "product",
  "¿Qué ocurre si cambio de ordenador durante el piloto?": "security",
};

describe("cada pregunta de la FAQ tiene su categoría", () => {
  it("toda pregunta española e inglesa tiene una categoría válida", () => {
    const sinCategoria = [...FAQ_ES, ...FAQ_EN]
      .filter((it) => !CATEGORIAS.includes(it.categoria))
      .map((it) => it.q);
    expect(sinCategoria, "preguntas sin categoría válida").toEqual([]);
  });

  it("la pregunta española y la inglesa de cada posición comparten categoría", () => {
    expect(FAQ_EN.length).toBe(FAQ_ES.length);
    FAQ_ES.forEach((es, i) => {
      expect(FAQ_EN[i].categoria, `posición ${i}: «${es.q}»`).toBe(es.categoria);
    });
  });

  it("ninguna categoría de la página se queda vacía", () => {
    for (const categoria of CATEGORIAS) {
      expect(FAQ_ES.some((it) => it.categoria === categoria), `ES sin preguntas en «${categoria}»`).toBe(true);
      expect(FAQ_EN.some((it) => it.categoria === categoria), `EN sin preguntas en «${categoria}»`).toBe(true);
    }
  });

  it("la asignación es la de hoy, fijada por el texto de la pregunta", () => {
    expect(FAQ_ES.map((it) => it.q).sort()).toEqual(Object.keys(CATEGORIA_POR_PREGUNTA).sort());
    for (const it of FAQ_ES) {
      expect(it.categoria, it.q).toBe(CATEGORIA_POR_PREGUNTA[it.q]);
    }
  });
});

describe("los datos estructurados no publican la categoría", () => {
  it("cada pregunta del FAQPage lleva solo nombre y respuesta", () => {
    for (const entrada of jsonLdFaq(FAQ_ES).mainEntity) {
      expect(Object.keys(entrada).sort()).toEqual(["@type", "acceptedAnswer", "name"]);
    }
  });
});
