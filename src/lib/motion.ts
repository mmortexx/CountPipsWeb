/**
 * Puente entre los tokens de movimiento del CSS (`--ease-*` y `--dur-*` en
 * `globals.css`) y JavaScript: `el.animate()` no resuelve `var(--…)` y lanza
 * un TypeError. Se lee el valor real del documento, así la hoja de estilos
 * sigue siendo la única fuente, y se memoriza porque `getComputedStyle` fuerza
 * el cálculo de estilos.
 */

/** Valores de respaldo, por si se piden antes de que haya CSS. */
const RESPALDO = {
  "--ease-suave": "cubic-bezier(0.22, 1, 0.36, 1)",
  "--ease-acelera": "cubic-bezier(0.4, 0, 1, 1)",
  "--dur-pulsa": "100ms",
  "--dur-estado": "150ms",
  "--dur-abre": "220ms",
  "--dur-entra": "320ms",
  "--escalon": "40ms",
} as const;

type Curva = "--ease-suave" | "--ease-acelera";
type Duracion = "--dur-pulsa" | "--dur-estado" | "--dur-abre" | "--dur-entra" | "--escalon";

const cache = new Map<string, string>();

function token(nombre: keyof typeof RESPALDO): string {
  const enCache = cache.get(nombre);
  if (enCache) return enCache;
  let valor: string = RESPALDO[nombre];
  if (typeof window !== "undefined") {
    const leido = getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
    if (leido) valor = leido;
  }
  cache.set(nombre, valor);
  return valor;
}

/** La curva declarada en el CSS, lista para `el.animate()`. */
export function curva(nombre: Curva): string {
  return token(nombre);
}

/** La duración declarada en el CSS, en milisegundos. */
export function duracion(nombre: Duracion): number {
  const v = token(nombre);
  const n = parseFloat(v);
  return v.endsWith("ms") ? n : n * 1000;
}
