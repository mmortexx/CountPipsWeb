/**
 * El día del calendario en que se hizo un commit, tal como lo escribe git
 * con `--format=%cI` («2026-09-25T01:40:57+02:00»), en ISO corto.
 *
 * Se toma el día del propio texto y no el de `Date#toISOString`, que pasa a
 * UTC y atrasaría un día los commits hechos justo después de medianoche.
 * Cadena vacía si lo que llega no es una fecha de git.
 */
export function diaDelCommit(iso: string): string {
  const texto = iso.trim();
  const dia = /^(\d{4}-\d{2}-\d{2})T/.exec(texto)?.[1];
  if (!dia || Number.isNaN(new Date(texto).getTime())) return "";
  return dia;
}
