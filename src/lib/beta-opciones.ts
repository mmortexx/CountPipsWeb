/**
 * Opciones del formulario de acceso anticipado: el valor que viaja y su texto
 * en cada idioma. El formulario las pinta y el correo al titular las traduce
 * con `etiquetaEs`, para que llegue «3+ años» y no «3-plus».
 */

export type Opcion = { value: string; es: string; en: string };

export const PERFILES = [
  { value: "manual", es: "Operativa manual", en: "Manual trading" },
  { value: "prop", es: "Prop firm / evaluación", en: "Prop firm / evaluation" },
] as const satisfies readonly Opcion[];

export const EXPERIENCIAS = [
  { value: "under-1", es: "Menos de 1 año", en: "Under 1 year" },
  { value: "1-3", es: "1–3 años", en: "1–3 years" },
  { value: "3-plus", es: "3+ años", en: "3+ years" },
] as const satisfies readonly Opcion[];

export const DIARIOS = [
  { value: "spreadsheet", es: "Excel / Sheets", en: "Excel / Sheets" },
  { value: "journal", es: "Otro diario", en: "Another journal" },
  { value: "notes", es: "Notas sueltas", en: "Loose notes" },
  { value: "nothing", es: "Todavía no", en: "Not yet" },
] as const satisfies readonly Opcion[];

export const OBJETIVOS = [
  { value: "metrics", es: "Métricas y edge", en: "Metrics and edge" },
  { value: "discipline", es: "Disciplina", en: "Discipline" },
  { value: "risk", es: "Riesgo y reglas", en: "Risk and rules" },
  { value: "review", es: "Revisión de operaciones", en: "Trade review" },
] as const satisfies readonly Opcion[];

/** Texto en español de un valor; si no está en la lista, el valor tal cual. */
export function etiquetaEs(opciones: readonly Opcion[], value: string): string {
  return opciones.find((o) => o.value === value)?.es ?? value;
}
