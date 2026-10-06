import { fmtNum, fmtOperaciones } from "@/lib/trading/format";
import type { Lang } from "@/lib/i18n";

/** Arranque medido de la app de escritorio; lo citan la ficha técnica y el
 *  explorador de características, así que la cifra vive solo aquí. */
export const ARRANQUE = { segundos: 0.7, operaciones: 50_000 } as const;

export function arranqueMedido(lang: Lang): string {
  const s = fmtNum(ARRANQUE.segundos, lang, 1);
  const n = fmtOperaciones(ARRANQUE.operaciones, lang);
  return lang === "es" ? `${s} s con ${n} (medido)` : `${s} s with ${n} (measured)`;
}
