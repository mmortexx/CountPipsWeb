import { describe, expect, it } from "vitest";
import { paraBuscar } from "@/lib/busqueda";
import { FAQ_EN } from "@/lib/faq";

/**
 * El texto inglés lleva el apóstrofo tipográfico (’) y el teclado escribe el
 * recto ('): sin plegarlos, «what's» no encuentra «What’s the difference…».
 */
const encuentra = (consulta: string, texto: string) =>
  paraBuscar(texto).includes(paraBuscar(consulta));

describe("paraBuscar", () => {
  it("el apóstrofo del teclado encuentra el tipográfico, y al revés", () => {
    expect(encuentra("what's", "What’s the difference between Core and Pro?")).toBe(true);
    expect(encuentra("what’s", "What's new")).toBe(true);
  });
  it("sin tildes ni mayúsculas", () => {
    expect(encuentra("calculo", "Cálculo del riesgo")).toBe(true);
    expect(encuentra("RIESGO", "riesgo")).toBe(true);
  });
  it("cada pregunta inglesa de la FAQ se encuentra escribiéndola con el teclado", () => {
    for (const it of FAQ_EN) {
      expect(encuentra(it.q.replace(/[‘’]/g, "'"), it.q), it.q).toBe(true);
    }
  });
});
