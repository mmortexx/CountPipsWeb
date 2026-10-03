import { describe, expect, it } from "vitest";
import {
  DESCRIPCION_A_MANO,
  LARGO_MAXIMO_DESCRIPCION,
  LARGO_MINIMO_DESCRIPCION,
  TERMINOS,
  cortePorFrases,
  descripcionDeTermino,
} from "@/lib/glosario";

/* La descripción de cada ficha del glosario es lo que se lee en el
   buscador y al compartir el enlace. Se recortaba a 152 caracteres a
   ciegas: 90 de 114 acababan en «…» a media palabra. */
describe("la descripción de cada término es una frase entera", () => {
  it("entre 70 y 155 caracteres, cerrada, sin puntos suspensivos ni paréntesis abiertos", () => {
    const malas: string[] = [];
    for (const t of TERMINOS) {
      for (const lang of ["es", "en"] as const) {
        const d = descripcionDeTermino(t, lang);
        const abiertos = (d.match(/\(/g) || []).length - (d.match(/\)/g) || []).length;
        if (
          d.length < LARGO_MINIMO_DESCRIPCION ||
          d.length > LARGO_MAXIMO_DESCRIPCION ||
          d.endsWith("…") ||
          !/[.!?»)]$/.test(d) ||
          abiertos !== 0
        )
          malas.push(`${lang} ${t.slug} [${d.length}] ${d}`);
      }
    }
    expect(malas).toEqual([]);
  });

  it("la descripción a mano solo existe donde el recorte por frases no basta", () => {
    const sobran: string[] = [];
    for (const [slug, porIdioma] of Object.entries(DESCRIPCION_A_MANO)) {
      const t = TERMINOS.find((x) => x.slug === slug);
      if (!t) {
        sobran.push(`${slug}: no es un término`);
        continue;
      }
      for (const lang of ["es", "en"] as const) {
        if (porIdioma[lang] && cortePorFrases(lang === "es" ? t.es : t.en) !== null)
          sobran.push(`${lang} ${slug}: el recorte automático ya da una frase entera`);
      }
    }
    expect(sobran).toEqual([]);
  });

  it("el recorte no confunde «p. ej.» ni un decimal con un final de frase", () => {
    const larga = "Ventana en la que mejor funcionan tus setups (p. ej. la apertura de Londres) con un payoff de 0.4 o más. Segunda frase de relleno que lleva el total por encima del tope.";
    expect(larga.length).toBeGreaterThan(LARGO_MAXIMO_DESCRIPCION);
    expect(cortePorFrases(larga)).toBe(larga.slice(0, larga.indexOf(" Segunda")));
    expect(cortePorFrases(`${larga.slice(0, larga.indexOf(". Segunda"))}; segunda parte que no cabe y que sigue y sigue hasta pasar del tope.`)).toBe(larga.slice(0, larga.indexOf(" Segunda")));
  });
});
