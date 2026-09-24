import { fmtInt, fmtNum } from "@/lib/trading/format";
import type { Lang } from "@/lib/i18n";

/** Arranque medido de la app de escritorio. Lo citan la ficha técnica y el
 *  explorador de características; escrito a mano en los dos, bastaba con
 *  volver a medir y retocar uno para que la web diera dos cifras. */
export const ARRANQUE = { segundos: 0.7, operaciones: 50_000 } as const;

export function arranqueMedido(lang: Lang): string {
  const s = fmtNum(ARRANQUE.segundos, lang, 1);
  const n = fmtInt(ARRANQUE.operaciones, lang);
  return lang === "es" ? `${s} s con ${n} operaciones (medido)` : `${s} s with ${n} trades (measured)`;
}
