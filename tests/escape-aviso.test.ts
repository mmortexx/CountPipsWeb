import { describe, expect, it } from "vitest";
import { escapeRechazaAviso } from "@/lib/consent";

/** Aviso mínimo: `contains` solo reconoce el nodo que se le da, como el DOM. */
const aviso = (dentro: unknown) => ({ contains: (n: unknown) => n === dentro });

describe("Escape en el aviso de cookies", () => {
  it("rechaza cuando el foco está dentro del aviso", () => {
    const dentro = {};
    expect(escapeRechazaAviso("Escape", dentro, aviso(dentro))).toBe(true);
  });

  it("no rechaza cuando el foco está fuera del aviso", () => {
    const dentro = {};
    const fuera = {};
    expect(escapeRechazaAviso("Escape", fuera, aviso(dentro))).toBe(false);
  });

  it("otra tecla con el foco dentro no rechaza", () => {
    const dentro = {};
    expect(escapeRechazaAviso("Enter", dentro, aviso(dentro))).toBe(false);
  });

  it("sin aviso montado no rechaza", () => {
    expect(escapeRechazaAviso("Escape", {}, null)).toBe(false);
  });
});
