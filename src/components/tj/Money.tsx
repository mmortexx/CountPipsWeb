"use client";

import { useLang } from "@/lib/i18n";
import { fmtMoney, pnlTone } from "@/lib/trading/format";

interface MoneyProps {
  value: number;
  sign?: boolean;
  decimals?: number;
  compact?: boolean;
  colorizeSign?: boolean;
  /** Fuerza un tono (anula el color de `colorizeSign`). */
  tone?: "pos" | "neg" | "neutral";
  className?: string;
}

/** Importe formateado como divisa, con color semántico de P&L opcional. */
export function Money({
  value,
  sign = false,
  decimals = 2,
  compact = false,
  colorizeSign = false,
  tone: forcedTone,
  className = "",
}: MoneyProps) {
  const { lang } = useLang();
  const text = fmtMoney(value, lang, { sign, decimals, compact });
  const tone = forcedTone ?? pnlTone(value);

  if (colorizeSign || forcedTone) {
    const cls =
      tone === "pos"
        ? "text-pnl-pos"
        : tone === "neg"
        ? "text-pnl-neg"
        : "text-secondary";
    return <span className={`tnum ${cls} ${className}`}>{text}</span>;
  }
  return <span className={`tnum ${className}`}>{text}</span>;
}
