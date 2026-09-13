"use client";

import { useState, useMemo, useCallback } from "react";
import { useLang } from "@/lib/i18n";
import { computeExpectedMaxLossStreak } from "@/lib/trading/data";

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
  const [monthlyWithdrawal, setMonthlyWithdrawal] = useState(0); // $
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

    // Fórmula Analítica de Probabilidad de Ruina:
    // P(Ruin) = exp(-2 * E * B / sigma^2)
    // donde E = EV por trade en %, B = Capital inicial en %, sigma^2 = varianza del retorno
    const meanTradePct = (expectancyR * riskPct) / 100;
    const varTradePct = wr * Math.pow((avgWinR * riskPct) / 100 - meanTradePct, 2) +
      (1 - wr) * Math.pow((-avgLossR * riskPct) / 100 - meanTradePct, 2);
    const analyticalRuinProb = meanTradePct > 0 && varTradePct > 0
      ? Math.min(100, Math.max(0, Math.exp((-2 * meanTradePct * 1.0) / varTradePct) * 100))
      : 100;

    // Simular SIM_RUNS caminos de `trades` operaciones cada uno.
    const rng = mulberry32(seed * 7919 + 1);
    const paths: number[][] = [];
    let ruinCount = 0;
    let doubleCount = 0;
    const finalBalances: number[] = [];
    const maxLossStreaks: number[] = [];

    // Aproximamos 20 operaciones por mes para los retiros periódicos
    const tradesPerMonth = 20;

    for (let run = 0; run < SIM_RUNS; run++) {
      const path: number[] = [startBalance];
      let bal = startBalance;
      let ruined = false;
      let curLossStreak = 0;
      let maxLossRun = 0;

      for (let t = 0; t < trades; t++) {
        if (bal <= 0) { ruined = true; break; }
        const r = rng();
        const riskUsd = bal * (riskPct / 100);
        if (r < wr) {
          bal += riskUsd * avgWinR;
          curLossStreak = 0;
        } else {
          bal -= riskUsd * avgLossR;
          curLossStreak++;
          maxLossRun = Math.max(maxLossRun, curLossStreak);
        }

        // Retiro periódico al final de cada bloque mensual
        if ((t + 1) % tradesPerMonth === 0 && monthlyWithdrawal > 0) {
          bal = Math.max(0, bal - monthlyWithdrawal);
        }

        if (bal <= 0) { bal = 0; ruined = true; }
        path.push(bal);
      }
      paths.push(path);
      finalBalances.push(bal);
      maxLossStreaks.push(maxLossRun);
      if (ruined) ruinCount++;
      if (bal >= startBalance * 2) doubleCount++;
    }

    // Estadísticas por operación: P5, P25, P50 (mediana), P75, P95, media.
    const statsPerTrade: { p5: number; p25: number; p50: number; p75: number; p95: number; mean: number }[] = [];
    for (let t = 0; t <= trades; t++) {
      const vals = paths.map((p) => p[t] ?? 0).sort((a, b) => a - b);
      const idx = (q: number) => Math.min(vals.length - 1, Math.max(0, Math.floor(q * vals.length)));
      statsPerTrade.push({
        p5: vals[idx(0.05)],
        p25: vals[idx(0.25)],
        p50: vals[idx(0.50)],
        p75: vals[idx(0.75)],
        p95: vals[idx(0.95)],
        mean: vals.reduce((s, v) => s + v, 0) / vals.length,
      });
    }

    const sortedFinal = [...finalBalances].sort((a, b) => a - b);
    const idx = (q: number) => Math.min(sortedFinal.length - 1, Math.max(0, Math.floor(q * sortedFinal.length)));
    const finalP5 = sortedFinal[idx(0.05)];
    const finalP25 = sortedFinal[idx(0.25)];
    const finalP50 = sortedFinal[idx(0.50)];
    const finalP75 = sortedFinal[idx(0.75)];
    const finalP95 = sortedFinal[idx(0.95)];
    const finalMean = finalBalances.reduce((s, v) => s + v, 0) / finalBalances.length;

    // Distribución de racha máxima perdedora
    const sortedStreaks = [...maxLossStreaks].sort((a, b) => a - b);
    const medianMaxLossStreak = sortedStreaks[idx(0.50)];
    const p95MaxLossStreak = sortedStreaks[idx(0.95)];

    const probRuin = (ruinCount / SIM_RUNS) * 100;
    const probDouble = (doubleCount / SIM_RUNS) * 100;

    return {
      expectancyR,
      statsPerTrade,
      finalP5, finalP25, finalP50, finalP75, finalP95, finalMean,
      medianMaxLossStreak,
      p95MaxLossStreak,
      theoreticalMaxLossStreak: computeExpectedMaxLossStreak(winRate, trades),
      analyticalRuinProb,
      probRuin, probDouble,
    };
  }, [startBalance, trades, winRate, avgWinR, avgLossR, riskPct, monthlyWithdrawal, seed, mulberry32]);

  const fmtUsd = (n: number) =>
    es
      ? new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
      : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  /* Importe corto para las cinco celdas de percentil, que a 320 px miden
     poco mas de 70 px. A mano y no con `notation: "compact"` de Intl:
     en espanol eso devuelve «18,9 mil», que ocupa MAS que «18.906». */
  const fmtUsdCorto = (n: number) => {
    const a = Math.abs(n);
    const signo = n < 0 ? "−" : "";
    if (a >= 1_000_000) return `${signo}${fmtNum(a / 1_000_000, 2)} M $`;
    if (a >= 10_000) return `${signo}${fmtNum(a / 1_000, 0)} k $`;
    return fmtUsd(n);
  };

  const fmtNum = (n: number, dec = 2) =>
    es
      ? new Intl.NumberFormat("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n)
      : new Intl.NumberFormat("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);

  const fmtPct = (n: number, dec = 1) => `${fmtNum(n, dec)} %`;

  // ── SVG paths para el abanico P5-P95, P25-P75 + media + mediana ──────────
  const svgW = 540;
  const svgH = 150;
  const padX = 8;
  const padY = 10;
  const allVals = c.statsPerTrade.flatMap((s) => [s.p5, s.p25, s.p50, s.p75, s.p95, s.mean]);
  const maxV = Math.max(...allVals, startBalance, 1);
  const minV = 0;
  const range = maxV - minV || 1;
  const N = c.statsPerTrade.length;

  const toPath = (key: "p5" | "p25" | "p50" | "p75" | "p95" | "mean") => {
    const pts = c.statsPerTrade.map((s, i) => {
      const x = padX + (i / (N - 1)) * (svgW - padX * 2);
      const y = svgH - padY - ((s[key] - minV) / range) * (svgH - padY * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return "M " + pts.join(" L ");
  };

  // Banda P5-P95 como area cerrada externa
  const outerBandPath = useMemo(() => {
    const top = c.statsPerTrade.map((s, i) => {
      const x = padX + (i / (N - 1)) * (svgW - padX * 2);
      const y = svgH - padY - ((s.p95 - minV) / range) * (svgH - padY * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const bottom = c.statsPerTrade
      .slice()
      .reverse()
      .map((s, i) => {
        const idx = N - 1 - i;
        const x = padX + (idx / (N - 1)) * (svgW - padX * 2);
        const y = svgH - padY - ((c.statsPerTrade[idx].p5 - minV) / range) * (svgH - padY * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      });
    return "M " + top.join(" L ") + " L " + bottom.join(" L ") + " Z";
  }, [c.statsPerTrade, N, range, minV]);

  // Banda P25-P75 como area cerrada interna
  const innerBandPath = useMemo(() => {
    const top = c.statsPerTrade.map((s, i) => {
      const x = padX + (i / (N - 1)) * (svgW - padX * 2);
      const y = svgH - padY - ((s.p75 - minV) / range) * (svgH - padY * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const bottom = c.statsPerTrade
      .slice()
      .reverse()
      .map((s, i) => {
        const idx = N - 1 - i;
        const x = padX + (idx / (N - 1)) * (svgW - padX * 2);
        const y = svgH - padY - ((c.statsPerTrade[idx].p25 - minV) / range) * (svgH - padY * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      });
    return "M " + top.join(" L ") + " L " + bottom.join(" L ") + " Z";
  }, [c.statsPerTrade, N, range, minV]);

  // Reusable slider
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
          className="tnum inline-flex items-baseline px-2.5 py-0.5 rounded-[2px]"
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
    <section className="section-tight border-t border-[rgb(var(--divider)/0.06)]">
      <div className="tj-container grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* Left: intro + inputs */}
        <div>
          <div className="inline-flex items-center gap-3 mb-5">
            <span className="tnum text-xs font-medium tracking-wide text-[rgb(var(--accent-base))]">
              § {num}
            </span>
            <span aria-hidden className="w-[22px] h-px bg-[rgb(var(--divider)/0.13)]" />
            <span className="tnum text-[11px] tracking-[0.2em] uppercase text-tertiary">
              {es ? "SIMULADOR" : "SIMULATOR"}
            </span>
          </div>
          <h2 className="font-serif m-0 text-3xl sm:text-4xl lg:text-5xl font-normal tracking-[-0.022em] leading-[1.08] text-primary text-balance">
            {es ? (
              <>
                El edge existe. <span className="text-[rgb(var(--accent-base))]">La varianza</span>, también.
              </>
            ) : (
              <>
                The edge is real. <span className="text-[rgb(var(--accent-base))]">So is variance.</span>
              </>
            )}
          </h2>
          <p className="mt-5 mb-7 text-base sm:text-lg leading-relaxed text-secondary max-w-[34em]">
            {es
              ? "300 simulaciones de tus próximas operaciones. Cada camino es distinto: el abanico muestra los percentiles completos (P5 a P95). El mismo edge puede multiplicar tu cuenta o arruinarte según el orden. La disciplina es lo que te deja sobrevivir hasta cobrarlo."
              : "300 simulations of your next trades. Each path is different: the fan shows full percentiles (P5 to P95). The same edge can multiply your account or ruin you depending on order. Discipline is what lets you survive long enough to collect it."}
          </p>

          {/* ── ARQUETIPOS ────────────────────────────────────────────
              Eran cuatro fichas sueltas en `flex-wrap` con etiquetas de
              largos muy distintos: se repartian en tres filas desiguales
              y el bloque se leia como un monton de botones, no como una
              eleccion entre cuatro cosas del mismo rango.

              Ahora es el control segmentado del sitio, el mismo que usan
              las otras calculadoras: apilado en estrecho y en fila desde
              `sm`, con todas las opciones del MISMO ancho. El parametro
              que las distingue baja a una segunda linea atenuada en vez
              de alargar el nombre entre parentesis — es el patron que ya
              usan los presets del proyector. */}
          <div className="mb-6">
            <span className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-tertiary">
              {es ? "Arquetipos de trading predefinidos" : "Pre-calibrated trading archetypes"}
            </span>
            <div className="tj-segmentado tj-segmentado-apila" role="group">
              {[
                { label: es ? "Evaluación Prop" : "Prop Challenge", nota: es ? "0,75 % riesgo" : "0.75% risk", wr: 55, winR: 1.8, lossR: 1.0, risk: 0.75 },
                { label: es ? "Seguimiento de tendencia" : "Trend Following", nota: es ? "42 % acierto · 3,2 R" : "42% hit · 3.2R", wr: 42, winR: 3.2, lossR: 1.0, risk: 1.0 },
                { label: es ? "Scalping de reversión" : "Mean Reversion Scalp", nota: es ? "65 % acierto · 1,2 R" : "65% hit · 1.2R", wr: 65, winR: 1.2, lossR: 1.0, risk: 0.5 },
                { label: es ? "Sobre-apalancamiento" : "Over-leveraged", nota: es ? "3,5 % riesgo · peligro" : "3.5% risk · danger", wr: 50, winR: 1.5, lossR: 1.0, risk: 3.5 },
              ].map((preset) => {
                const activo =
                  winRate === preset.wr &&
                  avgWinR === preset.winR &&
                  avgLossR === preset.lossR &&
                  riskPct === preset.risk;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    aria-pressed={activo}
                    onClick={() => {
                      setWinRate(preset.wr);
                      setAvgWinR(preset.winR);
                      setAvgLossR(preset.lossR);
                      setRiskPct(preset.risk);
                      setSeed((s) => s + 1);
                    }}
                  >
                    {/* El nombre reserva DOS lineas aunque ocupe una:
                        «Evaluación Prop» cabe en una y los otros tres no,
                        y sin el suelo las cuatro notas quedaban a alturas
                        distintas — que es lo que hacia que cuatro
                        opciones del mismo rango se leyeran desiguales. */}
                    <span className="grid min-w-0 text-center leading-[1.25]">
                      <span className="flex min-h-[2.5em] items-center justify-center">
                        {preset.label}
                      </span>
                      <span className="mt-0.5 text-[9.5px] opacity-70">{preset.nota}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {slider(es ? "Balance inicial" : "Starting balance", startBalance, 1000, 100000, 500, setStartBalance, " $", es ? "Balance inicial" : "Starting balance")}
            {slider(es ? "Operaciones" : "Trades", trades, 20, 300, 10, setTrades, "", es ? "Número de operaciones a simular" : "Number of trades to simulate")}
            {slider(es ? "Win rate" : "Win rate", winRate, 30, 75, 1, setWinRate, " %", es ? "Porcentaje de aciertos" : "Win rate")}
            {slider(es ? "Ganancia media" : "Avg win (R)", avgWinR, 0.5, 5, 0.1, setAvgWinR, " R", es ? "Ganancia media en R" : "Average win in R")}
            {slider(es ? "Pérdida media" : "Avg loss (R)", avgLossR, 0.25, 3, 0.05, setAvgLossR, " R", es ? "Pérdida media en R" : "Average loss in R")}
            {slider(es ? "Riesgo/op." : "Risk/trade", riskPct, 0.25, 3.5, 0.05, setRiskPct, " %", es ? "Riesgo por operación" : "Risk per trade")}
            {slider(es ? "Retiro mensual ($)" : "Monthly withdrawal ($)", monthlyWithdrawal, 0, 5000, 100, setMonthlyWithdrawal, " $", es ? "Retiro mensual de beneficios" : "Monthly profit withdrawal")}
            {slider(es ? "Semilla PRNG" : "PRNG Seed", seed, 1, 50, 1, setSeed, "", es ? "Semilla de simulación determinista" : "Deterministic simulation seed")}
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
            {es ? "Volver a tirar (Semilla +1)" : "Re-roll (Seed +1)"}
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
                {es ? "Simulaciones deterministas" : "Deterministic simulations"}
              </div>
              <div className="tnum" style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>{SIM_RUNS} runs (seed #{seed})</div>
            </div>
          </div>

          {/* Fan chart SVG */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <span className="tnum" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)" }}>
                {es ? "Abanico de caminos" : "Path fan"} · {trades} {es ? "ops" : "trades"}
              </span>
              <div className="flex items-center gap-3 tnum" style={{ fontSize: 9.5, color: "var(--ink-3)" }}>
                <span className="inline-flex items-center gap-1"><span aria-hidden className="inline-block w-2.5 h-1.5 rounded-[1px]" style={{ background: "rgb(var(--accent-base) / 0.12)" }} /> P5–P95</span>
                <span className="inline-flex items-center gap-1"><span aria-hidden className="inline-block w-2.5 h-1.5 rounded-[1px]" style={{ background: "rgb(var(--accent-base) / 0.28)" }} /> P25–P75</span>
                <span className="inline-flex items-center gap-1"><span aria-hidden className="inline-block w-2.5 h-[2px]" style={{ background: "rgb(var(--accent-base))" }} /> {es ? "Media" : "Mean"}</span>
                <span className="inline-flex items-center gap-1"><span aria-hidden className="inline-block w-2.5 h-[1.5px] border-t border-dashed" style={{ borderColor: "var(--ink-2)" }} /> P50</span>
              </div>
            </div>
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ height: "auto", display: "block" }} aria-label={es ? "Abanico de caminos simulados" : "Fan of simulated paths"} role="img">
              <defs>
                <linearGradient id="rs-outer-band" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(var(--accent-base))" stopOpacity="0.14" />
                  <stop offset="100%" stopColor="rgb(var(--accent-base))" stopOpacity="0.04" />
                </linearGradient>
                <linearGradient id="rs-inner-band" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(var(--accent-base))" stopOpacity="0.30" />
                  <stop offset="100%" stopColor="rgb(var(--accent-base))" stopOpacity="0.12" />
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
              {/* P5-P95 outer band */}
              <path d={outerBandPath} fill="url(#rs-outer-band)" />
              {/* P25-P75 inner band */}
              <path d={innerBandPath} fill="url(#rs-inner-band)" />
              {/* mean line */}
              <path d={toPath("mean")} fill="none" stroke="rgb(var(--accent-base))" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              {/* median dashed */}
              <path d={toPath("p50")} fill="none" stroke="var(--ink-2)" strokeWidth="1.5" strokeDasharray="4 3" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          </div>

          {/* ── LA DISTRIBUCION, EN UNA SOLA TIRA ─────────────────────
              Eran cinco cajas con borde y fondo propios, y cada rotulo
              arrastraba un parentesis («P5 (Cola 5%)») que a dos columnas
              partia en dos lineas y empujaba la cifra fuera.

              Cinco percentiles son UNA distribucion, no cinco datos
              sueltos: se dibujan como una tira reglada con filetes entre
              columnas y una sola caja alrededor. La mediana no se marca
              con otro fondo sino con un filete de acento arriba, que es
              como se senala una referencia en una tabla y no compite con
              los otros cuatro valores.

              Cada columna es su propio contenedor de medida (`caja-cifra`)
              y el importe va abreviado: «18,9 k $» en vez de «18.906 US$»,
              que no cabe en 70 px. */}
          <div
            className="mb-4 grid grid-cols-5 overflow-clip rounded-[2px] border border-[rgb(var(--divider)/0.12)] text-center font-mono"
            style={{ background: "color-mix(in oklab, var(--surface-2) 40%, transparent)" }}
          >
            {[
              { k: "P5", n: es ? "Cola 5 %" : "Bottom 5%", v: c.finalP5, col: "rgb(var(--pnl-neg))", ref: false },
              { k: "P25", n: "Q1", v: c.finalP25, col: "var(--ink-2)", ref: false },
              { k: "P50", n: es ? "Mediana" : "Median", v: c.finalP50, col: "rgb(var(--accent-base))", ref: true },
              { k: "P75", n: "Q3", v: c.finalP75, col: "var(--ink-2)", ref: false },
              { k: "P95", n: es ? "Cima 5 %" : "Top 5%", v: c.finalP95, col: "rgb(var(--pnl-pos))", ref: false },
            ].map((p, i) => (
              <div
                key={p.k}
                title={fmtUsd(p.v)}
                className={`caja-cifra relative min-w-0 px-1 py-2.5 ${i > 0 ? "border-l border-[rgb(var(--divider)/0.10)]" : ""}`}
              >
                {p.ref && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-[2px]"
                    style={{ background: "rgb(var(--accent-base))" }}
                  />
                )}
                <span
                  className="tnum block text-[9.5px] font-semibold tracking-[0.1em]"
                  style={{ color: p.ref ? "rgb(var(--accent-base))" : "var(--ink-3)" }}
                >
                  {p.k}
                </span>
                <span className="mt-0.5 block text-[9.5px] leading-[1.2] text-tertiary">{p.n}</span>
                <span
                  className="tnum cifra-sm mt-1.5 block whitespace-nowrap font-bold"
                  style={{ color: p.col }}
                >
                  {fmtUsdCorto(p.v)}
                </span>
              </div>
            ))}
          </div>

          {/* ── RUINA Y RACHAS ────────────────────────────────────────
              Cuatro rotulos en versalitas con 0,12em de espaciado
              —«RUINA (MONTE CARLO)», «RACHA TEORICA (E[L])»— sobre
              columnas de 90 px: partian en dos y tres lineas de largos
              distintos y las cuatro cifras quedaban a alturas distintas,
              que es lo que hacia que el bloque se leyera desordenado.

              Se separan las dos cosas que el rotulo mezclaba: arriba el
              CONCEPTO en una sola linea, debajo la PRECISION (de donde
              sale el numero) en redonda y atenuada. Con `grid-rows` de
              tres filas las cuatro cifras caen en la misma linea de base
              pase lo que pase con el texto de encima.

              Filetes entre columnas en vez de separacion: son cuatro
              lecturas de la misma simulacion, no cuatro tarjetas. */}
          <div
            className="mb-4 grid grid-cols-2 overflow-clip rounded-[2px] text-center font-mono sm:grid-cols-4"
            style={{ background: "color-mix(in oklab, var(--surface-2) 40%, transparent)", border: "1px solid rgb(var(--divider) / 0.10)" }}
          >
            {[
              {
                t: es ? "Ruina" : "Ruin",
                sub: "Monte Carlo",
                v: fmtPct(c.probRuin, 1),
                col: c.probRuin > 5 ? "rgb(var(--pnl-neg))" : "var(--ink)",
              },
              {
                t: es ? "Ruina" : "Ruin",
                sub: es ? "Analítica" : "Analytical",
                v: fmtPct(c.analyticalRuinProb, 1),
                col: c.analyticalRuinProb > 5 ? "rgb(var(--pnl-neg))" : "var(--ink)",
              },
              {
                t: es ? "Racha perdedora" : "Losing streak",
                sub: es ? `Esperada · mediana ${c.medianMaxLossStreak}` : `Expected · median ${c.medianMaxLossStreak}`,
                v: `~${c.theoreticalMaxLossStreak}`,
                col: "var(--ink)",
              },
              {
                t: es ? "Peor racha" : "Worst streak",
                sub: "P95",
                v: `${c.p95MaxLossStreak} ${es ? "ops" : "trades"}`,
                col: "rgb(var(--pnl-neg))",
              },
            ].map((m, i) => (
              <div
                key={m.t + m.sub}
                className={`caja-cifra grid min-w-0 grid-rows-[auto_auto_1fr] px-2 py-3 ${
                  i % 2 === 1 ? "border-l border-[rgb(var(--divider)/0.10)]" : ""
                } ${i >= 2 ? "border-t border-[rgb(var(--divider)/0.10)] sm:border-t-0" : ""} ${
                  i === 2 ? "sm:border-l sm:border-[rgb(var(--divider)/0.10)]" : ""
                }`}
              >
                <span
                  className="tnum text-[9.5px] uppercase leading-[1.25] tracking-[0.12em]"
                  style={{ color: "var(--ink-3)" }}
                >
                  {m.t}
                </span>
                <span className="mt-0.5 text-[9.5px] leading-[1.25] text-tertiary [overflow-wrap:anywhere]">
                  {m.sub}
                </span>
                <span
                  className="tnum cifra-sm mt-1.5 self-end whitespace-nowrap font-bold"
                  style={{ color: m.col }}
                >
                  {m.v}
                </span>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div
            className="rounded-[2px] px-3 py-2.5"
            style={{ background: "color-mix(in oklab, var(--surface-2) 40%, transparent)", border: "1px solid rgb(var(--divider) / 0.06)" }}
          >
            <p className="tnum m-0 text-[11px] leading-[1.55]" style={{ color: "var(--ink-3)" }}>
              {es
                ? "Simulación Monte Carlo con PRNG determinista (seed " + seed + "). 300 caminos muestreados de Bernoulli(" + fmtNum(winRate, 0) + "\u00a0%). Asume payouts fijos en R y riesgo compuesto. La realidad tiene colas más pesadas: el drawdown real puede superar el P10. No es consejo financiero."
                : "Monte Carlo simulation with deterministic PRNG (seed " + seed + "). 300 paths sampled from Bernoulli(" + fmtNum(winRate, 0) + "%). Assumes fixed R payouts and compounding risk. Reality has heavier tails: actual drawdown may exceed P10. Not financial advice."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
