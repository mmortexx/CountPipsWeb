"use client";

import { useCallback, useId, useState } from "react";
import { useLang } from "@/lib/i18n";

/**
 * HeroMicroCalcs — las dos micro-calculadoras del hero.
 *
 * Nacieron como cajas ESTÁTICAS: dos recuadros que enseñaban «+0,65 R» y
 * «−20 % → +25 %» fijos, con un rótulo que las llamaba «micro-simulador
 * interactivo». En un sitio cuyo producto es el rigor cuantitativo, una
 * calculadora que no calcula es lo mismo que una cifra inventada: se lee
 * bien durante medio segundo y socava lo demás. Aquí se convierten en lo
 * que decían ser — dos controles reales, 100 % locales, que responden al
 * instante y usan el mismo idioma visual que las herramientas de
 * /herramientas: `.tj-range` de 44 px, cifras `tnum`, tokens de PnL para
 * el veredicto y fórmula visible al pie, como la placa de un instrumento.
 *
 * Matemática (idéntica a la de `src/lib/trading/data.ts` para la
 * esperanza en R):
 *   EV  = WR · W − (1 − WR) · L     con L = 1 R (pérdida nominal)
 *   Rec = DD / (1 − DD)             ganancia necesaria para volver al pico
 *
 * Determinismo SSG: los valores iniciales son constantes fijas; nada de
 * fechas ni azar, así que el HTML prerenderizado y el primer pintado del
 * cliente coinciden byte a byte.
 */
export function HeroMicroCalcs() {
  const { lang } = useLang();
  const es = lang === "es";

  /* Estado por defecto = los números que ya enseñaban las cajas
     estáticas (55 % · 1:2 · −20 %): quien no toque nada sigue viendo
     exactamente lo que veía, pero ahora es verdad. */
  const [wr, setWr] = useState(55);
  const [payoff, setPayoff] = useState(2);
  const [dd, setDd] = useState(20);

  const fmt = useCallback(
    (n: number, dec = 2) =>
      new Intl.NumberFormat(es ? "es-ES" : "en-US", {
        minimumFractionDigits: dec,
        maximumFractionDigits: dec,
      })
        .format(n)
        /* El menos tipográfico (U+2212), como el resto de cifras del
           sitio: «−1,5 R», no «-1,5 R». Intl emite guion-menos ASCII. */
        .replace("-", "\u2212"),
    [es]
  );

  const ev = (wr / 100) * payoff - (1 - wr / 100);
  const ev100 = ev * 100;
  const rec = dd / 100 / (1 - dd / 100);
  const evPos = ev > 0;

  const wrId = useId();
  const payId = useId();
  const ddId = useId();

  const slider = (
    id: string,
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    onChange: (n: number) => void,
    display: string
  ) => (
    <div>
      <div className="flex items-baseline justify-between">
        <label
          htmlFor={id}
          className="tnum uppercase"
          style={{ fontSize: 10.5, letterSpacing: "0.14em", color: "var(--ink-3)" }}
        >
          {label}
        </label>
        <span className="tnum" style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
          {display}
        </span>
      </div>
      <input
        id={id}
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
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={display}
      />
    </div>
  );

  const card =
    "rounded-[2px] border border-[rgb(var(--divider)/0.14)] bg-[color-mix(in_oklab,var(--surface-2)_45%,transparent)] p-4 backdrop-blur-md sm:p-5";

  return (
    <div data-seq className="mt-8 grid grid-cols-1 gap-4 text-left md:grid-cols-2">
      {/* ── Esperanza matemática ─────────────────────────────────── */}
      <div className={card}>
        <div className="flex items-baseline justify-between gap-3">
          <span
            className="tnum uppercase"
            style={{ fontSize: 11, letterSpacing: "0.14em", color: "var(--ink-2)" }}
          >
            {es ? "Esperanza matemática" : "Expectancy"}
          </span>
          {/* `aria-live`: el valor deriva de los controles; sin región
              viva, quien usa lector de pantalla mueve el deslizador y
              sólo oye el porcentaje, nunca el veredicto que importa. */}
          <span
            aria-live="polite"
            className="tnum"
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: evPos ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))",
            }}
          >
            {evPos ? "+" : ""}
            {fmt(ev, 2)} R / {es ? "op" : "trade"}
          </span>
        </div>
        <div
          aria-hidden
          className="my-3 h-px w-full"
          style={{ background: "rgb(var(--divider) / 0.12)" }}
        />
        <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
          {slider(
            wrId,
            es ? "Tasa de acierto" : "Hit rate",
            wr,
            30,
            80,
            1,
            setWr,
            `${fmt(wr, 0)} %`
          )}
          {slider(
            payId,
            es ? "Pago (ganancia R)" : "Payoff (win in R)",
            payoff,
            1,
            3,
            0.25,
            setPayoff,
            `${fmt(payoff, 2)} R`
          )}
        </div>
        <p
          className="m-0 mt-2"
          style={{ fontSize: 11, lineHeight: 1.5, color: "var(--ink-3)" }}
        >
          <span className="tnum">EV = WR · W − (1 − WR) · L</span>
          {" · "}
          {es ? "100 operaciones" : "100 trades"}:{" "}
          <span
            className="tnum"
            style={{ fontWeight: 600, color: evPos ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))" }}
          >
            {ev100 >= 0 ? "+" : ""}
            {fmt(ev100, 1)} R
          </span>
        </p>
      </div>

      {/* ── Asimetría de drawdown ────────────────────────────────── */}
      <div className={card}>
        <div className="flex items-baseline justify-between gap-3">
          <span
            className="tnum uppercase"
            style={{ fontSize: 11, letterSpacing: "0.14em", color: "var(--ink-2)" }}
          >
            {es ? "Asimetría de drawdown" : "Drawdown asymmetry"}
          </span>
          <span
            aria-live="polite"
            className="tnum"
            style={{ fontSize: 14, fontWeight: 700, color: "rgb(var(--pnl-neg))" }}
          >
            −{fmt(dd, 0)} % → +{fmt(rec * 100, 1)} %
          </span>
        </div>
        <div
          aria-hidden
          className="my-3 h-px w-full"
          style={{ background: "rgb(var(--divider) / 0.12)" }}
        />
        {slider(
          ddId,
          es ? "Pérdida desde el pico" : "Loss from peak",
          dd,
          5,
          60,
          1,
          setDd,
          `−${fmt(dd, 0)} %`
        )}
        <p
          className="m-0 mt-2"
          style={{ fontSize: 11, lineHeight: 1.5, color: "var(--ink-3)" }}
        >
          <span className="tnum">R = DD / (1 − DD)</span>
          {" · "}
          {es ? (
            <>
              la recuperación crece más rápido que la pérdida: −50 % exige{" "}
              <span className="tnum" style={{ fontWeight: 600, color: "rgb(var(--pnl-neg))" }}>
                +100 %
              </span>{" "}
              para volver al pico.
            </>
          ) : (
            <>
              recovery outgrows loss: −50 % demands{" "}
              <span className="tnum" style={{ fontWeight: 600, color: "rgb(var(--pnl-neg))" }}>
                +100 %
              </span>{" "}
              to reclaim the peak.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
