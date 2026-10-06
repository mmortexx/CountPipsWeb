/**
 * Puente entre las curvas del CSS (`--ease-suave`, `--ease-salida`,
 * `--ease-entrada-salida` en `globals.css`) y JavaScript: `el.animate()` no
 * resuelve `var(--…)` en `easing` y lanza un TypeError. Se lee el valor real
 * del documento, así la hoja de estilos sigue siendo la única fuente, y se
 * memoriza porque `getComputedStyle` fuerza el cálculo de estilos.
 */

/** Valores de respaldo, por si se pide la curva antes de que haya CSS. */
const RESPALDO: Record<string, string> = {
  "--ease-suave": "cubic-bezier(0.22, 1, 0.36, 1)",
  "--ease-salida": "cubic-bezier(0.16, 1, 0.3, 1)",
  "--ease-entrada-salida": "cubic-bezier(0.76, 0, 0.24, 1)",
};

const cache = new Map<string, string>();

/**
 * Devuelve la curva declarada en el CSS, lista para `el.animate()`.
 *
 * @param nombre Nombre de la propiedad personalizada, con los dos guiones.
 */
export function curva(nombre: keyof typeof RESPALDO | string): string {
  const enCache = cache.get(nombre);
  if (enCache) return enCache;

  let valor = RESPALDO[nombre] ?? "ease";
  if (typeof window !== "undefined") {
    const leido = getComputedStyle(document.documentElement)
      .getPropertyValue(nombre)
      .trim();
    if (leido) valor = leido;
  }
  cache.set(nombre, valor);
  return valor;
}
