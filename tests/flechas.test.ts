import { describe, expect, it } from "vitest";
import { destinoConFlechas } from "@/lib/flechas";

// Los grupos de opción y las pestañas se mueven con esta función: un lector
// de pantalla anuncia «1 de 4» y las flechas deben cumplirlo.
describe("destinoConFlechas", () => {
  it("avanza y retrocede, y da la vuelta en los extremos", () => {
    expect(destinoConFlechas("ArrowRight", 0, 4)).toBe(1);
    expect(destinoConFlechas("ArrowRight", 3, 4)).toBe(0);
    expect(destinoConFlechas("ArrowLeft", 0, 4)).toBe(3);
    expect(destinoConFlechas("ArrowDown", 2, 4)).toBe(3);
    expect(destinoConFlechas("ArrowUp", 0, 4)).toBe(3);
  });

  it("Inicio y Fin saltan a los extremos", () => {
    expect(destinoConFlechas("Home", 2, 5)).toBe(0);
    expect(destinoConFlechas("End", 0, 5)).toBe(4);
  });

  it("en las pestañas, ↑ y ↓ no mueven: desplazan la página", () => {
    expect(destinoConFlechas("ArrowDown", 0, 2, true)).toBeNull();
    expect(destinoConFlechas("ArrowUp", 1, 2, true)).toBeNull();
    expect(destinoConFlechas("ArrowRight", 1, 2, true)).toBe(0);
  });

  it("cualquier otra tecla, o un grupo vacío, no mueve", () => {
    expect(destinoConFlechas("Tab", 0, 4)).toBeNull();
    expect(destinoConFlechas(" ", 0, 4)).toBeNull();
    expect(destinoConFlechas("ArrowRight", 0, 0)).toBeNull();
  });
});
