import { describe, expect, it } from "vitest";
import { CONEXIONES, ENTRADILLA_FICHA_TECNICA, LO_QUE_VA_SOLO, RESUMEN_SEGURIDAD } from "@/lib/conexiones";
import { FAQ_EN, FAQ_ES } from "@/lib/faq";

/**
 * Cada texto que resume las conexiones debe nombrar las que van solas o, si no
 * va ninguna, decirlo; y cada fila debe decir si depende del usuario. Que la
 * lista es la del programa lo comprueba `programa.test.ts`.
 */

const CONDICION = {
  es: /\b(si|solo cuando|al pulsar)\b/i,
  en: /\b(if|only when|when you press)\b/i,
};
const solas = CONEXIONES.filter((c) => c.automatica);

function respuesta(faq: { q: string; a: string }[], pregunta: string) {
  const qa = faq.find((x) => x.q === pregunta);
  if (!qa) throw new Error(`no está la pregunta «${pregunta}»`);
  return qa.a;
}

describe("conexiones del programa", () => {
  it.each(CONEXIONES.flatMap((c) => (["es", "en"] as const).map((l) => [l, c] as const)))(
    "%s: la fila dice si depende de ti, y casa con `automatica`",
    (l, c) => {
      expect(CONDICION[l].test(c[l].que), `${c[l].nombre}: «${c[l].que}»`).toBe(!c.automatica);
    },
  );

  const textos: [string, string, "es" | "en"][] = [
    ["FAQ ES «¿Mis datos están seguros?»", respuesta(FAQ_ES, "¿Mis datos están seguros?"), "es"],
    ["FAQ EN «Is my data safe?»", respuesta(FAQ_EN, "Is my data safe?"), "en"],
    ["entradilla de seguridad ES", RESUMEN_SEGURIDAD.es, "es"],
    ["entradilla de seguridad EN", RESUMEN_SEGURIDAD.en, "en"],
    ["LO_QUE_VA_SOLO ES", LO_QUE_VA_SOLO.es, "es"],
    ["LO_QUE_VA_SOLO EN", LO_QUE_VA_SOLO.en, "en"],
    ["entradilla de la ficha técnica ES", ENTRADILLA_FICHA_TECNICA.es, "es"],
    ["entradilla de la ficha técnica EN", ENTRADILLA_FICHA_TECNICA.en, "en"],
  ];

  const NINGUNA = { es: /nada se conecta solo/i, en: /nothing connects on its own/i };

  it.each(textos)("%s nombra cada conexión que va sola, o dice que no va ninguna", (_, texto, l) => {
    expect(NINGUNA[l].test(texto), `«${texto}»`).toBe(solas.length === 0);
    for (const c of solas) {
      expect(texto.toLowerCase(), `falta «${c[l].nombre}»`).toContain(c[l].nombre.toLowerCase());
    }
  });

});
