import type { Lang } from "@/lib/locale";

const LOCALE: Record<Lang, string> = {
  es: "es-ES",
  en: "en-US",
  pt: "pt-BR",
  fr: "fr-FR",
  de: "de-DE",
  it: "it-IT",
};
// Las cifras en inglés usan en-US porque en-GB escribe «US$» delante del dólar;
// las fechas van en británico, como la app (Strings/en-GB) y el resto del inglés del sitio.
export const LOCALE_FECHA: Record<Lang, string> = {
  es: "es-ES",
  en: "en-GB",
  pt: "pt-BR",
  fr: "fr-FR",
  de: "de-DE",
  it: "it-IT",
};

/** Importe en dólares. es-ES da «1.234,56 $» (`Intl` escribe «US$» y se cambia
 *  por «$», como MoneyFormat.cs en la app de escritorio); en-US, «$1,234.56».
 *
 *  `sign: true` antepone `+` a los positivos; los negativos llevan siempre `−`
 *  (U+2212). El cero va sin signo.
 *
 *  `compact: true` redondea a 0 decimales desde 1.000 $ y pasa a notación corta
 *  («$1,2 M») desde 1 M. */
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
  })
    .format(abs)
    .replace(/US\$|\$US|USD/g, "$")
    .trim();
  // El signo sale de la cifra escrita: −0,4 $ a cero decimales es «0 $», no «−0 $».
  if (!/[1-9]/.test(formatted)) return formatted;
  if (value < 0) return `−${formatted}`;
  if (sign && value > 0) return `+${formatted}`;
  return formatted;
}

/** `Intl` escribe el negativo con el guion del teclado (U+002D) y deja
 *  «-0,0» cuando la cifra redondea a cero. El signo de la casa es el menos
 *  tipográfico (U+2212), como en fmtMoney y fmtR, y el cero va sin signo. */
function menosTipografico(texto: string): string {
  if (!texto.startsWith("-")) return texto;
  const cuerpo = texto.slice(1);
  return /[1-9]/.test(cuerpo) ? `−${cuerpo}` : cuerpo;
}

export function fmtNum(
  value: number,
  lang: Lang = "es",
  decimals = 2
): string {
  return menosTipografico(
    new Intl.NumberFormat(LOCALE[lang], {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: "always",
    }).format(value),
  );
}

/** Cifra para un campo editable: coma decimal en español, punto en inglés y
 *  sin millares, porque «1.240» no se distingue de un «1,24» mal escrito. */
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

/** Separador decimal de cada idioma. El francés no escribe millares con punto. */
const DECIMAL: Record<Lang, string> = { es: ",", en: ".", pt: ",", fr: ",", de: ",", it: "," };
const GRUPOS_PUNTO = /^[1-9]\d{0,2}(\.\d{3})+$/;
const GRUPOS_COMA = /^[1-9]\d{0,2}(,\d{3})+$/;

/** Lee lo escrito en un campo según el idioma y los decimales que admite.
 *  «10.000» es 10000 si el campo admite menos de tres decimales, y 10 si admite
 *  tres o más, donde un precio como «151.234» sigue siendo decimal. Devuelve
 *  `null` si no es una cifra (vacío, «1.2.3», «1e5»). */
export function leeCifra(texto: string, lang: Lang, decimales: number): number | null {
  const limpio = texto.replace(/\u2212/g, "-").replace(/\s/g, "");
  const negativo = limpio.startsWith("-");
  const cuerpo = negativo ? limpio.slice(1) : limpio;
  if (!/^[\d.,]+$/.test(cuerpo) || !/\d/.test(cuerpo)) return null;
  const valor = cifraSinSigno(cuerpo, lang, decimales);
  if (valor === null || !Number.isFinite(valor)) return null;
  return negativo && valor !== 0 ? -valor : valor;
}

function cifraSinSigno(cuerpo: string, lang: Lang, decimales: number): number | null {
  const separadores = cuerpo.replace(/\d/g, "");
  if (separadores === "") return Number(cuerpo);
  if (new Set(separadores).size === 2) {
    const decimal = separadores.slice(-1);
    const corte = cuerpo.lastIndexOf(decimal);
    const grupos = decimal === "," ? GRUPOS_PUNTO : GRUPOS_COMA;
    const entera = cuerpo.slice(0, corte);
    if (!grupos.test(entera)) return null;
    return Number(`${entera.replace(/[.,]/g, "")}.${cuerpo.slice(corte + 1) || "0"}`);
  }
  if (separadores.length > 1) {
    const grupos = separadores[0] === "." ? GRUPOS_PUNTO : GRUPOS_COMA;
    return grupos.test(cuerpo) ? Number(cuerpo.replace(/[.,]/g, "")) : null;
  }
  const [entera, fraccion] = cuerpo.split(separadores);
  const tresDetras = fraccion.length === 3 && entera.length > 0 && entera.length <= 3 && !entera.startsWith("0");
  const millares = tresDetras && separadores !== DECIMAL[lang] && lang !== "fr" && decimales < 3;
  return Number(millares ? entera + fraccion : `${entera || "0"}.${fraccion || "0"}`);
}

// Separador entre la cifra y el % según convención de idioma:
// español, francés y alemán con espacio duro (U+00A0); inglés, portugués e italiano pegado.
const PCT_SEP: Record<Lang, string> = {
  es: " %",
  en: "%",
  pt: "%",
  fr: " %",
  de: " %",
  it: "%",
};

