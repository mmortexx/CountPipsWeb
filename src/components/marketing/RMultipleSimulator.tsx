"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { marcasRedondas } from "@/lib/marcasEje";
import { useLang } from "@/lib/i18n";
import { ResultadoAnunciado } from "@/components/tj/ResultadoAnunciado";
import { simulaMonteCarlo } from "@/lib/trading/montecarlo";
import { UMBRAL_RUINA_PCT } from "@/lib/trading/estadistica";
import { fmtMoney, fmtNum as fmtNumBase, fmtR, pctSep } from "@/lib/trading/format";
import { CAMINOS_MONTE_CARLO } from "@/lib/herramientas";

const SIM_RUNS = CAMINOS_MONTE_CARLO;

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
 *   · las bandas P5–P95 y P25–P75, y la mediana (incertidumbre)
 *   · la probabilidad de ruina (perder la mitad) y de superar 2×
 *
 * ── Por qué Monte Carlo aquí ──────────────────────────────────────────
 * Un solo camino no enseña nada: el mismo edge puede llevarte a
 * multiplicar por 4 o a quebrar, dependiendo del ORDEN. Correr cientos
 * de caminos y mostrar el abanico es la forma honesta de visualizar el
 * riesgo — y refuerza el mensaje de disciplina: el edge existe, pero
 * necesitas sobrevivir a la varianza para cobrarlo.
 *
 * ── Aleatoriedad determinista ──────────────────────────────────────────
 * Cada simulación usa un PRNG seedado (mulberry32) con la semilla del
 * slider, así el resultado es REPRODUCIBLE: mismo seed → mismo abanico.
 * Esto evita que el gráfico baile en cada render y permite comparar
 * escenarios. "Re-tirar" cambia la semilla y da otra realización.
 *
 */
