import { describe, expect, it } from "vitest";
import { GLOSSARY_CATEGORIES } from "@/lib/trading/glossary";
import { CATEGORIAS, ORDEN_CATEGORIAS } from "@/lib/glosario";

// El diálogo del glosario (Ctrl+G) y la página /glosario tienen cada uno su
// lista de familias: deben coincidir en orden y nombre.
describe("las familias del glosario", () => {
  it("salen en el mismo orden y con el mismo nombre en el diálogo y en la página", () => {
    const dialogo = GLOSSARY_CATEGORIES.filter((c) => c.id !== "all").map((c) => `${c.id}:${c.es}:${c.en}`);
    const pagina = ORDEN_CATEGORIAS.map((id) => `${id}:${CATEGORIAS[id].es}:${CATEGORIAS[id].en}`);
    expect(dialogo).toEqual(pagina);
  });
});
