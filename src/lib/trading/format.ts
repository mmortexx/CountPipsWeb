import type { Lang } from "@/lib/i18n";

const LOCALE: Record<Lang, string> = { es: "es-ES", en: "en-US" };
/* Las cifras en inglés salen de en-US porque en-GB escribe «US$» delante del
   dólar; las FECHAS no tienen ese problema y van en británico, como la app
   (Strings/en-GB), el pie, los legales y el resto del inglés del sitio
   («licence», «judgement»). Con en-US convivían en la misma portada «Feb 15»
   en el gráfico y «21 September 2026» en el pie. */
export const LOCALE_FECHA: Record<Lang, string> = { es: "es-ES", en: "en-GB" };

/** Format a USD money value with sign-aware coloring support.
 *
 *  Locale rules (both produced by `Intl.NumberFormat` with `currency: USD`):
 *   - es-ES → "1.234,56 $"  (number then currency, comma decimal, dot thousands;
 *     Intl writes "US$" here, so it is swapped for "$" — as MoneyFormat.cs
 *     does in the desktop app)
 *   - en-US → "$1,234.56"   (currency then number, dot decimal, comma thousands)
 *
 *  `sign: true` prefixes a `+` to positive values (winners) and a `−`
 *  (U+2212 minus sign, matches the typographic convention used across
 *  the demo) to negatives. Zero is rendered without a sign.
 *
 *  `compact: true` rounds to 0 decimals for $1k+ values (so the equity
 *  curve endpoint shows "$15.000" instead of "$15.000,42") and switches
 *  to short notation ("$1,2 M") above $1M. */
export function fmtMoney(
  value: number,
  lang: Lang = "es",
  opts: { sign?: boolean; decimals?: number; compact?: boolean } = {}
): string {
  const { sign = false, decimals = 2, compact = false } = opts;
  const locale = LOCALE[lang];
  const abs = Math.abs(value);
  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: compact && abs >= 1000 ? 0 : decimals,
    maximumFractionDigits: compact && abs >= 1000 ? 0 : decimals,
    notation: compact && abs >= 1_000_000 ? "compact" : "standard",
    useGrouping: "always",
  }).format(abs).replace("US$", "$");
  if (value < 0) return `−${formatted}`;
  if (sign && value > 0) return `+${formatted}`;
  return formatted;
}

export function fmtNum(
  value: number,
  lang: Lang = "es",
  decimals = 2
): string {
  return new Intl.NumberFormat(LOCALE[lang], {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: "always",
  }).format(value);
}

/** Una cifra para un campo EDITABLE: coma decimal en español, punto en
 *  inglés, y sin separador de millares. Con millares, «1.240» en un campo
 *  español no se distingue de «1,24» mal escrito, y al leerlo de vuelta
 *  habría que adivinar. */
export function cifraEditable(value: number, lang: Lang = "es", maxDecimales = 6, minDecimales = 0): string {
  if (!Number.isFinite(value)) return "";
  return new Intl.NumberFormat(LOCALE[lang], {
    useGrouping: false,
    minimumFractionDigits: minDecimales,
    maximumFractionDigits: Math.max(minDecimales, maxDecimales),
  })
    .format(value)
    .replace("\u2212", "-");
}

/** Lee lo que alguien escribe en un campo de cifra, en cualquiera de los
 *  dos idiomas: coma o punto como decimal, «−» tipográfico o «-». Como los
 *  campos no enseñan millares, un único separador es siempre el decimal.
 *  Devuelve `null` si no es una cifra (vacío, «1.2.3», «abc»). */
export function leeCifra(texto: string): number | null {
  const limpio = texto.trim().replace(/\u2212/g, "-").replace(/\s/g, "").replace(",", ".");
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(limpio)) return null;
  const n = Number(limpio);
  return Number.isFinite(n) ? n : null;
}

/** Separador entre la cifra y el signo de porcentaje.
 *
 *  En español la ortografía académica exige espacio ("50 %"); en inglés
 *  la convención es pegarlo ("50%"). Se usa un espacio DURO (U+00A0) para
 *  que el signo nunca se quede solo al principio de la línea siguiente:
 *  con un espacio normal, una columna estrecha puede partir "10" y "%"
 *  en dos renglones, que es peor que no separarlos. */
const PCT_SEP: Record<Lang, string> = { es: " %", en: "%" };

/** El separador anterior, para los sitios que componen el porcentaje a mano
 *  porque la cifra ya viene en escala de 0 a 100 y `fmtPct` la multiplicaría.
 *
 *  Existe porque diez puntos del sitio escribían `{cifra} %` directamente en
 *  el JSX: espacio normal —que deja el signo colgando solo al principio de
 *  una línea en columna estrecha— y el mismo espacio en inglés, donde la
 *  convención es pegarlo. Una web inglesa que escribe «32 %» se lee como
 *  traducida del español, que es justo lo que no puede parecer. */
export function pctSep(lang: Lang): string {
  return PCT_SEP[lang];
}

