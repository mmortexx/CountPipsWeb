"use client";

import { useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useLang, type Lang } from "@/lib/i18n";
import {
  TRADES,
  INSTRUMENTS,
  nombreSetup,
  type Trade,
  type Compliance,
} from "@/lib/trading/data";
import { useCustomTrades, customTradeToTrade } from "@/lib/trading/demoStore";
import {
  fmtNum,
  fmtDuration,
  fmtDateTime,
  fmtPrice,
  pnlTone,
} from "@/lib/trading/format";
import { useDemo } from "@/components/demo/DemoContext";
import { Eyebrow } from "@/components/tj/Eyebrow";
import { Chip } from "@/components/tj/Chip";
import { Money } from "@/components/tj/Money";
import { CountUp } from "@/components/tj/CountUp";
import { MagneticButton } from "@/components/tj/MagneticButton";
import { TradeCandleChart } from "@/components/charts/TradeCandleChart";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ---------- helpers ---------- */

function seededRnd(seed: number) {
  let s = Math.abs(Math.floor(seed)) || 1;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/** Tiny deterministic candlestick mini-chart for screenshot thumbnails. */
function MiniCandles({ seed, win }: { seed: number; win: boolean }) {
  const rnd = seededRnd(seed);
  const n = 9;
  const candles: { o: number; c: number; h: number; l: number }[] = [];
  let last = 30 + rnd() * 25;
  const drift = win ? 0.6 : -0.6;
  for (let i = 0; i < n; i++) {
    const o = last;
    const c = o + (rnd() - 0.5 + drift * 0.18) * 14;
    const h = Math.max(o, c) + rnd() * 4;
    const l = Math.min(o, c) - rnd() * 4;
    candles.push({ o, c, h, l });
    last = c;
  }
  const allV = candles.flatMap((c) => [c.h, c.l]);
  const min = Math.min(...allV);
  const max = Math.max(...allV);
  const range = max - min || 1;
  const W = 100;
  const H = 60;
  const pad = 4;
  const yFor = (v: number) =>
    pad + (1 - (v - min) / range) * (H - pad * 2);
  const cw = (W - pad * 2) / n;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="w-full h-full"
      aria-hidden="true"
    >
      {candles.map((c, i) => {
        const x = pad + i * cw + cw / 2;
        const up = c.c >= c.o;
        const stroke = up
          ? "rgb(var(--pnl-pos))"
          : "rgb(var(--pnl-neg))";
        const bodyTop = yFor(Math.max(c.o, c.c));
        const bodyBot = yFor(Math.min(c.o, c.c));
        return (
          <g key={i}>
            <line
              x1={x}
              y1={yFor(c.h)}
              x2={x}
              y2={yFor(c.l)}
              stroke={stroke}
              strokeWidth={0.6}
              vectorEffect="non-scaling-stroke"
            />
            <rect
              x={x - cw * 0.3}
              y={bodyTop}
              width={cw * 0.6}
              height={Math.max(0.6, bodyBot - bodyTop)}
              fill={stroke}
              opacity={0.92}
            />
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- Anatomy (executions table) ----------
 * Mirrors the real app's "Anatomía: las ejecuciones reales" card —
 * a compact fills table showing each entry/exit leg with time, qty,
 * price, fee and running cumulative qty. Built deterministically
 * from the trade's data so the same trade always shows the same
 * shape (single-fill / 2-tranche scale-in / 3-tranche scale-out).
 */
interface FillRow {
  dir: "ENTRY" | "EXIT";
  side: "BUY" | "SELL";
  time: string;
  qty: string;
  price: string;
  fee: string;
  cumulative: string;
}

function buildFills(trade: Trade, decimals: number, lang: Lang): FillRow[] {
  const isLong = trade.direction === "long";
  const entrySide = isLong ? "BUY" : "SELL";
  const exitSide = isLong ? "SELL" : "BUY";
  const opened = trade.openedAt;
  const mid = new Date(opened.getTime() + trade.durationMin * 30000);
  const closed = trade.closedAt;
  const fmtT = (d: Date) =>
    new Intl.DateTimeFormat(lang === "es" ? "es-ES" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(d);
  const totalQty = trade.qty;
  // Split: 2 entries (60% + 40%) and 1 exit, OR 1 entry + 2 exits
  // depending on which side has the larger excursion — keeps the
  // table small and varied but always consistent.
  const splitEntry = trade.mfe > 1.2;
  if (splitEntry) {
    const q1 = +(totalQty * 0.6).toFixed(3);
    const q2 = +(totalQty * 0.4).toFixed(3);
    return [
      {
        dir: "ENTRY",
        side: entrySide,
        time: fmtT(opened),
        qty: fmtNum(q1, lang, 3),
        price: fmtPrice(trade.entry, decimals, lang),
        fee: "—",
        cumulative: fmtNum(q1, lang, 3),
      },
      {
        dir: "ENTRY",
        side: entrySide,
        time: fmtT(mid),
        qty: fmtNum(q2, lang, 3),
        price: fmtPrice(
          +(trade.entry * (1 + (isLong ? 0.0008 : -0.0008))).toFixed(decimals),
          decimals,
          lang
        ),
        fee: "—",
        cumulative: fmtNum(totalQty, lang, 3),
      },
      {
        dir: "EXIT",
        side: exitSide,
        time: fmtT(closed),
        qty: fmtNum(totalQty, lang, 3),
        price: fmtPrice(trade.exit, decimals, lang),
        fee: "—",
        cumulative: "0",
      },
    ];
  }
  // 1 entry + 2 exits (scale-out).
  const q1 = +(totalQty * 0.5).toFixed(3);
  return [
    {
      dir: "ENTRY",
      side: entrySide,
      time: fmtT(opened),
      qty: fmtNum(totalQty, lang, 3),
      price: fmtPrice(trade.entry, decimals, lang),
      fee: "—",
      cumulative: fmtNum(totalQty, lang, 3),
    },
    {
      dir: "EXIT",
      side: exitSide,
      time: fmtT(mid),
      qty: fmtNum(q1, lang, 3),
      price: fmtPrice(
        +(trade.entry * (1 + (isLong ? 0.0008 : -0.0008))).toFixed(decimals),
        decimals,
        lang
      ),
      fee: "—",
      cumulative: fmtNum(+(totalQty - q1).toFixed(3), lang, 3),
      },
    {
      dir: "EXIT",
      side: exitSide,
      time: fmtT(closed),
      qty: fmtNum(+(totalQty - q1).toFixed(3), lang, 3),
      price: fmtPrice(trade.exit, decimals, lang),
      fee: "—",
      cumulative: "0",
    },
  ];
}

/* ---------- Detail cell ---------- */
function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.15em] text-tertiary mb-1">
        {label}
      </dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: ReactNode;
  tone?: "pos" | "neg";
}) {
  const cls =
    tone === "pos"
      ? "text-pnl-pos"
      : tone === "neg"
      ? "text-pnl-neg"
      : "text-primary";
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-tertiary text-sm">{label}</span>
      <span className={`tnum text-sm font-medium ${cls}`}>{value}</span>
    </div>
  );
}

/* ---------- Hero stat (with optional left hairline) ---------- */
function HeroStat({
  label,
  children,
  divider,
}: {
  label: string;
  children: ReactNode;
  divider?: boolean;
}) {
  return (
    <div
      className={`relative px-5 first:pl-0 ${
        divider
          ? "before:absolute before:left-0 before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-transparent before:via-[rgb(var(--divider)/0.18)] before:to-transparent"
          : ""
      }`}
    >
      <div className="text-[10px] uppercase tracking-[0.15em] text-tertiary mb-1.5">
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

/* ---------- MAE/MFE excursion diverging bar ----------
 * Mirrors the real app's "Excursión MAE/MFE en R" diverging bar —
 * red on the left (how far it went against you), green on the right
 * (how far it went in your favour), both at the same R scale.
 */
function ExcursionBar({ mae, mfe }: { mae: number; mfe: number }) {
  const maxAbs = Math.max(Math.abs(mae), Math.abs(mfe), 1);
  const maePct = (Math.abs(mae) / maxAbs) * 50;
  const mfePct = (Math.abs(mfe) / maxAbs) * 50;
  return (
    <div className="relative h-2 rounded-full bg-[rgb(var(--divider)/0.05)] overflow-hidden">
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[rgb(var(--divider)/0.25)] z-10" />
      <motion.div
        className="absolute top-0 bottom-0 right-1/2 bg-pnl-neg/80"
        initial={{ width: 0 }}
        animate={{ width: `${maePct}%` }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.5 }}
      />
      <motion.div
        className="absolute top-0 bottom-0 left-1/2 bg-pnl-pos/80"
        initial={{ width: 0 }}
        animate={{ width: `${mfePct}%` }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.65 }}
      />
    </div>
  );
}

/* ---------- Barra de riesgo : recompensa planificado ----------
   Rotulada como en la app ("Riesgo · 1R" / "Recompensa · 2,0R"): estaba
   en inglés dentro de una demo en español. */
function RiskRewardBar({
  plannedRr,
  lang,
}: {
  plannedRr: number;
  lang: "es" | "en";
}) {
  const riskFraction = 1 / (1 + plannedRr);
  const rewardFraction = plannedRr / (1 + plannedRr);
  return (
    <div>
      <div className="flex items-center justify-between mb-2 text-[10px] tracking-[0.15em] text-tertiary tnum">
        <span>{lang === "es" ? "Riesgo" : "Risk"} · 1R</span>
        <span>
          {lang === "es" ? "Recompensa" : "Reward"} · {fmtNum(plannedRr, lang, 1)}R
        </span>
      </div>
      <div className="relative h-2.5 rounded-full bg-[rgb(var(--divider)/0.05)] overflow-hidden flex">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${riskFraction * 100}%` }}
          transition={{ duration: 0.9, delay: 0.7, ease: EASE }}
          className="h-full bg-pnl-neg/80 shrink-0"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${rewardFraction * 100}%` }}
          transition={{ duration: 0.9, delay: 1.0, ease: EASE }}
          className="h-full bg-pnl-pos/80 shrink-0"
        />
      </div>
    </div>
  );
}

/* ---------- Tag pill ---------- */
type TagKind = "error" | "win" | "emotion" | "custom";
function TagPill({
  kind,
  label,
  onRemove,
}: {
  kind: TagKind;
  label: string;
  onRemove?: () => void;
}) {
  const colors: Record<TagKind, string> = {
    error: "rgb(var(--pnl-neg))",
    win: "rgb(var(--pnl-pos))",
    emotion: "rgb(var(--accent-base))",
    custom: "rgb(var(--txt-tertiary))",
  };
  return (
    <span
      className="pill inline-flex items-center gap-1.5 text-[11px] border"
      style={{
        color: colors[kind],
        borderColor: `${colors[kind]} / 0.3)`,
        backgroundColor: `${colors[kind]} / 0.08)`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: colors[kind] }}
        aria-hidden
      />
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove tag"
          className="ml-0.5 -mr-0.5 w-4 h-4 rounded-sm hover:bg-[rgb(var(--divider)/0.1)] inline-flex items-center justify-center"
        >
          <svg
            width="9"
            height="9"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <line x1="5" y1="5" x2="19" y2="19" />
            <line x1="19" y1="5" x2="5" y2="19" />
          </svg>
        </button>
      )}
    </span>
  );
}