export function RMultipleSimulator() {
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
  const cajaGraficoRef = useRef<HTMLDivElement | null>(null);
  const [anchoGrafico, setAnchoGrafico] = useState(540);
  useEffect(() => {
    const caja = cajaGraficoRef.current;
    if (!caja || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width);
      if (w > 0) setAnchoGrafico(w);
    });
    ro.observe(caja);
    return () => ro.disconnect();
  }, []);


  const c = useMemo(
    () => simulaMonteCarlo({ caminos: SIM_RUNS, startBalance, trades, winRate, avgWinR, avgLossR, riskPct, monthlyWithdrawal, seed }),
    [startBalance, trades, winRate, avgWinR, avgLossR, riskPct, monthlyWithdrawal, seed],
  );

  const fmtUsd = (n: number) => fmtMoney(n, lang, { decimals: 0 });

  /* Importe corto para las cinco celdas de percentil, que a 320 px miden
     poco mas de 70 px. A mano y no con `notation: "compact"` de Intl:
     en espanol eso devuelve «18,9 mil», que ocupa MAS que «18.906». */
  const fmtUsdCorto = (n: number) => {
    const a = Math.abs(n);
    const signo = n < 0 ? "−" : "";
    if (a >= 1_000_000) return es ? `${signo}${fmtNum(a / 1_000_000, 2)}\u00a0M $` : `${signo}$${fmtNum(a / 1_000_000, 2)}M`;
    if (a >= 10_000) return es ? `${signo}${fmtNum(a / 1_000, 0)}\u00a0k $` : `${signo}$${fmtNum(a / 1_000, 0)}k`;
    return fmtUsd(n);
  };

  const fmtNum = (n: number, dec = 2) => fmtNumBase(n, lang, dec);

  const fmtPct = (n: number, dec = 1) => `${fmtNum(n, dec)}${pctSep(lang)}`;

  // ── Abanico P5-P95, P25-P75, media y mediana ─────────────────────────────
  /* Al ancho real de la caja y con escala: antes era un lienzo fijo de 540
     escalado, con el eje en 0 —la curva vivía apretada en la mitad de
     arriba— y sin una sola cifra que dijera cuánto marcaba cada banda. */
  const svgW = anchoGrafico;
  const svgH = Math.round(Math.max(160, Math.min(220, svgW * 0.36)));
  const padL = 4;
  const padR = 56;
  const padT = 10;
  const padB = 24;
  const allVals = c.statsPerTrade.flatMap((s) => [s.p5, s.p25, s.p50, s.p75, s.p95, s.mean]);
  const lo = Math.min(...allVals, startBalance);
  const hi = Math.max(...allVals, startBalance);
  const holgura = (hi - lo || Math.max(hi, 1) * 0.1) * 0.06;
  const minV = Math.max(0, lo - holgura);
  const maxV = hi + holgura;
  const range = maxV - minV || 1;
  const N = c.statsPerTrade.length;
  const xDe = (i: number) => padL + (i / Math.max(1, N - 1)) * (svgW - padL - padR);
  const yDe = (v: number) => svgH - padB - ((v - minV) / range) * (svgH - padT - padB);
  const marcasY = marcasRedondas(minV, maxV);

  const toPath = (key: "p5" | "p25" | "p50" | "p75" | "p95" | "mean") =>
    "M " + c.statsPerTrade.map((s, i) => `${xDe(i).toFixed(1)},${yDe(s[key]).toFixed(1)}`).join(" L ");

  const banda = (arriba: "p95" | "p75", abajo: "p5" | "p25") => {
    const top = c.statsPerTrade.map((s, i) => `${xDe(i).toFixed(1)},${yDe(s[arriba]).toFixed(1)}`);
    const bottom = c.statsPerTrade
      .map((s, i) => `${xDe(i).toFixed(1)},${yDe(s[abajo]).toFixed(1)}`)
      .reverse();
    return "M " + top.join(" L ") + " L " + bottom.join(" L ") + " Z";
  };
  const outerBandPath = banda("p95", "p5");
  const innerBandPath = banda("p75", "p25");

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
        <span className="tnum" style={{ fontSize: 12, color: "var(--ink-3)" }}>
          {label}
        </span>
        <span
          className="tnum inline-flex items-baseline"
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--ink)",
            transition: "color 0.18s var(--ease-suave)",
          }}
        >
          {/* El dólar cambia de sitio con el idioma: «10.000 $» en español,
              «$10,000» en inglés. Con el sufijo fijo `" $"` la web inglesa
              componía «10,000 $», la forma española en una página inglesa.
              Las demás unidades —%, R, operaciones— van siempre detrás. */}
          {suffix === " $" && !es
            ? `$${fmtNum(value, 0)}`
            : `${fmtNum(value, Number.isInteger(step) ? 0 : 2)}${suffix}`}
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
    <section className="section-tight">
      {/* Las tres cifras por las que se viene a una simulación, para quien
          no ve la pantalla: dónde acaba la mitad de las veces, cómo es el
          mal escenario, y qué probabilidad hay de quedarse sin cuenta. */}
      <ResultadoAnunciado
        texto={
          es
            ? `Mediana: ${fmtUsd(c.finalP50)}. Cola del 5 %: ${fmtUsd(c.finalP5)}. Probabilidad de ruina: ${fmtPct(c.probRuin, 1)}.`
            : `Median: ${fmtUsd(c.finalP50)}. Bottom 5%: ${fmtUsd(c.finalP5)}. Probability of ruin: ${fmtPct(c.probRuin, 1)}.`
        }
      />
      <div className="tj-container grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* Left: intro + inputs */}
        <div>
          <div className="inline-flex items-center gap-3 mb-5">
            <span className="eyebrow" data-titular-herramienta>
              {es ? "Simulador" : "Simulator"}
            </span>
          </div>
          <h2 data-titular-herramienta className="t-h2 m-0 text-primary max-w-[24ch]">
            {es ? (
              <>
                El edge existe. <span className="text-gradient tj-frase-nueva">La varianza, también.</span>
              </>
            ) : (
              <>
                The edge is real. <span className="text-gradient tj-frase-nueva">So is variance.</span>
              </>
            )}
          </h2>
          <p className="mt-5 mb-7 text-base sm:text-lg leading-relaxed text-secondary max-w-[34em]">
            {es
              ? `${SIM_RUNS} simulaciones de tus próximas operaciones. Cada camino es distinto: el abanico muestra los percentiles completos (P5 a P95). El mismo edge puede multiplicar tu cuenta o arruinarte según el orden. La disciplina es lo que te deja sobrevivir hasta cobrarlo.`
              : `${SIM_RUNS} simulations of your next trades. Each path is different: the fan shows full percentiles (P5 to P95). The same edge can multiply your account or ruin you depending on order. Discipline is what lets you survive long enough to collect it.`}
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
            <span className="mb-2 block tnum text-[12px] text-tertiary">
              {es ? "Perfiles de ejemplo" : "Example profiles"}
            </span>
            <div className="tj-segmentado tj-segmentado-rejilla" role="group">
              {[
                { label: es ? "Prueba de fondeo" : "Prop challenge", muestra: "riesgo", wr: 55, winR: 1.8, lossR: 1.0, risk: 0.75 },
                { label: es ? "Seguimiento de tendencia" : "Trend following", muestra: "acierto", wr: 42, winR: 3.2, lossR: 1.0, risk: 1.0 },
                { label: es ? "Scalping de reversión" : "Mean-reversion scalp", muestra: "acierto", wr: 65, winR: 1.2, lossR: 1.0, risk: 0.5 },
                { label: es ? "Sobre-apalancamiento" : "Over-leveraged", muestra: "riesgo", peligro: true, wr: 50, winR: 1.5, lossR: 1.0, risk: 3.5 },
              ].map((p) => ({
                ...p,
                /* La nota se compone de los campos del perfil: escrita a mano,
                   repetía cada cifra y podía quedarse atrás al retocar una. */
                nota:
                  p.muestra === "riesgo"
                    ? `${fmtPct(p.risk, Number.isInteger(p.risk * 10) ? 1 : 2)} ${es ? "riesgo" : "risk"}${p.peligro ? (es ? " · peligro" : " · danger") : ""}`
                    : `${fmtPct(p.wr, 0)} ${es ? "acierto" : "hit"} · ${fmtNum(p.winR, 1)}R`,
              })).map((preset) => {
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
                        «Prueba de fondeo» cabe en una y los otros tres no,
                        y sin el suelo las cuatro notas quedaban a alturas
                        distintas — que es lo que hacia que cuatro
                        opciones del mismo rango se leyeran desiguales. */}
                    <span className="grid min-w-0 text-center leading-[1.25]">
                      <span className="flex min-h-[2.5em] items-center justify-center">
                        {preset.label}
                      </span>
                      <span className="mt-0.5 text-[11px] opacity-70">{preset.nota}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {slider(es ? "Balance inicial" : "Starting balance", startBalance, 1000, 100000, 500, setStartBalance, " $", es ? "Balance inicial" : "Starting balance")}
            {slider(es ? "Operaciones" : "Trades", trades, 20, 300, 10, setTrades, "", es ? "Número de operaciones a simular" : "Number of trades to simulate")}
            {slider(es ? "Win rate" : "Win rate", winRate, 30, 75, 1, setWinRate, pctSep(lang), es ? "Porcentaje de aciertos" : "Win rate")}
            {slider(es ? "Ganancia media" : "Avg win (R)", avgWinR, 0.5, 5, 0.1, setAvgWinR, " R", es ? "Ganancia media en R" : "Average win in R")}
            {slider(es ? "Pérdida media" : "Avg loss (R)", avgLossR, 0.25, 3, 0.05, setAvgLossR, " R", es ? "Pérdida media en R" : "Average loss in R")}
            {slider(es ? "Riesgo por operación" : "Risk per trade", riskPct, 0.25, 3.5, 0.05, setRiskPct, pctSep(lang), es ? "Riesgo por operación" : "Risk per trade")}
            {slider(es ? "Retiro mensual" : "Monthly withdrawal", monthlyWithdrawal, 0, 5000, 100, setMonthlyWithdrawal, " $", es ? "Retiro mensual de beneficios" : "Monthly profit withdrawal")}
            {slider(es ? "Semilla" : "Seed", seed, 1, 50, 1, setSeed, "", es ? "Semilla de simulación determinista" : "Deterministic simulation seed")}
          </div>

          <button
            type="button"
            onClick={() => setSeed((s) => s + 1)}
            className="mt-5 -ml-1 inline-flex items-center gap-2 min-h-[44px] px-1 text-[14px] font-medium text-primary transition-colors duration-150 hover:text-[rgb(var(--accent-base))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]"
            aria-label={es ? "Volver a simular con otra semilla aleatoria" : "Re-simulate with a different random seed"}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2.5 8a5.5 5.5 0 019.4-3.9M13.5 8a5.5 5.5 0 01-9.4 3.9M13 2.5v3h-3M3 13.5v-3h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {es ? "Otra tirada" : "Re-roll"}
          </button>
        </div>

        {/* Right: results card */}
        <div
          className="tj-paper tj-paper-glow relative"
          style={{ padding: 24, borderRadius: 3, border: "1px solid transparent" }}
        >
          {/* Expectancy + runs headline */}
          <div className="mb-5 flex items-baseline justify-between flex-wrap gap-2">
            <div>
              <div className="tnum" style={{ fontSize: 12, color: "var(--ink-3)" }}>
                {es ? "Expectancy" : "Expectancy"}
              </div>
              <div className="flex items-baseline gap-3 mt-1">
                <span
                  className="tnum"
                  style={{ fontSize: 26, fontWeight: 600, color: c.expectancyR >= 0 ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))" }}
                >
                  {fmtR(c.expectancyR, lang, 3)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="tnum" style={{ fontSize: 12, color: "var(--ink-3)" }}>
                {es ? "Simulación" : "Simulation"}
              </div>
              <div className="tnum" style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>{es ? `${SIM_RUNS} caminos · semilla ${seed}` : `${SIM_RUNS} paths · seed ${seed}`}</div>
            </div>
          </div>

          {/* Fan chart SVG */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <span className="tnum" style={{ fontSize: 12, color: "var(--ink-3)" }}>
                {es ? "Abanico de caminos" : "Path fan"} · {trades} {es ? "ops" : "trades"}
              </span>
              <div className="flex items-center gap-3 tnum" style={{ fontSize: 12, color: "var(--ink-3)" }}>
                <span className="inline-flex items-center gap-1"><span aria-hidden className="inline-block w-2.5 h-1.5 rounded-[1px]" style={{ background: "rgb(var(--accent-base) / 0.12)" }} /> P5–P95</span>
                <span className="inline-flex items-center gap-1"><span aria-hidden className="inline-block w-2.5 h-1.5 rounded-[1px]" style={{ background: "rgb(var(--accent-base) / 0.28)" }} /> P25–P75</span>
                <span className="inline-flex items-center gap-1"><span aria-hidden className="inline-block w-2.5 h-[2px]" style={{ background: "rgb(var(--accent-base))" }} /> {es ? "Media" : "Mean"}</span>
                <span className="inline-flex items-center gap-1"><span aria-hidden className="inline-block w-2.5 h-[1.5px] border-t border-dashed" style={{ borderColor: "var(--ink-2)" }} /> P50</span>
              </div>
            </div>
            <div ref={cajaGraficoRef}>
            <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} className="block max-w-full" aria-label={es ? "Abanico de caminos simulados" : "Fan of simulated paths"} role="img">
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
              {marcasY.map((v) => (
                <g key={v}>
                  <line x1={padL} x2={svgW - padR} y1={yDe(v)} y2={yDe(v)} stroke="rgb(var(--divider) / 0.08)" strokeWidth="1" />
                  <text
                    x={svgW}
                    y={yDe(v)}
                    dy="0.35em"
                    textAnchor="end"
                    style={{ fontSize: 11, fontFamily: "var(--font-mono)", fill: "var(--ink-3)" }}
                  >
                    {fmtUsdCorto(v)}
                  </text>
                </g>
              ))}
              {/* Capital inicial: la referencia que separa ganar de perder */}
              <line
                x1={padL}
                y1={yDe(startBalance)}
                x2={svgW - padR}
                y2={yDe(startBalance)}
                stroke="rgb(var(--divider) / 0.35)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <path d={outerBandPath} fill="url(#rs-outer-band)" />
              <path d={innerBandPath} fill="url(#rs-inner-band)" />
              <path d={toPath("mean")} fill="none" stroke="rgb(var(--accent-base))" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              <path d={toPath("p50")} fill="none" stroke="var(--ink-2)" strokeWidth="1.5" strokeDasharray="4 3" strokeLinejoin="round" strokeLinecap="round" />
              {[0, Math.round(trades / 2), trades].map((t, i) => (
                <text
                  key={i}
                  x={xDe((t / Math.max(1, trades)) * (N - 1))}
                  y={svgH - 6}
                  textAnchor={i === 0 ? "start" : i === 2 ? "end" : "middle"}
                  style={{ fontSize: 11, fontFamily: "var(--font-mono)", fill: "var(--ink-3)" }}
                >
                  {i === 2 ? `${t} ${es ? "ops" : "trades"}` : t}
                </text>
              ))}
            </svg>
            </div>
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
          {/* El rojo dice «por debajo del capital inicial», no «el peor
              percentil»: con una ventaja sana el P5 también gana, y
              pintarlo de pérdida contradecía la cifra que lleva debajo. */}
          <div className="tj-matriz mb-4 grid-cols-5 border-b border-[var(--ficha-division)] text-center tnum">
            {[
              { k: "P5", n: es ? "Cola 5 %" : "Bottom 5%", v: c.finalP5, col: "var(--ink-2)", ref: false },
              { k: "P25", n: "Q1", v: c.finalP25, col: "var(--ink-2)", ref: false },
              { k: "P50", n: es ? "Mediana" : "Median", v: c.finalP50, col: "rgb(var(--accent-base))", ref: true },
              { k: "P75", n: "Q3", v: c.finalP75, col: "var(--ink-2)", ref: false },
              { k: "P95", n: es ? "Cima 5 %" : "Top 5%", v: c.finalP95, col: "var(--ink-2)", ref: false },
            ].map((p) => ({ ...p, col: p.v < startBalance ? "rgb(var(--pnl-neg))" : p.col })).map((p) => (
              <div
                key={p.k}
                title={fmtUsd(p.v)}
                className="caja-cifra relative min-w-0 px-1 py-2.5"
              >
                {p.ref && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-[2px]"
                    style={{ background: "rgb(var(--accent-base))" }}
                  />
                )}
                <span
                  className="tnum block text-[11px] font-semibold tracking-[0.08em]"
                  style={{ color: p.ref ? "rgb(var(--accent-base))" : "var(--ink-3)" }}
                >
                  {p.k}
                </span>
                <span className="mt-0.5 block text-[11px] leading-[1.2] text-tertiary">{p.n}</span>
                <span
                  className="tnum cifra-sm mt-1.5 block whitespace-nowrap font-semibold"
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
          <div className="tj-matriz mb-4 grid-cols-2 border-b border-[var(--ficha-division)] text-center tnum sm:grid-cols-4">
            {[
              {
                t: es ? `Ruina (−${UMBRAL_RUINA_PCT}\u00a0%)` : `Ruin (−${UMBRAL_RUINA_PCT}%)`,
                sub: es ? "en la simulación" : "in the simulation",
                v: fmtPct(c.probRuin, 1),
                col: c.probRuin > 5 ? "rgb(var(--pnl-neg))" : "var(--ink)",
              },
              {
                t: es ? `Ruina (−${UMBRAL_RUINA_PCT}\u00a0%)` : `Ruin (−${UMBRAL_RUINA_PCT}%)`,
                sub: es ? "por fórmula" : "by formula",
                v: fmtPct(c.analyticalRuinProb, 1),
                col: c.analyticalRuinProb > 5 ? "rgb(var(--pnl-neg))" : "var(--ink)",
              },
              {
                t: es ? "Racha perdedora" : "Losing streak",
                sub: es ? `teórica (simulada: ${c.medianMaxLossStreak})` : `theoretical (simulated: ${c.medianMaxLossStreak})`,
                v: `~${c.theoreticalMaxLossStreak}`,
                col: "var(--ink)",
              },
              {
                t: es ? "Peor racha" : "Worst streak",
                sub: es ? "en el 5\u00a0% de caminos peores" : "in the worst 5% of paths",
                v: `${c.p95MaxLossStreak} ${es ? "ops" : "trades"}`,
                col: "rgb(var(--pnl-neg))",
              },
            ].map((m) => (
              <div
                key={m.t + m.sub}
                className="caja-cifra grid min-w-0 grid-rows-[auto_auto_1fr] px-2 py-3"
              >
                <span
                  className="tnum text-[12px] leading-[1.25]"
                  style={{ color: "var(--ink-3)" }}
                >
                  {m.t}
                </span>
                <span className="mt-0.5 text-[11px] leading-[1.25] text-tertiary [overflow-wrap:anywhere]">
                  {m.sub}
                </span>
                <span
                  className="tnum cifra-sm mt-1.5 self-end whitespace-nowrap font-semibold"
                  style={{ color: m.col }}
                >
                  {m.v}
                </span>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div
            className="border-t border-[var(--line)] pt-3"
          >
            <p className="medida m-0 text-[12px] leading-[1.55]" style={{ color: "var(--ink-3)" }}>
              {es
                ? `${SIM_RUNS} caminos con la semilla ` + seed + ": cada operación gana con un " + fmtNum(winRate, 0) + "\u00a0% de probabilidad, con ganancia y pérdida fijas en R y riesgo compuesto. Ruina es perder en algún momento el " + UMBRAL_RUINA_PCT + "\u00a0% del balance inicial, por pérdidas o por retiros. El mercado real tiene rachas más extremas, así que tu drawdown puede ser peor que el de estos caminos. No es consejo financiero."
                : `${SIM_RUNS} paths with seed ` + seed + ": each trade wins with " + fmtNum(winRate, 0) + "% probability, with fixed R wins and losses and compounding risk. Ruin means losing " + UMBRAL_RUINA_PCT + "% of the starting balance at any point, through losses or withdrawals. Real markets have more extreme streaks, so your drawdown can be worse than these paths. Not financial advice."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
