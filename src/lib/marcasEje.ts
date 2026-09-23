/**
 * Marcas de eje en cifras redondas: 1 · 2 · 2,5 · 5 por su potencia de
 * diez, como las pone quien dibuja un gráfico a mano. Repartir el eje en
 * fracciones fijas del rango daba «801 k · 1,8 M · 2,88 M · 3,93 M», que
 * obliga a leer cada cifra en vez de la escala.
 */
export function pasoRedondo(rango: number, marcas = 4): number {
  if (!(rango > 0) || !Number.isFinite(rango)) return 1;
  const bruto = rango / Math.max(1, marcas);
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const f = bruto / potencia;
  const redondo = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return redondo * potencia;
}

/** Múltiplos del paso redondo que caen dentro de [min, max], ambos incluidos. */
export function marcasRedondas(min: number, max: number, marcas = 4): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return [];
  const paso = pasoRedondo(max - min, marcas);
  const salida: number[] = [];
  for (let k = Math.ceil(min / paso - 1e-9); k * paso <= max + paso * 1e-9; k++) {
    // `+ 0` convierte el −0 que deja `Math.ceil(-ε)` en un cero normal.
    salida.push(Math.round(k * paso * 1e6) / 1e6 + 0);
  }
  return salida;
}
