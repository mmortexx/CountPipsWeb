"use client";

import { useState, useMemo } from "react";
import { useLang } from "@/lib/i18n";
import { computeStatisticalPower, normalCdf } from "@/lib/trading/data";

export { normalCdf };

/**
 * EdgeSignificanceChecker — ¿tu edge es real o suerte?
 *
 * El trader introduce: número de operaciones (N), win rate observado,
 * ganancia/pérdida media en R. El componente calcula:
 *   · expectancy en R
 *   · z-score y p-valor de un test binomial (H0: win rate real = 50%,
 *     es decir, "tirar una moneda")
 *   · veredicto: ¿el edge es estadísticamente significativo (p<0.05)?
 *   · muestra mínima recomendada para detectar ese win rate al 95% de
 *     confianza (n = (z·z · p·(1-p)) / e·e, con e = margen ±5%)
 *
 * ── Por qué aquí ──────────────────────────────────────────────────────
 * Encaja en /faq porque responde a la pregunta más frecuente de un
 * trader novato: "tengo un 60% de aciertos en 20 operaciones, ¿tengo
 * un edge?". La respuesta honesta es NO — 20 operaciones no bastan para
 * distinguir un 60% real de una moneda cargada al 50%. Este tool lo
 * muestra con números, no con opiniones.
 *
 * ── Honestidad estadística ────────────────────────────────────────────
 * El test binomial asume independencia e identica distribución (iid),
 * lo cual NUNCA es del todo cierto en trading (regímenes cambian,
 * correlación entre operaciones). El copy lo dice: es una COTA, no una
 * garantía. El verdadero test es el tiempo + fuera de muestra.
 *
 * ── Material ──────────────────────────────────────────────────────────
 * .tj-paper + .tj-paper-glow. Touch targets ≥44px. Sin overflow mobile.
 */
