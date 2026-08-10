"use client";

import { useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useLang } from "@/lib/i18n";
import {
  TRADES,
  METRICS,
  INSTRUMENTS,
  SETUP_NAMES,
  nombreSetup,
  INITIAL_BALANCE_CONST,
  type Direction,
  type Metrics,
} from "@/lib/trading/data";
import { addTrade, useAllTrades } from "@/lib/trading/demoStore";
import { useToast } from "@/hooks/use-toast";
import { useHydrated } from "@/hooks/use-hydrated";
import { fmtNum, fmtPct } from "@/lib/trading/format";
import { Reveal } from "@/components/tj/Reveal";
import { Eyebrow } from "@/components/tj/Eyebrow";
import { Money } from "@/components/tj/Money";
import { EquityCurve } from "@/components/charts/EquityCurve";
import { MiniCalendar } from "@/components/charts/MiniCalendar";
import { AssetMark } from "@/components/demo/AssetMark";
import { useDemo } from "@/components/demo/DemoContext";

// ES futures contract multiplier ($50 per point per contract) — kept for
// the demo's P&L computation parity with demoStore.ts.
const FUTURES_MULTIPLIER = 50;

// Equity-curve timeframe selector — filters the chart to the last N days
// of trades so the user can zoom into 1M / 3M / 6M windows. The sample
// data spans ~180 days, so "6M" is effectively "All".
type Timeframe = "1M" | "3M" | "6M";
const TIMEFRAMES: Timeframe[] = ["1M", "3M", "6M"];
const TF_DAYS: Record<Timeframe, number> = { "1M": 30, "3M": 90, "6M": 180 };

/** Slice a Metrics snapshot to the last N days of trades — keeps the
 *  equityCurve + drawdownCeiling arrays in sync so the chart redraws
 *  without changing the underlying sample data. Returns the original
 *  metrics object if the slice would be empty or cover everything. */
function sliceMetricsByDays(m: Metrics, days: number): Metrics {
  if (!m.equityCurve.length) return m;
  const last = m.equityCurve[m.equityCurve.length - 1].date.getTime();
  const cutoff = last - days * 86_400_000;
  let startIdx = 0;
  for (let i = 0; i < m.equityCurve.length; i++) {
    if (m.equityCurve[i].date.getTime() >= cutoff) {
      startIdx = i;
      break;
    }
  }
  if (startIdx === 0) return m;
  const equityCurve = m.equityCurve.slice(startIdx);
  const drawdownCeiling = m.drawdownCeiling.slice(startIdx);
  return { ...m, equityCurve, drawdownCeiling };
}

const inputCls =
  "w-full bg-[rgb(var(--divider)/0.05)] border border-[rgb(var(--divider)/0.1)] rounded-md h-9 px-3 text-sm text-primary tnum placeholder:text-tertiary focus:border-[rgb(var(--divider)/0.2)] focus:bg-[rgb(var(--divider)/0.08)] transition-colors appearance-none";
const labelCls =
  "block text-[11px] uppercase tracking-[0.15em] text-tertiary mb-1.5";

/**
 * Dashboard / "Resumen" page of the native CountPips app,
 * recreated for the browser demo. Mirrors the WinUI DashboardPage.xaml
 * layout (post 17/07/2026 redesign):
 *
 *   ┌─ Section 1 — REGISTRAR OPERACIÓN (protagonist, full width) ────┐
 *   │  Header: eyebrow + title (left) │ live Risk $ 28px (right)      │
 *   │  Composer card ─ 2-col grid                                     │
 *   │    ┌── Left col ──────────┐  ┌── Right col ──────────────────┐ │
 *   │    │ Screenshot dropzone  │  │ Long/Short toggle              │ │
 *   │    │ (380px fixed height) │  │ Instrument                     │ │
 *   │    ├──────────────────────┤  │ Entry + Exit                   │ │
 *   │    │ Risk $ │ R:R │ %     │  │ Quantity + calc                │ │
 *   │    │ (hairline dividers)  │  │ Stop + Target                  │ │
 *   │    └──────────────────────┘  │ Setup + Note                   │ │
 *   │                              └────────────────────────────────┘ │
 *   │  Footer: session count (left) │ Save draft + Register (right)   │
 *   └──────────────────────────────────────────────────────────────────┘
 *   ┌─ Section 2 — RENDIMIENTO (full width below) ──────────────────┐
 *   │  Header: eyebrow + title                                       │
 *   │  KPI strip — 7 cells with vertical hairline dividers (no card) │
 *   │  Equity curve │ Calendar — 50/50 side-by-side                  │
 *   └──────────────────────────────────────────────────────────────────┘
 *
 * The composer is the protagonist — full-width and centered, with a
 * generous 2-column layout (image left, data right) so a pasted chart
 * screenshot reads LARGE while the trader fills in the trade alongside.
 * Performance (KPIs + equity + calendar) lives below, no longer
 * competing for space with the composer.
 */
