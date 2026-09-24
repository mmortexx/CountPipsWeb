/** Nivel, en palabra, de cuánto de la ganancia bruta se va en costes.
 *  `costDragPct` va en escala 0–100 (ya multiplicado, no un ratio 0–1). */
export type NivelFugaComisiones = "alto" | "moderado" | "bajo";

/**
 * El color de «Parte de la ganancia» (rojo / ámbar / verde) no llevaba
 * palabra: quien no distingue el color por daltonismo o porque su lector de
 * pantalla no anuncia el estilo, no se enteraba de si el dato era bueno o
 * malo. Misma frontera que ya pintaba el componente: >30 alto, >15
 * moderado, el resto bajo.
 */
export function clasificaFugaComisiones(costDragPct: number): NivelFugaComisiones {
  if (costDragPct > 30) return "alto";
  if (costDragPct > 15) return "moderado";
  return "bajo";
}