export function EdgeSignificanceChecker({ num = "01" }: { num?: string }) {
  const { lang } = useLang();
  const es = lang === "es";

  const [trades, setTrades] = useState(50);
  const [winRate, setWinRate] = useState(58); // %
  const [avgWinR, setAvgWinR] = useState(2.0);
  const [avgLossR, setAvgLossR] = useState(1.0);
  const [parametersCount, setParametersCount] = useState(3);
  const [copied, setCopied] = useState(false);

  const c = useMemo(() => {
    const wr = winRate / 100;
    const p0 = 0.5; // hipótesis nula: win rate real = 50% (azar)
    const n = trades;

    // Expectancy en R
    const expectancyR = wr * avgWinR - (1 - wr) * avgLossR;

    // Test binomial (aproximación normal, válida para n·p0·(1-p0) ≥ 5)
    const np0 = n * p0 * (1 - p0);
    const canTest = np0 >= 5;
    // z = (observedWins - expectedUnderH0) / sqrt(n·p0·(1-p0))
    const observedWins = wr * n;
    const expectedWins = p0 * n;
    const se = Math.sqrt(np0);
    const z = canTest && se > 0 ? (observedWins - expectedWins) / se : 0;

    // p-valor (two-tailed, approx normal CDF via erf)
    const pValue = canTest ? 2 * (1 - normalCdf(Math.abs(z))) : 1;

    const significant = pValue < 0.05;
    const strongSignificant = pValue < 0.01;

    // Intervalo de confianza Wilson Score (al 95% con z=1.96)
    const z95 = 1.96;
    const zSq = z95 * z95;
    const denom = 1 + zSq / n;
    const center = (wr + zSq / (2 * n)) / denom;
    const margin = (z95 * Math.sqrt((wr * (1 - wr)) / n + zSq / (4 * n * n))) / denom;
    const wilsonLower = Math.max(0, center - margin) * 100;
    const wilsonUpper = Math.min(1, center + margin) * 100;

    // Muestra mínima para 90%, 95% y 99% de confianza (margen error e = ±5%)
    const e = 0.05;
    const z90 = 1.645;
    const z99 = 2.576;
    const minSample90 = Math.ceil((z90 * z90 * wr * (1 - wr)) / (e * e));
    const minSample95 = Math.ceil((z95 * z95 * wr * (1 - wr)) / (e * e));
    const minSample99 = Math.ceil((z99 * z99 * wr * (1 - wr)) / (e * e));

    // Detector de Sobreajuste (Overfitting): Ratio de trades por parámetro (mínimo institucional 20:1)
    const tradesPerParam = n / Math.max(1, parametersCount);
    const overfittingRisk = tradesPerParam < 20;

    return {
      expectancyR,
      z,
      pValue,
      significant,
      strongSignificant,
      canTest,
      wilsonLower,
      wilsonUpper,
      minSample: minSample95,
      minSample90,
      minSample95,
      minSample99,
      sampleAdequate: n >= minSample95,
      tradesPerParam,
      overfittingRisk,
      power: computeStatisticalPower(winRate, trades),
      wins: Math.round(observedWins),
      losses: n - Math.round(observedWins),
    };
  }, [trades, winRate, avgWinR, avgLossR, parametersCount]);

  const fmtNum = (n: number, dec = 2) =>
    es
      ? new Intl.NumberFormat("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n)
      : new Intl.NumberFormat("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);

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

  const verdict = !c.canTest
    ? {
        label: es ? "Muestra insuficiente" : "Insufficient sample",
        color: "var(--ink-2)",
        text: es
          ? `Con ${trades} operaciones no se puede hacer un test estadístico fiable. Necesitas al menos ~20 para que la aproximación sea válida.`
          : `With ${trades} trades a reliable statistical test isn't possible. You need at least ~20 for the approximation to hold.`,
      }
    : !c.significant
      ? {
          label: es ? "No significativo" : "Not significant",
          color: "rgb(var(--pnl-neg))",
          text: es
            ? `Un ${fmtNum(winRate, 0)}% de aciertos en ${trades} operaciones NO es estadísticamente distinto de tirar una moneda (p = ${fmtNum(c.pValue, 3)}). Podría ser suerte. Sigue operando y midiendo.`
            : `A ${fmtNum(winRate, 0)}% win rate over ${trades} trades is NOT statistically distinct from a coin flip (p = ${fmtNum(c.pValue, 3)}). It could be luck. Keep trading and measuring.`,
        }
      : c.strongSignificant
        ? {
            label: es ? "Edge fuerte" : "Strong edge",
            color: "rgb(var(--pnl-pos))",
            text: es
              ? `Un ${fmtNum(winRate, 0)}% en ${trades} operaciones es muy poco probable por azar (p = ${fmtNum(c.pValue, 4)} < 0,01). Hay algo real aquí — pero valídalo fuera de muestra.`
              : `A ${fmtNum(winRate, 0)}% over ${trades} trades is very unlikely by chance (p = ${fmtNum(c.pValue, 4)} < 0.01). There's something real here — but validate out-of-sample.`,
          }
        : {
            label: es ? "Edge moderado" : "Moderate edge",
            color: "rgb(var(--accent-base))",
            text: es
              ? `Un ${fmtNum(winRate, 0)}% en ${trades} operaciones es significativo (p = ${fmtNum(c.pValue, 3)} < 0,05). Probablemente hay un edge, pero el margen es fino: acumula más operaciones para confirmarlo.`
              : `A ${fmtNum(winRate, 0)}% over ${trades} trades is significant (p = ${fmtNum(c.pValue, 3)} < 0.05). There's likely an edge, but the margin is thin: accumulate more trades to confirm.`,
          };

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
              {es ? "TEST ESTADÍSTICO" : "STATISTICAL TEST"}
            </span>
          </div>
          <h2 className="font-serif m-0 text-3xl sm:text-4xl lg:text-5xl font-normal tracking-[-0.022em] leading-[1.1] text-primary text-balance">
            {es ? (
              <>
                ¿Tu win rate es <span className="text-[rgb(var(--accent-base))]">real</span> o es suerte?
              </>
            ) : (
              <>
                Is your win rate <span className="text-[rgb(var(--accent-base))]">real</span> or luck?
              </>
            )}
          </h2>
          <p className="mt-5 mb-7 text-base sm:text-lg leading-relaxed text-secondary max-w-[34em]">
            {es
              ? "60% de aciertos en 20 operaciones suena bien — pero estadísticamente es indistinguible de una moneda. Este test te dice si tu muestra basta para afirmar que tienes un edge."
              : "60% win rate over 20 trades sounds good — but statistically it's indistinguishable from a coin. This test tells you if your sample is enough to claim you have an edge."}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {slider(es ? "Operaciones (N)" : "Trades (N)", trades, 5, 500, 5, setTrades, "", es ? "Número de operaciones" : "Number of trades")}
            {slider(es ? "Win rate" : "Win rate", winRate, 35, 75, 1, setWinRate, " %", es ? "Porcentaje de aciertos" : "Win rate percentage")}
            {slider(es ? "Ganancia media" : "Avg win (R)", avgWinR, 0.5, 5, 0.1, setAvgWinR, " R", es ? "Ganancia media en R" : "Average win in R")}
            {slider(es ? "Pérdida media" : "Avg loss (R)", avgLossR, 0.25, 3, 0.05, setAvgLossR, " R", es ? "Pérdida media en R" : "Average loss in R")}
          </div>

          {/* Detector de sobreajuste / Grados de libertad del setup */}
          <div className="mt-5 p-3.5 rounded-[2px] border border-[rgb(var(--divider)/0.12)] bg-[rgb(var(--divider)/0.03)]">
            <div className="flex items-center justify-between mb-2">
              <span className="tnum text-[11px] uppercase tracking-wider text-tertiary">
                {es ? "Parámetros / Reglas del Setup" : "Setup Parameters / Rules"}
              </span>
              <span className="tnum font-mono font-bold text-primary">{parametersCount}</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={parametersCount}
              onChange={(e) => setParametersCount(parseInt(e.target.value, 10))}
              aria-label={es ? "Número de parámetros del setup" : "Number of setup parameters"}
              className="tj-range w-full"
              /* `height: 44` y no 36: es lo que declara `.tj-range` —«el
                 control mide lo mismo que su bolita para que quepa
                 entera»— y lo que pasan los otros cinco deslizadores del
                 sitio. Este se había quedado en 36, por debajo del mínimo
                 de toque y desalineado con sus hermanos.

                 Y `--pct`, que también faltaba: sin ella la pista se
                 pinta con `--pct: 0%` de respaldo, o sea entera de surco.
                 El tramo recorrido NO se veía nunca, así que el
                 deslizador no enseñaba por dónde iba. */
              style={
                {
                  accentColor: "rgb(var(--accent-base))",
                  height: 44,
                  "--pct": `${((parametersCount - 1) / 9) * 100}%`,
                } as React.CSSProperties
              }
            />
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-secondary">
                {es ? "Ratio trades/parámetro:" : "Trades/parameter ratio:"} <strong className="font-mono text-primary">{c.tradesPerParam.toFixed(1)}:1</strong>
              </span>
              <span className={`font-semibold ${c.overfittingRisk ? "text-[rgb(var(--pnl-neg))]" : "text-[rgb(var(--pnl-pos))]"}`}>
                {c.overfittingRisk ? (es ? "⚠ Riesgo de Sobreajuste" : "⚠ Overfitting Risk") : (es ? "✓ Robusto (≥20:1)" : "✓ Robust (≥20:1)")}
              </span>
            </div>
          </div>
        </div>

        {/* Right: results card */}
        <div
          className="tj-paper tj-paper-glow relative lg:sticky lg:top-24"
          style={{ padding: 24, borderRadius: 3, border: "1px solid rgb(var(--divider) / 0.13)" }}
        >
          {/* Verdict headline */}
          <div className="mb-5">
            <div className="tnum" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)" }}>
              {es ? "Veredicto" : "Verdict"}
            </div>
            <div className="flex items-baseline gap-3 mt-1 mb-2">
              <span
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[2px]"
                style={{
                  background: `color-mix(in oklab, ${verdict.color} 12%, transparent)`,
                  border: `1px solid color-mix(in oklab, ${verdict.color} 35%, transparent)`,
                }}
              >
                <span aria-hidden className="w-1.5 h-1.5 rounded-[1px]" style={{ background: verdict.color }} />
                <span className="tnum" style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: verdict.color }}>
                  {verdict.label}
                </span>
              </span>
            </div>
            <p className="m-0 text-[13px] leading-[1.6]" style={{ color: "var(--ink)" }}>
              {verdict.text}
            </p>
          </div>

          {/* Gaussian Bell Curve Distribution Chart */}
          <div className="mb-4 p-3 rounded-[2px] border border-[rgb(var(--divider)/0.1)] bg-[rgb(var(--divider)/0.02)]">
            <div className="flex items-center justify-between text-[10px] font-mono text-tertiary uppercase tracking-wider mb-1">
              <span>{es ? "Campana de Gauss (H₀: Azar)" : "Gaussian Bell Curve (H₀: Luck)"}</span>
              <span>
                {es ? "Región crítica: |z| ≥ 1.96" : "Critical zone: |z| ≥ 1.96"}
              </span>
            </div>
            <GaussianBellCurve z={c.z} isSignificant={c.significant} />
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Result label={es ? "Expectancy" : "Expectancy"} value={`${c.expectancyR >= 0 ? "+" : ""}${fmtNum(c.expectancyR, 3)} R`} color={c.expectancyR >= 0 ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))"} />
            <Result label="p-valor (H₀: 50%)" value={fmtNum(c.pValue, 4)} color={c.significant ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))"} />
            <Result label={es ? "Potencia (1 - β)" : "Statistical Power"} value={`${fmtNum(c.power, 1)}%`} color={c.power >= 80 ? "rgb(var(--pnl-pos))" : "rgb(var(--accent-base))"} />
            <Result label={es ? "IC Wilson 95%" : "Wilson 95% CI"} value={`[${fmtNum(c.wilsonLower, 1)}%, ${fmtNum(c.wilsonUpper, 1)}%]`} color="var(--ink)" />
          </div>

          {/* Matriz de Muestra Mínima */}
          <div className="mb-4 p-3 rounded-[2px] border border-[rgb(var(--divider)/0.08)] bg-[rgb(var(--divider)/0.03)]">
            <span className="block text-[10px] uppercase tracking-wider text-tertiary mb-2">
              {es ? "Muestra requerida según confianza (margen ±5%)" : "Required sample by confidence (margin ±5%)"}
            </span>
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="p-1.5 rounded bg-[rgb(var(--divider)/0.04)]">
                <span className="block text-[10px] text-tertiary">90% (z=1.65)</span>
                <span className={`font-bold ${trades >= c.minSample90 ? "text-[rgb(var(--pnl-pos))]" : "text-primary"}`}>
                  {c.minSample90} ops
                </span>
              </div>
              <div className="p-1.5 rounded bg-[rgb(var(--accent-base)/0.08)] border border-[rgb(var(--accent-base)/0.2)]">
                <span className="block text-[10px] text-[rgb(var(--accent-base))] font-semibold">95% (z=1.96)</span>
                <span className={`font-bold ${trades >= c.minSample95 ? "text-[rgb(var(--pnl-pos))]" : "text-[rgb(var(--accent-base))]"}`}>
                  {c.minSample95} ops
                </span>
              </div>
              <div className="p-1.5 rounded bg-[rgb(var(--divider)/0.04)]">
                <span className="block text-[10px] text-tertiary">99% (z=2.58)</span>
                <span className={`font-bold ${trades >= c.minSample99 ? "text-[rgb(var(--pnl-pos))]" : "text-primary"}`}>
                  {c.minSample99} ops
                </span>
              </div>
            </div>
          </div>

          {/* Sample-size adequacy bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="tnum" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)" }}>
                {es ? "Muestra vs. necesaria" : "Sample vs. needed"}
              </span>
              <span className="tnum" style={{ fontSize: 11, fontWeight: 600, color: c.sampleAdequate ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))" }}>
                {trades} / {c.minSample}
              </span>
            </div>
            <div className="relative h-2 rounded-[2px] overflow-hidden" style={{ background: "rgb(var(--divider) / 0.13)" }}>
              <div
                className="absolute left-0 top-0 h-full rounded-[2px]"
                style={{
                  width: `${Math.min(100, (trades / c.minSample) * 100)}%`,
                  background: c.sampleAdequate
                    ? "linear-gradient(90deg, color-mix(in oklab, rgb(var(--pnl-pos)) 45%, transparent), rgb(var(--pnl-pos)))"
                    : "linear-gradient(90deg, color-mix(in oklab, rgb(var(--pnl-neg)) 45%, transparent), rgb(var(--pnl-neg)))",
                  transition: "width 0.3s var(--ease-suave)",
                }}
              />
              {/* minSample marker */}
              <div
                aria-hidden
                className="absolute top-0 bottom-0"
                style={{
                  left: `${Math.min(100, (c.minSample / Math.max(trades, c.minSample)) * 100)}%`,
                  width: 1,
                  background: "rgb(var(--divider) / 0.5)",
                }}
              />
            </div>
            <p className="tnum m-0 mt-1.5 text-[10.5px]" style={{ color: "var(--ink-3)" }}>
              {c.sampleAdequate
                ? (es ? `Muestra suficiente para detectar un ${fmtNum(winRate, 0)}% real al 95% de confianza (±5%).` : `Sample sufficient to detect a real ${fmtNum(winRate, 0)}% at 95% confidence (±5%).`)
                : (es ? `Te faltan ${c.minSample - trades} operaciones más para detectar un ${fmtNum(winRate, 0)}% real al 95% de confianza.` : `You need ${c.minSample - trades} more trades to detect a real ${fmtNum(winRate, 0)}% at 95% confidence.`)}
            </p>
          </div>

          {/* Exportar informe */}
          <div className="mt-4 pt-3 border-t border-[rgb(var(--divider)/0.08)] flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                const report = es
                  ? `Informe de Significancia Estadística (CountPips):\n• Muestra analizada: ${trades} operaciones\n• Win Rate observado: ${winRate}%\n• IC 95% Wilson Score: [${c.wilsonLower.toFixed(1)}%, ${c.wilsonUpper.toFixed(1)}%]\n• Expectancy: ${c.expectancyR >= 0 ? "+" : ""}${c.expectancyR.toFixed(3)} R\n• z-score: ${c.z.toFixed(2)} | p-valor: ${c.pValue.toFixed(4)}\n• Veredicto: ${verdict.label} (${c.significant ? "Significativo p < 0.05" : "No significativo"})\n• Muestra 95% requerida: ${c.minSample95} ops\n• Parámetros del setup: ${parametersCount} (${c.tradesPerParam.toFixed(1)}:1 ratio)`
                  : `Statistical Significance Report (CountPips):\n• Analyzed Sample: ${trades} trades\n• Observed Win Rate: ${winRate}%\n• Wilson 95% CI: [${c.wilsonLower.toFixed(1)}%, ${c.wilsonUpper.toFixed(1)}%]\n• Expectancy: ${c.expectancyR >= 0 ? "+" : ""}${c.expectancyR.toFixed(3)} R\n• z-score: ${c.z.toFixed(2)} | p-value: ${c.pValue.toFixed(4)}\n• Verdict: ${verdict.label} (${c.significant ? "Significant p < 0.05" : "Not significant"})\n• 95% Min Sample: ${c.minSample95} trades\n• Setup Parameters: ${parametersCount} (${c.tradesPerParam.toFixed(1)}:1 ratio)`;

                if (navigator?.clipboard?.writeText) {
                  navigator.clipboard.writeText(report).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2200);
                  });
                }
              }}
              className="toque-comodo inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-[rgb(var(--accent-base))] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]"
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" stroke="currentColor" strokeWidth="1.3" />
              </svg>
              {copied ? (es ? "¡Informe copiado!" : "Report copied!") : (es ? "Copiar informe estadístico" : "Copy statistical report")}
            </button>
            <span className="text-[11px] text-tertiary font-mono">
              {es ? "100% privado en navegador" : "100% private in browser"}
            </span>
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
      {/* «EXPECTANCY» en versalitas con 0,12em de espaciado mide mas que
          la celda a 320 px: se recortaba. Con el espaciado a cero cuando
          no cabe y permiso para partir, se lee entero. */}
      <div
        className="tnum relative leading-[1.3] [overflow-wrap:anywhere]"
        style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)" }}
      >
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

