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

/**
 * Datos del programa de escritorio que la web cita. `tests/programa.test.ts` los
 * compara con el código del programa cuando `COUNTPIPS_REPO` apunta a una copia.
 */
export const PROGRAMA = {
  /** `AppPaths.FolderName` bajo `LocalApplicationData`. */
  carpetaDatos: "%LOCALAPPDATA%\\CountPips",
  /** `LicenseEvaluator.GraceDays`. */
  graciaSinRedDias: 30,
  /** `LicenseService.ValidationInterval`. */
  revalidacionDias: 1,
  /** `Pbkdf2Policy.Iterations`, el de la copia en la nube y el de las copias cifradas. */
  pbkdf2Iteraciones: 600_000,
  /** `LicenseGate.CoreAccountLimit`. */
  cuentasCore: 2,
  /** `PropFirmTemplates.All`, en su orden. */
  plantillasProp: ["FTMO", "Topstep", "The5ers", "FundedNext", "Apex"],
  /** `BrokerTemplates`, con el nombre que se enseña en la web. */
  plantillasCsv: ["Interactive Brokers", "MetaTrader 4/5", "TradingView", "Binance", "Bybit"],
} as const;

/** «A, B y C» o «A, B and C». */
export function enumerar(nombres: readonly string[], lang: Lang): string {
  return new Intl.ListFormat(lang === "es" ? "es" : "en-GB", { type: "conjunction" }).format(nombres);
}
