"use client";

import { useState, useMemo } from "react";
import { useLang } from "@/lib/i18n";
import { ResultadoAnunciado } from "@/components/tj/ResultadoAnunciado";
import { Deslizador } from "@/components/tj/Deslizador";
import { BotonCopiar } from "@/components/tj/BotonCopiar";
import { componerInforme } from "@/lib/informe";
import { pctSep, fmtR, fmtNum as fmtNumBase, fmtOperaciones, fmtPct } from "@/lib/trading/format";
import { Z_UNA_COLA, contrasteVentaja, normalCdf } from "@/lib/trading/estadistica";

export { normalCdf };

/**
 * EdgeSignificanceChecker — ¿tu edge es real o suerte?
 *
 * El trader introduce: número de operaciones (N), win rate observado,
 * ganancia/pérdida media en R. El componente calcula:
 *   · expectancy en R
 *   · el acierto de equilibrio, el que deja la expectancy a cero
 *   · z y p-valor de un contraste de una cola frente a ese equilibrio
 *     (`contrasteVentaja`): con 1 R : 1 R es tirar una moneda, con
 *     2 R : 1 R basta un 33 %
 *   · la muestra que detectaría ese acierto con una potencia del 80 %
 *
 * ── Por qué aquí ──────────────────────────────────────────────────────
 * Responde a la pregunta más frecuente de un trader novato: "tengo un
 * 60% de aciertos en 20 operaciones, ¿tengo un edge?". Ganando lo mismo
 * que pierde, la respuesta honesta es NO — 20 operaciones no bastan para
 * distinguir un 60% real de una moneda. Este tool lo muestra con
 * números, no con opiniones.
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
    const n = trades;
    const expectancyR = wr * avgWinR - (1 - wr) * avgLossR;
    const k = contrasteVentaja(n, winRate, avgWinR, avgLossR);

    // Intervalo de confianza Wilson Score (al 95% con z=1.96)
    const z95 = 1.96;
    const zSq = z95 * z95;
    const denom = 1 + zSq / n;
    const center = (wr + zSq / (2 * n)) / denom;
    const margin = (z95 * Math.sqrt((wr * (1 - wr)) / n + zSq / (4 * n * n))) / denom;
    const wilsonLower = Math.max(0, center - margin) * 100;
    const wilsonUpper = Math.min(1, center + margin) * 100;

    const minSample95 = k.muestraPara(95);

    // Detector de Sobreajuste (Overfitting): Ratio de trades por parámetro (mínimo institucional 20:1)
    const tradesPerParam = n / Math.max(1, parametersCount);
    const overfittingRisk = tradesPerParam < 20;

    return {
      ...k,
      expectancyR,
      significant: k.veredicto === "moderada" || k.veredicto === "solida",
      wilsonLower,
      wilsonUpper,
      minSample90: k.muestraPara(90),
      minSample95,
      minSample99: k.muestraPara(99),
      sampleAdequate: minSample95 !== null && n >= minSample95,
      tradesPerParam,
      overfittingRisk,
    };
  }, [trades, winRate, avgWinR, avgLossR, parametersCount]);

  /* El helper de format.ts, no un `Intl.NumberFormat` propio: el propio
     escribía «1234,5» sin millares en español, distinto del resto de la web. */
  const fmtNum = (n: number, dec = 2) => fmtNumBase(n, lang, dec);

  const textoDeslizador = (value: number, step: number, suffix: string) =>
    `${fmtNum(value, Number.isInteger(step) ? 0 : 2)}${suffix}`;

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
        <span className="tj-deslizador-valor">{textoDeslizador(value, step, suffix)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="tj-range w-full"
        /* `--f` pinta el tramo recorrido dentro de la pista del control. */
        style={
          {
            accentColor: "rgb(var(--accent-base))",
            height: 44,
            "--f": ((value - min) / (max - min)),
          } as React.CSSProperties
        }
        aria-label={ariaLabel}
        aria-valuetext={textoDeslizador(value, step, suffix)}
      />
    </div>
  );

  const aciertoTxt = `${fmtNum(winRate, 0)}${PCT}`;
  const equilibrioPct = c.equilibrio * 100;
  const equilibrioTxt = fmtPct(c.equilibrio, lang, Math.abs(equilibrioPct - Math.round(equilibrioPct)) < 0.05 ? 0 : 1);
  const ops = fmtOperaciones(trades, lang);
  const pTxt = (dec: number) => (c.pValor < 0.0001 ? `p < ${fmtNum(0.0001, 4)}` : `p = ${fmtNum(c.pValor, dec)}`);

  const VEREDICTOS = {
    "sin-ventaja": {
      label: es ? "Sin ventaja" : "No edge",
      color: "rgb(var(--pnl-neg))",
      text: es
        ? `Con ${fmtNum(avgWinR, 2)}\u00a0R de ganancia media y ${fmtNum(avgLossR, 2)}\u00a0R de pérdida media, el acierto de equilibrio es un ${equilibrioTxt}: por debajo se pierde dinero. Tu ${aciertoTxt} deja ${fmtR(c.expectancyR, lang, 3)} por operación, así que no hay ventaja que contrastar.`
        : `With an average win of ${fmtNum(avgWinR, 2)}\u00a0R and an average loss of ${fmtNum(avgLossR, 2)}\u00a0R, the breakeven win rate is ${equilibrioTxt}: below it you lose money. Your ${aciertoTxt} leaves ${fmtR(c.expectancyR, lang, 3)} per trade, so there is no edge to test.`,
    },
    "muestra-insuficiente": {
      label: es ? "Muestra insuficiente" : "Insufficient sample",
      color: "var(--ink-2)",
      text: es
        ? `Con ${ops} y el equilibrio en un ${equilibrioTxt} no se puede hacer un test estadístico fiable. Necesitas al menos ${fmtOperaciones(c.minimoValido, lang)} para que la aproximación sea válida.`
        : `With ${ops} and breakeven at ${equilibrioTxt}, a reliable statistical test isn’t possible. You need at least ${fmtOperaciones(c.minimoValido, lang)} for the approximation to hold.`,
    },
    "no-significativo": {
      label: es ? "No significativo" : "Not significant",
      color: "rgb(var(--pnl-neg))",
      text: es
        ? `Tu expectancy es positiva (${fmtR(c.expectancyR, lang, 3)}), pero un ${aciertoTxt} de aciertos en ${ops} no se distingue del ${equilibrioTxt} de equilibrio (${pTxt(3)}). Podría ser suerte. Sigue operando y midiendo.`
        : `Your expectancy is positive (${fmtR(c.expectancyR, lang, 3)}), but a ${aciertoTxt} win rate over ${ops} is not statistically distinct from the ${equilibrioTxt} breakeven (${pTxt(3)}). It could be luck. Keep trading and measuring.`,
    },
    solida: {
      label: es ? "Ventaja sólida" : "Strong edge",
      color: "rgb(var(--pnl-pos))",
      text: es
        ? `Un ${aciertoTxt} en ${ops}, con el equilibrio en un ${equilibrioTxt}, es muy poco probable por azar (${pTxt(4)}). Hay algo real aquí, pero valídalo fuera de muestra.`
        : `A ${aciertoTxt} over ${ops}, with breakeven at ${equilibrioTxt}, is very unlikely by chance (${pTxt(4)}). There’s something real here — but validate out-of-sample.`,
    },
    moderada: {
      label: es ? "Ventaja moderada" : "Moderate edge",
      color: "rgb(var(--accent-base))",
      text: es
        ? `Un ${aciertoTxt} en ${ops} supera el ${equilibrioTxt} de equilibrio de forma significativa (${pTxt(3)} < 0,05). Probablemente hay una ventaja, pero el margen es fino: acumula más operaciones para confirmarlo.`
        : `A ${aciertoTxt} over ${ops} beats the ${equilibrioTxt} breakeven significantly (${pTxt(3)} < 0.05). There’s likely an edge, but the margin is thin: accumulate more trades to confirm.`,
    },
  };
  const verdict = VEREDICTOS[c.veredicto];

  return (
    <section className="section-tight">
      {/* El veredicto, para quien no ve la pantalla. Se reutiliza el
          rótulo que ya compone la herramienta en vez de inventar otro
          vocabulario, y se acompaña de las dos cifras que lo sostienen:
          el resto del panel sigue disponible leyéndolo. */}
      <ResultadoAnunciado
        texto={
          es
            ? `${verdict.label}: ${pTxt(4)}, expectancy ${fmtR(c.expectancyR, lang, 3)} en ${ops}, equilibrio en un ${equilibrioTxt}.`
            : `${verdict.label}: ${pTxt(4)}, expectancy ${fmtR(c.expectancyR, lang, 3)} over ${ops}, breakeven at ${equilibrioTxt}.`
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
                ¿Tu ventaja es real o es suerte?
              </>
            ) : (
              <>
                Is your edge real or luck?
              </>
            )}
          </h2>
          <p className="t-entradilla mt-5 mb-7 text-secondary max-w-[34em]">
            {es
              ? `60${PCT} de aciertos en 20 operaciones, ganando lo mismo que pierdes, suena bien, pero estadísticamente es indistinguible de una moneda. Este test compara tu acierto con el que necesitas para no perder dinero y te dice si tu muestra basta para afirmar que tienes un edge.`
              : "60% win rate over 20 trades, winning as much as you lose, sounds good — but statistically it’s indistinguishable from a coin. This test compares your win rate with the one you need to break even and tells you if your sample is enough to claim you have an edge."}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {slider(es ? "Operaciones (N)" : "Trades (N)", trades, 5, 500, 5, setTrades, "", es ? "Número de operaciones" : "Number of trades")}
            {slider(es ? "Win rate" : "Win rate", winRate, 35, 75, 1, setWinRate, pctSep(lang), es ? "Porcentaje de aciertos" : "Win rate percentage")}
            {slider(es ? "Ganancia media" : "Avg win (R)", avgWinR, 0.5, 5, 0.1, setAvgWinR, " R", es ? "Ganancia media en R" : "Average win in R")}
            {slider(es ? "Pérdida media" : "Avg loss (R)", avgLossR, 0.25, 3, 0.05, setAvgLossR, " R", es ? "Pérdida media en R" : "Average loss in R")}
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
              {fmtOperaciones(trades, lang)} · {fmtNum(winRate, 0)}{PCT}
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
              <span className="whitespace-nowrap">{es ? "Campana de Gauss (H₀: sin ventaja)" : "Bell curve (H₀: no edge)"}</span>
              <span className="whitespace-nowrap">
                {`${es ? "Región crítica" : "Critical zone"}: z\u00a0≥\u00a0${fmtNum(Z_UNA_COLA[95], 3)}`}
              </span>
            </div>
            <GaussianBellCurve
              z={c.z}
              color={c.significant ? "rgb(var(--pnl-pos))" : c.veredicto === "sin-ventaja" ? "rgb(var(--pnl-neg))" : "rgb(var(--accent-base))"}
            />
          </div>

          {/* Stats grid */}
          <div className="tj-matriz grid-cols-2 mb-5">
            <Result label={es ? "Expectancy" : "Expectancy"} value={`${fmtR(c.expectancyR, lang, 3)}`} color={c.expectancyR >= 0 ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))"} />
            <Result label={es ? `p-valor (H₀: ${equilibrioTxt})` : `p-value (H₀: ${equilibrioTxt})`} value={c.pValor < 0.0001 ? `< ${fmtNum(0.0001, 4)}` : fmtNum(c.pValor, 4)} color={c.significant ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))"} />
            <Result label={es ? "Potencia (1 − β)" : "Statistical power (1 − β)"} value={`${fmtNum(c.potencia, 1)}${PCT}`} color={c.potencia >= 80 ? "rgb(var(--pnl-pos))" : "rgb(var(--accent-base))"} />
            <Result label={es ? `IC Wilson 95${PCT}` : "Wilson 95% CI"} value={`${fmtNum(c.wilsonLower, 1)}–${fmtNum(c.wilsonUpper, 1)}${PCT}`} color="var(--ink)" />
          </div>

          {/* Matriz de Muestra Mínima */}
          <div className="mb-5">
            <span className="block text-[12px] text-tertiary mb-2">
              {es ? `Muestra para distinguir tu ventaja del azar (potencia 80${PCT})` : "Sample to tell your edge from chance (80% power)"}
            </span>
            <div className="tj-matriz grid-cols-3 text-center text-xs tnum">
              {([90, 95, 99] as const).map((conf) => {
                const m = conf === 90 ? c.minSample90 : conf === 95 ? c.minSample95 : c.minSample99;
                const propia = conf === 95;
                return (
                  <div key={conf} className={`${propia ? "tj-columna-propia " : ""}py-2.5`}>
                    <span className={`block text-[12px] ${propia ? "text-primary font-semibold" : "text-tertiary"}`}>
                      {`${conf}${PCT} (z\u00a0=\u00a0${fmtNum(Z_UNA_COLA[conf], 3)})`}
                    </span>
                    <span className={`font-semibold ${m !== null && trades >= m ? "text-[rgb(var(--pnl-pos))]" : propia ? "text-[rgb(var(--accent-base))]" : "text-primary"}`}>
                      {m === null ? "—" : `${fmtNum(m, 0)} ops`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sample-size adequacy bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="tnum" style={{ fontSize: 12, color: "var(--ink-3)" }}>
                {es ? "Muestra frente a la necesaria" : "Sample vs. required"}
              </span>
              <span className="tnum" style={{ fontSize: 12, fontWeight: 600, color: c.sampleAdequate ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))" }}>
                {fmtNum(trades, 0)} / {c.minSample95 === null ? "—" : fmtNum(c.minSample95, 0)}
              </span>
            </div>
            <div className="relative h-[3px] rounded-[1px] overflow-hidden" style={{ background: "var(--ficha-division)" }}>
              <div
                className="absolute left-0 top-0 h-full"
                style={{
                  width: `${c.minSample95 === null ? 0 : Math.min(100, (trades / c.minSample95) * 100)}%`,
                  background: c.sampleAdequate ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))",
                  transition: "width 0.3s var(--ease-suave)",
                }}
              />
            </div>
            <p className="tnum m-0 mt-1.5 text-[12px]" style={{ color: "var(--ink-3)" }}>
              {c.minSample95 === null
                ? (es ? "Sin ventaja que detectar: con este acierto y este payoff, ninguna muestra la encontrará." : "No edge to detect: with this win rate and payoff, no sample size will find one.")
                : c.sampleAdequate
                  ? (es ? `Muestra suficiente: con ${ops}, un ${aciertoTxt} real se distingue del ${equilibrioTxt} de equilibrio al 95${PCT} de confianza en 8 de cada 10 muestras.` : `Sample sufficient: with ${ops}, a real ${aciertoTxt} is told apart from the ${equilibrioTxt} breakeven at 95% confidence in 8 samples out of 10.`)
                  : (es ? `Te faltan ${fmtOperaciones(c.minSample95 - trades, lang)} para distinguir un ${aciertoTxt} real del ${equilibrioTxt} de equilibrio al 95${PCT} de confianza.` : `You need ${fmtNum(c.minSample95 - trades, 0)} more ${c.minSample95 - trades === 1 ? "trade" : "trades"} to tell a real ${aciertoTxt} from the ${equilibrioTxt} breakeven at 95% confidence.`)}
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
                        `${es ? "Muestra" : "Sample"}: ${fmtOperaciones(trades, lang)}`,
                        `${es ? "Win rate observado" : "Observed win rate"}: ${aciertoTxt}`,
                        `${es ? "Ganancia y pérdida medias" : "Average win and loss"}: ${fmtNum(avgWinR, 2)}\u00a0R / ${fmtNum(avgLossR, 2)}\u00a0R`,
                        `${es ? "Win rate de equilibrio" : "Breakeven win rate"}: ${equilibrioTxt}`,
                        `Expectancy: ${fmtR(c.expectancyR, lang, 3)}`,
                        `${es ? "Parámetros del setup" : "Setup parameters"}: ${parametersCount} (${fmtNum(c.tradesPerParam, 1)} ${es ? "operaciones por parámetro" : "trades per parameter"})`,
                      ],
                    },
                    {
                      rotulo: es ? "Resultado" : "Result",
                      lineas: [
                        `${es ? "Veredicto" : "Verdict"}: ${verdict.label}`,
                        `z: ${fmtNum(c.z, 2)} · ${pTxt(4)}`,
                        `${es ? `IC Wilson 95${PCT}` : "Wilson 95% CI"}: ${fmtNum(c.wilsonLower, 1)}–${fmtNum(c.wilsonUpper, 1)}${PCT}`,
                        `${es ? `Muestra necesaria al 95${PCT}` : "Sample needed at 95%"}: ${c.minSample95 === null ? (es ? "sin ventaja que detectar" : "no edge to detect") : fmtOperaciones(c.minSample95, lang)}`,
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

function GaussianBellCurve({ z, color }: { z: number; color: string }) {
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
  const critRightX = padX + ((Z_UNA_COLA[95] - (-3.5)) / 7.0) * plotW;

  return (
    <div className="relative w-full h-[70px]">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
        {/* Una sola cola: solo cuenta superar el acierto de equilibrio. */}
        <rect x={critRightX} y={padY} width={W - padX - critRightX} height={plotH} fill="rgb(var(--pnl-pos))" fillOpacity="0.15" />

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
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
