"use client";

import { useMemo, useRef, useState, type CSSProperties } from "react";
import { useLang } from "@/lib/i18n";
import { fmtInt, fmtNum, fmtPct, fmtR, pctSep } from "@/lib/trading/format";
import { ResultadoAnunciado } from "@/components/tj/ResultadoAnunciado";
import {
  crecimientoPorOperacion,
  gananciaParaRecuperar,
  operacionesParaRecuperar,
} from "@/lib/trading/recuperacion";

/**
 * Recuperación de drawdown: lo que hay que ganar para volver al máximo y
 * cuántas operaciones tarda el camino típico con tu forma de operar.
 *
 * La tabla de caídas es fija a propósito: la asimetría se entiende en filas
 * de un vistazo, y la barra es lineal para que se vea crecer como crece.
 */
const CAIDAS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.75, 0.9];
const TECHO = CAIDAS[CAIDAS.length - 1] / (1 - CAIDAS[CAIDAS.length - 1]);

function Deslizador({
  etiqueta,
  texto,
  valor,
  min,
  max,
  paso,
  onValor,
}: {
  etiqueta: string;
  texto: string;
  valor: number;
  min: number;
  max: number;
  paso: number;
  onValor: (n: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="text-[12px] text-tertiary">{etiqueta}</span>
        <span className="tnum text-[15px] font-semibold text-primary">{texto}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={paso}
        value={valor}
        onChange={(e) => onValor(Number(e.target.value))}
        aria-label={etiqueta}
        aria-valuetext={texto}
        className="tj-range w-full"
        style={{ height: 44, "--pct": `${((valor - min) / (max - min)) * 100}%` } as CSSProperties}
      />
    </div>
  );
}

export function DrawdownRecovery() {
  const { lang } = useLang();
  const es = lang === "es";
  const pct = (v: number, dec = 0) => `${fmtNum(v, lang, dec)}${pctSep(lang)}`;

  const [caida, setCaida] = useState(20);
  const [riesgo, setRiesgo] = useState(1);
  const [acierto, setAcierto] = useState(45);
  const [payoff, setPayoff] = useState(2);
  const [copiado, setCopiado] = useState(false);
  const reloj = useRef<ReturnType<typeof setTimeout> | null>(null);

  const c = useMemo(() => {
    const d = caida / 100;
    const r = riesgo / 100;
    const p = acierto / 100;
    const g = crecimientoPorOperacion(r, p, payoff) ?? 0;
    return {
      ganancia: gananciaParaRecuperar(d) ?? 0,
      operaciones: operacionesParaRecuperar(d, r, p, payoff),
      crecimiento: Math.expm1(g),
      esperanza: p * payoff - (1 - p),
      filas: CAIDAS.map((x) => ({
        caida: x,
        ganancia: gananciaParaRecuperar(x) ?? 0,
        operaciones: operacionesParaRecuperar(x, r, p, payoff),
      })),
      propia: CAIDAS.reduce((a, b) => (Math.abs(b - d) < Math.abs(a - d) ? b : a)),
    };
  }, [caida, riesgo, acierto, payoff]);

  const conSigno = (v: number, dec: number) =>
    `${v > 0 ? "+" : v < 0 ? "−" : ""}${fmtPct(Math.abs(v), lang, dec)}`;
  const noVuelve = c.operaciones === null;

  const diagnostico = noVuelve
    ? c.esperanza <= 0
      ? es
        ? "Sin expectancy positiva no hay vuelta: el camino típico sigue cayendo, operación tras operación."
        : "Without positive expectancy there is no way back: the typical path keeps falling, trade after trade."
      : es
        ? "La expectancy es positiva, pero con este riesgo la volatilidad se la come y el camino típico sigue cayendo. Con menos riesgo por operación, sí vuelve."
        : "Expectancy is positive, but at this risk volatility eats it and the typical path keeps falling. With less risk per trade, it does come back."
    : es
      ? `Arriesgando un ${pct(riesgo, 2)} por operación, el camino típico tarda ${fmtInt(c.operaciones!, lang)} operaciones en devolver la cuenta al máximo. Es un ritmo, no un plazo: con una mala racha tarda bastante más.`
      : `Risking ${pct(riesgo, 2)} per trade, the typical path takes ${fmtInt(c.operaciones!, lang)} trades to bring the account back to its peak. It is a pace, not a deadline: a bad run makes it much longer.`;

  const copiar = () => {
    const texto = es
      ? `Recuperación de drawdown (CountPips)\n• Caída: ${pct(caida)}\n• Hace falta ganar: +${fmtPct(c.ganancia, lang)}\n• Riesgo por operación: ${pct(riesgo, 2)} · acierto ${pct(acierto)} · payoff ${fmtNum(payoff, lang, 1)}\n• Expectancy: ${fmtR(c.esperanza, lang)} por operación\n• Operaciones para volver, camino típico: ${noVuelve ? "no vuelve" : fmtInt(c.operaciones!, lang)}`
      : `Drawdown recovery (CountPips)\n• Drawdown: ${pct(caida)}\n• Gain needed: +${fmtPct(c.ganancia, lang)}\n• Risk per trade: ${pct(riesgo, 2)} · win rate ${pct(acierto)} · payoff ${fmtNum(payoff, lang, 1)}\n• Expectancy: ${fmtR(c.esperanza, lang)} per trade\n• Trades to recover, typical path: ${noVuelve ? "never" : fmtInt(c.operaciones!, lang)}`;
    navigator.clipboard?.writeText(texto).then(() => {
      setCopiado(true);
      if (reloj.current) clearTimeout(reloj.current);
      reloj.current = setTimeout(() => setCopiado(false), 2200);
    });
  };

  return (
    <section className="section-tight">
      <ResultadoAnunciado
        texto={
          es
            ? `Para recuperar una caída del ${pct(caida)} hace falta ganar un ${fmtPct(c.ganancia, lang)}; ${noVuelve ? "con estos datos, el camino típico no vuelve" : `unas ${fmtInt(c.operaciones!, lang)} operaciones por el camino típico`}.`
            : `Recovering a ${pct(caida)} drawdown takes a ${fmtPct(c.ganancia, lang)} gain; ${noVuelve ? "with these inputs, the typical path never gets back" : `about ${fmtInt(c.operaciones!, lang)} trades on the typical path`}.`
        }
      />
      <div className="tj-container">
        <div className="mb-5 inline-flex items-center gap-3">
          <span className="eyebrow" data-titular-herramienta>
            {es ? "Recuperación" : "Recovery"}
          </span>
        </div>

        {/* En móvil, el resultado va entre los controles y la tabla: lejos
            de los controles, quien mueve un deslizador no ve qué cambia. */}
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:grid-rows-[auto_1fr]">
          <div className="lg:col-start-1 lg:row-start-1">
            <h2 data-titular-herramienta className="t-h2 m-0 max-w-[24ch] text-primary">
              {es ? (
                <>
                  Cuesta más subir <span className="text-gradient">que caer.</span>
                </>
              ) : (
                <>
                  The climb back <span className="text-gradient">is steeper.</span>
                </>
              )}
            </h2>
            <p className="medida mt-3 text-sm leading-relaxed text-secondary md:text-base">
              {es
                ? "Una caída del 50\u00a0% no se recupera con un 50\u00a0%: hace falta un 100\u00a0%. Mueve tu caída y tu forma de operar."
                : "A 50% drawdown is not undone by a 50% gain: it takes 100%. Set your drawdown and how you trade."}
            </p>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Deslizador
                etiqueta={es ? "Caída desde el máximo" : "Drawdown from the peak"}
                texto={pct(caida)}
                valor={caida}
                min={1}
                max={90}
                paso={1}
                onValor={setCaida}
              />
              <Deslizador
                etiqueta={es ? "Riesgo por operación" : "Risk per trade"}
                texto={pct(riesgo, 2)}
                valor={riesgo}
                min={0.25}
                max={5}
                paso={0.25}
                onValor={setRiesgo}
              />
              <Deslizador
                etiqueta={es ? "Porcentaje de aciertos" : "Win rate"}
                texto={pct(acierto)}
                valor={acierto}
                min={20}
                max={80}
                paso={1}
                onValor={setAcierto}
              />
              <Deslizador
                etiqueta={es ? "Payoff (ganancia media / pérdida media)" : "Payoff (average win / average loss)"}
                texto={fmtNum(payoff, lang, 1)}
                valor={payoff}
                min={0.5}
                max={5}
                paso={0.1}
                onValor={setPayoff}
              />
            </div>
          </div>

          <div className="tj-ficha lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <p className="tj-ficha-barra">
              <span>{es ? "Para volver al máximo" : "Back to the peak"}</span>
              <span>
                {es ? "Caída" : "Drawdown"} {pct(caida)}
              </span>
            </p>
            <div className="tj-ficha-cuerpo">
              <span className="block text-[12px] text-tertiary">{es ? "Hace falta ganar" : "Gain needed"}</span>
              <div className="tnum mt-1 text-4xl font-semibold leading-none tracking-tight text-primary">
                +{fmtPct(c.ganancia, lang)}
              </div>
              <p className="m-0 mt-2 text-[13px] text-secondary">
                {es
                  ? "Sobre lo que queda en la cuenta, no sobre lo que había."
                  : "On what is left in the account, not on what was there."}
              </p>

              <dl className="tj-matriz mt-6 grid-cols-3">
                <div className="py-3 pl-0 pr-3 sm:pr-4">
                  <dt className="text-[12px] text-tertiary">{es ? "Operaciones" : "Trades"}</dt>
                  <dd
                    className={`tnum m-0 mt-1 text-lg font-semibold ${noVuelve ? "text-[rgb(var(--pnl-neg))]" : "text-primary"}`}
                  >
                    {noVuelve ? (es ? "No vuelve" : "Never") : fmtInt(c.operaciones!, lang)}
                  </dd>
                  <dd className="m-0 text-[11px] text-tertiary">{es ? "camino típico" : "typical path"}</dd>
                </div>
                <div className="px-3 py-3 sm:px-4">
                  <dt className="text-[12px] text-tertiary">{es ? "Crecimiento" : "Growth"}</dt>
                  <dd
                    className={`tnum m-0 mt-1 text-lg font-semibold ${c.crecimiento < 0 ? "text-[rgb(var(--pnl-neg))]" : "text-primary"}`}
                  >
                    {conSigno(c.crecimiento, 2)}
                  </dd>
                  <dd className="m-0 text-[11px] text-tertiary">{es ? "típico por operación" : "typical per trade"}</dd>
                </div>
                <div className="px-3 py-3 sm:px-4">
                  <dt className="text-[12px] text-tertiary">Expectancy</dt>
                  <dd
                    className={`tnum m-0 mt-1 text-lg font-semibold ${c.esperanza < 0 ? "text-[rgb(var(--pnl-neg))]" : c.esperanza > 0 ? "text-[rgb(var(--pnl-pos))]" : "text-primary"}`}
                  >
                    {fmtR(c.esperanza, lang)}
                  </dd>
                  <dd className="m-0 text-[11px] text-tertiary">{es ? "por operación" : "per trade"}</dd>
                </div>
              </dl>

              <p className="m-0 mt-5 border-t border-[var(--ficha-division)] pt-4 text-[13px] leading-relaxed text-secondary">
                {diagnostico}
              </p>
            </div>
            <div className="tj-ficha-barra tj-ficha-barra--pie">
              <button
                type="button"
                onClick={copiar}
                className="toque-comodo inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-primary outline-none transition-colors hover:text-[rgb(var(--accent-base))] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]"
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                  <path
                    d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />
                </svg>
                {copiado ? (es ? "Resumen copiado" : "Summary copied") : es ? "Copiar resumen" : "Copy summary"}
              </button>
              <span className="text-tertiary">{es ? "Privado en tu navegador" : "Private in your browser"}</span>
            </div>
          </div>

          <div className="lg:col-start-1 lg:row-start-2">
              <p className="eyebrow m-0">{es ? "La asimetría de las caídas" : "The asymmetry of drawdowns"}</p>
              <table className="mt-3 w-full tnum text-[13px]">
                <caption className="sr-only">
                  {es
                    ? "Ganancia necesaria y operaciones del camino típico para cada caída, con tu riesgo, tu acierto y tu payoff"
                    : "Gain needed and typical-path trades for each drawdown, with your risk, win rate and payoff"}
                </caption>
                <thead>
                  <tr className="text-[12px] text-tertiary">
                    <th scope="col" className="tj-matriz-cab py-2.5 pr-3 text-left font-medium">
                      {es ? "Caída" : "Drawdown"}
                    </th>
                    <th scope="col" className="tj-matriz-cab px-3 py-2.5 text-left font-medium">
                      {es ? "Hace falta ganar" : "Gain needed"}
                    </th>
                    <th scope="col" className="tj-matriz-cab py-2.5 pl-3 text-right font-medium">
                      {es ? "Operaciones" : "Trades"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {c.filas.map((f) => {
                    const propia = f.caida === c.propia;
                    return (
                      <tr
                        key={f.caida}
                        className={`border-t border-[rgb(var(--divider)/0.09)] ${propia ? "tj-columna-propia text-primary" : "text-secondary"}`}
                      >
                        <th scope="row" className={`py-2 pr-3 text-left ${propia ? "font-semibold" : "font-normal"}`}>
                          {fmtPct(f.caida, lang, 0)}
                        </th>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-3">
                            <span aria-hidden className="relative h-[3px] flex-1 overflow-hidden rounded-[1px] bg-[var(--ficha-division)]">
                              <span
                                className="absolute inset-y-0 left-0"
                                style={{
                                  width: `${Math.max(1, (f.ganancia / TECHO) * 100)}%`,
                                  background: propia ? "var(--ink)" : "var(--ink-3)",
                                }}
                              />
                            </span>
                            <span className={`w-[4.5rem] text-right ${propia ? "font-semibold" : ""}`}>
                              +{fmtPct(f.ganancia, lang, 0)}
                            </span>
                          </div>
                        </td>
                        <td className={`py-2 pl-3 text-right ${propia ? "font-semibold" : ""}`}>
                          {f.operaciones === null ? "—" : fmtInt(f.operaciones, lang)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
          </div>
        </div>
      </div>
    </section>
  );
}
