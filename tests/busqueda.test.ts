import { describe, expect, it } from "vitest";
import { coincide, paraBuscar } from "@/lib/busqueda";
import { FAQ_EN, FAQ_ES } from "@/lib/faq";

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

describe("coincide: espacios duros y varias palabras", () => {
  const precio = FAQ_ES.find((it) => /149\s\$/u.test(it.a))!;

  it("«149 $» y «10 %» tecleados con espacio normal encuentran el texto con espacio duro", () => {
    expect(precio).toBeDefined();
    expect(coincide("149 $", precio.q, precio.a)).toBe(true);
    expect(coincide("10 %", "un riesgo del 10 % por operación")).toBe(true);
    expect(coincide("10 %", "un riesgo del 10 % por operación")).toBe(true);
    expect(paraBuscar("10 %")).toBe(paraBuscar("10 %"));
  });

  it("dos palabras separadas en el texto se encuentran si están las dos", () => {
    expect(coincide("pago tarjeta", "¿Qué métodos de pago aceptáis? Con tarjeta.")).toBe(true);
    expect(coincide("tarjeta pago", "¿Qué métodos de pago aceptáis?", "Con tarjeta.")).toBe(true);
    expect(coincide("pago bitcoin", "¿Qué métodos de pago aceptáis? Con tarjeta.")).toBe(false);
  });

  it("la unión invisible de las rayas no parte la búsqueda", () => {
    expect(coincide("plan de riesgo", "tu plan⁠ de riesgo")).toBe(true);
  });

  it("vacía coincide con todo", () => {
    expect(coincide("   ", "lo que sea")).toBe(true);
  });
});