/** El separador anterior, para componer el porcentaje a mano cuando la cifra ya
 *  va en escala 0–100 y `fmtPct` la multiplicaría. Evita escribir `{cifra} %`
 *  en el JSX: espacio normal y, en inglés, un «32 %» que se lee como traducido. */
export function pctSep(lang: Lang): string {
  return PCT_SEP[lang];
}

/** Porcentaje a partir de una razón (0,5 = 50 %). Un valor como -0,0001 que
 *  redondea a cero sale sin signo, no como «-0,0 %». */
export function fmtPct(value: number, lang: Lang = "es", decimals = 1): string {
  const scaled = value * 100;
  const rounded = Number(scaled.toFixed(decimals));
  if (Object.is(rounded, 0) || Object.is(rounded, -0)) {
    return `${fmtNum(0, lang, decimals)}${PCT_SEP[lang]}`;
  }
  return `${fmtNum(scaled, lang, decimals)}${PCT_SEP[lang]}`;
}

/** Múltiplo R («+1,50 R» / «−0,80 R» / «0,00 R»): `+` a los positivos y `−`
 *  (U+2212) a los negativos. El cero va sin signo, para que la columna no
 *  oscile entre «+0,00 R» y «−0,00 R» por ruido de coma flotante. La unidad
 *  va tras un espacio duro, como en la app (`FormatR`, TradesViewModel.cs). */
export function fmtR(
  value: number,
  lang: Lang = "es",
  decimals = 2
): string {
  const rounded = Number(value.toFixed(decimals));
  if (Object.is(rounded, 0) || Object.is(rounded, -0)) {
    return `${fmtNum(0, lang, decimals)}\u00a0R`;
  }
  const sign = rounded > 0 ? "+" : "−";
  return `${sign}${fmtNum(Math.abs(rounded), lang, decimals)}\u00a0R`;
}

// `useGrouping: "always"` en las tres: sin él, `Intl` en español no agrupa las cifras de cuatro dígitos.
export function fmtInt(value: number, lang: Lang = "es"): string {
  return menosTipografico(new Intl.NumberFormat(LOCALE[lang], { useGrouping: "always" }).format(value));
}

/** «1 operación», «2 operaciones» / «1 trade», «2 trades». */
export function fmtOperaciones(n: number, lang: Lang = "es"): string {
  const uno = Math.abs(n) === 1;
  const palabra = {
    es: uno ? "operación" : "operaciones",
    en: uno ? "trade" : "trades",
    pt: uno ? "operação" : "operações",
    fr: uno ? "trade" : "trades",
    de: uno ? "Trade" : "Trades",
    it: uno ? "trade" : "trades",
  }[lang];
  return `${fmtInt(n, lang)} ${palabra}`;
}

/** Cifra con signo para celdas diminutas (calendario, mapa de calor): «+845» o «−1,2k». */
export function fmtCifraCorta(value: number, lang: Lang = "es"): string {
  const abs = Math.round(Math.abs(value));
  const signo = value >= 0 ? "+" : "−";
  return abs >= 1000 ? `${signo}${fmtNum(abs / 1000, lang, 1)}k` : `${signo}${abs}`;
}

/** Un precio con los decimales que trae: al menos dos y como mucho ocho. */
export function fmtPrecio(value: number, lang: Lang = "es"): string {
  if (!Number.isFinite(value)) return "—";
  const decimales = (value.toFixed(8).replace(/0+$/, "").split(".")[1] ?? "").length;
  return fmtNum(value, lang, Math.max(2, decimales));
}

export function fmtPrice(value: number, decimals = 2, lang: Lang = "es"): string {
  return menosTipografico(
    new Intl.NumberFormat(LOCALE[lang], {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: "always",
    }).format(value),
  );
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

// Las fechas de una operación se escriben en UTC, que es como están fechadas
// (ver `data.ts`). Sin `timeZone`, `Intl` usaría el huso de quien mira: la
// operación cambiaría de hora y de día según desde dónde se abra, y el HTML
// compilado (UTC) no coincidiría con lo pintado.
export function fmtDate(date: Date, lang: Lang = "es"): string {
  return new Intl.DateTimeFormat(LOCALE_FECHA[lang], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Rótulo corto de eje de fechas, como el de la app: «15 feb» / «15 Feb». En pt-BR,
 *  `Intl` mete « de » entre día y mes («15 de set»): ese literal se cambia por un espacio. */
export function fmtDiaMes(date: Date, lang: Lang = "es"): string {
  return new Intl.DateTimeFormat(LOCALE_FECHA[lang], { day: "numeric", month: "short", timeZone: "UTC" })
    .formatToParts(date)
    .map((parte) => (parte.type === "literal" && parte.value.trim() === "de" ? " " : parte.value))
    .join("")
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

/** «de» delante de un mes en francés: «d’octobre» si empieza por vocal o h, «de janvier» si no. */
export function deFr(texto: string): string {
  return /^[aeiouyhàâäéèêëîïôöùûüÿœ]/i.test(texto) ? `d’${texto}` : `de ${texto}`;
}

/** Tono semántico según el signo del P&L. */
export function pnlTone(value: number): "pos" | "neg" | "neutral" {
  if (value > 0) return "pos";
  if (value < 0) return "neg";
  return "neutral";
}
