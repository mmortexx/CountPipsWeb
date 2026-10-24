import { describe, expect, it } from "vitest";
import { QUESTIONS, notaParcial } from "@/lib/trading/disciplineQuestions";

const N = QUESTIONS.length;

describe("test de disciplina: una cifra a medias se dice a medias", () => {
  it("tras una sola respuesta avisa de cuántas lleva: «1 de N respondidas», no un «100 / 100» a secas", () => {
    expect(notaParcial(1, N, "es")).toBe(`Provisional: 1 de ${N} respondidas.`);
    expect(notaParcial(1, N, "en")).toBe(`Provisional: 1 of ${N} answered.`);
  });

  it("a mitad y a una del final también", () => {
    expect(notaParcial(7, N, "es")).toBe(`Provisional: 7 de ${N} respondidas.`);
    expect(notaParcial(N - 1, N, "es")).toBe(`Provisional: ${N - 1} de ${N} respondidas.`);
  });

  it("sin respuestas (la cifra es «—») o con todas (ya hay veredicto) no dice nada", () => {
    expect(notaParcial(0, N, "es")).toBeNull();
    expect(notaParcial(N, N, "es")).toBeNull();
    expect(notaParcial(N, N, "en")).toBeNull();
  });

  it("el número de preguntas sale de las preguntas, no de una cifra a mano", () => {
    expect(N).toBeGreaterThan(1);
    expect(notaParcial(1, N, "es")).toContain(` de ${N} `);
  });
});
