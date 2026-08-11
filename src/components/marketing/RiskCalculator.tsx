"use client";

import { useState, useMemo, useCallback } from "react";
import { useLang } from "@/lib/i18n";

/**
 * RiskCalculator — calculadora de tamaño de posición REAL e interactiva.
 *
 * Antes era una demo de valores fijos (entry 100 / stop 95 / target 115).
 * Ahora el trader introduce SU operación: balance, riesgo %, entrada,
 * stop y objetivo. Se calcula en vivo: riesgo $, tamaño (unidades),
 * beneficio, R:R, valor de la posición y % del balance comprometido.
 *
 * ── Cómo se calcula ───────────────────────────────────────────────────
 *   riskPerShare   = |entry − stop|     (vale para largo y corto)
 *   rewardPerShare = |target − entry|
 *   rr             = rewardPerShare / riskPerShare
 *   riskUsd        = balance · riskPct / 100
 *   size           = riskUsd / riskPerShare
 *   profit         = size · rewardPerShare
 *   positionValue  = size · entry
 *   positionPct    = positionValue / balance · 100
 *
 * Usar valores absolutos para risk/reward per share permite que la
 * misma calculadora sirva para largos (stop < entry) y cortos
 * (stop > entry) sin un conmutador de dirección.
 *
 * ── Validación ────────────────────────────────────────────────────────
 * Si riskPerShare ≤ 0 (entry == stop) o rewardPerShare ≤ 0 (target ==
 * entry), no se puede calcular el tamaño: se muestra un aviso inline en
 * vez de NaN/Infinity. Los campos siguen siendo editables.
 *
 * ── Material ──────────────────────────────────────────────────────────
 * La tarjeta usa `.tj-paper` (papel translúcido cálido) + `.tj-paper-glow`
 * (halo champagne) para cohesión con el resto del sitio. Los chips de
 * plantilla/balance mantienen ≥44 px de touch target.
 *
 * ── Copiar plan ───────────────────────────────────────────────────────
 * Un botón "Copiar plan" lleva al portapapeles un resumen de texto plano
 * con todos los parámetros y resultados — listo para pegar en el diario
 * de CountPips. Refuerza el mensaje "mide antes de operar".
 *
 * `num` — ordinal del eyebrow (las páginas internas pasan el suyo).
 */
/* Extremos del riesgo por operación y las marcas que se rotulan bajo la
   pista. Viven fuera del componente porque los usan tres cosas —el
   control, el relleno de la pista y los rótulos— y tenían que ser el
   mismo número en las tres: cuando el rango estaba escrito a mano en cada
   sitio, bastaba tocar uno para que la bolita dejara de coincidir con su
   etiqueta, que es justo lo que pasaba. */
const RISK_MIN = 0.25;
const RISK_MAX = 3;
const RISK_MARKS = [0.25, 1, 2, 3];

/** Posición de un valor de riesgo dentro de la pista, en % del recorrido. */
const riskAt = (v: number) => ((v - RISK_MIN) / (RISK_MAX - RISK_MIN)) * 100;

