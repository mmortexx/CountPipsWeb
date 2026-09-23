/**
 * Generador pseudoaleatorio mulberry32: la misma semilla da siempre la
 * misma secuencia. Lo usan los datos de la demo y los simuladores, que así
 * pintan lo mismo en el servidor y en el navegador.
 */
export function mulberry32(semilla: number): () => number {
  let a = semilla | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
