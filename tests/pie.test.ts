import { describe, expect, it } from "vitest";
import type { Lang } from "@/lib/locale";
import { columnasPie } from "@/lib/pie";

/**
 * Contrato del pie: dos columnas con el mismo rótulo en el mismo idioma
 * (p. ej. «Recursos» como título y como enlace) dejan a quien lee sin saber
 * cuál es cuál. Se compara sin mayúsculas ni espacios de sobra.
 */
const IDIOMAS: Lang[] = ["es", "en", "pt", "fr", "de", "it"];
const normaliza = (texto: string) => texto.trim().replace(/\s+/g, " ").toLowerCase();

describe("Pie del sitio", () => {
  it.each(IDIOMAS)("en %s, ningún texto se repite entre títulos y enlaces", (lang) => {
    const cols = columnasPie(lang);
    const textos = cols
      .flatMap((c) => [c.title, ...c.links.map((l) => l.label)])
      .map(normaliza);
    const repetidos = textos.filter((t, i) => textos.indexOf(t) !== i);
    expect(repetidos).toEqual([]);
  });

  it.each(IDIOMAS)("en %s, cada columna tiene título y al menos un enlace", (lang) => {
    for (const col of columnasPie(lang)) {
      expect(normaliza(col.title)).not.toBe("");
      expect(col.links.length).toBeGreaterThan(0);
      for (const enlace of col.links) expect(normaliza(enlace.label)).not.toBe("");
    }
  });
});
