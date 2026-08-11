"use client";

import { useState, useMemo, useCallback } from "react";
import { useLang } from "@/lib/i18n";

/**
 * RMultipleSimulator — simulador Monte Carlo de distribución de R.
 *
 * El EquityProjector (en /features/metricas) muestra la curva
 * DETERMINISTA: expectancy repetida. Pero la operativa real tiene
 * VARIANZA: una secuencia de operaciones puede tener una racha mala
 * temprana que te saque del juego antes de que el edge se materialice.
 *
 * Este componente corre N simulaciones de M operaciones cada una,
 * muestreando de una distribución Bernoulli(winRate) con payouts
 * avgWinR / -avgLossR, y muestra:
 *   · la curva de equity MEDIA (centro del abanico)
 *   · las bandas P10 / P50 / P90 (incertidumbre)
 *   · la probabilidad de ruina (balance → 0) y de superar 2×
 *
 * ── Por qué Monte Carlo aquí ──────────────────────────────────────────
 * Un solo camino no enseña nada: el mismo edge puede llevarte a
 * multiplicar por 4 o a quebrar, dependiendo del ORDEN. Correr 500
 * caminos y mostrar el abanico es la forma honesta de visualizar el
 * riesgo — y refuerza el mensaje de disciplina: el edge existe, pero
 * necesitas sobrevivir a la varianza para cobrarlo.
 *
 * ── Aleatoriedad determinista ──────────────────────────────────────────
 * Cada simulación usa un PRNG seedado (mulberry32) con la semilla del
 * slider, así el resultado es REPRODUCIBLE: mismo seed → mismo abanico.
 * Esto evita que el gráfico baile en cada render y permite comparar
 * escenarios. "Re-tirar" cambia la semilla y da otra realización.
 *
 * ── Material ──────────────────────────────────────────────────────────
 * .tj-paper + .tj-paper-glow (papel translúcido cálido, halo champagne).
 */
