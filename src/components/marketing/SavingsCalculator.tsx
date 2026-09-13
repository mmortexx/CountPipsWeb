"use client";

import { useState, useMemo } from "react";
import { useLang } from "@/lib/i18n";

/**
 * SavingsCalculator — illustrative post-beta cost scenario.
 *
 * Uses the planned Core/Pro reference prices only as an illustrative
 * scenario; it does not represent a live offer or purchase flow.
 *
 * El trader ajusta:
 *   · planned reference tier (Core $149 / Pro $249)
 *   · precio mensual de la alternativa por suscripción
 *   · años de uso
 *
 * Y ve: reference cost, subscription cost (cumulative), illustrative saving
 * total $ y %, y una mini-curva que muestra cómo el ahorro crece con
 * el tiempo mientras la suscripción sigue cobrando cada mes.
 *
 * ── Material ──────────────────────────────────────────────────────────
 * .tj-paper + .tj-paper-glow (papel translúcido cálido, halo champagne).
 * Touch targets ≥44px. Sin overflow en mobile.
 */
/* Los planes viven FUERA del componente por dos motivos, y ninguno es estético.
   Uno: sus nombres son de marca, iguales en español y en inglés, así que no
   tenían nada que hacer dentro de un render que depende del idioma. Dos: al
   declararse dentro se creaban de nuevo en cada render, y como la lista figura
   entre las dependencias del cálculo de abajo, el `useMemo` se rehacía siempre
   y no memorizaba nada. Aquí arriba la identidad es estable.

   El tipo de `id` se declara en vez de dejarlo inferir: inferido salía como
   texto libre y no encajaba con el estado, que solo admite estos dos valores. */
type PlanId = "core" | "pro";

const COUNTPIPS_PLANS: { id: PlanId; label: string; price: number }[] = [
  { id: "core", label: "CountPips Core", price: 149 },
  { id: "pro", label: "CountPips Pro", price: 249 },
];

