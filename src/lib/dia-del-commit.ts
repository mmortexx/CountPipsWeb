/**
 * El día del calendario en que se hizo un commit, tal como lo escribe git
 * con `--format=%cI` («2026-09-25T01:40:57+02:00»), en ISO corto.
 *
 * Se toma el día del propio texto y no el de `Date#toISOString`: eso lo pasa
 * a UTC, y un commit hecho en España entre medianoche y las dos salía con la
 * fecha del día anterior —y el 1 de enero, con el año anterior—. Cadena vacía
 * si lo que llega no es una fecha de git.
 */
export function diaDelCommit(iso: string): string {
  const texto = iso.trim();
  const dia = /^(\d{4}-\d{2}-\d{2})T/.exec(texto)?.[1];
  if (!dia || Number.isNaN(new Date(texto).getTime())) return "";
  return dia;
}
