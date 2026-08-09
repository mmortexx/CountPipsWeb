"use client";

import { useState, useMemo } from "react";
import { useLang } from "@/lib/i18n";

/**
 * EquityProjector — proyector de curva de capital a N años.
 *
 * Complemento natural del RiskCalculator: éste calcula el riesgo de UNA
 * operación; EquityProjector proyecta a qué se convierte ese riesgo
 * repetido y disciplinado a lo largo de años.
 *
 * ── Modelo ────────────────────────────────────────────────────────────
 * Simulación simplificada a valor esperado (sin Monte Carlo por
 * iteración, para que el resultado sea determinista y reproducible):
 *
 *   expectancyPerTrade (R) = (winRate · avgWinR) − (lossRate · |avgLossR|)
 *   expectancyPerTradeUsd  = expectancyPerTrade · riskUsd
 *   riskUsd                = balance · riskPct / 100   (riesgo fijo %)
 *
 * Por año (tradesPerYear operaciones):
 *   yearlyReturnUsd(n)     = expectancyPerTradeUsd · tradesPerYear
 *   — el riesgo se recalcula cada operación sobre el balance actual,
 *      así que la curva es COMPUESTA, no lineal:
 *   balance(n+1) = balance(n) + expectancyPerTradeR · riskPct% · balance(n)
 *                = balance(n) · (1 + expectancyPerTradeR · riskPct/100)
 *                                per trade, × tradesPerYear per year
 *
 *   CAGR = (final/initial)^(1/years) − 1
 *
 * ── Drawdown estimado ─────────────────────────────────────────────────
 * Sin Monte Carlo real, se estima el drawdown como el peor caso
 * esperado de una racha de pérdidas consecutivas:
 *   maxConsecLosses ≈ log(1−0.99) / log(lossRate)   (99% confidence)
 *   estMaxDD         = maxConsecLosses · |avgLossR| · riskPct%
 * Es una cota razonable, no una garantía — el copy lo dice ("estimado").
 *
 * ── Material ──────────────────────────────────────────────────────────
 * .tj-paper + .tj-paper-glow (papel translúcido cálido, halo champagne).
 *
 * `num` — ordinal del eyebrow (la página interna pasa el suyo).
 */
