/**
 * Voces del glosario que enlaza cada perfil de trader: las que cita su texto.
 * Sin importaciones para que `scripts/enlaces.mjs` lo lea y compruebe que
 * cada página las enlaza de verdad.
 */
export const TERMINOS_DE_PERFIL: Record<"manual" | "prop", string[]> = {
  manual: ["Setup", "Expectancy", "Profit factor", "R-multiple", "Revenge trading"],
  prop: ["Prop firm", "Max drawdown", "Drawdown", "Position sizing", "Risk of ruin"],
};
