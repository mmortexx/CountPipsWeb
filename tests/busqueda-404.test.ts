import { describe, expect, it } from "vitest";
import { destinoDeBusqueda } from "@/lib/busqueda";
import { TERMINOS } from "@/lib/glosario";

/**
 * La caja de la página 404 dice «Métrica o pregunta…»: una métrica tiene que
 * llevar a su voz del glosario, y el resto a la FAQ filtrada.
 */
describe("destinoDeBusqueda", () => {
  it("el nombre de una voz lleva a ella, sin tildes ni mayúsculas y en los dos idiomas", () => {
    expect(destinoDeBusqueda("drawdown", TERMINOS)).toBe("/glosario/drawdown");
    expect(destinoDeBusqueda("  Apalancamiento ", TERMINOS)).toBe("/glosario/leverage");
    expect(destinoDeBusqueda("leverage", TERMINOS)).toBe("/glosario/leverage");
  });

  it("la sigla y la expansión entre paréntesis también", () => {
    expect(destinoDeBusqueda("mae", TERMINOS)).toBe("/glosario/mae-maximum-adverse-excursion");
    expect(destinoDeBusqueda("System Quality Number", TERMINOS)).toBe("/glosario/sqn-system-quality-number");
  });

  it("lo demás va a la FAQ con la consulta, y vacío a la FAQ sin más", () => {
    expect(destinoDeBusqueda("¿cuánto cuesta?", TERMINOS)).toBe(`/faq?q=${encodeURIComponent("¿cuánto cuesta?")}`);
    expect(destinoDeBusqueda("   ", TERMINOS)).toBe("/faq");
  });

  it("cada voz se encuentra escribiendo su nombre", () => {
    for (const t of TERMINOS) {
      expect(destinoDeBusqueda(t.term, TERMINOS), t.term).toBe(`/glosario/${t.slug}`);
      if (t.nombreEs) expect(destinoDeBusqueda(t.nombreEs, TERMINOS), t.nombreEs).toBe(`/glosario/${t.slug}`);
    }
  });
});
