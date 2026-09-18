import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { G_NAV_MAP, SALTOS_TECLADO } from "@/lib/saltos-teclado";

// La ayuda de atajos y el teclado global leen la misma tabla; lo que queda
// por vigilar es que cada salto lleve a una página que existe.
describe("saltos g + letra", () => {
  it.each(SALTOS_TECLADO.map((s) => [s.tecla, s.ruta]))(
    "g %s lleva a %s, y esa página existe",
    (_tecla, ruta) => {
      const pagina = join(process.cwd(), "src", "app", ...ruta.split("/").filter(Boolean), "page.tsx");
      expect(existsSync(pagina), pagina).toBe(true);
    },
  );

  it("no repite tecla y todas son una minúscula", () => {
    const teclas = SALTOS_TECLADO.map((s) => s.tecla);
    expect(new Set(teclas).size).toBe(teclas.length);
    for (const t of teclas) expect(t).toMatch(/^[a-z]$/);
  });

  it("el mapa del teclado es la misma tabla", () => {
    expect(Object.keys(G_NAV_MAP)).toEqual(SALTOS_TECLADO.map((s) => s.tecla));
  });
});
