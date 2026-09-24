import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * TEST_INFRA.md es el índice de lo que vigila cada prueba. Cuatro ficheros
 * llegaron a existir sin fila (barra-riesgo, saltos-teclado, sesiones,
 * variables): una guarda que nadie sabe que existe no se mantiene, y quien
 * la rompe no sabe qué estaba protegiendo.
 */
const RAIZ = join(import.meta.dirname, "..");
const indice = readFileSync(join(RAIZ, "TEST_INFRA.md"), "utf8");
const pruebas = (dir: string) =>
  readdirSync(join(RAIZ, dir)).filter((n) => n.endsWith(".test.ts"));

describe("TEST_INFRA.md nombra todas las pruebas", () => {
  it("hay pruebas que buscar", () => {
    expect(pruebas("tests").length).toBeGreaterThan(20);
    expect(pruebas("tests/e2e").length).toBeGreaterThan(5);
  });
  it.each([...pruebas("tests"), ...pruebas("tests/e2e")])("%s tiene su fila", (nombre) => {
    expect(indice.includes(`\`${nombre}\``), `${nombre} no aparece en TEST_INFRA.md`).toBe(true);
  });
});
