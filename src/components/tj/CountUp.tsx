"use client";

import { useLang } from "@/lib/i18n";
import { fmtNum } from "@/lib/trading/format";

interface CountUpProps {
  to: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  tone?: "pos" | "neg" | "neutral";
}

/** Cifra de la demo con su formato y su tono. Ya no cuenta: sale en su valor,
 *  porque una cifra que corre compite con el dato que enseña. Cifras `tnum`. */
export function CountUp({
  to,
  decimals = 0,
  suffix = "",
  prefix = "",
  className = "",
  tone = "neutral",
}: CountUpProps) {
  const { lang } = useLang();
  const toneClass =
    tone === "pos"
      ? "text-pnl-pos"
      : tone === "neg"
      ? "text-pnl-neg"
      : "";

  return (
    <span className={`tnum ${toneClass} ${className}`}>{`${prefix}${fmtNum(to, lang, decimals)}${suffix}`}</span>
  );
}