function GaussianBellCurve({ z, isSignificant }: { z: number; isSignificant: boolean }) {
  const W = 320;
  const H = 70;
  const padX = 12;
  const padY = 6;
  const plotW = W - padX * 2;
  const plotH = H - padY * 2;

  // Generate normal curve points from x = -3.5 to +3.5
  const points: { x: number; y: number; val: number }[] = [];
  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const val = -3.5 + (i / steps) * 7.0;
    const pdf = (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * val * val);
    const px = padX + (i / steps) * plotW;
    const py = H - padY - (pdf / 0.42) * plotH;
    points.push({ x: px, y: py, val });
  }

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  // Clamped z position
  const clampedZ = Math.max(-3.4, Math.min(3.4, z));
  const zX = padX + ((clampedZ - (-3.5)) / 7.0) * plotW;
  const critLeftX = padX + ((-1.96 - (-3.5)) / 7.0) * plotW;
  const critRightX = padX + ((1.96 - (-3.5)) / 7.0) * plotW;

  return (
    <div className="relative w-full h-[70px]">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
        {/* Critical rejection zones shading */}
        <rect x={padX} y={padY} width={critLeftX - padX} height={plotH} fill="rgb(var(--pnl-neg))" fillOpacity="0.1" />
        <rect x={critRightX} y={padY} width={W - padX - critRightX} height={plotH} fill="rgb(var(--pnl-pos))" fillOpacity="0.15" />

        {/* Critical threshold lines (z = +/- 1.96) */}
        <line x1={critLeftX} y1={padY} x2={critLeftX} y2={H - padY} stroke="rgb(var(--divider)/0.2)" strokeDasharray="2 2" />
        <line x1={critRightX} y1={padY} x2={critRightX} y2={H - padY} stroke="rgb(var(--divider)/0.2)" strokeDasharray="2 2" />

        {/* Center baseline */}
        <line x1={padX} y1={H - padY} x2={W - padX} y2={H - padY} stroke="rgb(var(--divider)/0.25)" />

        {/* Gaussian curve line */}
        <path d={pathD} fill="none" stroke="var(--ink-3)" strokeWidth="1.5" />

        {/* User's observed z-score marker */}
        <line
          x1={zX}
          y1={padY}
          x2={zX}
          y2={H - padY}
          stroke={isSignificant ? "rgb(var(--pnl-pos))" : "rgb(var(--accent-base))"}
          strokeWidth="2"
        />
        <circle
          cx={zX}
          cy={padY + 4}
          r="3"
          fill={isSignificant ? "rgb(var(--pnl-pos))" : "rgb(var(--accent-base))"}
        />
      </svg>
    </div>
  );
}