/* ---------- main component ---------- */

export function TradeDetailPage() {
  const { t, lang } = useLang();
  const { selectedTradeId, goBack, goDetail } = useDemo();
  const customTrades = useCustomTrades();
  const allTrades = useMemo(() => {
    const custom = customTrades.map(customTradeToTrade);
    return [...custom, ...TRADES];
  }, [customTrades]);
  const trade = useMemo(() => {
    const sample = TRADES.find((x) => x.id === selectedTradeId);
    if (sample) return sample;
    const custom = customTrades.find((c) => c.id === selectedTradeId);
    return custom ? customTradeToTrade(custom) : undefined;
  }, [selectedTradeId, customTrades]);
  const currentIndex = allTrades.findIndex((x) => x.id === selectedTradeId);
  const prevTrade = currentIndex > 0 ? allTrades[currentIndex - 1] : undefined;
  const nextTrade = currentIndex >= 0 && currentIndex < allTrades.length - 1 ? allTrades[currentIndex + 1] : undefined;
  const [review, setReview] = useState<Compliance>(
    trade?.compliance ?? "yes"
  );

  // Tags state (mirrors the real app's tags: error / acierto / emocion / libre).
  const [tags, setTags] = useState<
    { kind: TagKind; label: string }[]
  >([
    { kind: "win", label: lang === "es" ? "Buena entrada" : "Good entry" },
    { kind: "emotion", label: lang === "es" ? "Calma" : "Calm" },
  ]);

  // Instrument decimals + fills table. Computed BEFORE the early
  // return so the hook order is stable across renders (satisfies
  // react-hooks/rules-of-hooks). When `trade` is undefined the fills
  // memo returns an empty array.
  const decimals = useMemo(() => {
    if (!trade) return 2;
    const instrument = INSTRUMENTS.find((i) => i.symbol === trade.instrument);
    return instrument?.decimals ?? 2;
  }, [trade]);
  const fills = useMemo(
    () => (trade ? buildFills(trade, decimals, lang) : []),
    [trade, decimals, lang]
  );

  if (!trade) {
    return (
      <div className="p-5 md:p-6">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-secondary hover:text-primary border border-[rgb(var(--divider)/0.10)] transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          {t("back")}
        </button>
        <p className="text-secondary text-sm mt-6">
          {lang === "es"
            ? "Ninguna operación seleccionada."
            : "No trade selected."}
        </p>
      </div>
    );
  }

  const isWin = trade.netPnl >= 0;
  const isLong = trade.direction === "long";
  const tone = pnlTone(trade.netPnl);

  // Risk amount in $ = the 1R dollar amount (already in trade.riskUsd).
  const riskAmount = trade.riskUsd;
  const riskPct = (riskAmount / 10000) * 100;

  // Day-context data — deterministic placeholders that mirror the
  // real app's "Dónde cayó dentro del día" card.
  const dayOrdinal =
    lang === "es"
      ? `3ª operación del día`
      : `3rd trade of the day`;
  const sincePrevious =
    lang === "es"
      ? `8 min después de la operación anterior`
      : `8 min after the previous trade`;
  const dayPnlBefore = -84.6;
  const isRevengeCandidate = dayPnlBefore < 0;

  /* Se van cuatro cálculos que no leía nadie: `instrument` (la búsqueda en
     el catálogo, sustituida por el símbolo que ya trae la operación), las
     dos fracciones del riesgo:recompensa —la barra proporcional que las
     usaba se sustituyó por la cifra de R— y `complianceVariant`, que hoy
     resuelve el propio `Chip`. */

  return (
    <div className="relative p-5 md:p-6 space-y-5">
      {/* ===== HEADER: back + symbol + direction + closed date ===== */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="flex items-center justify-between gap-3 flex-wrap"
      >
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-secondary hover:text-primary border border-[rgb(var(--divider)/0.10)] transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          {t("back")}
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0 justify-center">
          {/* h2 y no h1: esta es una pantalla SIMULADA dentro de la página de
              la demo. El h1 del documento es el titular de esa página, y dos
              h1 rompen el esquema de encabezados —lectores de pantalla y
              buscadores lo usan para entender la jerarquía—. */}
          <h2 className="text-2xl md:text-3xl font-mono font-medium tracking-[-0.01em] text-primary tnum">
            {trade.instrument}
          </h2>
          <Chip variant={isLong ? "pos" : "neg"}>
            {t(isLong ? "long" : "short")}
          </Chip>
          <span className="text-xs text-tertiary tnum hidden sm:inline">
            {fmtDateTime(trade.closedAt, lang)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-tertiary tnum">
            #{trade.id.toString().padStart(3, "0")}
          </span>
          <button
            type="button"
            onClick={() => prevTrade && goDetail(prevTrade.id)}
            disabled={!prevTrade}
            aria-label={lang === "es" ? "Operación anterior" : "Previous trade"}
            className="w-8 h-8 rounded-md border border-[rgb(var(--divider)/0.1)] text-tertiary hover:text-primary hover:border-[rgb(var(--divider)/0.25)] transition-colors inline-flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => nextTrade && goDetail(nextTrade.id)}
            disabled={!nextTrade}
            aria-label={lang === "es" ? "Operación siguiente" : "Next trade"}
            className="w-8 h-8 rounded-md border border-[rgb(var(--divider)/0.1)] text-tertiary hover:text-primary hover:border-[rgb(var(--divider)/0.25)] transition-colors inline-flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </motion.section>

      {/* ===== HERO: net P&L | R | risk amount | planned RR + MAE/MFE
                excursion bar + planned risk:reward bar =====
                Mirrors the real app's hero card layout. */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative overflow-hidden demo-card p-6"
      >
        <div className="relative space-y-6">
          {/* Hero stat row: Net | R | Risk | Planned RR (with hairlines) */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-5">
            {/* Las cuatro cifras de cabecera son, con sus nombres, las de
                la app (TradeDetailPage.xaml): "P&L neto", "R múltiplo",
                "Riesgo" y "RR planeado". La demo las llamaba "Cierre",
                "R" y "Entrada + stop" — nombres que no dicen lo que hay
                debajo: la primera cifra no es la fecha de cierre, es el
                resultado neto de la operación. */}
            <HeroStat label={lang === "es" ? "P&L neto" : "Net P&L"}>
              <div className="flex items-baseline gap-2">
                <CountUp
                  key={trade.id}
                  to={Math.abs(trade.netPnl)}
                  from={0}
                  decimals={2}
                  prefix={trade.netPnl >= 0 ? "+" : "−"}
                  suffix=" US$"
                  tone={tone}
                  duration={1.6}
                  className="text-3xl md:text-4xl font-bold tracking-tight"
                />
              </div>
            </HeroStat>
            <HeroStat label={lang === "es" ? "R múltiplo" : "R multiple"} divider>
              <span
                className={`text-2xl md:text-3xl font-bold tnum ${
                  trade.rMultiple >= 0 ? "text-pnl-pos" : "text-pnl-neg"
                }`}
              >
                {trade.rMultiple > 0 ? "+" : ""}
                {fmtNum(trade.rMultiple, lang, 2)}R
              </span>
            </HeroStat>
            <HeroStat label={lang === "es" ? "Riesgo" : "Risk"} divider>
              <div className="flex flex-col">
                <Money
                  value={riskAmount}
                  className="text-2xl md:text-3xl font-semibold"
                />
                <span className="text-[10px] text-tertiary tnum">
                  {fmtNum(riskPct, lang, 2)} % {lang === "es" ? "del capital" : "of capital"}
                </span>
              </div>
            </HeroStat>
            <HeroStat label={t("plannedRr")} divider>
              <span className="text-2xl md:text-3xl font-semibold tnum text-primary">
                {fmtNum(trade.plannedRr, lang, 2)}R
              </span>
            </HeroStat>
          </div>

          {/* MAE/MFE excursion diverging bar */}
          <div className="space-y-2 pt-2 border-t border-[rgb(var(--divider)/0.1)]">
            <div className="flex items-center justify-between">
              <Eyebrow>
                {lang === "es" ? "Recorrido de la operación" : "Trade journey"}
              </Eyebrow>
              <div className="flex items-center gap-5 text-xs">
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-[10px] uppercase tracking-[0.14em] text-tertiary">
                    MAE
                  </span>
                  <span className="text-pnl-neg font-semibold tnum">
                    {trade.mae.toFixed(2)}R
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-[10px] uppercase tracking-[0.14em] text-tertiary">
                    MFE
                  </span>
                  <span className="text-pnl-pos font-semibold tnum">
                    +{trade.mfe.toFixed(2)}R
                  </span>
                </span>
              </div>
            </div>
            <ExcursionBar mae={trade.mae} mfe={trade.mfe} />
          </div>

          {/* Planned risk:reward bar */}
          <div className="space-y-2 pt-2 border-t border-[rgb(var(--divider)/0.1)]">
            <RiskRewardBar plannedRr={trade.plannedRr} lang={lang} />
          </div>
        </div>
      </motion.section>

      {/* ===== INTERACTIVE CANDLESTICK REPLAY CHART ===== */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
      >
        <TradeCandleChart trade={trade} decimals={decimals} />
      </motion.section>

      {/* ===== 2-COLUMN GRID: left (5fr) | right (4fr) ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-[5fr_4fr] gap-5">
        {/* ===== LEFT COLUMN ===== */}
        <div className="flex flex-col gap-5 min-w-0">
          {/* Execution card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35, ease: EASE }}
            whileHover={{
              y: -2,
              transition: { type: "spring", stiffness: 300, damping: 24 },
            }}
            className="demo-card p-5"
          >
            <Eyebrow className="mb-4">{t("execution")}</Eyebrow>
            <dl className="grid grid-cols-3 gap-y-3.5 gap-x-4">
              <Detail label={t("entry")}>
                <span className="tnum text-primary">
                  {fmtPrice(trade.entry, decimals, lang)}
                </span>
              </Detail>
              <Detail label={t("exit")}>
                <span className="tnum text-primary">
                  {fmtPrice(trade.exit, decimals, lang)}
                </span>
              </Detail>
              <Detail label={t("quantity")}>
                <span className="tnum text-primary">
                  {fmtNum(trade.qty, lang, 3)}
                </span>
              </Detail>
              <Detail label={t("grossPnl")}>
                <Money value={trade.grossPnl} sign colorizeSign />
              </Detail>
              <Detail label={t("fees")}>
                <Money value={-trade.fees} />
              </Detail>
              {/* El rótulo es «Setup» en los dos idiomas —es el término del
                  oficio—, pero su VALOR no lo era: aquí se pintaba la clave
                  cruda, y en español eso dejaba «Breakout» en una ficha por
                  lo demás traducida. */}
              <Detail label="Setup">
                <span className="text-primary">{nombreSetup(trade.setup, lang)}</span>
              </Detail>
            </dl>
          </motion.div>

          {/* Anatomy card — executions table (mirrors the real app's
              "Anatomía: las ejecuciones reales" card). */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: EASE }}
            whileHover={{
              y: -2,
              transition: { type: "spring", stiffness: 300, damping: 24 },
            }}
            className="demo-card p-5"
          >
            <div className="flex items-center gap-3 mb-4">
              <Eyebrow>
                {lang === "es" ? "Anatomía" : "Anatomy"}
              </Eyebrow>
              <span className="pill bg-[rgb(var(--divider)/0.05)] text-tertiary border border-[rgb(var(--divider)/0.1)] text-[10px] tnum">
                {fills.length} {lang === "es" ? "fills" : "fills"}
              </span>
            </div>
            {/* Table header — wrapped in overflow-x-auto so the fixed
                column widths (3.5rem + 1fr + 3.5rem + 4rem + 3rem + 3.5rem
                = ~296px + 5×12px gaps = ~356px) scroll horizontally inside
                the card on narrow viewports instead of forcing the column
                past its track. */}
            <div className="overflow-x-auto custom-scroll -mx-1 px-1">
              <div className="grid grid-cols-[3.5rem_1fr_3.5rem_4rem_3rem_3.5rem] gap-x-3 pb-2 min-w-[24rem] text-[10px] uppercase tracking-[0.14em] text-tertiary border-b border-[rgb(var(--divider)/0.1)]">
                <div>{lang === "es" ? "Lado" : "Side"}</div>
                <div>{lang === "es" ? "Hora" : "Time"}</div>
                <div className="text-right">Qty</div>
                <div className="text-right">{lang === "es" ? "Precio" : "Price"}</div>
                <div className="text-right">{lang === "es" ? "Com." : "Fee"}</div>
                <div className="text-right">{lang === "es" ? "Acum." : "Cum."}</div>
              </div>
              <ul className="divide-y divide-[rgb(var(--divider)/0.07)]">
                {fills.map((f, i) => {
                  const isEntry = f.dir === "ENTRY";
                  return (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35, delay: 0.5 + i * 0.08, ease: EASE }}
                      className="grid grid-cols-[3.5rem_1fr_3.5rem_4rem_3rem_3.5rem] gap-x-3 py-2 items-center text-xs min-w-[24rem]"
                    >
                    <div className="flex flex-col">
                      <span
                        className={`text-[11px] font-semibold ${
                          isEntry
                            ? trade.direction === "long"
                              ? "text-pnl-pos"
                              : "text-pnl-neg"
                            : trade.direction === "long"
                            ? "text-pnl-neg"
                            : "text-pnl-pos"
                        }`}
                      >
                        {f.dir}
                      </span>
                      <span className="text-[10px] text-tertiary">
                        {f.side}
                      </span>
                    </div>
                    <span className="tnum text-secondary">{f.time}</span>
                    <span className="tnum text-secondary text-right">{f.qty}</span>
                    <span className="tnum font-semibold text-primary text-right">
                      {f.price}
                    </span>
                    <span className="tnum text-tertiary text-right">{f.fee}</span>
                    <span className="tnum text-tertiary text-right">{f.cumulative}</span>
                  </motion.li>
                );
              })}
            </ul>
            </div>
          </motion.div>

          {/* Day-context card — mirrors the real app's "Dónde cayó
              dentro del día" card (revenge warning, ordinal, since
              previous, P&L before). */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45, ease: EASE }}
            whileHover={{
              y: -2,
              transition: { type: "spring", stiffness: 300, damping: 24 },
            }}
            className="demo-card p-5"
          >
            <Eyebrow className="mb-4">
              {lang === "es" ? "Dónde cayó dentro del día" : "Where it fell in the day"}
            </Eyebrow>
            <div className="space-y-3">
              {isRevengeCandidate && (
                <div className="flex items-start gap-2.5 text-pnl-warn">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mt-0.5 flex-shrink-0"
                    aria-hidden
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <p className="text-xs leading-relaxed">
                    {lang === "es"
                      ? "Posible revancha: mismo instrumento, dentro de tu ventana de enfriamiento."
                      : "Possible revenge: same instrument, inside your cooldown window."}
                  </p>
                </div>
              )}
              <p className="text-sm text-secondary">{dayOrdinal}</p>
              <p className="text-sm text-secondary">{sincePrevious}</p>
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] uppercase tracking-[0.15em] text-tertiary">
                  {lang === "es" ? "P&L previo" : "P&L before"}
                </span>
                <Money
                  value={dayPnlBefore}
                  sign
                  colorizeSign
                  className="text-sm font-semibold"
                />
              </div>
            </div>
          </motion.div>

          {/* Plan card + Context card (compact 2-up) */}
          <div className="grid sm:grid-cols-2 gap-5">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55, ease: EASE }}
              whileHover={{
                y: -2,
                transition: { type: "spring", stiffness: 300, damping: 24 },
              }}
              className="demo-card p-5"
            >
              <Eyebrow className="mb-4">{t("plan")}</Eyebrow>
              <dl className="grid grid-cols-2 gap-y-3.5 gap-x-4">
                <Detail label={t("initialStop")}>
                  <span className="tnum text-pnl-neg">
                    {fmtPrice(trade.initialStop, decimals, lang)}
                  </span>
                </Detail>
                <Detail label={t("target")}>
                  <span className="tnum text-pnl-pos">
                    {fmtPrice(trade.target, decimals, lang)}
                  </span>
                </Detail>
                <Detail label="MAE">
                  <span className="tnum text-pnl-neg">
                    {trade.mae.toFixed(2)}R
                  </span>
                </Detail>
                <Detail label="MFE">
                  <span className="tnum text-pnl-pos">
                    +{trade.mfe.toFixed(2)}R
                  </span>
                </Detail>
              </dl>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6, ease: EASE }}
              whileHover={{
                y: -2,
                transition: { type: "spring", stiffness: 300, damping: 24 },
              }}
              className="demo-card p-5"
            >
              <Eyebrow className="mb-4">{t("context")}</Eyebrow>
              <dl className="grid grid-cols-2 gap-y-3.5 gap-x-4">
                <Detail label={lang === "es" ? "Temporalidad" : "Timeframe"}>
                  <span className="text-primary">5m</span>
                </Detail>
                <Detail label={lang === "es" ? "Sesión" : "Session"}>
                  <span className="text-primary">{trade.session}</span>
                </Detail>
                <Detail label={lang === "es" ? "Mercado" : "Market"}>
                  <span className="text-primary">
                    {lang === "es" ? "Tendencia" : "Trending"}
                  </span>
                </Detail>
                <Detail label={lang === "es" ? "Ánimo pre" : "Mood pre"}>
                  <span className="text-primary">3/5</span>
                </Detail>
              </dl>
            </motion.div>
          </div>

          {/* Dates row */}
          <div className="flex items-center gap-6 flex-wrap text-xs">
            <div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-tertiary mb-0.5">
                {lang === "es" ? "Apertura" : "Opened"}
              </div>
              <div className="tnum text-secondary">
                {fmtDateTime(trade.openedAt, lang)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-tertiary mb-0.5">
                {t("colClosed")}
              </div>
              <div className="tnum text-secondary">
                {fmtDateTime(trade.closedAt, lang)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-tertiary mb-0.5">
                {lang === "es" ? "Duración" : "Duration"}
              </div>
              <div className="tnum font-semibold text-primary">
                {fmtDuration(trade.durationMin, lang)}
              </div>
            </div>
          </div>
        </div>

        {/* ===== RIGHT COLUMN ===== */}
        <div className="flex flex-col gap-5 min-w-0">
          {/* Screenshots card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: EASE }}
            whileHover={{
              y: -2,
              transition: { type: "spring", stiffness: 300, damping: 24 },
            }}
            className="demo-card p-5"
          >
            <Eyebrow className="mb-4">{t("screenshots")}</Eyebrow>
            <div className="border-2 border-dashed border-[rgb(var(--divider)/0.1)] rounded-md p-4 text-center text-xs text-tertiary mb-3 transition-colors hover:border-[rgb(var(--divider)/0.2)] hover:bg-[rgb(var(--divider)/0.02)]">
              <svg
                className="mx-auto mb-2 opacity-60"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
              </svg>
              {t("dropScreens")}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="aspect-[4/3] rounded-md overflow-hidden border border-[rgb(var(--divider)/0.10)] p-1.5">
                <MiniCandles seed={trade.id * 7 + 1} win={isWin} />
              </div>
              <div className="aspect-[4/3] rounded-md overflow-hidden border border-[rgb(var(--divider)/0.10)] p-1.5">
                <MiniCandles seed={trade.id * 13 + 5} win={isWin} />
              </div>
            </div>
          </motion.div>

          {/* Tags card — mirrors the real app's "Etiquetas" card
              (error / acierto / emocion / libre, with remove buttons). */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45, ease: EASE }}
            whileHover={{
              y: -2,
              transition: { type: "spring", stiffness: 300, damping: 24 },
            }}
            className="demo-card p-5"
          >
            <Eyebrow className="mb-4">
              {lang === "es" ? "Etiquetas" : "Tags"}
            </Eyebrow>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, i) => (
                <TagPill
                  key={`${tag.kind}-${tag.label}-${i}`}
                  kind={tag.kind}
                  label={tag.label}
                  onRemove={() =>
                    setTags((prev) => prev.filter((_, j) => j !== i))
                  }
                />
              ))}
              <button
                type="button"
                onClick={() =>
                  setTags((prev) => [
                    ...prev,
                    {
                      kind: "custom",
                      label: lang === "es" ? "Nueva etiqueta" : "New tag",
                    },
                  ])
                }
                className="pill inline-flex items-center gap-1 text-[11px] border border-dashed border-[rgb(var(--divider)/0.15)] text-tertiary hover:text-primary hover:border-[rgb(var(--divider)/0.3)] transition-colors"
                aria-label={lang === "es" ? "Añadir etiqueta" : "Add tag"}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  aria-hidden
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {lang === "es" ? "Añadir" : "Add"}
              </button>
            </div>
          </motion.div>

          {/* Review card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: EASE }}
            whileHover={{
              y: -2,
              transition: { type: "spring", stiffness: 300, damping: 24 },
            }}
            className="demo-card p-5"
          >
            <Eyebrow className="mb-4">{t("review")}</Eyebrow>

            {/* Notes — entry / management / close */}
            <div className="space-y-3 mb-5">
              <div>
                <div className="text-[10px] uppercase tracking-[0.15em] text-tertiary mb-1">
                  {t("entryNote")}
                </div>
                <blockquote className="border-l-2 border-solid border-[rgb(var(--divider)/0.25)] pl-3 py-1 text-sm text-secondary italic leading-relaxed">
                  {trade.entryNote}
                </blockquote>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.15em] text-tertiary mb-1">
                  {t("manageNote")}
                </div>
                <blockquote className="border-l-2 border-solid border-[rgb(var(--divider)/0.25)] pl-3 py-1 text-sm text-secondary italic leading-relaxed">
                  {lang === "es"
                    ? `MFE alcanzó ${trade.mfe.toFixed(2)}R; salí en ${trade.rMultiple.toFixed(2)}R.`
                    : `MFE reached ${trade.mfe.toFixed(2)}R; exited at ${trade.rMultiple.toFixed(2)}R.`}
                </blockquote>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.15em] text-tertiary mb-1">
                  {t("closeNote")}
                </div>
                <blockquote className="border-l-2 border-solid border-[rgb(var(--divider)/0.25)] pl-3 py-1 text-sm text-secondary italic leading-relaxed">
                  {trade.closeNote}
                </blockquote>
              </div>
            </div>

            <p className="text-sm text-secondary mb-3">{t("followedPlan")}</p>

            {/* Compliance toggle */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {(["yes", "partial", "no"] as Compliance[]).map((opt) => {
                const active = review === opt;
                const optTone =
                  opt === "yes"
                    ? "text-pnl-pos"
                    : opt === "no"
                    ? "text-pnl-neg"
                    : "text-pnl-warn";
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setReview(opt)}
                    aria-pressed={active}
                    className={`relative h-10 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? "text-primary"
                        : "text-tertiary hover:text-secondary hover:bg-[rgb(var(--divider)/0.05)]"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="review-pill"
                        className="absolute inset-0 rounded-md bg-[rgb(var(--divider)/0.05)] border border-[rgb(var(--divider)/0.2)]"
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                        }}
                      />
                    )}
                    <span className={`relative ${active ? optTone : ""}`}>
                      {t(opt)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Summary */}
            <div className="space-y-2.5 border-t border-[rgb(var(--divider)/0.1)] pt-4">
              <SummaryRow
                label={t("rr")}
                tone={trade.rMultiple >= 0 ? "pos" : "neg"}
                value={`${trade.rMultiple > 0 ? "+" : ""}${trade.rMultiple.toFixed(2)}R`}
              />
              <SummaryRow
                label={t("grossPnl")}
                value={<Money value={trade.grossPnl} sign colorizeSign />}
              />
              <SummaryRow
                label={t("fees")}
                value={<Money value={-trade.fees} />}
              />
              <SummaryRow
                label={lang === "es" ? "P&L neto" : "Net P&L"}
                tone={trade.netPnl >= 0 ? "pos" : "neg"}
                value={<Money value={trade.netPnl} sign colorizeSign />}
              />
            </div>

            {/* Save button */}
            <div className="mt-5">
              <MagneticButton
                type="button"
                strength={0.25}
                className="w-full h-11 rounded-md bg-[rgb(var(--accent-base))] text-[rgb(var(--accent-ink))] font-medium text-sm transition-colors hover:bg-[rgb(var(--accent-hover))] inline-flex items-center justify-center"
              >
                {t("saveChanges")}
              </MagneticButton>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
