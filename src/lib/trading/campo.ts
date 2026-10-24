import type { Lang } from "@/lib/locale";
import { cifraReposo, leeCifra } from "@/lib/trading/format";

/** Lo que dice un campo de cifra de lo que hay escrito:
 *  - `valor`: una cifra dentro del rango.
 *  - `en-curso`: aún no hay cifra, pero puede llegar (vacío, «-», «,», «$»).
 *  - `invalida`: no se lee o cae fuera del rango. No se recorta ni se sustituye
 *    por otra: el campo lo marca y dice el rango. */
export type LecturaCampo =
  | { tipo: "valor"; valor: number }
  | { tipo: "en-curso" }
  | { tipo: "invalida" };

/* Solo signos, separadores y símbolos de moneda o %: nadie ha escrito aún una cifra. */
const SIN_CIFRA = /^[\s+\-−.,%\p{Sc}]*$/u;

export function leeBorrador(texto: string, lang: Lang, decimales: number, min = -Infinity, max = Infinity): LecturaCampo {
  const n = leeCifra(texto, lang, decimales);
  if (n === null) return SIN_CIFRA.test(texto) ? { tipo: "en-curso" } : { tipo: "invalida" };
  return n >= min && n <= max ? { tipo: "valor", valor: n } : { tipo: "invalida" };
}

/** El aviso de un campo inválido, con el rango que sí vale. */
export function mensajeRango(min: number | undefined, max: number | undefined, lang: Lang): string {
  const es = lang === "es";
  const desde = min !== undefined && Number.isFinite(min) ? cifraReposo(min, lang) : null;
  const hasta = max !== undefined && Number.isFinite(max) ? cifraReposo(max, lang) : null;
  if (desde !== null && hasta !== null) {
    return es ? `Escribe una cifra entre ${desde} y ${hasta}.` : `Enter a number between ${desde} and ${hasta}.`;
  }
  if (hasta !== null) return es ? `Escribe una cifra de hasta ${hasta}.` : `Enter a number up to ${hasta}.`;
  if (desde !== null) return es ? `Escribe una cifra de al menos ${desde}.` : `Enter a number of at least ${desde}.`;
  return es ? "Escribe una cifra." : "Enter a number.";
}
