"use client";

import { useState, useMemo } from "react";
import { useLang } from "@/lib/i18n";
import { ResultadoAnunciado } from "@/components/tj/ResultadoAnunciado";
import { Deslizador } from "@/components/tj/Deslizador";
import { BotonCopiar } from "@/components/tj/BotonCopiar";
import { componerInforme } from "@/lib/informe";
import { pctSep, fmtR, fmtNum as fmtNumBase } from "@/lib/trading/format";
import { computeStatisticalPower, normalCdf } from "@/lib/trading/estadistica";

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
 * .tj-ficha con barra, cuerpo y pie. Touch targets ≥44px. Sin overflow mobile.
 */
export function EdgeSignificanceChecker() {
  const { lang } = useLang();
  const es = lang === "es";
  /* El espacio duro antes del signo en espanol, pegado en ingles, es
     `PCT_SEP` de lib/trading/format.ts: aqui se llama a traves de
     `pctSep(lang)`, sin repetirlo. */
  const PCT = pctSep(lang);

  const [trades, setTrades] = useState(50);
  const [winRate, setWinRate] = useState(58); // %
  const [avgWinR, setAvgWinR] = useState(2.0);
  const [avgLossR, setAvgLossR] = useState(1.0);
  const [parametersCount, setParametersCount] = useState(3);

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

  /* El helper de format.ts, no un `Intl.NumberFormat` propio: el propio
     escribía «1234,5» sin millares en español, distinto del resto de la web. */
  const fmtNum = (n: number, dec = 2) => fmtNumBase(n, lang, dec);

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
        <span className="tj-deslizador-etiqueta">{label}</span>
        <span className="tj-deslizador-valor">
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
          ? `Con ${trades} operaciones no se puede hacer un test estadístico fiable. Necesitas al menos 20 para que la aproximación sea válida.`
          : `With ${trades} trades a reliable statistical test isn’t possible. You need at least 20 for the approximation to hold.`,
      }
    : !c.significant
      ? {
          label: es ? "No significativo" : "Not significant",
          color: "rgb(var(--pnl-neg))",
          text: es
            ? `Un ${fmtNum(winRate, 0)}${PCT} de aciertos en ${trades} operaciones no es estadísticamente distinto de tirar una moneda (p = ${fmtNum(c.pValue, 3)}). Podría ser suerte. Sigue operando y midiendo.`
            : `A ${fmtNum(winRate, 0)}% win rate over ${trades} trades is not statistically distinct from a coin flip (p = ${fmtNum(c.pValue, 3)}). It could be luck. Keep trading and measuring.`,
        }
      : c.strongSignificant
        ? {
            label: es ? "Ventaja sólida" : "Strong edge",
            color: "rgb(var(--pnl-pos))",
            text: es
              ? `Un ${fmtNum(winRate, 0)}${PCT} en ${trades} operaciones es muy poco probable por azar (p = ${fmtNum(c.pValue, 4)} < 0,01). Hay algo real aquí, pero valídalo fuera de muestra.`
              : `A ${fmtNum(winRate, 0)}% over ${trades} trades is very unlikely by chance (p = ${fmtNum(c.pValue, 4)} < 0.01). There’s something real here — but validate out-of-sample.`,
          }
        : {
            label: es ? "Ventaja moderada" : "Moderate edge",
            color: "rgb(var(--accent-base))",
            text: es
              ? `Un ${fmtNum(winRate, 0)}${PCT} en ${trades} operaciones es significativo (p = ${fmtNum(c.pValue, 3)} < 0,05). Probablemente hay una ventaja, pero el margen es fino: acumula más operaciones para confirmarlo.`
              : `A ${fmtNum(winRate, 0)}% over ${trades} trades is significant (p = ${fmtNum(c.pValue, 3)} < 0.05). There’s likely an edge, but the margin is thin: accumulate more trades to confirm.`,
          };

  return (
    <section className="section-tight">
      {/* El veredicto, para quien no ve la pantalla. Se reutiliza el
          rótulo que ya compone la herramienta en vez de inventar otro
          vocabulario, y se acompaña de las dos cifras que lo sostienen:
          el resto del panel sigue disponible leyéndolo. */}
      <ResultadoAnunciado
        texto={
          es
            ? `${verdict.label}: p = ${fmtNum(c.pValue, 4)}, expectancy ${fmtR(c.expectancyR, lang, 3)} en ${trades} operaciones.`
            : `${verdict.label}: p = ${fmtNum(c.pValue, 4)}, expectancy ${fmtR(c.expectancyR, lang, 3)} over ${trades} trades.`
        }
      />
      <div className="tj-container grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* Left: intro + inputs */}
        <div>
          <div className="inline-flex items-center gap-3 mb-5">
            <span className="eyebrow" data-titular-herramienta>
              {es ? "Test estadístico" : "Statistical test"}
            </span>
          </div>
          <h2 data-titular-herramienta className="t-h2 m-0 text-primary max-w-[24ch]">
            {es ? (
              <>
                ¿Tu win rate es real o es suerte?
              </>
            ) : (
              <>
                Is your win rate real or luck?
              </>
            )}
          </h2>
          <p className="t-entradilla mt-5 mb-7 text-secondary max-w-[34em]">
            {es
              ? `60${PCT} de aciertos en 20 operaciones suena bien, pero estadísticamente es indistinguible de una moneda. Este test te dice si tu muestra basta para afirmar que tienes un edge.`
              : "60% win rate over 20 trades sounds good — but statistically it’s indistinguishable from a coin. This test tells you if your sample is enough to claim you have an edge."}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {slider(es ? "Operaciones (N)" : "Trades (N)", trades, 5, 500, 5, setTrades, "", es ? "Número de operaciones" : "Number of trades")}
            {slider(es ? "Win rate" : "Win rate", winRate, 35, 75, 1, setWinRate, pctSep(lang), es ? "Porcentaje de aciertos" : "Win rate percentage")}
            {slider(es ? "Ganancia media" : "Avg win (R)", avgWinR, 0.5, 5, 0.1, setAvgWinR, " R", es ? "Ganancia media en R" : "Average win in R")}
            {slider(es ? "Pérdida media" : "Avg loss (R)", avgLossR, 0.25, 3, 0.05, setAvgLossR, " R", es ? "Pérdida media en R" : "Average loss in R")}
          </div>

          {/* Detector de sobreajuste / Grados de libertad del setup */}
          <div className="mt-6 border-t border-[var(--ficha-division)] pt-5">
            <Deslizador
              etiqueta={es ? "Parámetros o reglas del setup" : "Setup parameters or rules"}
              texto={String(parametersCount)}
              valor={parametersCount}
              min={1}
              max={10}
              paso={1}
              onValor={setParametersCount}
            />
            <div className="mt-2 flex items-center justify-between text-[13px]">
              <span className="text-secondary">
                {es ? "Operaciones por parámetro:" : "Trades per parameter:"} <strong className="tnum text-primary">{fmtNum(c.tradesPerParam, 1)}:1</strong>
              </span>
              <span className={`font-semibold ${c.overfittingRisk ? "text-[rgb(var(--pnl-neg))]" : "text-[rgb(var(--pnl-pos))]"}`}>
                {c.overfittingRisk ? (es ? "Riesgo de sobreajuste" : "Overfitting risk") : (es ? "Robusto (≥ 20:1)" : "Robust (≥ 20:1)")}
              </span>
            </div>
          </div>
        </div>

        {/* Right: results card */}
        <div className="tj-ficha relative lg:sticky lg:top-24">
          <p className="tj-ficha-barra">
            <span>{es ? "Veredicto" : "Verdict"}</span>
            <span>
              {trades} {es ? "operaciones" : "trades"} · {fmtNum(winRate, 0)}{PCT}
            </span>
          </p>
          <div className="tj-ficha-cuerpo">
          <div className="mb-5">
            <p className="t-h4 m-0" style={{ color: verdict.color }}>
              {verdict.label}
            </p>
            <p className="medida m-0 mt-2 text-[14px] leading-[1.6] text-secondary">
              {verdict.text}
            </p>
          </div>

          {/* Gaussian Bell Curve Distribution Chart */}
          <div className="mb-5 border-t border-[var(--ficha-division)] pt-3">
            <div className="flex flex-wrap justify-between gap-x-4 text-[12px] tnum text-tertiary mb-1">
              <span className="whitespace-nowrap">{es ? "Campana de Gauss (H₀: azar)" : "Bell curve (H₀: chance)"}</span>
              <span className="whitespace-nowrap">
                {es ? "Región crítica: |z| ≥ 1,96" : "Critical zone: |z| ≥ 1.96"}
              </span>
            </div>
            <GaussianBellCurve z={c.z} isSignificant={c.significant} />
          </div>

          {/* Stats grid */}
          <div className="tj-matriz grid-cols-2 mb-5">
            <Result label={es ? "Expectancy" : "Expectancy"} value={`${fmtR(c.expectancyR, lang, 3)}`} color={c.expectancyR >= 0 ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))"} />
            <Result label={es ? `p-valor (H₀: 50${PCT})` : `p-value (H₀: 50%)`} value={fmtNum(c.pValue, 4)} color={c.significant ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))"} />
            <Result label={es ? "Potencia (1 − β)" : "Statistical power (1 − β)"} value={`${fmtNum(c.power, 1)}${PCT}`} color={c.power >= 80 ? "rgb(var(--pnl-pos))" : "rgb(var(--accent-base))"} />
            <Result label={es ? `IC Wilson 95${PCT}` : "Wilson 95% CI"} value={`${fmtNum(c.wilsonLower, 1)}–${fmtNum(c.wilsonUpper, 1)}${PCT}`} color="var(--ink)" />
          </div>

          {/* Matriz de Muestra Mínima */}
          <div className="mb-5">
            <span className="block text-[12px] text-tertiary mb-2">
              {es ? `Muestra requerida según confianza (margen ±5${PCT})` : "Required sample by confidence (margin ±5%)"}
            </span>
            <div className="tj-matriz grid-cols-3 text-center text-xs tnum">
              <div className="py-2.5">
                <span className="block text-[12px] text-tertiary">{es ? `90${PCT} (z = 1,65)` : "90% (z = 1.65)"}</span>
                <span className={`font-semibold ${trades >= c.minSample90 ? "text-[rgb(var(--pnl-pos))]" : "text-primary"}`}>
                  {c.minSample90} ops
                </span>
              </div>
              <div className="tj-columna-propia py-2.5">
                <span className="block text-[12px] text-primary font-semibold">{es ? `95${PCT} (z = 1,96)` : "95% (z = 1.96)"}</span>
                <span className={`font-semibold ${trades >= c.minSample95 ? "text-[rgb(var(--pnl-pos))]" : "text-[rgb(var(--accent-base))]"}`}>
                  {c.minSample95} ops
                </span>
              </div>
              <div className="py-2.5">
                <span className="block text-[12px] text-tertiary">{es ? `99${PCT} (z = 2,58)` : "99% (z = 2.58)"}</span>
                <span className={`font-semibold ${trades >= c.minSample99 ? "text-[rgb(var(--pnl-pos))]" : "text-primary"}`}>
                  {c.minSample99} ops
                </span>
              </div>
            </div>
          </div>

          {/* Sample-size adequacy bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="tnum" style={{ fontSize: 12, color: "var(--ink-3)" }}>
                {es ? "Muestra frente a la necesaria" : "Sample vs. required"}
              </span>
              <span className="tnum" style={{ fontSize: 12, fontWeight: 600, color: c.sampleAdequate ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))" }}>
                {trades} / {c.minSample}
              </span>
            </div>
            <div className="relative h-[3px] rounded-[1px] overflow-hidden" style={{ background: "var(--ficha-division)" }}>
              <div
                className="absolute left-0 top-0 h-full"
                style={{
                  width: `${Math.min(100, (trades / c.minSample) * 100)}%`,
                  background: c.sampleAdequate ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))",
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
            <p className="tnum m-0 mt-1.5 text-[12px]" style={{ color: "var(--ink-3)" }}>
              {c.sampleAdequate
                ? (es ? `Muestra suficiente para detectar un ${fmtNum(winRate, 0)}${PCT} real al 95${PCT} de confianza (±5${PCT}).` : `Sample sufficient to detect a real ${fmtNum(winRate, 0)}% at 95% confidence (±5%).`)
                : (es ? `Te faltan ${c.minSample - trades} operaciones más para detectar un ${fmtNum(winRate, 0)}${PCT} real al 95${PCT} de confianza.` : `You need ${c.minSample - trades} more trades to detect a real ${fmtNum(winRate, 0)}% at 95% confidence.`)}
            </p>
          </div>

          </div>
          <div className="tj-ficha-barra tj-ficha-barra--pie">
            <BotonCopiar
              texto={() =>
                componerInforme(
                  es ? "Significancia estadística" : "Statistical significance",
                  [
                    {
                      lineas: [
                        `${es ? "Muestra" : "Sample"}: ${trades} ${es ? "operaciones" : "trades"}`,
                        `${es ? "Win rate observado" : "Observed win rate"}: ${fmtNum(winRate, 0)}${PCT}`,
                        `Expectancy: ${fmtR(c.expectancyR, lang, 3)}`,
                        `${es ? "Parámetros del setup" : "Setup parameters"}: ${parametersCount} (${fmtNum(c.tradesPerParam, 1)} ${es ? "operaciones por parámetro" : "trades per parameter"})`,
                      ],
                    },
                    {
                      rotulo: es ? "Resultado" : "Result",
                      lineas: [
                        `${es ? "Veredicto" : "Verdict"}: ${verdict.label}`,
                        `z: ${fmtNum(c.z, 2)} · ${es ? "p-valor" : "p-value"}: ${fmtNum(c.pValue, 4)}`,
                        `${es ? `IC Wilson 95${PCT}` : "Wilson 95% CI"}: ${fmtNum(c.wilsonLower, 1)}–${fmtNum(c.wilsonUpper, 1)}${PCT}`,
                        `${es ? `Muestra necesaria al 95${PCT}` : "Sample needed at 95%"}: ${c.minSample95} ${es ? "operaciones" : "trades"}`,
                      ],
                    },
                  ],
                  `${es ? "" : "/en"}/herramientas/significancia-estadistica/`,
                )
              }
              rotulo={es ? "Copiar informe" : "Copy report"}
              hecho={es ? "Informe copiado" : "Report copied"}
            />
            <span className="text-tertiary">
              {es ? "Privado en tu navegador" : "Private in your browser"}
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
      className="relative flex min-w-0 flex-col px-4 py-4"
    >
      {/* «EXPECTANCY» en versalitas con 0,12em de espaciado mide mas que
          la celda a 320 px: se recortaba. Con el espaciado a cero cuando
          no cabe y permiso para partir, se lee entero. */}
      <div
        className="tnum relative leading-[1.3] [overflow-wrap:anywhere]"
        style={{ fontSize: 12, color: "var(--ink-3)" }}
      >
        {label}
      </div>
      <div
        className="tnum mt-auto min-w-0 break-words relative pt-1"
        style={{ fontSize: 18, fontWeight: 600, color, transition: "color 0.18s var(--ease-suave)" }}
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
        <line x1={critLeftX} y1={padY} x2={critLeftX} y2={H - padY} stroke="rgb(var(--divider)/0.2)" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
        <line x1={critRightX} y1={padY} x2={critRightX} y2={H - padY} stroke="rgb(var(--divider)/0.2)" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />

        {/* Center baseline */}
        <line x1={padX} y1={H - padY} x2={W - padX} y2={H - padY} stroke="rgb(var(--divider)/0.25)" vectorEffect="non-scaling-stroke" />

        {/* Gaussian curve line */}
        <path d={pathD} fill="none" stroke="var(--ink-3)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />

        {/* User's observed z-score marker */}
        <line
          x1={zX}
          y1={padY}
          x2={zX}
          y2={H - padY}
          stroke={isSignificant ? "rgb(var(--pnl-pos))" : "rgb(var(--accent-base))"}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