export function RiskCalculator({ num = "04·c" }: { num?: string }) {
  const { lang } = useLang();
  const es = lang === "es";

  const presets = [
    { label: es ? "Conservador" : "Conservative", pct: 0.5 },
    { label: es ? "Estándar" : "Standard", pct: 1.0 },
    { label: es ? "Agresivo" : "Aggressive", pct: 2.0 },
  ];
  const balances = [
    { label: "5k $", v: 5000 },
    { label: "10k $", v: 10000 },
    { label: "25k $", v: 25000 },
  ];

  // ── Estado editable: la operación del usuario ─────────────────────
  const [riskPct, setRiskPct] = useState(1.0);
  const [balance, setBalance] = useState(10000);
  const [entry, setEntry] = useState(100);
  const [stop, setStop] = useState(95);
  const [target, setTarget] = useState(115);
  const [copied, setCopied] = useState(false);

  // ── Cálculo en vivo (abs-value → largo y corto) ───────────────────
  const c = useMemo(() => {
    const riskPerShare = Math.abs(entry - stop);
    const rewardPerShare = Math.abs(target - entry);
    const valid = riskPerShare > 0 && rewardPerShare > 0 && entry > 0;
    const rr = valid ? rewardPerShare / riskPerShare : 0;
    const riskUsd = (balance * riskPct) / 100;
    const size = valid ? riskUsd / riskPerShare : 0;
    const profit = valid ? size * rewardPerShare : 0;
    const profitPct = (profit / balance) * 100;
    const positionValue = valid ? size * entry : 0;
    const positionPct = (positionValue / balance) * 100;
    // ¿Es corto? stop > entry → Long/Short hint.
    const direction = entry > 0 && stop > entry ? "short" : "long";
    return { riskPerShare, rewardPerShare, valid, rr, riskUsd, size, profit, profitPct, positionValue, positionPct, direction };
  }, [entry, stop, target, balance, riskPct]);

  /* Los formateadores se construían dentro de la función, así que cada
     cifra de la pantalla creaba su propio `Intl.NumberFormat` —el objeto
     más caro de esta vista— y se tiraba acto seguido. Además hacían que el
     `useCallback` de "copiar" se invalidara en cada render, o sea que no
     memoizaba nada: la lista de dependencias lo decía y nadie lo leía
     porque la regla que avisa estaba apagada.

     Ahora se crean una vez por idioma y las dos funciones son estables. */
  /* `fmtNum` recibe los decimales por argumento, pero esta pantalla sólo
     pide uno o dos, así que se construyen los tres formateadores de una vez
     en lugar de cachear bajo demanda: una caché mutable dentro de un hook
     es justo lo que el compilador de React prohíbe, y para tres objetos no
     compensa. */
  const nf = useMemo(() => {
    const locale = es ? "es-ES" : "en-US";
    return {
      usd: new Intl.NumberFormat(locale, {
        style: "currency", currency: "USD",
        minimumFractionDigits: 2, maximumFractionDigits: 2,
      }),
      dec1: new Intl.NumberFormat(locale, {
        minimumFractionDigits: 1, maximumFractionDigits: 1,
      }),
      dec2: new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2, maximumFractionDigits: 2,
      }),
    };
  }, [es]);

  const fmtUsd = useCallback((n: number) => nf.usd.format(n), [nf]);

  const fmtNum = useCallback(
    (n: number, dec = 2) => (dec === 1 ? nf.dec1 : nf.dec2).format(n),
    [nf],
  );

  // Anchos de las barras Riesgo / Beneficio normalizados.
  const max = Math.max(c.riskUsd, c.profit, 1);
  const riskW = (c.riskUsd / max) * 100;
  const profitW = (c.profit / max) * 100;

  const chipStyle = (active: boolean): React.CSSProperties => ({
    fontSize: 12,
    lineHeight: 1.2,
    minHeight: 44,
    padding: "12px 18px",
    borderRadius: 4,
    cursor: "pointer",
    transition: "background 0.2s, color 0.2s, border-color 0.2s",
    background: active
      ? "color-mix(in oklab, rgb(var(--accent-base)) 14%, transparent)"
      : "transparent",
    color: active ? "rgb(var(--accent-base))" : "var(--ink-2)",
    border: active
      ? "1px solid color-mix(in oklab, rgb(var(--accent-base)) 50%, transparent)"
      : "1px solid rgb(var(--divider) / 0.13)",
  });

  // ── Input numérico reutilizable (≥44 px, tnum, label) ─────────────
  const numInput = (label: string, value: number, onChange: (n: number) => void, ariaLabel: string) => (
    <label className="block min-w-0">
      <span
        className="tnum block"
        style={{ fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4 }}
      >
        {label}
      </span>
      <input
        type="number"
        inputMode="decimal"
        step="any"
        min={0}
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          onChange(Number.isFinite(v) ? v : 0);
        }}
        aria-label={ariaLabel}
        className="tnum w-full min-h-[44px] rounded-[2px] outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] transition-colors"
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: "var(--ink)",
          background: "color-mix(in oklab, var(--surface-2) 60%, transparent)",
          border: "1px solid rgb(var(--divider) / 0.13)",
          padding: "8px 12px",
        }}
      />
    </label>
  );

  // ── Copiar plan al portapapeles ───────────────────────────────────
  const copyPlan = useCallback(async () => {
    if (!c.valid) return;
    const lines = [
      es ? "Plan de operación — CountPips" : "Trade plan — CountPips",
      "─".repeat(28),
      `${es ? "Balance" : "Balance"}: ${fmtUsd(balance)}`,
      `${es ? "Riesgo" : "Risk"}: ${fmtNum(riskPct)} % (${fmtUsd(c.riskUsd)})`,
      `${es ? "Entrada" : "Entry"}: ${fmtNum(entry)}`,
      `${es ? "Stop" : "Stop"}: ${fmtNum(stop)}`,
      `${es ? "Objetivo" : "Target"}: ${fmtNum(target)}`,
      `${es ? "Dirección" : "Direction"}: ${c.direction === "short" ? (es ? "Corto" : "Short") : (es ? "Largo" : "Long")}`,
      "─".repeat(28),
      `${es ? "Tamaño" : "Size"}: ${fmtNum(c.size, 2)} u`,
      `${es ? "R:R" : "R:R"}: ${fmtNum(c.rr, 2)} : 1`,
      `${es ? "Beneficio" : "Profit"}: ${fmtUsd(c.profit)} (${fmtNum(c.profitPct, 1)} %)`,
      `${es ? "Valor posición" : "Position value"}: ${fmtUsd(c.positionValue)} (${fmtNum(c.positionPct, 1)} % ${es ? "del balance" : "of balance"})`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // clipboard no disponible — aviso silencioso
    }
  }, [c, balance, riskPct, entry, stop, target, es, fmtUsd, fmtNum]);

  return (
    <section
      className="section-tight bg-veil border-t border-[rgb(var(--divider)/0.06)]"
    >
      <div className="tj-container grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div>
          <div className="inline-flex items-center gap-3 mb-5">
            <span
              className="tnum"
              style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.04em", color: "rgb(var(--accent-base))" }}
            >
              § {num}
            </span>
            <span aria-hidden style={{ width: 22, height: 1, background: "rgb(var(--divider) / 0.13)" }} />
            <span
              className="tnum"
              style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--ink-3)" }}
            >
              {es ? "CALCULADORA" : "CALCULATOR"}
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
                Calcula tu riesgo <span style={{ color: "rgb(var(--accent-base))" }}>antes</span> de operar.
              </>
            ) : (
              <>
                Calculate your risk <span style={{ color: "rgb(var(--accent-base))" }}>before</span> you trade.
              </>
            )}
          </h2>
          <p
            className="mt-5 mb-7"
            style={{
              fontSize: "clamp(1rem, 1.3vw, 1.1rem)",
              lineHeight: 1.62,
              color: "var(--ink-2)",
              maxWidth: "34em",
            }}
          >
            {es
              ? "Introduce tu balance y tu operación. Te decimos cuántas unidades, cuánto arriesgas y dónde poner el stop. Vale para largos y cortos."
              : "Enter your balance and your trade. We tell you how many units, how much you risk, and where to place your stop. Works for longs and shorts."}
          </p>
          {/* Chips de plantilla */}
          <div className="mb-4">
            <div
              className="tnum mb-2"
              style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)" }}
            >
              {es ? "Plantilla de riesgo" : "Risk preset"}
            </div>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setRiskPct(p.pct)}
                  style={chipStyle(riskPct === p.pct)}
                  aria-pressed={riskPct === p.pct}
                  aria-label={es ? `Plantilla ${p.label}, ${fmtNum(p.pct)} por ciento de riesgo` : `${p.label} preset, ${fmtNum(p.pct)} percent risk`}
                >
                  {p.label} · {fmtNum(p.pct)} %
                </button>
              ))}
            </div>
          </div>
          {/* Chips de balance */}
          <div>
            <div
              className="tnum mb-2"
              style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)" }}
            >
              {es ? "Balance" : "Balance"}
            </div>
            <div className="flex flex-wrap gap-2">
              {balances.map((b) => (
                <button
                  key={b.label}
                  onClick={() => setBalance(b.v)}
                  style={chipStyle(balance === b.v)}
                  aria-pressed={balance === b.v}
                  aria-label={es ? `Balance ${b.label}` : `Balance ${b.label}`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tarjeta calculadora — papel translúcido cálido */}
        <div
          className="tj-paper tj-paper-glow relative"
          style={{
            padding: 24,
            borderRadius: 3,
            border: "1px solid rgb(var(--divider) / 0.13)",
          }}
        >
          {/* Slider de riesgo */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span
                className="tnum"
                style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)" }}
              >
                {es ? "Riesgo por operación" : "Risk per trade"}
              </span>
              <span
                className="tnum inline-flex items-baseline gap-1"
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "rgb(var(--accent-base))",
                  padding: "2px 12px",
                  borderRadius: 3,
                  background: "color-mix(in oklab, rgb(var(--accent-base)) 12%, transparent)",
                  border: "1px solid color-mix(in oklab, rgb(var(--accent-base)) 35%, transparent)",
                }}
              >
                {fmtNum(riskPct)} %
              </span>
            </div>
            {/* Una sola pista: la del propio control. La barra de progreso
                que había aquí encima era un elemento aparte, así que se
                veían dos líneas paralelas y la de arriba no respondía al
                arrastre. Ahora el tramo recorrido se pinta dentro de la
                pista real a partir de `--pct`. */}
            <input
              type="range"
              min={RISK_MIN}
              max={RISK_MAX}
              step={0.05}
              value={riskPct}
              onChange={(e) => setRiskPct(parseFloat(e.target.value))}
              className="tj-range w-full"
              style={
                {
                  accentColor: "rgb(var(--accent-base))",
                  height: 44,
                  "--pct": `${riskAt(riskPct)}%`,
                } as React.CSSProperties
              }
              aria-label={es ? "Riesgo por operación en porcentaje" : "Risk per trade percentage"}
              aria-valuemin={RISK_MIN}
              aria-valuemax={RISK_MAX}
              aria-valuenow={riskPct}
              aria-valuetext={`${fmtNum(riskPct)} %`}
            />
            {/* Las marcas van DONDE CAEN, no repartidas a partes iguales.
                Estaban en una fila con separación uniforme, así que 1,00 %
                aparecía en mitad de la pista cuando su sitio real está en
                el 27 % del recorrido: la bolita nunca coincidía con su
                propia etiqueta y el control parecía descalibrado.

                El 0,25 se alinea por la izquierda y el 3,00 por la derecha
                para que ninguno se salga de la caja; los de en medio van
                centrados sobre su posición. */}
            <div className="relative mt-1 h-3">
              {RISK_MARKS.map((v, i) => {
                const pct = riskAt(v);
                const extremoIzq = i === 0;
                const extremoDer = i === RISK_MARKS.length - 1;
                return (
                  <span
                    key={v}
                    className="tnum absolute top-0"
                    style={{
                      left: `${pct}%`,
                      transform: extremoIzq
                        ? "none"
                        : extremoDer
                          ? "translateX(-100%)"
                          : "translateX(-50%)",
                      fontSize: 9.5,
                      color: "var(--ink-3)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {fmtNum(v)} %
                  </span>
                );
              })}
            </div>
          </div>

          {/* Entrada / Stop / Target — EDITABLES.

              DOS columnas en móvil y tres desde `sm`. Con tres columnas en
              un teléfono cada campo se quedaba en 83 px, de los que 57 son
              útiles: entra el valor de ejemplo (100) y poco más. Medido con
              la tipografía real, NO entraba ningún precio de verdad —
              1.08450 pide 60 px, 2345.75 pide 58, 18450.25 pide 67.

              Es decir, la calculadora funcionaba mientras nadie la usara: se
              rompía justo al hacer lo que el propio texto pide, que es meter
              tu operación. Y no lo delata nada, porque los valores de
              ejemplo caben. Con dos columnas quedan ~130 px útiles y entra
              cualquier precio con holgura. El reparto 2+1 ya es el que
              tienen los chips de plantilla de aquí arriba. */}
          <div
            className="grid grid-cols-2 gap-2 p-3 rounded-[2px] mb-4 sm:grid-cols-3"
            style={{
              background: "color-mix(in oklab, var(--surface-2) 50%, transparent)",
              border: "1px solid rgb(var(--divider) / 0.06)",
            }}
          >
            {numInput(es ? "Entrada" : "Entry", entry, setEntry, es ? "Precio de entrada" : "Entry price")}
            {numInput(es ? "Stop" : "Stop", stop, setStop, es ? "Precio de stop loss" : "Stop loss price")}
            {numInput(es ? "Objetivo" : "Target", target, setTarget, es ? "Precio objetivo take profit" : "Take profit target price")}
          </div>

          {/* Aviso de validación + dirección */}
          {!c.valid ? (
            <div
              className="mb-4 rounded-[2px] px-3 py-2.5 text-[12px] leading-[1.5]"
              style={{
                background: "color-mix(in oklab, rgb(var(--pnl-neg)) 10%, transparent)",
                border: "1px solid color-mix(in oklab, rgb(var(--pnl-neg)) 30%, transparent)",
                color: "rgb(var(--pnl-neg))",
              }}
              role="alert"
            >
              {es
                ? "Entrada, stop y objetivo deben ser distintos y positivos para calcular el tamaño."
                : "Entry, stop and target must be distinct and positive to calculate size."}
            </div>
          ) : (
            <div
              className="mb-4 flex items-center gap-2 text-[11px] tnum"
              style={{ color: "var(--ink-3)", letterSpacing: "0.06em" }}
            >
              <span
                aria-hidden
                className="inline-flex items-center justify-center rounded-full"
                style={{
                  width: 16, height: 16,
                  background: c.direction === "short"
                    ? "color-mix(in oklab, rgb(var(--pnl-neg)) 16%, transparent)"
                    : "color-mix(in oklab, rgb(var(--pnl-pos)) 16%, transparent)",
                  color: c.direction === "short" ? "rgb(var(--pnl-neg))" : "rgb(var(--pnl-pos))",
                  fontSize: 10, fontWeight: 700,
                }}
              >
                {c.direction === "short" ? "↓" : "↑"}
              </span>
              {c.direction === "short"
                ? (es ? "Operación en corto detectada" : "Short trade detected")
                : (es ? "Operación en largo detectada" : "Long trade detected")}
            </div>
          )}

          {/* Resultados */}
          <div className="grid grid-cols-2 gap-3.5 mb-5">
            <Result label={es ? "Riesgo $" : "Risk $"} value={fmtUsd(c.riskUsd)} color="rgb(var(--pnl-neg))" />
            <Result label={es ? "Beneficio" : "Profit"} value={fmtUsd(c.profit)} color="rgb(var(--pnl-pos))" />
            <Result label={es ? "Tamaño" : "Size"} value={`${fmtNum(c.size, 2)} u`} color="var(--ink)" />
            <Result label="R:R" value={`${fmtNum(c.rr, 2)} : 1`} color="rgb(var(--accent-base))" />
          </div>

          {/* Stats adicionales: valor posición + % balance */}
          <div
            className="grid grid-cols-2 gap-2 mb-5 rounded-[2px] p-3"
            style={{ background: "color-mix(in oklab, var(--surface-2) 40%, transparent)", border: "1px solid rgb(var(--divider) / 0.05)" }}
          >
            <div>
              <div className="tnum" style={{ fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-3)" }}>
                {es ? "Valor posición" : "Position value"}
              </div>
              <div className="tnum" style={{ fontSize: 14, fontWeight: 600, marginTop: 2, color: "var(--ink)" }}>
                {fmtUsd(c.positionValue)}
              </div>
            </div>
            <div>
              <div className="tnum" style={{ fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-3)" }}>
                {es ? "% del balance" : "% of balance"}
              </div>
              <div
                className="tnum"
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  marginTop: 2,
                  // >50% del balance en una sola posición es agresivo → aviso visual
                  color: c.positionPct > 50 ? "rgb(var(--pnl-neg))" : "var(--ink)",
                }}
              >
                {fmtNum(c.positionPct, 1)} %
              </div>
            </div>
          </div>

          {/* Barra Riesgo ↔ Beneficio */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span
                className="tnum inline-flex items-center gap-1.5"
                style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)" }}
              >
                <span aria-hidden className="w-1.5 h-1.5 rounded-full" style={{ background: "rgb(var(--pnl-neg))" }} />
                {es ? "Riesgo" : "Risk"}
              </span>
              <span
                className="tnum"
                style={{ fontSize: 9.5, letterSpacing: "0.16em", color: "rgb(var(--accent-base))", fontWeight: 700 }}
              >
                {fmtNum(c.rr, 2)} : 1 {es ? "R:R" : "R:R"}
              </span>
              <span
                className="tnum inline-flex items-center gap-1.5"
                style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)" }}
              >
                {es ? "Beneficio" : "Profit"}
                <span aria-hidden className="w-1.5 h-1.5 rounded-full" style={{ background: "rgb(var(--pnl-pos))" }} />
              </span>
            </div>
            <div
              className="relative h-2 rounded-[2px] overflow-hidden"
              style={{ background: "rgb(var(--divider) / 0.13)" }}
            >
              <div
                className="absolute left-0 top-0 h-full"
                style={{ width: `${riskW}%`, background: "rgb(var(--pnl-neg))" }}
              />
              <div
                className="absolute right-0 top-0 h-full"
                style={{ width: `${profitW}%`, background: "rgb(var(--pnl-pos))" }}
              />
              <span
                aria-hidden
                className="absolute top-0 bottom-0"
                style={{
                  left: "50%",
                  width: 1,
                  transform: "translateX(-50%)",
                  background: "linear-gradient(180deg, transparent, rgb(var(--divider) / 0.45) 50%, transparent)",
                }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between tnum" style={{ fontSize: 11, color: "var(--ink-2)" }}>
              <span>{fmtUsd(c.riskUsd)}</span>
              <span style={{ color: "var(--ink-3)" }}>{fmtNum(c.profitPct, 1)} % {es ? "del balance" : "of balance"}</span>
              <span>{fmtUsd(c.profit)}</span>
            </div>
          </div>

          {/* Copiar plan — refuerzo "mide antes de operar" */}
          <button
            type="button"
            onClick={copyPlan}
            disabled={!c.valid}
            aria-label={es ? "Copiar plan de operación al portapapeles" : "Copy trade plan to clipboard"}
            className="mt-5 w-full sm:w-fit inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-[2px] text-[13px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: copied
                ? "color-mix(in oklab, rgb(var(--pnl-pos)) 16%, transparent)"
                : "color-mix(in oklab, rgb(var(--accent-base)) 12%, transparent)",
              color: copied ? "rgb(var(--pnl-pos))" : "rgb(var(--accent-base))",
              border: copied
                ? "1px solid color-mix(in oklab, rgb(var(--pnl-pos)) 40%, transparent)"
                : "1px solid color-mix(in oklab, rgb(var(--accent-base)) 35%, transparent)",
            }}
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {es ? "Plan copiado" : "Plan copied"}
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M3 11V3.5A1.5 1.5 0 014.5 2H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {es ? "Copiar plan" : "Copy plan"}
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

function Result({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="group/result relative min-w-0 rounded-[2px] border border-[rgb(var(--divider)/0.06)] px-4 py-4 transition-[transform,border-color] duration-200 ease-[var(--ease-suave)] hover:-translate-y-0.5 hover:border-[rgb(var(--accent-base)/0.30)]"
      style={{
        background: "color-mix(in oklab, var(--surface-2) 50%, transparent)",
      }}
    >
      <div
        className="tnum relative"
        style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-3)" }}
      >
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
