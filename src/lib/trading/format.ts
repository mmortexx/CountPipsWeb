import type { Lang } from "@/lib/i18n";

const LOCALE: Record<Lang, string> = { es: "es-ES", en: "en-US" };

/** Format a USD money value with sign-aware coloring support.
 *
 *  Locale rules (both produced by `Intl.NumberFormat` with `currency: USD`):
 *   - es-ES → "1.234,56 $"  (number then currency, comma decimal, dot thousands)
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
  }).format(abs);
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
  }).format(value);
}

/** Separador entre la cifra y el signo de porcentaje.
 *
 *  En español la ortografía académica exige espacio ("50 %"); en inglés
 *  la convención es pegarlo ("50%"). Se usa un espacio DURO (U+00A0) para
 *  que el signo nunca se quede solo al principio de la línea siguiente:
 *  con un espacio normal, una columna estrecha puede partir "10" y "%"
 *  en dos renglones, que es peor que no separarlos. */
const PCT_SEP: Record<Lang, string> = { es: " %", en: "%" };

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

export function fmtInt(value: number, lang: Lang = "es"): string {
  return new Intl.NumberFormat(LOCALE[lang]).format(value);
}

export function fmtPrice(value: number, decimals = 2, lang: Lang = "es"): string {
  return new Intl.NumberFormat(LOCALE[lang], {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
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
  return new Intl.DateTimeFormat(LOCALE[lang], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function fmtDateTime(date: Date, lang: Lang = "es"): string {
  return new Intl.DateTimeFormat(LOCALE[lang], {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

export function fmtTime(date: Date, lang: Lang = "es"): string {
  return new Intl.DateTimeFormat(LOCALE[lang], {
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