export function EquityProjector({ num = "03" }: { num?: string }) {
  const { lang } = useLang();
  const es = lang === "es";

  // ── Inputs ────────────────────────────────────────────────────────
  const [startBalance, setStartBalance] = useState(10000);
  const [tradesPerYear, setTradesPerYear] = useState(200);
  const [winRate, setWinRate] = useState(55); // %
  const [avgWinR, setAvgWinR] = useState(2.0); // R
  const [avgLossR, setAvgLossR] = useState(1.0); // R (positive number)
  const [riskPct, setRiskPct] = useState(1.0); // % per trade
  const [years, setYears] = useState(5);

  const c = useMemo(() => {
    const wr = winRate / 100;
    const lr = 1 - wr;
    const expectancyPerTradeR = wr * avgWinR - lr * avgLossR;
    // Per-trade growth factor (compounding on current balance):
    const perTradeGrowth = expectancyPerTradeR * (riskPct / 100);
    // Yearly growth factor compounded over tradesPerYear trades:
    const yearlyFactor = Math.pow(1 + perTradeGrowth, tradesPerYear);

    // Equity curve (year 0 = start, year N = final)
    const curve: number[] = [startBalance];
    for (let y = 1; y <= years; y++) {
      curve.push(curve[y - 1] * yearlyFactor);
    }
    const finalBalance = curve[curve.length - 1];

    const cagr = yearlyFactor >= 0 ? Math.pow(finalBalance / startBalance, 1 / years) - 1 : -1;

    // Estimated max drawdown via expected max losing streak (99% conf):
    // maxConsecLosses = ln(1−0.99) / ln(lossRate)
    const maxConsecLosses = lr > 0 && lr < 1 ? Math.log(0.01) / Math.log(lr) : 0;
    const estMaxDDpct = maxConsecLosses * avgLossR * (riskPct / 100) * 100; // in %

    const totalReturnPct = (finalBalance / startBalance - 1) * 100;
    const expectancyPerTradeUsd = expectancyPerTradeR * (riskPct / 100) * startBalance;
    const yearlyUsd = expectancyPerTradeUsd * tradesPerYear;

    return {
      expectancyPerTradeR,
      perTradeGrowth,
      yearlyFactor,
      curve,
      finalBalance,
      cagr,
      maxConsecLosses: Math.max(0, Math.round(maxConsecLosses)),
      estMaxDDpct: Math.max(0, estMaxDDpct),
      totalReturnPct,
      expectancyPerTradeUsd,
      yearlyUsd,
      hasEdge: expectancyPerTradeR > 0,
    };
  }, [startBalance, tradesPerYear, winRate, avgWinR, avgLossR, riskPct, years]);

  const fmtUsd = (n: number) =>
    es
      ? new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
      : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const fmtNum = (n: number, dec = 2) =>
    es
      ? new Intl.NumberFormat("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n)
      : new Intl.NumberFormat("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);

  const fmtPct = (n: number, dec = 1) => `${fmtNum(n, dec)} %`;

  // SVG curve path (normalized 0..1 over the curve range)
  const svgW = 520;
  const svgH = 120;
  const padX = 8;
  const padY = 10;
  const curvePath = useMemo(() => {
    const max = Math.max(...c.curve, 1);
    const min = Math.min(...c.curve, 0);
    const range = max - min || 1;
    const pts = c.curve.map((v, i) => {
      const x = padX + (i / (c.curve.length - 1)) * (svgW - padX * 2);
      const y = svgH - padY - ((v - min) / range) * (svgH - padY * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return "M " + pts.join(" L ");
  }, [c.curve]);

  // area fill path (close to bottom)
  const areaPath = useMemo(() => {
    const max = Math.max(...c.curve, 1);
    const min = Math.min(...c.curve, 0);
    const range = max - min || 1;
    const pts = c.curve.map((v, i) => {
      const x = padX + (i / (c.curve.length - 1)) * (svgW - padX * 2);
      const y = svgH - padY - ((v - min) / range) * (svgH - padY * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const lastX = padX + (svgW - padX * 2);
    return `M ${padX},${svgH - padY} L ` + pts.join(" L ") + ` L ${lastX.toFixed(1)},${svgH - padY} Z`;
  }, [c.curve]);

  // Reusable slider — label + accent value pill + ≥44px touch row.
  // Unified across all interactive tools (Risk/Equity/RMultiple/Savings/Edge).
  const slider = (
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    onChange: (n: number) => void,
    suffix: string,
    ariaLabel: string,
  ) => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="tnum" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)" }}>
          {label}
        </span>
        <span
          className="tnum inline-flex items-baseline px-2.5 py-0.5 rounded-full"
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "rgb(var(--accent-base))",
            background: "color-mix(in oklab, rgb(var(--accent-base)) 12%, transparent)",
            border: "1px solid color-mix(in oklab, rgb(var(--accent-base)) 32%, transparent)",
            transition: "color 0.18s var(--ease-suave)",
          }}
        >
          {fmtNum(value, Number.isInteger(step) ? 0 : 2)}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="tj-range w-full"
        /* `--pct` pinta el tramo recorrido dentro de la pista del propio
           control, en vez de con una barra superpuesta. */
        style={
          {
            accentColor: "rgb(var(--accent-base))",
            height: 44,
            "--pct": `${((value - min) / (max - min)) * 100}%`,
          } as React.CSSProperties
        }
        aria-label={ariaLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
    </div>
  );

  return (
    <section className="section-tight bg-veil border-t border-[rgb(var(--divider)/0.06)]">
      <div className="tj-container grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* Left: intro + inputs */}
        <div>
          <div className="inline-flex items-center gap-3 mb-5">
            <span className="tnum" style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.04em", color: "rgb(var(--accent-base))" }}>
              § {num}
            </span>
            <span aria-hidden style={{ width: 22, height: 1, background: "rgb(var(--divider) / 0.13)" }} />
            <span className="tnum" style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--ink-3)" }}>
              {es ? "PROYECTOR" : "PROJECTOR"}
            </span>
          </div>
          <h2
            className="font-serif m-0"
            style={{
              fontSize: "clamp(1.95rem, 3.5vw, 3rem)",
              fontWeight: 400,
              letterSpacing: "-0.022em",
              lineHeight: 1.08,
              color: "var(--ink)",
              textWrap: "balance",
            }}
          >
            {es ? (
              <>
                Tu edge, <span style={{ color: "rgb(var(--accent-base))" }}>compuesto</span> en el tiempo.
              </>
            ) : (
              <>
                Your edge, <span style={{ color: "rgb(var(--accent-base))" }}>compounded</span> over time.
              </>
            )}
          </h2>
          <p
            className="mt-5 mb-7"
            style={{ fontSize: "clamp(1rem, 1.3vw, 1.1rem)", lineHeight: 1.62, color: "var(--ink-2)", maxWidth: "34em" }}
          >
            {es
              ? "Si tu operativa tiene un edge positivo y lo repites con disciplina, la curva de capital crece de forma compuesta. Ajusta tus números y mira qué pasa en 5 años."
              : "If your trading has a positive edge and you repeat it with discipline, the equity curve compounds. Adjust your numbers and see what happens over 5 years."}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {slider(es ? "Balance inicial" : "Starting balance", startBalance, 1000, 100000, 500, setStartBalance, " $", es ? "Balance inicial en dólares" : "Starting balance in dollars")}
            {slider(es ? "Operaciones/año" : "Trades/year", tradesPerYear, 20, 500, 10, setTradesPerYear, "", es ? "Operaciones por año" : "Trades per year")}
            {slider(es ? "Win rate" : "Win rate", winRate, 30, 75, 1, setWinRate, " %", es ? "Porcentaje de aciertos" : "Win rate percentage")}
            {slider(es ? "Ganancia media" : "Avg win (R)", avgWinR, 0.5, 5, 0.1, setAvgWinR, " R", es ? "Ganancia media en múltiplos de R" : "Average win in R multiples")}
            {slider(es ? "Pérdida media" : "Avg loss (R)", avgLossR, 0.25, 3, 0.05, setAvgLossR, " R", es ? "Pérdida media en múltiplos de R" : "Average loss in R multiples")}
            {slider(es ? "Riesgo/op." : "Risk/trade", riskPct, 0.25, 3, 0.05, setRiskPct, " %", es ? "Riesgo por operación en porcentaje" : "Risk per trade percentage")}
            {slider(es ? "Horizonte" : "Horizon", years, 1, 20, 1, setYears, " a", es ? "Horizonte en años" : "Horizon in years")}
          </div>
        </div>

        {/* Right: results card */}
        <div
          className="tj-paper tj-paper-glow relative"
          style={{ padding: 24, borderRadius: 3, border: "1px solid rgb(var(--divider) / 0.13)" }}
        >
          {/* Expectancy headline */}
          <div className="mb-5">
            <div className="tnum" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)" }}>
              {es ? "Expectancy por operación" : "Expectancy per trade"}
            </div>
            <div className="flex items-baseline gap-3 mt-1">
              <span
                className="tnum"
                style={{
                  fontSize: 30,
                  fontWeight: 700,
                  color: c.hasEdge ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))",
                }}
              >
                {c.expectancyPerTradeR >= 0 ? "+" : ""}{fmtNum(c.expectancyPerTradeR, 3)} R
              </span>
              <span className="tnum" style={{ fontSize: 13, color: "var(--ink-2)" }}>
                ≈ {fmtUsd(c.expectancyPerTradeUsd)}
              </span>
            </div>
            {!c.hasEdge && (
              <div
                className="mt-2 text-[12px] leading-[1.5] rounded-[2px] px-3 py-2"
                style={{
                  background: "color-mix(in oklab, rgb(var(--pnl-neg)) 10%, transparent)",
                  border: "1px solid color-mix(in oklab, rgb(var(--pnl-neg)) 30%, transparent)",
                  color: "rgb(var(--pnl-neg))",
                }}
                role="alert"
              >
                {es
                  ? "Tu expectancy es negativa: sin edge, el compuesto trabaja en contra. Reduce el riesgo o mejora la operativa antes de pensar en crecer."
                  : "Your expectancy is negative: without an edge, compounding works against you. Cut risk or improve your edge before thinking about growth."}
              </div>
            )}
          </div>

          {/* Equity curve SVG */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="tnum" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)" }}>
                {es ? "Curva de capital" : "Equity curve"} · {years} {es ? "años" : "yrs"}
              </span>
              <span className="tnum" style={{ fontSize: 9, color: "var(--ink-3)" }}>
                {fmtUsd(startBalance)} → <span style={{ color: "rgb(var(--accent-base))", fontWeight: 700 }}>{fmtUsd(c.finalBalance)}</span>
              </span>
            </div>
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ height: "auto", display: "block" }} aria-label={es ? "Curva de capital proyectada" : "Projected equity curve"} role="img">
              <defs>
                <linearGradient id="eq-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(var(--accent-base))" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="rgb(var(--accent-base))" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* baseline grid */}
              <line x1={padX} y1={svgH - padY} x2={svgW - padX} y2={svgH - padY} stroke="rgb(var(--divider) / 0.16)" strokeWidth="1" />
              <path d={areaPath} fill="url(#eq-area)" />
              <path d={curvePath} fill="none" stroke="rgb(var(--accent-base))" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          </div>

          {/* Result tiles — unified 2×2 grid, ≥16px padding, hover lift + accent border */}
          <div className="grid grid-cols-2 gap-3.5 mb-5">
            <Result label={es ? "Balance final" : "Final balance"} value={fmtUsd(c.finalBalance)} color="rgb(var(--accent-base))" />
            <Result label={es ? "Retorno total" : "Total return"} value={fmtPct(c.totalReturnPct, 0)} color={c.totalReturnPct >= 0 ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))"} />
            <Result label="CAGR" value={fmtPct(c.cagr * 100, 1)} color={c.cagr >= 0 ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))"} />
            <Result label={es ? "Max DD estimado" : "Est. max DD"} value={fmtPct(c.estMaxDDpct, 1)} color="rgb(var(--pnl-neg))" />
          </div>

          {/* Disclaimer */}
          <div
            className="rounded-[2px] px-3 py-2.5"
            style={{
              background: "color-mix(in oklab, var(--surface-2) 40%, transparent)",
              border: "1px solid rgb(var(--divider) / 0.06)",
            }}
          >
            <p className="tnum m-0 text-[11px] leading-[1.55]" style={{ color: "var(--ink-3)" }}>
              {es
                ? "Proyección determinista basada en expectancy. La realidad tiene varianza: el drawdown real puede ser mayor. El drawdown estimado asume una racha de pérdidas al 99 % de confianza. No es una promesa de rentabilidad."
                : "Deterministic projection based on expectancy. Reality has variance: actual drawdown may be larger. Estimated drawdown assumes a losing streak at 99% confidence. This is not a profitability promise."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Result({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="group/result relative min-w-0 rounded-[2px] border border-[rgb(var(--divider)/0.06)] px-4 py-4 transition-[transform,border-color] duration-200 ease-[var(--ease-suave)] hover:-translate-y-0.5 hover:border-[rgb(var(--accent-base)/0.30)]"
      style={{ background: "color-mix(in oklab, var(--surface-2) 50%, transparent)" }}
    >
      <div className="tnum relative" style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-3)" }}>
        {label}
      </div>
      <div
        className="tnum min-w-0 break-words relative"
        style={{ fontSize: 19, fontWeight: 700, marginTop: 4, color, transition: "color 0.18s var(--ease-suave)" }}
      >
        {value}
      </div>
    </div>
  );
}
