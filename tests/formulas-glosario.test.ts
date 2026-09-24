import { describe, expect, it } from "vitest";
import { FORMULAS_GLOSARIO } from "@/lib/glosario";

/* La leyenda de cada fórmula explica sus símbolos («σ: desviación estándar»).
   Un símbolo explicado que no está en la fórmula confunde al lector: el
   Sharpe definía «μ» mientras la fórmula escribía E[R]. */
const simbolosDeLeyenda = (variables: string) =>
  [...variables.matchAll(/(?:^|, )([^,:()]{1,8}): /g)].map((m) => m[1].trim());

describe("leyendas de las fórmulas del glosario", () => {
  for (const [termino, f] of Object.entries(FORMULAS_GLOSARIO)) {
    for (const idioma of ["Es", "En"] as const) {
      it(`${termino} (${idioma}): cada símbolo explicado aparece en la fórmula`, () => {
        const formula = f[`formula${idioma}`];
        const faltan = simbolosDeLeyenda(f[`variables${idioma}`]).filter((s) => !formula.includes(s));
        expect(faltan).toEqual([]);
      });
    }
  }

  it("la guarda lee de verdad los símbolos de la leyenda", () => {
    expect(simbolosDeLeyenda("μ: retorno medio, Rf: tasa, σd: desviación")).toEqual(["μ", "Rf", "σd"]);
  });
});
