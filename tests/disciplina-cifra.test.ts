import { describe, expect, it } from "vitest";
import { QUESTIONS, type DimId } from "@/lib/trading/disciplineQuestions";
import { DIMS, puntuar } from "@/components/marketing/DisciplineScore";

/* La cifra global es la media de los ejes ponderada por el peso de cada eje.
   Antes se ponderaba cada pregunta por su peso y además por el del eje, y un
   eje con más preguntas, o más pesadas, contaba más de lo que dice su peso. */

const todas = (valor: (dim: DimId) => number) => QUESTIONS.map((q) => valor(q.dim));

describe("test de disciplina: la cifra global", () => {
  it("riesgo a 0 y el resto al máximo da la media de los otros ejes por su peso", () => {
    const { score, perDim } = puntuar(todas((d) => (d === "riesgo" ? 0 : 3)));
    expect(perDim.find((e) => e.dim.id === "riesgo")?.pct).toBe(0);
    const pesoTotal = DIMS.reduce((s, d) => s + d.weight, 0);
    const pesoRiesgo = DIMS.find((d) => d.id === "riesgo")!.weight;
    expect(score).toBe(Math.round((100 * (pesoTotal - pesoRiesgo)) / pesoTotal));
  });

  it("todo al máximo da 100 y todo a cero da 0", () => {
    expect(puntuar(todas(() => 3)).score).toBe(100);
    expect(puntuar(todas(() => 0)).score).toBe(0);
  });

  it("a medias solo cuentan los ejes con alguna respuesta", () => {
    const respuestas: (number | null)[] = QUESTIONS.map(() => null);
    respuestas[QUESTIONS.findIndex((q) => q.dim === "plan")] = 3;
    const { score, perDim } = puntuar(respuestas);
    expect(score).toBe(100);
    expect(perDim.filter((e) => e.respondidas).map((e) => e.dim.id)).toEqual(["plan"]);
  });
});
