import type { GlossaryTerm } from "@/lib/trading/glossary";

/**
 * Nombre y dirección de una voz del glosario, aparte de los datos: lo usan
 * páginas que no deben cargar el diccionario entero (`scripts/equipaje.mjs`).
 */

/** Nombre que se enseña en cada idioma: el español si lo tiene, si no el inglés. */
export function nombreTermino(t: GlossaryTerm, lang: string): string {
  return lang === "es" ? (t.nombreEs ?? t.term) : t.term;
}

/** «Risk-reward ratio» → «risk-reward-ratio». La dirección sale siempre del nombre inglés. */
export function slugTermino(term: string): string {
  return term
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
