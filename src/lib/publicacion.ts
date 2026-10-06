/**
 * Año de publicación de esta compilación, para el copyright. No sale de
 * `new Date()`: el HTML se compila una vez y el año del navegador difiere del
 * del servidor tras el 1 de enero (error de hidratación #418).
 *
 * Lo inyecta `next.config.ts` desde la fecha del último commit (como
 * `fechas.ts`, que no se puede importar desde cliente por leer
 * `node:child_process`). El respaldo cubre compilaciones sin `next.config.ts`,
 * como las pruebas.
 */
export const ANIO_PUBLICACION: string =
  process.env.NEXT_PUBLIC_ANIO_PUBLICACION || "2026";

/**
 * Fecha completa de la misma compilación, en ISO (`2026-09-17`). El respaldo
 * es la cadena vacía: una fecha inventada afirmaría algo no comprobado, y sin
 * git el pie simplemente omite la línea.
 */
export const FECHA_PUBLICACION: string =
  process.env.NEXT_PUBLIC_FECHA_PUBLICACION || "";
