/**
 * Puente entre las curvas de movimiento del CSS y las que necesita
 * JavaScript.
 *
 * ── POR QUÉ HACE FALTA ────────────────────────────────────────────────
 * Las curvas viven en `globals.css` como `--ease-suave`, `--ease-salida`
 * y `--ease-entrada-salida`, para no tenerlas repetidas a mano por la
 * hoja. Pero la Web Animations API (`el.animate()`) NO resuelve
 * variables CSS en su campo `easing`: recibe la cadena tal cual, y si le
 * llega `var(--ease-suave)` lanza
 *
 *   TypeError: Failed to execute 'animate' on 'Element':
 *   'var(--ease-suave)' is not a valid value for easing
 *
 * y la animación entera no llega a existir. Lo pilló la comprobación de
 * humo (`scripts/humo.mjs`) en las doce rutas a la vez.
 *
 * Aquí se resuelve el valor REAL leyéndolo del documento, así que sigue
 * habiendo una sola fuente de verdad —la hoja de estilos— y JavaScript
 * recibe la cadena literal que la API espera. Se memoriza porque
 * `SectionReveal` puede animar decenas de elementos y `getComputedStyle`
 * fuerza al navegador a calcular estilos.
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
