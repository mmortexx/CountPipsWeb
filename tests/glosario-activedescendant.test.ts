import { describe, expect, it } from "vitest";
import { idOpcionGlosario } from "@/components/tj/GlossaryModal";
import { GLOSSARY } from "@/lib/trading/glossary";

// `aria-activedescendant` del listbox del glosario apunta al `id` de la
// opción activa. Ese id lo calcula `idOpcionGlosario` a partir del
// término — tiene que ser válido como id HTML y, sobre todo, único: dos
// términos con el mismo id dejarían a `aria-activedescendant` apuntando
// a la opción equivocada (o a las dos a la vez).
describe("idOpcionGlosario", () => {
  it("compone un id legible a partir del término", () => {
    expect(idOpcionGlosario("Long")).toBe("glosario-opcion-long");
    expect(idOpcionGlosario("Prop firm")).toBe("glosario-opcion-prop-firm");
    expect(idOpcionGlosario("Stop loss")).toBe("glosario-opcion-stop-loss");
    expect(idOpcionGlosario("Risk-reward ratio")).toBe(
      "glosario-opcion-risk-reward-ratio"
    );
  });

  it("normaliza acentos y símbolos a algo válido como id HTML", () => {
    expect(idOpcionGlosario("P&L")).toBe("glosario-opcion-p-l");
    expect(idOpcionGlosario("Édge")).toBe("glosario-opcion-edge");
  });

  it("nunca deja el id vacío, ni con un término sin caracteres válidos", () => {
    expect(idOpcionGlosario("")).toBe("glosario-opcion-x");
    expect(idOpcionGlosario("...")).toBe("glosario-opcion-x");
  });

  it("cada término real del glosario produce un id distinto", () => {
    const ids = GLOSSARY.map((g) => idOpcionGlosario(g.term));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