/** Format a percentage. `value` is a ratio (0.5 = 50 %).
 *
 *  Negative-zero guard: a value like -0.0001 that rounds to "0,0 %"
 *  would otherwise render as "-0,0 %" — visually misleading. We strip
 *  the sign when the rounded magnitude is 0. */
export function fmtPct(value: number, lang: Lang = "es", decimals = 1): string {
  const scaled = value * 100;
  const rounded = Number(scaled.toFixed(decimals));
  // Avoid "-0,0 %" / "-0.0%" when the actual magnitude rounds to zero.
  if (Object.is(rounded, 0) || Object.is(rounded, -0)) {
    return `${fmtNum(0, lang, decimals)}${PCT_SEP[lang]}`;
  }
  return `${fmtNum(scaled, lang, decimals)}${PCT_SEP[lang]}`;
}

/** Format an R-multiple ("+1,50 R" / "−0,80 R" / "+0,00 R").
 *
 *  Positive values are prefixed with `+`, negatives with `−` (U+2212,
 *  matching the typographic convention used by `fmtMoney` / `fmtPct`).
 *  Zero is rendered without a sign so the column doesn't flicker
 *  between "+0,00 R" and "−0,00 R" on small floating-point noise. */
export function fmtR(
  value: number,
  lang: Lang = "es",
  decimals = 2
): string {
  const rounded = Number(value.toFixed(decimals));
  if (Object.is(rounded, 0) || Object.is(rounded, -0)) {
    return `${fmtNum(0, lang, decimals)}R`;
  }
  const sign = rounded > 0 ? "+" : "−";
  return `${sign}${fmtNum(Math.abs(rounded), lang, decimals)}R`;
}

/* `useGrouping: "always"` en las tres: sin él, `Intl` en español no agrupa
   las cifras de cuatro dígitos y la tabla de la demo ponía «2350,00» en una
   fila y «18.200,0» en la siguiente. */
export function fmtInt(value: number, lang: Lang = "es"): string {
  return new Intl.NumberFormat(LOCALE[lang], { useGrouping: "always" }).format(value);
}

/** Cifra con signo para celdas diminutas (calendario, mapa de calor):
 *  «+845» o «−1,2k». Se escribía con `toFixed`, que daba «1.2k» también
 *  en español. */
export function fmtCifraCorta(value: number, lang: Lang = "es"): string {
  const abs = Math.round(Math.abs(value));
  const signo = value >= 0 ? "+" : "−";
  return abs >= 1000 ? `${signo}${fmtNum(abs / 1000, lang, 1)}k` : `${signo}${abs}`;
}

export function fmtPrice(value: number, decimals = 2, lang: Lang = "es"): string {
  return new Intl.NumberFormat(LOCALE[lang], {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: "always",
  }).format(value);
}

export function fmtDuration(minutes: number, _lang: Lang = "es"): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h < 24) return m ? `${h}h ${m}m` : `${h}h`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return rh ? `${d}d ${rh}h` : `${d}d`;
}

/* ── LAS TRES FECHAS DE UNA OPERACIÓN SE ESCRIBEN EN UTC ──────────────
   Los únicos `Date` que pasan por aquí son la apertura y el cierre de una
   operación de la muestra, y esos están fechados en UTC a propósito (ver
   la cabecera de `data.ts`): la hora de un cierre no es «las nueve donde
   tú estés», es la apertura de Londres.

   Sin `timeZone`, `Intl` los pintaba en el huso de quien mira, de modo
   que una operación etiquetada como sesión de Londres salía a las 17:00
   en Tokio, y la misma operación cambiaba de DÍA —y por tanto de fila en
   el calendario y en la tabla— según desde dónde se abriera la página.
   Encima el HTML lo compila un servidor en UTC, así que el texto servido
   y el pintado tampoco coincidían.

   La barra de la app enseña un reloj UTC junto a estas cifras; ahora las
   dos cosas dicen la hora en la misma escala. */
export function fmtDate(date: Date, lang: Lang = "es"): string {
  return new Intl.DateTimeFormat(LOCALE_FECHA[lang], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Rótulo corto de eje de fechas, como el de la app: «15 feb» / «15 Feb». */
export function fmtDiaMes(date: Date, lang: Lang = "es"): string {
  return new Intl.DateTimeFormat(LOCALE_FECHA[lang], { day: "numeric", month: "short", timeZone: "UTC" })
    .format(date)
    .replace(".", "");
}

export function fmtDateTime(date: Date, lang: Lang = "es"): string {
  return new Intl.DateTimeFormat(LOCALE_FECHA[lang], {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

export function fmtTime(date: Date, lang: Lang = "es"): string {
  return new Intl.DateTimeFormat(LOCALE_FECHA[lang], {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

/** P&L sign → semantic tone. */
export function pnlTone(value: number): "pos" | "neg" | "neutral" {
  if (value > 0) return "pos";
  if (value < 0) return "neg";
  return "neutral";
}
