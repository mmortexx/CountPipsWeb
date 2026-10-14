import type { Lang } from "./locale";
import { deFr, LOCALE_FECHA } from "./trading/format";

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

const NOTA_CORTE: Record<Lang, (corte: string) => string> = {
  es: (corte) => `Cifras a ${corte}.`,
  en: (corte) => `Figures as of ${corte}.`,
  pt: (corte) => `Números em ${corte}.`,
  fr: (corte) => `Chiffres ${deFr(corte)}.`,
  de: (corte) => `Stand der Zahlen: ${corte}.`,
  it: (corte) => `Dati a ${corte}.`,
};

/** «Cifras a octubre de 2026.»: la nota de corte de la banda de cifras. Vacía sin fecha de publicación. */
export function notaCorte(lang: Lang, fechaIso: string): string {
  if (!fechaIso) return "";
  const corte = new Date(fechaIso).toLocaleDateString(LOCALE_FECHA[lang], { year: "numeric", month: "long", timeZone: "UTC" });
  return NOTA_CORTE[lang](corte);
}
