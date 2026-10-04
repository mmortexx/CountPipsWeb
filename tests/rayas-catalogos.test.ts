import { describe, expect, it } from "vitest";
import { STR } from "@/lib/i18n";
import { GLOSSARY } from "@/lib/trading/glossary";
import { FAQ_ES, PRICING_FAQ_ES } from "@/lib/faq";
import { LAMINAS_PRODUCTO } from "@/lib/laminas";

/**
 * LA RAYA DE INCISO EN EL TEXTO ESPAÑOL DE LOS CATÁLOGOS.
 *
 * `tests/vocabulario.test.ts` y `scripts/cifras.mjs` leen el HTML compilado,
 * y la demo se pinta en el navegador: sus textos no están en ese HTML. La
 * revisión visual encontró «Ritual del día — Antes y después de operar» en
 * el Diario de la demo, con la raya inglesa (espaciada) en mitad de un
 * título español. Aquí se miran los catálogos de los que sale ese texto.
 *
 * Dos reglas: la raya no lleva espacio a los dos lados (eso es inglés), y
 * la que va pegada a una palabra lleva U+2060 para que el renglón no la
 * separe de ella («la mitad» al final de una línea y «— con…» en la
 * siguiente).
 */
const textos: { origen: string; texto: string }[] = [
  ...Object.entries(STR).map(([k, v]) => ({ origen: `i18n.${k}`, texto: (v as { es: string }).es })),
  ...GLOSSARY.map((g) => ({ origen: `glosario.${g.term}`, texto: g.es })),
  ...[...FAQ_ES, ...PRICING_FAQ_ES].map((q) => ({ origen: `faq «${q.q.slice(0, 30)}»`, texto: `${q.q} ${q.a}` })),
  ...Object.entries(LAMINAS_PRODUCTO).map(([k, l]) => ({ origen: `lámina.${k}`, texto: l.altEs })),
];

describe("la raya de inciso en el español de los catálogos", () => {
  it("hay texto que revisar", () => {
    expect(textos.length).toBeGreaterThan(150);
  });

  it("no lleva espacio a los dos lados", () => {
    const mal = textos.filter((t) => /\S — \S/.test(t.texto)).map((t) => `${t.origen}: ${t.texto.slice(0, 70)}`);
    expect(mal, "En español la raya de inciso va pegada a lo que abre y cierra, o se resuelve con dos puntos").toEqual([]);
  });

  it("la que va pegada a una palabra no se puede separar de ella", () => {
    const mal = textos
      .filter((t) => /[\p{L}\d.,)»”]—|—[\p{L}\d(«“]/u.test(t.texto))
      .map((t) => `${t.origen}: ${t.texto.slice(0, 70)}`);
    expect(mal, "Une la raya a su palabra con \\u2060").toEqual([]);
  });
});
