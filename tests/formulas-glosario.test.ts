import { describe, expect, it } from "vitest";
import { DESCRIPCION_A_MANO, FORMULAS_GLOSARIO } from "@/lib/glosario";
import { AMPLIADO } from "@/lib/glosario-ampliado";
import { GLOSSARY } from "@/lib/trading/glossary";

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

  /* La expectancy multiplica WR por la ganancia media: WR es una proporción (0–1).
     La ficha del win rate lo definía «× 100» con la misma letra. */
  it("WR es la misma magnitud en todas las fórmulas: ninguna la multiplica por 100", () => {
    const conWR = Object.entries(FORMULAS_GLOSARIO).filter(([, f]) => /\bWR\b/.test(f.formulaEs));
    expect(conWR.length).toBeGreaterThan(1);
    for (const [termino, f] of conWR) {
      expect(f.formulaEs, termino).not.toMatch(/×\s*100/);
      expect(f.formulaEn, termino).not.toMatch(/×\s*100/);
    }
  });
});

/** Cada texto en español (claves `es` o `…Es`) o en inglés de un objeto, recorrido entero. */
function textos(obj: unknown, idioma: "es" | "en", dentro = false): string[] {
  if (typeof obj === "string") return dentro ? [obj] : [];
  if (!obj || typeof obj !== "object") return [];
  return Object.entries(obj).flatMap(([k, v]) =>
    textos(v, idioma, dentro || k === idioma || k.endsWith(idioma === "es" ? "Es" : "En")),
  );
}

describe("el glosario nombra cada cosa de una sola forma", () => {
  const es = textos([GLOSSARY, FORMULAS_GLOSARIO, AMPLIADO, DESCRIPCION_A_MANO], "es");
  const en = textos([GLOSSARY, FORMULAS_GLOSARIO, AMPLIADO, DESCRIPCION_A_MANO], "en");

  it("en español, «deslizamiento» (su ficha se titula así) y «bróker», como el resto del sitio", () => {
    expect(es.length).toBeGreaterThan(200);
    expect(es.filter((t) => /\bslippage\b/i.test(t))).toEqual([]);
    expect(es.filter((t) => /\bbroker\b/.test(t))).toEqual([]);
  });

  it("en inglés, «win rate» y no «hit rate»", () => {
    expect(en.length).toBeGreaterThan(200);
    expect(en.filter((t) => /\bhit rate\b/i.test(t))).toEqual([]);
  });
});
