import { describe, expect, it } from "vitest";
import { CONEXIONES, LO_QUE_VA_SOLO, RESUMEN_SEGURIDAD } from "@/lib/conexiones";
import { FAQ_EN, FAQ_ES } from "@/lib/faq";

/**
 * «Lo que se conecta a internet lo activas tú» era falso: la licencia se
 * comprueba sola. Cada texto que resume la lista de conexiones tiene que
 * nombrar las que van solas, y cada fila tiene que decir en su propia
 * redacción si depende de ti o no.
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
  it("hay al menos una que va sola: si no, la prueba no vigila nada", () => {
    expect(solas.length).toBeGreaterThan(0);
  });

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
  ];

  it.each(textos)("%s nombra cada conexión que va sola", (_, texto, l) => {
    for (const c of solas) {
      expect(texto.toLowerCase(), `falta «${c[l].nombre}»`).toContain(c[l].nombre.toLowerCase());
    }
  });
});