export function RMultipleSimulator({ num = "03" }: { num?: string }) {
  const { lang } = useLang();
  const es = lang === "es";

  const [startBalance, setStartBalance] = useState(10000);
  const [trades, setTrades] = useState(100);
  const [winRate, setWinRate] = useState(55); // %
  const [avgWinR, setAvgWinR] = useState(2.0);
  const [avgLossR, setAvgLossR] = useState(1.0);
  const [riskPct, setRiskPct] = useState(1.0);
  const [seed, setSeed] = useState(1);

  const SIM_RUNS = 300;

  // ── PRNG mulberry32 (determinista por seed) ──────────────────────
  const mulberry32 = useCallback((s: number) => {
    let a = s >>> 0;
    return () => {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }, []);

  const c = useMemo(() => {
    const wr = winRate / 100;
    const expectancyR = wr * avgWinR - (1 - wr) * avgLossR;

    // Simular SIM_RUNS caminos de `trades` operaciones cada uno.
    // Cada op: gana (p=wr) → +avgWinR·riskPct%·balance; pierde → -avgLossR·riskPct%·balance.
    // Riesgo compuesto sobre el balance actual (como en la realidad).
    const rng = mulberry32(seed * 7919 + 1);
    const paths: number[][] = [];
    let ruinCount = 0;
    let doubleCount = 0;
    const finalBalances: number[] = [];

    for (let run = 0; run < SIM_RUNS; run++) {
      const path: number[] = [startBalance];
      let bal = startBalance;
      let ruined = false;
      for (let t = 0; t < trades; t++) {
        if (bal <= 0) { ruined = true; break; }
        const r = rng();
        const riskUsd = bal * (riskPct / 100);
        if (r < wr) {
          bal += riskUsd * avgWinR;
        } else {
          bal -= riskUsd * avgLossR;
        }
        if (bal <= 0) { bal = 0; ruined = true; }
        path.push(bal);
      }
      paths.push(path);
      finalBalances.push(bal);
      if (ruined) ruinCount++;
      if (bal >= startBalance * 2) doubleCount++;
    }

    // Estadísticas por operación: P10, P50 (mediana), P90, media.
    const statsPerTrade: { p10: number; p50: number; p90: number; mean: number }[] = [];
    for (let t = 0; t <= trades; t++) {
      const vals = paths.map((p) => p[t] ?? 0).sort((a, b) => a - b);
      const idx = (q: number) => Math.min(vals.length - 1, Math.max(0, Math.floor(q * vals.length)));
      statsPerTrade.push({
        p10: vals[idx(0.10)],
        p50: vals[idx(0.50)],
        p90: vals[idx(0.90)],
        mean: vals.reduce((s, v) => s + v, 0) / vals.length,
      });
    }

    const sortedFinal = [...finalBalances].sort((a, b) => a - b);
    const idx = (q: number) => Math.min(sortedFinal.length - 1, Math.max(0, Math.floor(q * sortedFinal.length)));
    const finalP10 = sortedFinal[idx(0.10)];
    const finalP50 = sortedFinal[idx(0.50)];
    const finalP90 = sortedFinal[idx(0.90)];
    const finalMean = finalBalances.reduce((s, v) => s + v, 0) / finalBalances.length;

    const probRuin = (ruinCount / SIM_RUNS) * 100;
    const probDouble = (doubleCount / SIM_RUNS) * 100;

    return {
      expectancyR,
      statsPerTrade,
      finalP10, finalP50, finalP90, finalMean,
      probRuin, probDouble,
    };
  }, [startBalance, trades, winRate, avgWinR, avgLossR, riskPct, seed, mulberry32]);

  const fmtUsd = (n: number) =>
    es
      ? new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
      : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const fmtNum = (n: number, dec = 2) =>
    es
      ? new Intl.NumberFormat("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n)
      : new Intl.NumberFormat("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);

  const fmtPct = (n: number, dec = 1) => `${fmtNum(n, dec)} %`;

  // ── SVG paths para el abanico P10-P90 + media + mediana ──────────
  const svgW = 540;
  const svgH = 140;
  const padX = 8;
  const padY = 10;
  const allVals = c.statsPerTrade.flatMap((s) => [s.p10, s.p50, s.p90, s.mean]);
  const maxV = Math.max(...allVals, startBalance, 1);
  const minV = 0;
  const range = maxV - minV || 1;
  const N = c.statsPerTrade.length;

  const toPath = (key: "p10" | "p50" | "p90" | "mean") => {
    const pts = c.statsPerTrade.map((s, i) => {
      const x = padX + (i / (N - 1)) * (svgW - padX * 2);
      const y = svgH - padY - ((s[key] - minV) / range) * (svgH - padY * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return "M " + pts.join(" L ");
  };

  // Banda P10-P90 como area cerrada
  const bandPath = useMemo(() => {
    const top = c.statsPerTrade.map((s, i) => {
      const x = padX + (i / (N - 1)) * (svgW - padX * 2);
      const y = svgH - padY - ((s.p90 - minV) / range) * (svgH - padY * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const bottom = c.statsPerTrade
      .slice()
      .reverse()
      .map((s, i) => {
        const idx = N - 1 - i;
        const x = padX + (idx / (N - 1)) * (svgW - padX * 2);
        const y = svgH - padY - ((c.statsPerTrade[idx].p10 - minV) / range) * (svgH - padY * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      });
    return "M " + top.join(" L ") + " L " + bottom.join(" L ") + " Z";
  }, [c.statsPerTrade, N, range, minV]);

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
        /* `--pct` pinta el tramo recorrido dentro de la pista del control. */
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
              {es ? "SIMULADOR" : "SIMULATOR"}
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
                El edge existe. <span style={{ color: "rgb(var(--accent-base))" }}>La varianza</span>, también.
              </>
            ) : (
              <>
                The edge is real. <span style={{ color: "rgb(var(--accent-base))" }}>So is variance.</span>
              </>
            )}
          </h2>
          <p
            className="mt-5 mb-7"
            style={{ fontSize: "clamp(1rem, 1.3vw, 1.1rem)", lineHeight: 1.62, color: "var(--ink-2)", maxWidth: "34em" }}
          >
            {es
              ? "300 simulaciones de tus próximas operaciones. Cada camino es distinto: la banda muestra el rango probable (P10–P90). El mismo edge puede multiplicar tu cuenta o arruinarte — depende del orden. La disciplina es lo que te deja sobrevivir hasta cobrarlo."
              : "300 simulations of your next trades. Each path is different: the band shows the likely range (P10–P90). The same edge can multiply your account or ruin you — it depends on order. Discipline is what lets you survive long enough to collect it."}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {slider(es ? "Balance inicial" : "Starting balance", startBalance, 1000, 100000, 500, setStartBalance, " $", es ? "Balance inicial" : "Starting balance")}
            {slider(es ? "Operaciones" : "Trades", trades, 20, 300, 10, setTrades, "", es ? "Número de operaciones a simular" : "Number of trades to simulate")}
            {slider(es ? "Win rate" : "Win rate", winRate, 30, 75, 1, setWinRate, " %", es ? "Porcentaje de aciertos" : "Win rate")}
            {slider(es ? "Ganancia media" : "Avg win (R)", avgWinR, 0.5, 5, 0.1, setAvgWinR, " R", es ? "Ganancia media en R" : "Average win in R")}
            {slider(es ? "Pérdida media" : "Avg loss (R)", avgLossR, 0.25, 3, 0.05, setAvgLossR, " R", es ? "Pérdida media en R" : "Average loss in R")}
            {slider(es ? "Riesgo/op." : "Risk/trade", riskPct, 0.25, 3, 0.05, setRiskPct, " %", es ? "Riesgo por operación" : "Risk per trade")}
          </div>

          <button
            type="button"
            onClick={() => setSeed((s) => s + 1)}
            className="mt-6 inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-[2px] text-[13px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]"
            style={{
              background: "color-mix(in oklab, rgb(var(--accent-base)) 12%, transparent)",
              color: "rgb(var(--accent-base))",
              border: "1px solid color-mix(in oklab, rgb(var(--accent-base)) 35%, transparent)",
            }}
            aria-label={es ? "Volver a simular con otra semilla aleatoria" : "Re-simulate with a different random seed"}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2.5 8a5.5 5.5 0 019.4-3.9M13.5 8a5.5 5.5 0 01-9.4 3.9M13 2.5v3h-3M3 13.5v-3h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {es ? "Volver a tirar" : "Re-roll"}
          </button>
        </div>

        {/* Right: results card */}
        <div
          className="tj-paper tj-paper-glow relative"
          style={{ padding: 24, borderRadius: 3, border: "1px solid rgb(var(--divider) / 0.13)" }}
        >
          {/* Expectancy + runs headline */}
          <div className="mb-5 flex items-baseline justify-between flex-wrap gap-2">
            <div>
              <div className="tnum" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)" }}>
                {es ? "Expectancy" : "Expectancy"}
              </div>
              <div className="flex items-baseline gap-3 mt-1">
                <span
                  className="tnum"
                  style={{ fontSize: 26, fontWeight: 700, color: c.expectancyR >= 0 ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))" }}
                >
                  {c.expectancyR >= 0 ? "+" : ""}{fmtNum(c.expectancyR, 3)} R
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="tnum" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)" }}>
                {es ? "Simulaciones" : "Simulations"}
              </div>
              <div className="tnum" style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>{SIM_RUNS}</div>
            </div>
          </div>

          {/* Fan chart SVG */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <span className="tnum" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)" }}>
                {es ? "Abanico de caminos" : "Path fan"} · {trades} {es ? "ops" : "trades"}
              </span>
              <div className="flex items-center gap-3 tnum" style={{ fontSize: 9.5, color: "var(--ink-3)" }}>
                <span className="inline-flex items-center gap-1"><span aria-hidden className="inline-block w-2.5 h-1.5 rounded-[1px]" style={{ background: "rgb(var(--accent-base) / 0.18)" }} /> P10–P90</span>
                <span className="inline-flex items-center gap-1"><span aria-hidden className="inline-block w-2.5 h-[2px]" style={{ background: "rgb(var(--accent-base))" }} /> {es ? "Media" : "Mean"}</span>
                <span className="inline-flex items-center gap-1"><span aria-hidden className="inline-block w-2.5 h-[1.5px] border-t border-dashed" style={{ borderColor: "var(--ink-2)" }} /> P50</span>
              </div>
            </div>
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ height: "auto", display: "block" }} aria-label={es ? "Abanico de caminos simulados" : "Fan of simulated paths"} role="img">
              <defs>
                <linearGradient id="rs-band" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(var(--accent-base))" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="rgb(var(--accent-base))" stopOpacity="0.06" />
                </linearGradient>
              </defs>
              {/* baseline (start balance) */}
              <line
                x1={padX}
                y1={svgH - padY - ((startBalance - minV) / range) * (svgH - padY * 2)}
                x2={svgW - padX}
                y2={svgH - padY - ((startBalance - minV) / range) * (svgH - padY * 2)}
                stroke="rgb(var(--divider) / 0.22)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              {/* P10-P90 band */}
              <path d={bandPath} fill="url(#rs-band)" />
              {/* mean line */}
              <path d={toPath("mean")} fill="none" stroke="rgb(var(--accent-base))" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              {/* median dashed */}
              <path d={toPath("p50")} fill="none" stroke="var(--ink-2)" strokeWidth="1.5" strokeDasharray="4 3" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          </div>

          {/* Final-balance distribution stats */}
          <div className="grid grid-cols-2 gap-3.5 mb-4">
            <Result label={es ? "Final P10" : "Final P10"} value={fmtUsd(c.finalP10)} color="rgb(var(--pnl-neg))" />
            <Result label={es ? "Final P50" : "Final P50"} value={fmtUsd(c.finalP50)} color="var(--ink)" />
            <Result label={es ? "Final P90" : "Final P90"} value={fmtUsd(c.finalP90)} color="rgb(var(--pnl-pos))" />
            <Result label={es ? "Final medio" : "Mean final"} value={fmtUsd(c.finalMean)} color="rgb(var(--accent-base))" />
          </div>

          {/* Probabilities */}
          <div
            className="grid grid-cols-2 gap-2 rounded-[2px] p-3 mb-4"
            style={{ background: "color-mix(in oklab, var(--surface-2) 40%, transparent)", border: "1px solid rgb(var(--divider) / 0.05)" }}
          >
            <div>
              <div className="tnum" style={{ fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-3)" }}>
                {es ? "Prob. de ruina" : "Prob. of ruin"}
              </div>
              <div
                className="tnum"
                style={{ fontSize: 16, fontWeight: 700, marginTop: 2, color: c.probRuin > 5 ? "rgb(var(--pnl-neg))" : "var(--ink)" }}
              >
                {fmtPct(c.probRuin, 1)}
              </div>
            </div>
            <div>
              <div className="tnum" style={{ fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-3)" }}>
                {es ? "Prob. doblar cuenta" : "Prob. to double"}
              </div>
              <div
                className="tnum"
                style={{ fontSize: 16, fontWeight: 700, marginTop: 2, color: c.probDouble > 50 ? "rgb(var(--pnl-pos))" : "var(--ink)" }}
              >
                {fmtPct(c.probDouble, 1)}
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div
            className="rounded-[2px] px-3 py-2.5"
            style={{ background: "color-mix(in oklab, var(--surface-2) 40%, transparent)", border: "1px solid rgb(var(--divider) / 0.06)" }}
          >
            <p className="tnum m-0 text-[11px] leading-[1.55]" style={{ color: "var(--ink-3)" }}>
              {es
                ? "Simulación Monte Carlo con PRNG determinista (seed " + seed + "). 300 caminos muestreados de Bernoulli(" + fmtNum(winRate, 0) + "%). Asume payouts fijos en R y riesgo compuesto. La realidad tiene colas más pesadas: el drawdown real puede superar el P10. No es consejo financiero."
                : "Monte Carlo simulation with deterministic PRNG (seed " + seed + "). 300 paths sampled from Bernoulli(" + fmtNum(winRate, 0) + "%). Assumes fixed R payouts and compounding risk. Reality has heavier tails: actual drawdown may exceed P10. Not financial advice."}
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
        style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color, transition: "color 0.18s var(--ease-suave)" }}
      >
        {value}
      </div>
    </div>
  );
}