export function SavingsCalculator() {
  const { lang } = useLang();
  const es = lang === "es";

  // Alternativas SaaS típicas (rango 15-30 $/mes)
  const altPresets = [
    { label: es ? "Básico" : "Basic", v: 15 },
    { label: es ? "Estándar" : "Standard", v: 25 },
    { label: es ? "Premium" : "Premium", v: 30 },
  ];

  const [plan, setPlan] = useState<PlanId>("pro");
  const [altMonthly, setAltMonthly] = useState(25);
  const [years, setYears] = useState(3);

  const c = useMemo(() => {
    const cpPrice = COUNTPIPS_PLANS.find((p) => p.id === plan)!.price;
    const altTotal = altMonthly * 12 * years;
    const savings = altTotal - cpPrice;
    const savingsPct = altTotal > 0 ? (savings / altTotal) * 100 : 0;
    // Break-even: cuántos meses hasta que la suscripción supere el pago único
    const breakEvenMonths = cpPrice > 0 && altMonthly > 0 ? Math.ceil(cpPrice / altMonthly) : 0;

    // Proyección de ahorro con Interés Compuesto reinvertido al 8% anual (rendimiento indexado SP500)
    // Aporte mensual de altMonthly durante years * 12 meses
    const monthlyRate = 0.08 / 12;
    const totalMonths = years * 12;
    let compoundInvested = 0;
    for (let m = 1; m <= totalMonths; m++) {
      compoundInvested = (compoundInvested + altMonthly) * (1 + monthlyRate);
    }
    const compoundAdvantage = Math.max(0, compoundInvested - cpPrice);

    // Curva año a año: suscripción acumulada vs línea plana CountPips
    const curve: { year: number; sub: number; cp: number }[] = [];
    for (let y = 0; y <= years; y++) {
      curve.push({ year: y, sub: altMonthly * 12 * y, cp: cpPrice });
    }
    return { cpPrice, altTotal, savings, savingsPct, breakEvenMonths, compoundInvested, compoundAdvantage, curve };
  }, [plan, altMonthly, years]);

  // A precios más altos, el escenario mínimo (años=1, alternativa=5$/mes)
  // puede dar una diferencia negativa real (la suscripción barata sale más
  // económica en ese extremo) — matemáticamente correcto, así que el color
  // sigue el signo en vez de estar fijo en verde.
  const savingsColor = c.savings >= 0 ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))";

  const fmtUsd = (n: number) =>
    es
      ? new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
      : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const fmtNum = (n: number, dec = 0) =>
    es
      ? new Intl.NumberFormat("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n)
      : new Intl.NumberFormat("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);

  // SVG curva: suscripción (creciente) vs CountPips (plano)
  const svgW = 520;
  const svgH = 130;
  const padX = 8;
  const padY = 12;
  const maxV = Math.max(c.altTotal, c.cpPrice, 1);
  const subPts = c.curve.map((p, i) => {
    const x = padX + (i / (c.curve.length - 1)) * (svgW - padX * 2);
    const y = svgH - padY - (p.sub / maxV) * (svgH - padY * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const subPath = "M " + subPts.join(" L ");
  const subAreaPath = `M ${padX},${svgH - padY} L ` + subPts.join(" L ") + ` L ${(svgW - padX).toFixed(1)},${svgH - padY} Z`;
  const cpY = svgH - padY - (c.cpPrice / maxV) * (svgH - padY * 2);
  const cpLineY = Math.max(padY, Math.min(svgH - padY, cpY));

  const chipStyle = (active: boolean) =>
    `min-h-[44px] px-4 py-2.5 text-xs rounded-[2px] transition-all font-mono ${
      active
        ? "bg-[rgb(var(--accent-base)/0.14)] text-[rgb(var(--accent-base))] border border-[rgb(var(--accent-base)/0.5)] font-semibold shadow-sm"
        : "bg-[var(--surface-2)]/40 text-secondary border border-[rgb(var(--divider)/0.13)] hover:text-primary hover:border-[rgb(var(--divider)/0.25)]"
    }`;

  return (
    <section className="section-tight border-t border-[rgb(var(--divider)/0.06)]">
      <div className="tj-container grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        {/* Left: intro + inputs */}
        <div>
          <div className="inline-flex items-center gap-3 mb-5">
            <span className="tnum text-xs font-medium tracking-wide text-[rgb(var(--accent-base))]">
              §
            </span>
            <span aria-hidden className="w-[22px] h-px bg-[rgb(var(--divider)/0.13)]" />
            <span className="tnum text-[11px] tracking-[0.2em] uppercase text-tertiary">
              {es ? "ESCENARIO" : "SCENARIO"}
            </span>
          </div>
          <h2 className="font-serif m-0 text-3xl sm:text-4xl lg:text-5xl font-normal tracking-[-0.022em] leading-[1.08] text-primary text-balance">
            {es ? (
              <>
                Un escenario de coste. <span className="text-[rgb(var(--accent-base))]">No es una oferta.</span>
              </>
            ) : (
              <>
                A cost scenario. <span className="text-[rgb(var(--accent-base))]">Not an offer.</span>
              </>
            )}
          </h2>
          <p className="mt-5 mb-7 text-base sm:text-lg leading-relaxed text-secondary max-w-[34em]">
            {es
              ? "Core $149 y Pro $249 son referencias previstas de lanzamiento. Compara un escenario de coste mensual sin interpretar el resultado como una promesa comercial."
              : "Core $149 and Pro $249 are planned launch references. Compare a monthly cost scenario without treating the result as a commercial promise."}
          </p>

          {/* Plan CountPips */}
          <div className="mb-5">
            <div className="tnum mb-2 text-[10px] uppercase tracking-[0.14em] text-tertiary">
              {es ? "Referencia prevista" : "Planned reference"}
            </div>
            <div className="flex flex-wrap gap-2">
              {COUNTPIPS_PLANS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlan(p.id)}
                  className={chipStyle(plan === p.id)}
                  aria-pressed={plan === p.id}
                  aria-label={`${p.label} ${fmtUsd(p.price)}`}
                >
                  {p.label} · {fmtUsd(p.price)}
                </button>
              ))}
            </div>
          </div>

          {/* Alternativa suscripción */}
          <div className="mb-5">
            <div className="tnum mb-2 text-[10px] uppercase tracking-[0.14em] text-tertiary">
              {es ? "Alternativa por suscripción ($/mes)" : "Subscription alternative ($/mo)"}
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {altPresets.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => setAltMonthly(a.v)}
                  className={chipStyle(altMonthly === a.v)}
                  aria-pressed={altMonthly === a.v}
                  aria-label={`${a.label} ${fmtUsd(a.v)} ${es ? "al mes" : "per month"}`}
                >
                  {a.label} · {fmtUsd(a.v)}
                </button>
              ))}
            </div>
            {/* Slider fino para el precio mensual — unified pill style */}
            <div className="flex items-center justify-between mb-2">
              <span className="tnum" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)" }}>
                {es ? "Precio mensual" : "Monthly price"}
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
                {fmtUsd(altMonthly)}{es ? "/mes" : "/mo"}
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={50}
              step={1}
              value={altMonthly}
              onChange={(e) => setAltMonthly(parseInt(e.target.value))}
              className="tj-range w-full"
              /* `--pct` pinta el tramo recorrido dentro de la pista. */
              style={
                {
                  accentColor: "rgb(var(--accent-base))",
                  height: 44,
                  "--pct": `${((altMonthly - 5) / (50 - 5)) * 100}%`,
                } as React.CSSProperties
              }
              aria-label={es ? "Precio mensual de la alternativa por suscripción" : "Monthly price of subscription alternative"}
              aria-valuemin={5}
              aria-valuemax={50}
              aria-valuenow={altMonthly}
            />
            <div className="flex items-center justify-between mt-1">
              <span className="tnum" style={{ fontSize: 9.5, color: "var(--ink-3)" }}>5 $</span>
              <span className="tnum" style={{ fontSize: 9.5, color: "var(--ink-3)" }}>50 $</span>
            </div>
          </div>

          {/* Años de uso — unified pill style */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="tnum" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)" }}>
                {es ? "Años de uso" : "Years of use"}
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
                {years} {es ? "años" : "yrs"}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={years}
              onChange={(e) => setYears(parseInt(e.target.value))}
              className="tj-range w-full"
              /* `--pct` pinta el tramo recorrido dentro de la pista. */
              style={
                {
                  accentColor: "rgb(var(--accent-base))",
                  height: 44,
                  "--pct": `${((years - 1) / (10 - 1)) * 100}%`,
                } as React.CSSProperties
              }
              aria-label={es ? "Años de uso" : "Years of use"}
              aria-valuemin={1}
              aria-valuemax={10}
              aria-valuenow={years}
            />
          </div>
        </div>

        {/* Right: results card */}
        <div
          className="tj-paper tj-paper-glow relative"
          style={{ padding: 24, borderRadius: 3, border: "1px solid rgb(var(--divider) / 0.13)" }}
        >
          {/* Headline savings */}
          <div className="mb-5">
            <div className="tnum" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)" }}>
              {es ? "Diferencia ilustrativa" : "Illustrative difference"}
            </div>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="tnum" style={{ fontSize: 34, fontWeight: 700, color: savingsColor }}>
                {fmtUsd(c.savings)}
              </span>
              <span className="tnum" style={{ fontSize: 16, fontWeight: 600, color: savingsColor }}>
                {fmtNum(c.savingsPct, 0)} %
              </span>
            </div>
          </div>

          {/* Comparison bar chart SVG */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="tnum" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)" }}>
                {es ? "Coste acumulado de referencia" : "Cumulative reference cost"} · {years} {es ? "años" : "yrs"}
              </span>
            </div>
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ height: "auto", display: "block" }} aria-label={es ? "Comparación de pago acumulado" : "Cumulative cost comparison"} role="img">
              <defs>
                <linearGradient id="sv-sub" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(var(--pnl-neg))" stopOpacity="0.26" />
                  <stop offset="100%" stopColor="rgb(var(--pnl-neg))" stopOpacity="0.04" />
                </linearGradient>
              </defs>
              {/* subscription area (growing) */}
              <path d={subAreaPath} fill="url(#sv-sub)" />
              <path d={subPath} fill="none" stroke="rgb(var(--pnl-neg))" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              {/* CountPips flat line */}
              <line
                x1={padX}
                y1={cpLineY}
                x2={svgW - padX}
                y2={cpLineY}
                stroke="rgb(var(--accent-base))"
                strokeWidth="2"
                strokeDasharray="5 3"
              />
              {/* start baseline */}
              <line x1={padX} y1={svgH - padY} x2={svgW - padX} y2={svgH - padY} stroke="rgb(var(--divider) / 0.16)" strokeWidth="1" />
            </svg>
            <div className="flex items-center gap-4 mt-2 tnum" style={{ fontSize: 10, color: "var(--ink-3)" }}>
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="inline-block w-2.5 h-[2px]" style={{ background: "rgb(var(--pnl-neg))" }} />
                {es ? "Alternativa mensual" : "Monthly alternative"}: {fmtUsd(c.altTotal)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="inline-block w-2.5 border-t-2 border-dashed" style={{ borderColor: "rgb(var(--accent-base))" }} />
                {es ? "Referencia CountPips" : "CountPips reference"}: {fmtUsd(c.cpPrice)}
              </span>
            </div>
          </div>

          {/* Result tiles */}
          <div className="grid grid-cols-2 gap-3.5 mb-4">
            <Result label={es ? "Referencia CountPips" : "CountPips reference"} value={fmtUsd(c.cpPrice)} color="rgb(var(--accent-base))" />
            <Result label={es ? "Alternativa acumulada" : "Cumulative alternative"} value={fmtUsd(c.altTotal)} color="rgb(var(--pnl-neg))" />
            <Result label={es ? "Ahorro directo" : "Direct savings"} value={fmtUsd(c.savings)} color={savingsColor} />
            <Result label={es ? "Reinvertido al 8 % anual" : "Compounded at 8% p.a."} value={fmtUsd(c.compoundAdvantage)} color="rgb(var(--pnl-pos))" />
          </div>

          {/* Break-even note */}
          <div
            className="rounded-[2px] px-3.5 py-3 border border-[rgb(var(--divider)/0.08)] bg-[rgb(var(--divider)/0.02)]"
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-primary">
                {es ? "Amortización de Licencia:" : "License Payback:"}
              </span>
              <span className="font-mono font-bold text-[rgb(var(--accent-base))]">
                {c.breakEvenMonths} {c.breakEvenMonths === 1 ? (es ? "mes" : "month") : (es ? "meses" : "months")}
              </span>
            </div>
            <p className="tnum m-0 text-[11.5px] leading-[1.55]" style={{ color: "var(--ink-2)" }}>
              {es
                ? `En solo ${c.breakEvenMonths} meses el coste de la alternativa SaaS supera el pago único perpetuo. A ${years} años, reinvertir el dinero ahorrado al 8\u00a0% genera ${fmtUsd(c.compoundAdvantage)} netos adicionales.`
                : `In just ${c.breakEvenMonths} months the SaaS alternative exceeds the one-time perpetual license. Over ${years} years, reinvesting saved fees at 8% yields +${fmtUsd(c.compoundAdvantage)} in net capital.`}
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
