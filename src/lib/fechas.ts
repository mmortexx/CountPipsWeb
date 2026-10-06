import { execFileSync } from "node:child_process";

/**
 * Fecha de la última actualización del sitio, para el sitemap y los datos
 * estructurados: la del último commit. No vale `new Date()` (cada compilación
 * daría un mapa distinto sin cambios) ni una fecha escrita a mano (se congela
 * y miente). Sin git se usa el respaldo: compilar no puede fallar por fechar.
 */

/** Último recurso: solo se usa si `git` no responde. */
const RESPALDO = "2026-08-01T00:00:00.000Z";

function leerFechaDeGit(): Date | null {
  try {
    // `execFileSync` y no `execSync`: sin intérprete de comandos, y arranca antes.
    const iso = execFileSync("git", ["log", "-1", "--format=%cI"], {
      encoding: "utf8",
      // Fuera de un repositorio git escribe en stderr; no es un problema aquí.
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5_000,
    }).trim();
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/** Se calcula una vez al cargar el módulo: el sitemap la pide para cada dirección. */
export const ULTIMA_ACTUALIZACION: Date = leerFechaDeGit() ?? new Date(RESPALDO);

/** La misma fecha en `AAAA-MM-DD`, que es lo que piden los datos estructurados. */
export const ULTIMA_ACTUALIZACION_ISO: string = ULTIMA_ACTUALIZACION.toISOString().slice(0, 10);

/**
 * Fecha de primera publicación (`datePublished`): la del primer commit. Es
 * constante porque el primer commit no cambia; si se reescribe la historia,
 * hay que actualizarla a mano.
 */
export const PUBLICACION_ISO = "2026-07-20";

/**
 * Validez del precio en los datos estructurados de la oferta: un año desde la
 * última publicación, para que nunca caduque (pasada la fecha, el buscador
 * retira el precio).
 */
export const PRECIO_VALIDO_HASTA: string = new Date(
  Date.UTC(
    ULTIMA_ACTUALIZACION.getUTCFullYear() + 1,
    ULTIMA_ACTUALIZACION.getUTCMonth(),
    ULTIMA_ACTUALIZACION.getUTCDate(),
  ),
)
  .toISOString()
  .slice(0, 10);