export function DashboardPage() {
  const { t, lang } = useLang();
  const { toast } = useToast();
  const { goDetail, setPage } = useDemo();
  const es = lang === "es";

  // ----- equity-curve timeframe -----
  const [tfSel, setTfSel] = useState<Timeframe>("6M");
  const slicedMetrics = useMemo(
    () => sliceMetricsByDays(METRICS, TF_DAYS[tfSel]),
    [tfSel]
  );

  // ----- recent trades (sample + custom, newest first) -----
  // useAllTrades subscribes to localStorage so trades logged via the
  // composer above appear here instantly without a manual refresh.
  const allTrades = useAllTrades(TRADES);
  const recentTrades = useMemo(() => allTrades.slice(0, 6), [allTrades]);

  // ----- composer form state -----
  const [direction, setDirection] = useState<Direction>("long");
  const [instrumentSymbol, setInstrumentSymbol] = useState(INSTRUMENTS[0].symbol);
  const [setupName, setSetupName] = useState<string>(SETUP_NAMES[1]);
  const [entry, setEntry] = useState<string>(
    INSTRUMENTS[0].basePrice.toFixed(INSTRUMENTS[0].decimals)
  );
  const [stop, setStop] = useState<string>(
    (INSTRUMENTS[0].basePrice * 0.992).toFixed(INSTRUMENTS[0].decimals)
  );
  const [exitPrice, setExitPrice] = useState<string>(
    (INSTRUMENTS[0].basePrice * 1.018).toFixed(INSTRUMENTS[0].decimals)
  );
  const [target, setTarget] = useState<string>(
    (INSTRUMENTS[0].basePrice * 1.024).toFixed(INSTRUMENTS[0].decimals)
  );
  const [quantity, setQuantity] = useState<string>("1");
  const [note, setNote] = useState<string>("");
  const [advanced, setAdvanced] = useState(false);

  const inst =
    INSTRUMENTS.find((i) => i.symbol === instrumentSymbol) ?? INSTRUMENTS[0];

  const entryNum = parseFloat(entry) || 0;
  const stopNum = parseFloat(stop) || 0;
  const targetNum = parseFloat(target) || 0;
  const qtyNum = parseFloat(quantity) || 0;

  const stopDist = Math.abs(entryNum - stopNum);
  // planned R:R = |target - entry| / |entry - stop| (real app's TradeRrDisplay).
  const plannedRr = stopDist > 0 ? Math.abs(targetNum - entryNum) / stopDist : 0;

  // ----- risk-$ calculation (real app: % of equity by default) -----
  // The real app moved the sizing CALCULATOR into its own dialog — the
  // composer itself just shows the resulting risk $/R:R/% derived from
  // entry/stop/qty. The demo defaults to a 1% risk posture on the
  // initial $10,000 balance; once entry/stop/qty are all set, the risk
  // is computed directly from stop-distance × qty × multiplier so the
  // footer reads a real number, not a placeholder.
  const riskUsdLive = useMemo(() => {
    // If we have a real stop + qty, compute risk from the trade itself
    // (matches the real app's "Risk $" footer cell, which is derived
    // from entry/stop/cantidad — not a separate sizing input).
    if (stopDist > 0 && qtyNum > 0) {
      const multiplier =
        inst.assetClass === "forex"
          ? 100_000
          : inst.assetClass === "futures"
          ? FUTURES_MULTIPLIER
          : 1;
      return stopDist * qtyNum * multiplier;
    }
    // Fallback: 1% of the initial balance (the demo's default posture).
    return INITIAL_BALANCE_CONST * 0.01;
  }, [stopDist, qtyNum, inst.assetClass]);

  const riskPct = INITIAL_BALANCE_CONST > 0 ? riskUsdLive / INITIAL_BALANCE_CONST : 0;

  // ----- handlers -----
  function handleRegister() {
    const entryN = parseFloat(entry);
    const stopN = parseFloat(stop);
    const exitParsed = parseFloat(exitPrice);
    // Exit isn't strictly required — fall back to entry so a missing exit
    // records a scratch trade (P&L = 0, R = 0) instead of NaN poisoning.
    const exitN = Number.isFinite(exitParsed) ? exitParsed : entryN;
    const qtyN = parseFloat(quantity);

    if (
      !Number.isFinite(entryN) ||
      entryN <= 0 ||
      !Number.isFinite(stopN) ||
      stopN <= 0 ||
      entryN === stopN
    ) {
      toast({
        title: t("tradeRegisterError"),
        description: t("tradeRegisterErrorDesc"),
        variant: "destructive",
      });
      return;
    }

    // Calculate realized P&L and R-multiple.
    // priceDiff is signed: positive for a winning move, negative for a loser.
    const stopDistLocal = Math.abs(entryN - stopN);
    const priceDiff =
      direction === "long" ? exitN - entryN : entryN - exitN;
    const rMultiple = stopDistLocal > 0 ? +(priceDiff / stopDistLocal).toFixed(2) : 0;

    // Position-value multiplier per asset class — matches demoStore.ts.
    const multiplier =
      inst.assetClass === "forex"
        ? 100_000
        : inst.assetClass === "futures"
        ? FUTURES_MULTIPLIER
        : 1;
    const safeQty = Number.isFinite(qtyN) && qtyN > 0 ? qtyN : 1;
    const netPnl = +(priceDiff * safeQty * multiplier).toFixed(2);

    addTrade({
      instrument: instrumentSymbol,
      setup: setupName as (typeof SETUP_NAMES)[number],
      direction,
      entry: +entryN.toFixed(inst.decimals),
      exit: +exitN.toFixed(inst.decimals),
      qty: +safeQty.toFixed(inst.assetClass === "forex" ? 2 : 3),
      netPnl,
      rMultiple,
      // A trade logged with a defined stop = followed plan, by convention.
      compliance: "yes",
      closedAt: new Date().toISOString(),
      note: note.trim(),
    });

    setNote("");

    toast({
      title: t("tradeRegistered"),
      description: t("tradeRegisteredDesc"),
    });
  }

  function selectInstrument(sym: string) {
    const next = INSTRUMENTS.find((i) => i.symbol === sym);
    if (!next) return;
    setInstrumentSymbol(sym);
    setEntry(next.basePrice.toFixed(next.decimals));
    setStop((next.basePrice * 0.992).toFixed(next.decimals));
    setExitPrice((next.basePrice * 1.018).toFixed(next.decimals));
    setTarget((next.basePrice * 1.024).toFixed(next.decimals));
  }

  // session count: trades logged "today" (demo: any custom trade this session).
  const sessionCount = allTrades.length - TRADES.length;

  return (
    <div className="p-5 md:p-6 space-y-8 relative">
      {/* ============ SECTION 1: REGISTRAR OPERACIÓN (protagonist) ============ */}
      <section className="relative">
        {/* Cabecera: eyebrow + title (left) │ live Risk $ 28px (right) */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="min-w-0">
            <Reveal delay={0}>
              <Eyebrow>{t("captureEyebrow")}</Eyebrow>
            </Reveal>
            <Reveal delay={0.04}>
              {/* h2 y no h1: esta es una pantalla SIMULADA dentro de la página de
                  la demo. El h1 del documento es el titular de esa página, y dos
                  h1 rompen el esquema de encabezados —lectores de pantalla y
                  buscadores lo usan para entender la jerarquía—. */}
              <h2 className="mt-2 font-medium tracking-[-0.02em] text-primary text-2xl md:text-[28px] leading-tight">
                {t("captureHeadline")}
              </h2>
            </Reveal>
          </div>
          {/* Riesgo en vivo: una sola cifra protagonista por pantalla.
              Reads "Risk in $" eyebrow + 28px Money value, right-aligned.
              The number animates softly when the value changes (entry/stop/qty
              edits) — same live-readout language as the WinUI app. */}
          <Reveal delay={0.08}>
            <div className="text-right shrink-0">
              <div className="text-[11px] uppercase tracking-[0.15em] text-tertiary">
                {t("riskUsd")}
              </div>
              <motion.div
                key={`risk-${riskUsdLive.toFixed(2)}`}
                initial={{ opacity: 0.55, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
                aria-live="polite"
                className="mt-1 text-[28px] font-bold tnum text-primary leading-none"
              >
                <Money value={riskUsdLive} />
              </motion.div>
            </div>
          </Reveal>
        </div>

        {/* Composer card — 2-col grid (image left, data right) */}
        <Reveal delay={0.1}>
          <motion.div
            className="demo-card p-5 md:p-6 relative overflow-hidden"
          >
            <div className="relative z-10">
              {/* R26-1d: wrap the composer inputs + footer actions in a real
                  <form> so Enter-to-submit works from any field, the form
                  landmark is exposed to SR, and browser autofill heuristics
                  have proper form context. The screenshot dropzone, Save
                  draft, direction toggle and calc-method buttons all carry
                  type="button" so they don't accidentally submit. The
                  Register button is now type="submit" and triggers
                  handleRegister via the form's onSubmit (after
                  preventDefault). */}
              <form
                className="contents"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRegister();
                }}
              >
              {/* `min-w-0` en las dos columnas, y no es cosmético: un hijo de
                  grid trae `min-width:auto`, o sea que NO puede encogerse por
                  debajo del ancho mínimo de su contenido. Medido en 390×844:
                  la columna del formulario se plantaba en 262px dentro de una
                  celda de 223 y la tarjeta —que tiene `overflow:hidden`— le
                  cortaba 39px por la derecha. Es decir, en el teléfono los
                  campos de la columna derecha de cada par («Salida»,
                  «Objetivo») salían seccionados por el canto. No lo delataba
                  nada: el recorte se come el desbordamiento, así que ni la
                  consola, ni los tests, ni el ancho del documento se
                  enteraban. Lo vigila ahora `humo.mjs`. */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* ============ LEFT COLUMN: image + risk footer ============ */}
                <div className="flex flex-col min-w-0">
                  {/* Screenshot dropzone — 380px FIXED height (matches the
                      WinUI RowDefinition Height="380"). Independent of the
                      form column's height: never resizes when fields
                      change. Empty-state shows a drop affordance; the demo
                      doesn't actually paste images but the affordance
                      communicates the workflow. */}
                  <button
                    type="button"
                    aria-label={t("dropScreens")}
                    // Responsive height: 380px fixed was the WinUI RowDefinition,
                    // but on a 316px mobile card it filled the entire viewport.
                    // 320px sm → 380px md+ (desktop parity).
                    //
                    // En móvil ya no son 260px sino 104. Medido en 390×844: con
                    // 260px, el primer control del formulario —el toggle
                    // Long/Short— empezaba en el píxel 606 de un panel de 480,
                    // o sea FUERA de la vista. Lo único que veía quien abre la
                    // demo en el teléfono era un rectángulo punteado para
                    // arrastrar un archivo, que es justo lo que un teléfono no
                    // puede hacer. La demo prometía «la app en tu navegador» y
                    // enseñaba una zona de soltar vacía. Compacta sigue
                    // comunicando que el flujo admite capturas, sin robarle la
                    // pantalla a lo que de verdad hay que ver.
                    className="w-full border border-dashed border-[rgb(var(--divider)/0.15)] rounded-md flex flex-col items-center justify-center gap-2 text-tertiary hover:text-secondary hover:border-[rgb(var(--divider)/0.3)] hover:bg-[rgb(var(--divider)/0.05)] transition-colors group h-[104px] sm:h-[320px] md:h-[380px]"
                  >
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className="group-hover:scale-110 transition-transform"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                    <span className="text-sm font-medium text-secondary text-center px-6">
                      {t("dropScreens")}
                    </span>
                    {/* La pista de Ctrl+V sólo donde ese atajo existe. En un
                        teléfono no hay ni Ctrl ni arrastrar un fichero: dejarla
                        ahí era prometer una interacción imposible en el propio
                        dispositivo desde el que se lee, y esta página presume
                        de no simular lo que no hay. */}
                    <span className="hidden sm:block text-[11px] text-tertiary text-center px-6">
                      {es
                        ? "Pega con Ctrl+V o arrastra una imagen del gráfico"
                        : "Paste with Ctrl+V or drag a chart image"}
                    </span>
                  </button>

                  {/* Risk footer — 3 cells (Risk $ / R:R / %) separated by
                      vertical hairlines, anchored to the bottom of the
                      left column. Top border = hairline divider. Mirrors
                      the WinUI VerticalHairlineStyle strip. */}
                  <div className="mt-4 pt-4 border-t border-[rgb(var(--divider)/0.1)]">
                    <div className="text-[11px] uppercase tracking-[0.15em] text-tertiary mb-3">
                      {es ? "Riesgo de esta operación" : "Trade risk"}
                    </div>
                    {/* `minmax(0,1fr)` y no `1fr`: un `1fr` pelado equivale a
                        `minmax(auto,1fr)`, así que la columna NO puede
                        encoger por debajo de su contenido. Con «520,00 US$»
                        dentro, la primera celda se plantaba en 96px, la tira
                        entera medía 262 en un hueco de 224 y el «5,20 %» se
                        salía por el canto de la tarjeta —que recorta— en
                        390px de ancho. Medido en 390×844. El gap también baja
                        a 8px en móvil: cuatro huecos de 16 se comían 64 de
                        los 224 disponibles. */}
                    <div className="grid grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)_1px_minmax(0,1fr)] gap-x-2 sm:gap-x-4 items-stretch">
                      {/* Risk $ */}
                      <div className="flex flex-col items-center justify-center gap-1 text-center py-1 rounded-md transition-colors hover:bg-[rgb(var(--divider)/0.03)]">
                        <div className="text-[10px] uppercase tracking-[0.12em] text-tertiary">
                          {t("riskUsd")}
                        </div>
                        <Money
                          value={riskUsdLive}
                          className="text-lg font-semibold text-primary"
                        />
                      </div>
                      {/* Vertical hairline — full height with subtle gradient */}
                      <div
                        className="self-stretch w-px bg-gradient-to-b from-transparent via-[rgb(var(--divider)/0.18)] to-transparent"
                        aria-hidden="true"
                      />
                      {/* R:R planned */}
                      <div className="flex flex-col items-center justify-center gap-1 text-center py-1 rounded-md transition-colors hover:bg-[rgb(var(--divider)/0.03)]">
                        <div className="text-[10px] uppercase tracking-[0.12em] text-tertiary">
                          {t("rr")}
                        </div>
                        <span
                          className={`text-lg font-semibold tnum ${
                            plannedRr >= 2
                              ? "text-pnl-pos"
                              : plannedRr >= 1
                              ? "text-pnl-warn"
                              : "text-pnl-neg"
                          }`}
                        >
                          {fmtNum(plannedRr, lang, 2)}R
                        </span>
                      </div>
                      {/* Vertical hairline */}
                      <div
                        className="self-stretch w-px bg-gradient-to-b from-transparent via-[rgb(var(--divider)/0.18)] to-transparent"
                        aria-hidden="true"
                      />
                      {/* % of account */}
                      <div className="flex flex-col items-center justify-center gap-1 text-center py-1 rounded-md transition-colors hover:bg-[rgb(var(--divider)/0.03)]">
                        <div className="text-[10px] uppercase tracking-[0.12em] text-tertiary">
                          {es ? "% cuenta" : "% acct"}
                        </div>
                        <span
                          className={`text-lg font-semibold tnum ${
                            riskPct > 0.02
                              ? "text-pnl-neg"
                              : riskPct > 0.01
                              ? "text-pnl-warn"
                              : "text-pnl-pos"
                          }`}
                        >
                          {fmtPct(riskPct, lang, 2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ============ RIGHT COLUMN: trade data form ============ */}
                <div className="flex flex-col gap-3 min-w-0">
                  {/* Long/Short toggle — 2-col grid with semantic P&L dots.
                      Sliding pill animates between Long (green) and Short
                      (red) via shared layoutId. */}
                  <div>
                    <span className={labelCls}>
                      {es ? "Dirección" : "Direction"}
                    </span>
                    <div
                      className="grid grid-cols-2 gap-2"
                      role="radiogroup"
                      aria-label={es ? "Dirección" : "Direction"}
                    >
                      {(["long", "short"] as Direction[]).map((d) => {
                        const active = direction === d;
                        return (
                          <button
                            key={d}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => setDirection(d)}
                            className={`relative h-11 rounded-md border text-sm font-medium transition-colors ${
                              active
                                ? d === "long"
                                  ? "bg-pnl-pos/15 border-pnl-pos/40 text-primary"
                                  : "bg-pnl-neg/15 border-pnl-neg/40 text-primary"
                                : "bg-[rgb(var(--divider)/0.05)] border-[rgb(var(--divider)/0.1)] text-tertiary hover:text-secondary hover:border-[rgb(var(--divider)/0.2)]"
                            }`}
                          >
                            {active && (
                              <motion.span
                                layoutId="dir-pill"
                                className={`absolute inset-0 rounded-md ${
                                  d === "long"
                                    ? "bg-pnl-pos/15 border border-pnl-pos/40"
                                    : "bg-pnl-neg/15 border border-pnl-neg/40"
                                }`}
                                transition={{
                                  type: "spring",
                                  stiffness: 400,
                                  damping: 32,
                                }}
                              />
                            )}
                            <span className="relative flex items-center justify-center gap-2">
                              {/* P&L semantic dot — green for Long, red for Short.
                                  Larger + glowing when active so the direction
                                  reads at-a-glance, mirroring the real app's
                                  PnlPositiveDot / PnlNegativeDot. */}
                              <motion.span
                                animate={{
                                  scale: active ? 1.15 : 1,
                                  boxShadow: active
                                    ? d === "long"
                                      ? "0 0 8px 1px rgb(var(--pnl-pos) / 0.6)"
                                      : "0 0 8px 1px rgb(var(--pnl-neg) / 0.6)"
                                    : "0 0 0px 0px rgb(0 0 0 / 0)",
                                }}
                                transition={{ duration: 0.25 }}
                                className={`inline-block w-2 h-2 rounded-full ${
                                  d === "long" ? "bg-pnl-pos" : "bg-pnl-neg"
                                }`}
                                aria-hidden="true"
                              />
                              {t(d)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Instrument — full-width select */}
                  <div>
                    <label htmlFor="d-inst" className={labelCls}>
                      {t("instrument")}
                    </label>
                    <div className="relative">
                      <select
                        id="d-inst"
                        value={instrumentSymbol}
                        onChange={(e) => selectInstrument(e.target.value)}
                        className={`${inputCls} pr-8 cursor-pointer`}
                      >
                        {INSTRUMENTS.map((i) => (
                          <option key={i.symbol} value={i.symbol}>
                            {i.symbol}
                          </option>
                        ))}
                      </select>
                      <ChevronDown />
                    </div>
                  </div>

                  {/* Entry + Exit — 2-col grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="d-entry" className={labelCls}>
                        {es ? "Entrada" : "Entry"}
                      </label>
                      <input
                        id="d-entry"
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={entry}
                        onChange={(e) => setEntry(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label htmlFor="d-exit" className={labelCls}>
                        {t("exit")}
                      </label>
                      <input
                        id="d-exit"
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={exitPrice}
                        onChange={(e) => setExitPrice(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  {/* Quantity — full-width input with realized R readout on right */}
                  <div className="grid grid-cols-[1fr_auto] gap-3">
                    <div>
                      <label htmlFor="d-qty" className={labelCls}>
                        {t("quantity")}
                      </label>
                      <input
                        id="d-qty"
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    {/* "Calcular tamaño" va pegado a Cantidad, como en la
                        app (DashboardPage.xaml L466): la calculadora de
                        tamaño de posición vive en su propio diálogo y al
                        confirmar rellena este campo. En la demo el botón
                        deja la cifra que ya calcula el propio composer —
                        el gesto es el mismo, sin abrir un diálogo que
                        aquí no aporta nada. */}
                    <div>
                      <span className={labelCls} aria-hidden="true">
                        &nbsp;
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (stopDist > 0) {
                            // 1 % de la cuenta entre la distancia al stop:
                            // el tamaño que arriesga exactamente ese 1 %.
                            const mult =
                              inst.assetClass === "forex"
                                ? 100_000
                                : inst.assetClass === "futures"
                                  ? FUTURES_MULTIPLIER
                                  : 1;
                            const q =
                              (INITIAL_BALANCE_CONST * 0.01) / (stopDist * mult);
                            setQuantity(q < 1 ? q.toFixed(3) : q.toFixed(2));
                          }
                        }}
                        className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md border border-[rgb(var(--divider)/0.12)] text-[12px] text-secondary hover:text-primary hover:bg-[rgb(var(--divider)/0.06)] transition-colors whitespace-nowrap"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          aria-hidden="true"
                        >
                          <rect x="5" y="3" width="14" height="18" rx="2" />
                          <path d="M8 7h8M8 11h2M12 11h2M16 11h.01M8 15h2M12 15h2M16 15h.01" />
                        </svg>
                        {es ? "Calcular tamaño" : "Size calculator"}
                      </button>
                    </div>
                  </div>

                  {/* Stop + Target — 2-col grid (InitialStop / InitialTarget
                      in the real app — gives the planned R:R). */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="d-stop" className={labelCls}>
                        {es ? "Stop" : "Stop"}
                      </label>
                      <input
                        id="d-stop"
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={stop}
                        onChange={(e) => setStop(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label htmlFor="d-target" className={labelCls}>
                        {es ? "Objetivo" : "Target"}
                      </label>
                      <input
                        id="d-target"
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  {/* Setup — full-width select */}
                  <div>
                    <label htmlFor="d-setup" className={labelCls}>
                      {t("setup")}
                    </label>
                    <div className="relative">
                      <select
                        id="d-setup"
                        value={setupName}
                        onChange={(e) => setSetupName(e.target.value)}
                        className={`${inputCls} pr-8 cursor-pointer`}
                      >
                        {SETUP_NAMES.map((s) => (
                          <option key={s} value={s}>
                            {nombreSetup(s, lang)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown />
                    </div>
                  </div>

                  {/* Note — textarea */}
                  <div className="flex-1 flex flex-col">
                    <label htmlFor="d-note" className={labelCls}>
                      {es ? "Nota" : "Note"}
                    </label>
                    <textarea
                      id="d-note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={t("notePlaceholder")}
                      rows={3}
                      className="w-full bg-[rgb(var(--divider)/0.05)] border border-[rgb(var(--divider)/0.1)] rounded-md px-3 py-2 text-sm text-primary placeholder:text-tertiary focus:border-[rgb(var(--divider)/0.2)] focus:bg-[rgb(var(--divider)/0.08)] transition-colors resize-none min-h-[88px] flex-1"
                      aria-label={t("notePlaceholder")}
                    />
                  </div>

                  {/* Modo avanzado — el interruptor que cierra el composer
                      en la app (Capture_AdvancedModeLabel). Abre el
                      registro por tramos: varias entradas o varias
                      salidas en la misma operación, que es lo que
                      distingue un diario serio de una hoja de cálculo.
                      En la demo declara la capacidad; el desglose por
                      tramos se ve entero en el detalle de la operación,
                      en la tabla "Anatomía". */}
                  <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
                    <input
                      type="checkbox"
                      checked={advanced}
                      onChange={(e) => setAdvanced(e.target.checked)}
                      className="peer sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
                        advanced
                          ? "bg-[rgb(var(--accent-base))]"
                          : "bg-[rgb(var(--divider)/0.15)]"
                      } peer-focus-visible:ring-2 peer-focus-visible:ring-[rgb(var(--accent-base)/0.5)]`}
                    >
                      <span
                        className={`absolute top-[3px] w-3.5 h-3.5 rounded-full transition-[left] ${
                          advanced ? "left-[19px] bg-[#1A1917]" : "left-[3px] bg-[rgb(var(--txt-secondary))]"
                        }`}
                      />
                    </span>
                    <span className="text-[12px] text-secondary">
                      {es
                        ? "Modo avanzado (varias entradas o salidas)"
                        : "Advanced mode (multiple entries or exits)"}
                    </span>
                  </label>
                </div>
              </div>

              {/* ============ FOOTER — session count + register ============
                  Top-border hairline (mirrors the WinUI DividerStroke).
                  Left: session count. Right: Save draft + Register
                  (accent, min-width 200, Ctrl+Enter). */}
              <div className="mt-6 pt-4 border-t border-[rgb(var(--divider)/0.1)] flex flex-wrap items-center gap-3 justify-between">
                {/* Session count */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-sm font-semibold tnum text-primary">
                    {sessionCount}
                  </span>
                  <span className="text-tertiary uppercase tracking-[0.1em]">
                    {es ? "en la sesión" : "this session"}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  <motion.button
                    type="button"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97, transition: { type: "spring", stiffness: 400, damping: 25 } }}
                    className="h-11 px-4 rounded-md bg-[rgb(var(--divider)/0.05)] border border-[rgb(var(--divider)/0.1)] text-secondary font-medium text-sm flex items-center gap-2 hover:bg-[rgb(var(--divider)/0.08)] hover:text-primary transition-colors"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M3 3h8l3 3v7a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1z" />
                      <path d="M5 3v3h5V3M5 11h6V8H5z" />
                    </svg>
                    {t("saveDraft")}
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97, transition: { type: "spring", stiffness: 400, damping: 25 } }}
                    title={es ? "Ctrl+Enter" : "Ctrl+Enter"}
                    className="group h-11 min-w-[200px] px-4 rounded-md bg-[rgb(var(--accent-base))] text-[rgb(var(--accent-ink))] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[rgb(var(--accent-hover))] transition-colors shadow-[0_2px_8px_rgb(var(--sombra)/0.18)]"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M3 8h10M8 3v10" />
                    </svg>
                    {t("registerTrade")}
                    {/* Keyboard hint — visible ⌘↵ chip on hover, mirrors the
                        real app's accelerator-key badge on primary CTAs. */}
                    <kbd
                      className="hidden sm:inline-flex items-center gap-0.5 h-5 px-1.5 rounded-[2px] bg-[rgb(var(--accent-ink)/0.12)] text-[10px] font-semibold text-[rgb(var(--accent-ink)/0.75)] tabular-nums group-hover:bg-[rgb(var(--accent-ink)/0.18)] transition-colors"
                      aria-hidden="true"
                    >
                      <span>⌘</span>
                      <span>↵</span>
                    </kbd>
                  </motion.button>
                </div>
              </div>
              </form>
            </div>
          </motion.div>
        </Reveal>
      </section>

      {/* ============ SECTION 2: RENDIMIENTO (full width below) ============ */}
      <section className="space-y-5">
        {/* Section header */}
        <div>
          <Reveal delay={0}>
            <Eyebrow>{t("performance")}</Eyebrow>
          </Reveal>
          <Reveal delay={0.04}>
            <h2 className="mt-2 font-medium tracking-[-0.02em] text-primary text-xl md:text-2xl leading-tight">
              {t("performanceTitle")}
            </h2>
          </Reveal>
        </div>

        {/* El parte de hoy — la primera tarjeta del Resumen en la app
            (DashboardPage.xaml L637-670). Es lo que el histórico dice del
            día ANTES de operar, y lo dice con la muestra en la mano: si no
            da para afirmar nada, lo declara en vez de inventarse una
            ventaja. La demo no la tenía, y es justo la pieza que hace que
            el Resumen se reconozca como esta app y no como un panel
            genérico de métricas. */}
        <Reveal delay={0.06}>
          <TodayBriefing />
        </Reveal>

        {/* KPI strip — 7 cells with vertical hairline dividers (no card).
            Mirrors the WinUI Grid with VerticalHairlineStyle borders
            between columns. Each cell: small caption + 18px tabular value. */}
        <Reveal delay={0.08}>
          {/* Mobile: horizontal-scroll strip with min-w cells (so the 7 KPIs
              stay readable instead of collapsing to ~25px each inside the
              316px panel). Desktop: same 7-col grid as before, no scroll. */}
          <div className="flex md:grid md:grid-cols-[repeat(7,minmax(5.5rem,1fr))] gap-x-4 px-1 py-2 overflow-x-auto custom-scroll">
            <KpiCell
              label={t("pnlTotal")}
              value={
                <Money
                  value={METRICS.netPnl}
                  sign
                  colorizeSign
                  className="text-lg font-semibold"
                />
              }
            />
            <KpiDivider />
            <KpiCell
              label={t("winRate")}
              value={
                <span className="text-lg font-semibold tnum text-primary">
                  {fmtPct(METRICS.winRate, lang, 1)}
                </span>
              }
            />
            <KpiDivider />
            <KpiCell
              label={t("expectancy")}
              value={
                <Money
                  value={METRICS.expectancy}
                  sign
                  colorizeSign
                  className="text-lg font-semibold"
                />
              }
            />
            <KpiDivider />
            <KpiCell
              label={t("profitFactor")}
              value={
                <span
                  className={`text-lg font-semibold tnum ${
                    METRICS.profitFactor >= 1 ? "text-pnl-pos" : "text-pnl-neg"
                  }`}
                >
                  {fmtNum(METRICS.profitFactor, lang, 2)}
                </span>
              }
            />
            <KpiDivider />
            <KpiCell
              label={t("currentDd")}
              value={
                <span className="text-lg font-semibold tnum text-pnl-neg">
                  {fmtPct(METRICS.currentDrawdown, lang, 1)}
                </span>
              }
            />
            <KpiDivider />
            <KpiCell
              label={t("streak")}
              value={
                <span
                  className={`text-lg font-semibold tnum ${
                    METRICS.currentStreak.kind === "win"
                      ? "text-pnl-pos"
                      : METRICS.currentStreak.kind === "loss"
                      ? "text-pnl-neg"
                      : "text-tertiary"
                  }`}
                >
                  {METRICS.currentStreak.count > 0
                    ? `${METRICS.currentStreak.count}${
                        METRICS.currentStreak.kind === "win"
                          ? es
                            ? "G"
                            : "W"
                          : es
                          ? "P"
                          : "L"
                      }`
                    : "—"}
                </span>
              }
            />
            <KpiDivider />
            <KpiCell
              label={t("discipline")}
              value={
                <span
                  className={`text-lg font-semibold tnum ${
                    METRICS.compliancePct >= 0.7
                      ? "text-pnl-pos"
                      : METRICS.compliancePct >= 0.5
                      ? "text-pnl-warn"
                      : "text-pnl-neg"
                  }`}
                >
                  {fmtPct(METRICS.compliancePct, lang, 0)}
                </span>
              }
            />
          </div>
        </Reveal>

        {/* Aviso de realidad — el InfoBar que la app pinta bajo la franja
            de KPIs (Summary_Reality*, Resources.resw L1612-1615). Pone la
            racha y la caída actuales frente a lo que el AZAR produce con
            ese porcentaje de acierto: sin esa referencia, tres pérdidas
            seguidas se leen como "algo va mal" cuando son lo normal. Es
            la pieza que convierte el panel en un antídoto contra el tilt. */}
        <Reveal delay={0.12}>
          <RealityCheck />
        </Reveal>

        {/* Equity curve + Calendar — 50/50 side-by-side. The real app's
            ColumnDefinition Width="*" / Width="*" — both halves equal.
            (Previous demo was 2/3 + 1/3.) */}
        <div className="grid lg:grid-cols-2 gap-4 md:gap-5">
          {/* Equity curve card */}
          <Reveal delay={0.1}>
            {/* Sin halo decorativo: la app no ilumina las esquinas de sus
                tarjetas, y ese resplandor blanco era otra marca de "esto es
                una web", no una ventana de escritorio. */}
            <div className="demo-card p-5 relative overflow-hidden h-full">
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3 gap-3 flex-wrap">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.15em] text-tertiary">
                      {es ? "Curva de capital" : "Equity curve"}
                    </div>
                    <div className="mt-1 flex items-baseline gap-2 flex-wrap">
                      <Money
                        value={METRICS.finalBalance}
                        compact
                        className="text-2xl font-bold text-primary"
                      />
                      <span
                        className={`text-xs tnum ${
                          METRICS.roiPct >= 0 ? "text-pnl-pos" : "text-pnl-neg"
                        }`}
                      >
                        {fmtPct(METRICS.roiPct, lang, 1)}
                      </span>
                    </div>
                  </div>
                  {/* Timeframe selector — 1M / 3M / 6M */}
                  <div className="flex items-center gap-0.5 bg-[rgb(var(--divider)/0.05)] border border-[rgb(var(--divider)/0.1)] rounded-md p-0.5">
                    {TIMEFRAMES.map((mode) => {
                      const active = tfSel === mode;
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setTfSel(mode)}
                          aria-pressed={active}
                          className={`relative px-2.5 h-6 rounded text-[11px] font-medium tnum transition-colors ${
                            active
                              ? "text-primary"
                              : "text-tertiary hover:text-secondary"
                          }`}
                        >
                          {active && (
                            <motion.span
                              layoutId="tf-pill"
                              className="absolute inset-0 rounded bg-[rgb(var(--divider)/0.1)] border border-[rgb(var(--divider)/0.15)]"
                              transition={{
                                type: "spring",
                                stiffness: 380,
                                damping: 30,
                              }}
                            />
                          )}
                          <span className="relative">{mode}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <EquityCurve metrics={slicedMetrics} height={260} />
              </div>
            </div>
          </Reveal>

          {/* P&L calendar card — MiniCalendar renders its own
              liquid-glass card with month header + nav arrows + daily
              P&L heat-map cells. */}
          <Reveal delay={0.14}>
            <MiniCalendar trades={TRADES} className="h-full" />
          </Reveal>
        </div>
      </section>

      {/* ============ RECENT TRADES — kept below performance ============
          A thin "last 6 trades" list at the bottom: not in the WinUI
          DashboardPage (it lives in Diario / Operaciones), but useful in
          the demo so a logged trade is immediately visible. */}
      <Reveal delay={0.1}>
        <div className="demo-card p-5 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-baseline justify-between mb-4 gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.15em] text-tertiary">
                  {es ? "Operaciones recientes" : "Recent trades"}
                </div>
                <div className="mt-1 text-primary font-medium text-base">
                  {es ? "Últimas 6 operaciones" : "Last 6 trades"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPage("trades")}
                className="text-xs text-tertiary hover:text-primary transition-colors flex items-center gap-1"
              >
                {es ? "Ver todas" : "See all"}
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="divide-y divide-[rgb(var(--divider)/0.07)]">
              {recentTrades.map((tr, i) => {
                const trInst = INSTRUMENTS.find((x) => x.symbol === tr.instrument);
                return (
                  <motion.button
                    key={tr.id}
                    type="button"
                    onClick={() => goDetail(tr.id)}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: Math.min(i * 0.04, 0.24),
                      duration: 0.3,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    /* `flex-wrap` en móvil, y no por gusto. Las cinco celdas
                       llevan `shrink-0`, así que NINGUNA puede ceder: a 390px
                       sumaban 319 en una fila de 207 útiles y la cifra de
                       resultado acababa en el píxel 384 con la tarjeta
                       cortando en 315. O sea que en el teléfono el P&L —el
                       dato por el que se mira una lista de operaciones— salía
                       seccionado o directamente invisible.
                       Envolver es lo único que no obliga a tirar información:
                       truncar el instrumento devolvía el "XAU/U…" que ya se
                       corrigió a propósito (ver el ancho de 100px de abajo), y
                       esconder la dirección o la R es perder un dato. Así la
                       fila pasa a dos líneas en móvil (47 → 79px): arriba
                       instrumento y dirección, abajo R y resultado a la
                       derecha. En sm+ vuelve a ser una sola línea. */
                    className="group w-full flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 py-2.5 hover:bg-[rgb(var(--divider)/0.05)] -mx-2 px-2 rounded-md transition-colors text-left"
                  >
                    {/* 80px se quedaba corto: "BTC/USDT" mide 79px de texto
                        él solo, y a eso hay que sumarle el icono + el hueco
                        antes de la letra — se cortaba en "EURU…" y "XAU/U…"
                        en el ancho de un teléfono. 100px es lo que pide el
                        símbolo más largo del catálogo, con margen. */}
                    <div className="flex items-center gap-2 min-w-0 w-[100px] sm:w-[110px] shrink-0">
                      <AssetMark assetClass={trInst?.assetClass} />
                      <span className="font-medium text-primary truncate min-w-0">
                        {tr.instrument}
                      </span>
                    </div>
                    <div className="shrink-0">
                      <DirectionChip direction={tr.direction} t={t} />
                    </div>
                    <div className="hidden md:block text-xs text-tertiary truncate flex-1 min-w-0">
                      {nombreSetup(tr.setup, lang)}
                    </div>
                    <div
                      className={`text-xs tnum font-medium shrink-0 w-12 text-right ${
                        tr.rMultiple > 0
                          ? "text-pnl-pos"
                          : tr.rMultiple < 0
                          ? "text-pnl-neg"
                          : "text-tertiary"
                      }`}
                    >
                      {fmtNum(tr.rMultiple, lang, 2)}R
                    </div>
                    {/* `ml-auto` sólo en móvil: es lo que manda el resultado al
                        canto derecho de la segunda línea cuando la fila
                        envuelve. En sm+ la fila es una sola línea y el hueco
                        ya lo reparte la columna del setup con `flex-1`. */}
                    <div className="shrink-0 w-20 sm:w-24 text-right ml-auto sm:ml-0">
                      <Money
                        value={tr.netPnl}
                        sign
                        colorizeSign
                        className="text-sm font-medium"
                      />
                    </div>
                    <svg
                      className="hidden md:block text-tertiary opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-[opacity,transform] shrink-0"
                      width="12"
                      height="12"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M6 4l4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

/** Single KPI cell — small caption above + 18px tabular SemiBold value below.
 *  No card, no hover lift: the strip is a flat band of statistics with
 *  hairline dividers, mirroring the WinUI strip. */
function KpiCell({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1 text-center min-w-[5.5rem] shrink-0 px-1 py-1 rounded-md transition-colors hover:bg-[rgb(var(--divider)/0.03)]">
      <div className="text-[10px] uppercase tracking-[0.12em] text-tertiary truncate max-w-full">
        {label}
      </div>
      {/* Tabular-nums + SemiBold enforced on the cell wrapper so all 7
          cells share the exact same numeric typography, regardless of
          whether the value is a <Money> span, a plain number, or a streak
          chip — keeps the row's baseline perfectly aligned. */}
      <div className="min-w-0 break-words [&>*]:text-lg [&>*]:font-semibold [&>span]:tnum">{value}</div>
    </div>
  );
}

/**
 * TodayBriefing — "El parte de hoy" (DashboardPage.xaml L637-670).
 *
 * Cuatro líneas que la app compone a partir del histórico REAL del
 * trader: qué deja su operación típica en el día de la semana que es
 * hoy, si ya ha cerrado algo, cómo va su cadencia y en qué racha llega.
 * Lo que la hace distinta de un widget de métricas cualquiera es que
 * declara cuándo NO puede afirmar nada: con muestra corta o con
 * resultados a ambos lados del cero, lo dice en vez de fabricar una
 * ventaja. Se reproducen aquí las cadenas literales de la app
 * (Summary_Briefing*, Resources.resw L608-617).
 *
 * El día de la semana se calcula tras montar, no en el render inicial:
 * la fecha del servidor y la del visitante no coinciden y el desajuste
 * rompería la hidratación (mismo motivo que el reloj del título).
 */
function TodayBriefing() {
  const { lang } = useLang();
  const es = lang === "es";
  // `useHydrated` en vez de estado + efecto: el día de la semana es un
  // valor derivado del cliente, no estado propio. Con el efecto había que
  // guardarlo en useState y eso disparaba un render en cascada al montar
  // (regla react-hooks/set-state-in-effect). Así se calcula durante el
  // render, pero sólo cuando ya estamos en el navegador.
  const hydrated = useHydrated();
  const weekday = hydrated
    ? new Date().toLocaleDateString(es ? "es-ES" : "en-GB", { weekday: "long" })
    : null;

  // Operaciones de la muestra que cayeron en el mismo día de la semana:
  // es la cifra con la que la app decide si puede afirmar algo o no.
  const sameWeekdayCount = useMemo(() => {
    if (!weekday) return 0;
    const target = new Date().getDay();
    return TRADES.filter((tr) => tr.closedAt.getDay() === target).length;
  }, [weekday]);

  const streak = METRICS.currentStreak;

  return (
    <div className="demo-card p-5">
      <div className="text-[11px] uppercase tracking-[0.15em] text-tertiary">
        {es ? "El parte de hoy" : "Today's briefing"}
      </div>
      <p className="mt-2 text-[12px] text-tertiary leading-relaxed max-w-3xl">
        {es
          ? "Lo que tu histórico dice de hoy, antes de operar — no una predicción. Cuando la muestra no da para afirmar nada, lo dice."
          : "What your history says about today, before you trade — not a prediction. When the sample cannot support a claim, it says so."}
      </p>
      <div className="mt-4 space-y-2 text-[13px] text-secondary leading-relaxed max-w-3xl">
        {/* Línea del día de la semana. En la muestra de la demo los
            resultados de cualquier día caen a los dos lados del cero, así
            que se usa la variante "ruidosa" — la que declara que no hay
            ventaja que afirmar. */}
        <p>
          {weekday
            ? es
              ? `Es ${weekday}. Con ${sameWeekdayCount} operaciones, tus resultados de ese día van de un lado a otro del cero: no hay ventaja ni desventaja que afirmar.`
              : `It is ${weekday}. Across ${sameWeekdayCount} trades, your results that day fall on both sides of zero: there is no edge or disadvantage to claim.`
            : " "}
        </p>
        <p>
          {es
            ? "Todavía no has cerrado ninguna operación hoy."
            : "You have not closed any trade today."}
        </p>
        {/* Con una sola operación no hay "racha" que anunciar: decir
            "1 ganadora seguidas" es la clase de descuido que delata que
            el texto lo compone una plantilla. */}
        {streak.kind !== "none" && streak.count > 1 && (
          <p>
            {es
              ? `Llegas con ${streak.count} ${
                  streak.kind === "win" ? "ganadoras" : "pérdidas"
                } seguidas.`
              : `You arrive on a run of ${streak.count} ${
                  streak.kind === "win" ? "winners" : "losers"
                }.`}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * RealityCheck — el aviso de la app bajo la franja de KPIs
 * (Summary_RealityStreakNormal / Summary_RealityDrawdownNormal).
 *
 * Los dos umbrales NO son cifras inventadas para la demo: salen de la
 * estadística de rachas. Con n operaciones y probabilidad de fallo q, la
 * racha perdedora más larga que cabe esperar es log(n)/log(1/q), y el
 * listón que el azar solo supera 1 de cada 20 veces es
 * log(n / ln(1/0,95))/log(1/q). Con los 200 trades y el 50 % de acierto
 * de la muestra dan 7 y 11 — los mismos números que enseña la app.
 *
 * La caída "típica" se deriva de ahí: una racha esperada de pérdidas
 * medias, medida contra el balance inicial.
 */
function RealityCheck() {
  const { lang } = useLang();
  const es = lang === "es";

  const streak = METRICS.currentStreak;
  const n = METRICS.closedCount;
  const q = 1 - METRICS.winRate; // probabilidad de perder

  if (n < 20 || q <= 0 || q >= 1) return null;

  const expectedStreak = Math.round(Math.log(n) / Math.log(1 / q));
  const rareStreak = Math.round(
    Math.log(n / Math.log(1 / 0.95)) / Math.log(1 / q)
  );

  // Caída típica: la racha esperada de pérdidas medias sobre el balance
  // de partida. Es el mismo orden de magnitud que la simulación de la app.
  const typicalDd =
    (expectedStreak * Math.abs(METRICS.avgLoss)) / INITIAL_BALANCE_CONST;
  const rareDd = (rareStreak * Math.abs(METRICS.avgLoss)) / INITIAL_BALANCE_CONST;

  /* Las dos frases son INDEPENDIENTES y cada una tiene su condición,
     exactamente como en LoadRealityCheck (PerformanceViewModel.cs
     L396-432): de la racha solo se habla si está EN una racha perdedora
     — en mitad de una buena racha nadie necesita que le tranquilicen, y
     decirlo entonces convierte el aviso en ruido que se aprende a
     saltar. De la caída, solo si hay una vigente. */
  const parts: string[] = [];

  if (streak.kind === "loss" && streak.count > 0) {
    parts.push(
      es
        ? `Llevas ${streak.count} pérdidas seguidas: con tu porcentaje de acierto lo normal es llegar a ${expectedStreak}, y ${rareStreak} tampoco sería raro.`
        : `You are on a run of ${streak.count} losses: with your win rate, reaching ${expectedStreak} is normal, and ${rareStreak} would not be unusual either.`
    );
  }

  if (METRICS.currentDrawdown > 0) {
    parts.push(
      es
        ? `Caída actual ${fmtPct(METRICS.currentDrawdown, lang, 1)}: la típica operando así es ${fmtPct(typicalDd, lang, 1)}, y ${fmtPct(rareDd, lang, 1)} sigue estando dentro de lo esperable.`
        : `Current drawdown ${fmtPct(METRICS.currentDrawdown, lang, 1)}: trading like this the typical one is ${fmtPct(typicalDd, lang, 1)}, and ${fmtPct(rareDd, lang, 1)} is still within what to expect.`
    );
  }

  if (parts.length === 0) return null;

  return (
    <div className="flex items-start gap-3 rounded-[2px] border border-[rgb(var(--divider)/0.10)] bg-[rgb(var(--divider)/0.02)] px-4 py-3">
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        className="text-tertiary shrink-0 mt-[2px]"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 7.5v.01" />
      </svg>
      <p className="text-[12px] text-secondary leading-relaxed">
        {parts.join(" ")}
      </p>
    </div>
  );
}

/** Vertical hairline divider between KPI cells — matches the WinUI
 *  VerticalHairlineStyle (1px column, full height, low-opacity stroke
 *  with a subtle top/bottom fade for premium feel). */
function KpiDivider() {
  return (
    <div
      // `md:hidden` — at md+ the parent switches from `flex` to a 7-col
      // CSS Grid (`md:grid md:grid-cols-[repeat(7,minmax(0,1fr))]`). The
      // 7 KpiDividers would otherwise become extra grid items (13 children
      // in a 7-col grid → wraps to 2 rows of KPIs). Hiding them on md+
      // leaves exactly 7 grid children (one per KpiCell) so the strip
      // stays a single row; the `gap-x-4` provides the optical separation
      // the dividers were painting on mobile.
      className="self-stretch w-px shrink-0 justify-self-center bg-gradient-to-b from-transparent via-[rgb(var(--divider)/0.18)] to-transparent md:hidden"
      aria-hidden="true"
    />
  );
}

/** Tiny direction chip — pos/neg colored pill with the long/short label.
 *  Kept inline (not importing Chip) so this file stays self-contained. */
function DirectionChip({
  direction,
  t,
}: {
  direction: Direction;
  t: (k: "long" | "short") => string;
}) {
  const isLong = direction === "long";
  return (
    <span
      /* El rojo usa `--pnl-neg-on-tint` y no el token normal: el texto va
         sobre un fondo teñido de su MISMO color, y ahí el #FF4D4D se
         quedaba en 4,03:1 para 10 px (hace falta 4,5:1). Ver la nota del
         token en globals.css con las alternativas medidas. El verde no lo
         necesita: sobre su tinte va sobrado. */
      className={`inline-flex items-center gap-1 px-1.5 h-5 rounded text-[10px] font-medium uppercase tracking-wider ${
        isLong
          ? "bg-pnl-pos/15 text-pnl-pos"
          : "bg-pnl-neg/15 text-[rgb(var(--pnl-neg-on-tint))]"
      }`}
    >
      <span
        className={`inline-block w-1 h-1 rounded-full ${
          isLong ? "bg-pnl-pos" : "bg-pnl-neg"
        }`}
        aria-hidden="true"
      />
      {t(direction)}
    </span>
  );
}

/** Native-select chevron overlay (since appearance-none strips it). */
function ChevronDown() {
  return (
    <span
      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-tertiary"
      aria-hidden="true"
    >
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <path
          d="M4 6l4 4 4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
