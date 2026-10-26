import { describe, expect, it } from "vitest";
import { cabeceraGlosario } from "@/components/tj/GlossaryModal";
import { GLOSSARY } from "@/lib/trading/glossary";

// La cabecera explica cómo se nombran los términos: no puede prometer que todos
// siguen en inglés mientras la lista enseñe algunos con su nombre en español.
describe("cabeceraGlosario", () => {
  const conNombreEs = GLOSSARY.filter((g) => g.nombreEs);

  it("en español no dice que todo va sin traducir si hay términos con nombre propio", () => {
    expect(conNombreEs.length).toBeGreaterThan(0);
    const { titulo, descripcion } = cabeceraGlosario(true);
    expect(`${titulo} ${descripcion}`).not.toMatch(/sin traducir|se mantienen en inglés/i);
    expect(descripcion).toMatch(/español/);
  });

  it("título y entradilla existen en los dos idiomas y son distintos", () => {
    const es = cabeceraGlosario(true);
    const en = cabeceraGlosario(false);
    for (const c of [es, en]) {
      expect(c.titulo.trim()).not.toBe("");
      expect(c.descripcion.trim()).not.toBe("");
    }
    expect(es.titulo).not.toBe(en.titulo);
  });
});
