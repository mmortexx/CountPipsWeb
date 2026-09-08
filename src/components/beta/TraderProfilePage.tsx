"use client";

import { useState } from "react";
import { ArrowRight, BarChart3, BookOpenCheck, ShieldCheck, Target, CheckCircle2, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Link } from "@/components/tj/LocaleLink";
import { FinalCTANew } from "@/components/marketing/FinalCTANew";
import { useLang } from "@/lib/i18n";
import { fmtMoney, fmtPct } from "@/lib/trading/format";

export type TraderProfile = "manual" | "prop";

const DATA = {
  manual: {
    eyebrowEs: "Para traders manuales",
    eyebrowEn: "For manual traders",
    titleEs: "Tu criterio merece una pista de datos.",
    titleEn: "Your judgement deserves a data trail.",
    highlightEs: "una pista de datos.",
    highlightEn: "a data trail.",
    subtitleEs: "Registra la operación, revisa la ejecución y descubre qué setups, horarios y decisiones sostienen de verdad tu ventaja.",
    subtitleEn: "Log the trade, review the execution and discover which setups, sessions and decisions actually support your edge.",
    cards: [
      { icon: BarChart3, titleEs: "Métricas que explican", titleEn: "Metrics that explain", textEs: "Expectancy, profit factor, drawdown y distribución de R en el mismo lugar que tus operaciones.", textEn: "Expectancy, profit factor, drawdown and R distribution next to the trades that produced them." },
      { icon: BookOpenCheck, titleEs: "Playbooks vivos", titleEn: "Living playbooks", textEs: "Compara setups con una muestra real y deja de confundir una buena racha con un edge.", textEn: "Compare setups against a real sample and stop confusing a good run with an edge." },
      { icon: Target, titleEs: "Revisión sin excusas", titleEn: "No-excuse review", textEs: "Anota el plan, la gestión y el cierre para ver dónde se rompe tu proceso.", textEn: "Capture plan, management and exit so you can see where your process breaks." },
    ],
    ctaEs: "Solicitar acceso anticipado",
    ctaEn: "Request early access",
  },
  prop: {
    eyebrowEs: "Para prop firms",
    eyebrowEn: "For prop firms",
    titleEs: "Opera con tus reglas delante.",
    titleEn: "Trade with your rules in view.",
    highlightEs: "tus reglas delante.",
    highlightEn: "your rules in view.",
    subtitleEs: "La demo enseña un flujo para traders que operan con límites de pérdida, evaluaciones y una disciplina que no admite improvisación.",
    subtitleEn: "The demo shows a workflow for traders working with loss limits, evaluations and discipline that leaves no room for improvisation.",
    cards: [
      { icon: ShieldCheck, titleEs: "Riesgo que se ve", titleEn: "Visible risk", textEs: "Revisa drawdown, rachas y exposición antes de que una operación te saque del plan.", textEn: "Review drawdown, streaks and exposure before one trade takes you outside the plan." },
      { icon: BarChart3, titleEs: "Track record limpio", titleEn: "Clean track record", textEs: "Separa el resultado de una sesión de la calidad de las decisiones que la construyeron.", textEn: "Separate a session's result from the quality of the decisions that built it." },
      { icon: Target, titleEs: "Reglas verificables", titleEn: "Verifiable rules", textEs: "Usa el diario para detectar incumplimientos recurrentes y preparar la siguiente evaluación.", textEn: "Use the journal to spot recurring breaches and prepare for the next evaluation." },
    ],
    ctaEs: "Solicitar acceso anticipado",
    ctaEn: "Request early access",
  },
} as const;

const PROP_FIRMS = [
  { id: "ftmo" as const, name: "FTMO", typeEs: "Drawdown estático", typeEn: "Static Drawdown", dailyPct: 5, maxDDPct: 10, phase1Pct: 8, phase2Pct: 5, trailingType: "static" },
  { id: "topstep" as const, name: "Topstep", typeEs: "Trailing EOD", typeEn: "Trailing EOD", dailyPct: 4.5, maxDDPct: 6, phase1Pct: 6, phase2Pct: 0, trailingType: "eod" },
  { id: "fundingpips" as const, name: "FundingPips", typeEs: "Trailing relativo", typeEn: "Relative Trailing", dailyPct: 5, maxDDPct: 10, phase1Pct: 8, phase2Pct: 5, trailingType: "relative" },
];

const PROP_BALANCES = [25000, 50000, 100000, 200000];

export function TraderProfileBody({ profile }: { profile: TraderProfile }) {
  const { lang } = useLang();
  const es = lang === "es";
  const data = DATA[profile];

  // Estado interactivo para prop firm
  const [selectedFirm, setSelectedFirm] = useState<"ftmo" | "topstep" | "fundingpips">("ftmo");
  const [propBalance, setPropBalance] = useState(100000);
  const [currentEquity, setCurrentEquity] = useState(103500); // Simulando beneficio acumulado
  const [manualSetup, setManualSetup] = useState<"breakout" | "sweep" | "reversion">("breakout");

  const firm = PROP_FIRMS.find((f) => f.id === selectedFirm) || PROP_FIRMS[0];

  // Cálculos de reglas de prop firm
  const dailyLossLimit = propBalance * (firm.dailyPct / 100);
  const maxTrailingLoss = propBalance * (firm.maxDDPct / 100);
  const phase1Target = propBalance * (firm.phase1Pct / 100);
  const phase2Target = firm.phase2Pct > 0 ? propBalance * (firm.phase2Pct / 100) : 0;
  const maxSafeRiskPerTrade = propBalance * 0.0075; // 0.75% por trade

  // Umbral de liquidación dinámico
  const peakEquity = Math.max(propBalance, currentEquity);
  const liquidationThreshold = firm.trailingType === "static"
    ? propBalance - maxTrailingLoss
    : peakEquity - maxTrailingLoss;
  const distanceToLiquidation = Math.max(0, currentEquity - liquidationThreshold);
  const distancePct = (distanceToLiquidation / maxTrailingLoss) * 100;

  return (
    <>
      <PageHeader
        eyebrowEs={data.eyebrowEs}
        eyebrowEn={data.eyebrowEn}
        titleEs={data.titleEs}
        titleEn={data.titleEn}
        titleHighlightEs={data.highlightEs}
        titleHighlightEn={data.highlightEn}
        subtitleEs={data.subtitleEs}
        subtitleEn={data.subtitleEn}
        breadcrumbEs={profile === "manual" ? "Operativa manual" : "Prop firms"}
        breadcrumbEn={profile === "manual" ? "Manual trading" : "Prop firms"}
      />

      <section className="section bg-veil">
        <div className="tj-container">
          <SectionHeader
            composicion="partida"
            etiqueta={es ? "Un flujo pensado para tu contexto" : "A workflow shaped for your context"}
            titulo={es ? "La pregunta no es cuánto ganaste." : "The question is not how much you made."}
            entradilla={es ? "Es qué parte de tu proceso merece repetirse, y qué parte necesita una regla antes de volver al mercado." : "It is which part of your process deserves repeating, and which part needs a rule before you return to the market."}
          />
          <ul className="mt-12 m-0 overflow-hidden rounded-[2px] border border-[rgb(var(--divider)/0.13)] p-0">
            {data.cards.map(({ titleEs, titleEn, textEs, textEn }, i) => (
              <li
                key={titleEs}
                className="grid gap-1 border-b border-[rgb(var(--divider)/0.08)] px-4 py-4 last:border-b-0 sm:grid-cols-[3rem_minmax(0,14rem)_minmax(0,1fr)] sm:items-baseline sm:gap-5"
              >
                <span
                  className="tnum text-[11px] font-semibold"
                  style={{ color: "rgb(var(--accent-base))" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="m-0 text-[15px] font-semibold tracking-tight text-primary">
                  {es ? titleEs : titleEn}
                </h2>
                <p className="m-0 text-[13.5px] leading-[1.55] text-secondary">
                  {es ? textEs : textEn}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* SECCIÓN INTERACTIVA ESPECÍFICA POR PERFIL */}
      {profile === "prop" ? (
        <section className="section border-y border-[rgb(var(--divider)/0.08)]">
          <div className="tj-container">
            <div className="max-w-3xl mb-8">
              <p className="eyebrow">{es ? "Reglas de evaluación y fondeo" : "Evaluation & funding rules"}</p>
              <h2 className="mt-3 text-2xl md:text-3xl font-semibold text-primary">
                {es ? "El Guardián calibrado para tu firma y cuenta." : "The Guardian calibrated for your firm and account."}
              </h2>
              <p className="mt-3 text-secondary text-sm md:text-base leading-relaxed">
                {es
                  ? "Selecciona tu firma de fondeo y tamaño de cuenta. CountPips monitoriza la pérdida diaria, el trailing drawdown y las fases de evaluación en tiempo real."
                  : "Select your prop firm and account size. CountPips tracks daily loss, trailing drawdown, and evaluation phase targets in real time."}
              </p>
            </div>

            {/* Selectores: Firma y Balance */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center gap-1 p-1 rounded-[2px] border border-[rgb(var(--divider)/0.12)] bg-[rgb(var(--divider)/0.03)]">
                {PROP_FIRMS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFirm(f.id)}
                    className={`toque-comodo h-8 px-3 rounded-[2px] text-xs font-semibold transition-all ${
                      selectedFirm === f.id
                        ? "bg-[rgb(var(--accent-base))] text-[rgb(var(--accent-ink))]"
                        : "text-secondary hover:text-primary"
                    }`}
                  >
                    {f.name} ({es ? f.typeEs : f.typeEn})
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 p-1 rounded-[2px] border border-[rgb(var(--divider)/0.12)] bg-[rgb(var(--divider)/0.03)]">
                {PROP_BALANCES.map((bal) => (
                  <button
                    key={bal}
                    type="button"
                    onClick={() => {
                      setPropBalance(bal);
                      setCurrentEquity(bal * 1.035);
                    }}
                    className={`toque-comodo h-8 px-3 rounded-[2px] text-xs font-semibold tnum transition-all ${
                      propBalance === bal
                        ? "bg-primary text-[var(--surface)]"
                        : "text-secondary hover:text-primary"
                    }`}
                  >
                    ${(bal / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>
            </div>

            {/* Monitor de Trailing Drawdown y Distancia al Umbral */}
            <div className="p-4 rounded-[2px] border border-[rgb(var(--divider)/0.12)] bg-[rgb(var(--divider)/0.02)] mb-6">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-primary">
                  {es ? "Distancia al umbral de liquidación:" : "Distance to liquidation threshold:"}
                </span>
                <span className="font-mono font-bold text-[rgb(var(--accent-base))]">
                  {/* `fmtPct`, no `toFixed`: `toFixed` escribe siempre el punto
                      decimal inglés, así que en español esta cifra decía
                      "135.0%" en una fila donde el importe de al lado decía
                      "13.500,00 US$". Dos convenciones distintas en el mismo
                      renglón. */}
                  +{fmtMoney(distanceToLiquidation, lang)} ({fmtPct(distancePct / 100, lang)} {es ? "del colchón disponible" : "buffer left"})
                </span>
              </div>
              <div className="relative h-2.5 rounded-[2px] overflow-hidden bg-[rgb(var(--divider)/0.12)]">
                <div
                  className="h-full rounded-[2px] transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(0, distancePct))}%`,
                    background: distancePct > 50
                      ? "rgb(var(--pnl-pos))"
                      : distancePct > 25
                      ? "rgb(var(--sig-amber))"
                      : "rgb(var(--pnl-neg))",
                  }}
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] font-mono text-tertiary">
                <span>{es ? "Liquidación:" : "Liquidation:"} {fmtMoney(liquidationThreshold, lang)}</span>
                <span>{es ? "Equity actual:" : "Current Equity:"} {fmtMoney(currentEquity, lang)}</span>
                <span>{es ? "Pico máximo:" : "High-Water Mark:"} {fmtMoney(peakEquity, lang)}</span>
              </div>
            </div>

            {/* Matriz de parámetros de prop firm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="caja-cifra tj-paper rounded-[2px] border border-[rgb(var(--divider)/0.14)] p-5">
                <div className="mb-2 flex items-start justify-between gap-2 text-xs uppercase tracking-wider text-tertiary [&>span]:min-w-0">
                  <span>{es ? `Límite diario (${firm.dailyPct}\u00a0%)` : `Daily limit (${firm.dailyPct}%)`}</span>
                  <AlertTriangle size={14} className="text-[rgb(var(--pnl-neg))]" />
                </div>
                <div className="cifra-xl font-mono font-semibold text-[rgb(var(--pnl-neg))] tnum">
                  −{fmtMoney(dailyLossLimit, lang)}
                </div>
                <p className="text-xs text-tertiary mt-2 leading-relaxed">
                  {es ? "El Guardián bloquea nuevas entradas al alcanzar el 80 % de este umbral." : "Guardian locks further entries when reaching 80% of this ceiling."}
                </p>
              </div>

              <div className="caja-cifra tj-paper rounded-[2px] border border-[rgb(var(--divider)/0.14)] p-5">
                <div className="mb-2 flex items-start justify-between gap-2 text-xs uppercase tracking-wider text-tertiary [&>span]:min-w-0">
                  <span>{es ? `Max Drawdown (${firm.maxDDPct}\u00a0%)` : `Max Drawdown (${firm.maxDDPct}%)`}</span>
                  <ShieldCheck size={14} className="text-[rgb(var(--accent-base))]" />
                </div>
                <div className="cifra-xl font-mono font-semibold text-primary tnum">
                  −{fmtMoney(maxTrailingLoss, lang)}
                </div>
                <p className="text-xs text-tertiary mt-2 leading-relaxed">
                  {firm.trailingType === "static"
                    ? (es ? "Drawdown estático respecto al balance de inicio." : "Static drawdown anchored to initial balance.")
                    : (es ? "Trailing ajustado dinámicamente al pico de balance." : "Trailing dynamically tracking balance peak.")}
                </p>
              </div>

              <div className="caja-cifra tj-paper rounded-[2px] border border-[rgb(var(--divider)/0.14)] p-5">
                <div className="mb-2 flex items-start justify-between gap-2 text-xs uppercase tracking-wider text-tertiary [&>span]:min-w-0">
                  <span>{es ? `Fase 1 (+${firm.phase1Pct}\u00a0%) ${firm.phase2Pct > 0 ? `/ F2 (+${firm.phase2Pct}\u00a0%)` : ""}` : `Phase 1 (+${firm.phase1Pct}%) ${firm.phase2Pct > 0 ? `/ P2 (+${firm.phase2Pct}%)` : ""}`}</span>
                  <CheckCircle2 size={14} className="text-[rgb(var(--pnl-pos))]" />
                </div>
                <div className="cifra-xl font-mono font-semibold text-[rgb(var(--pnl-pos))] tnum">
                  +{fmtMoney(phase1Target, lang)}{" "}
                  {firm.phase2Pct > 0 && (
                    <span className="block text-sm font-normal text-secondary">
                      / +{fmtMoney(phase2Target, lang)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-tertiary mt-2 leading-relaxed">
                  {es ? "Objetivos de rentabilidad auditados con control estricto de riesgo." : "Profit targets tracked with disciplined position sizing."}
                </p>
              </div>

              <div className="caja-cifra tj-paper rounded-[2px] border border-[rgb(var(--divider)/0.14)] p-5">
                <div className="mb-2 flex items-start justify-between gap-2 text-xs uppercase tracking-wider text-tertiary [&>span]:min-w-0">
                  <span>{es ? "Riesgo seguro (0,75 %)" : "Safe risk (0.75%)"}</span>
                  <Target size={14} className="text-[rgb(var(--accent-base))]" />
                </div>
                <div className="cifra-xl font-mono font-semibold text-primary tnum">
                  {fmtMoney(maxSafeRiskPerTrade, lang)}
                </div>
                <p className="text-xs text-tertiary mt-2 leading-relaxed">
                  {es ? "Otorga 6 pérdidas consecutivas de colchón antes de rozar el límite diario." : "Allows 6 consecutive losses buffer before daily limit."}
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="section border-y border-[rgb(var(--divider)/0.08)]">
          <div className="tj-container">
            <div className="max-w-3xl mb-8">
              <p className="eyebrow">{es ? "Playbooks en vivo" : "Live playbooks"}</p>
              <h2 className="mt-3 text-2xl md:text-3xl font-semibold text-primary">
                {es ? "Separa tus patrones ganadores de tus impulsos." : "Separate your winning patterns from your impulses."}
              </h2>
              <p className="mt-3 text-secondary text-sm md:text-base leading-relaxed">
                {es
                  ? "Un trader manual no falla por análisis técnico, falla por falta de consistencia en la ejecución. Compara la muestra real de tus principales setups."
                  : "A manual trader does not fail due to technical charts, but from inconsistent execution. Compare the real sample of your key setups."}
              </p>
            </div>

            {/* Selector de setup manual */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { id: "breakout" as const, labelEs: "Ruptura de Rango (Breakout)", labelEn: "Range Breakout" },
                { id: "sweep" as const, labelEs: "Barrido de Liquidez (Sweep)", labelEn: "Liquidity Sweep" },
                { id: "reversion" as const, labelEs: "Reversión a la Media (Mean Reversion)", labelEn: "Mean Reversion" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={manualSetup === s.id}
                  onClick={() => setManualSetup(s.id)}
                  className={`toque-comodo h-9 px-4 rounded-[2px] text-xs font-semibold transition-all ${
                    manualSetup === s.id
                      ? "bg-[rgb(var(--accent-base))] text-[rgb(var(--accent-ink))]"
                      : "border border-[rgb(var(--divider)/0.15)] bg-[rgb(var(--divider)/0.03)] text-secondary hover:text-primary hover:border-[rgb(var(--divider)/0.3)]"
                  }`}
                >
                  {es ? s.labelEs : s.labelEn}
                </button>
              ))}
            </div>

            {/* Tarjeta de métricas del setup */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="caja-cifra tj-paper rounded-[2px] border border-[rgb(var(--divider)/0.14)] p-5">
                <span className="text-xs uppercase tracking-wider text-tertiary block mb-2">{es ? "Expectancy en R" : "Expectancy in R"}</span>
                <span style={{ fontSize: "clamp(1.05rem, 3.4vw, 1.5rem)" }}
                  className="whitespace-nowrap font-mono font-semibold text-[rgb(var(--pnl-pos))] tnum">
                  {manualSetup === "breakout" ? "+0.84 R" : manualSetup === "sweep" ? "+1.12 R" : "+0.42 R"}
                </span>
                <span className="text-xs text-secondary block mt-2">
                  {manualSetup === "breakout"
                    ? (es ? "42 operaciones registradas" : "42 recorded trades")
                    : manualSetup === "sweep"
                    ? (es ? "31 operaciones registradas" : "31 recorded trades")
                    : (es ? "19 operaciones registradas" : "19 recorded trades")}
                </span>
              </div>

              <div className="caja-cifra tj-paper rounded-[2px] border border-[rgb(var(--divider)/0.14)] p-5">
                <span className="text-xs uppercase tracking-wider text-tertiary block mb-2">{es ? "Win Rate & Payoff" : "Win Rate & Payoff"}</span>
                <span style={{ fontSize: "clamp(1.05rem, 3.4vw, 1.5rem)" }}
                  className="whitespace-nowrap font-mono font-semibold text-primary tnum">
                  {es
                    ? (manualSetup === "breakout" ? "54 % · 1:2,4 R:R" : manualSetup === "sweep" ? "48 % · 1:3,1 R:R" : "61 % · 1:1,3 R:R")
                    : (manualSetup === "breakout" ? "54% · 1:2.4 R:R" : manualSetup === "sweep" ? "48% · 1:3.1 R:R" : "61% · 1:1.3 R:R")}
                </span>
                <span className="text-xs text-secondary block mt-2">
                  {es ? "Ventaja estadísticamente significativa" : "Statistically significant edge"}
                </span>
              </div>

              <div className="caja-cifra tj-paper rounded-[2px] border border-[rgb(var(--divider)/0.14)] p-5">
                <span className="text-xs uppercase tracking-wider text-tertiary block mb-2">{es ? "Cumplimiento de plan" : "Plan compliance"}</span>
                <span style={{ fontSize: "clamp(1.05rem, 3.4vw, 1.5rem)" }}
                  className="whitespace-nowrap font-mono font-semibold text-primary tnum">
                  {(manualSetup === "breakout" ? "92" : manualSetup === "sweep" ? "86" : "74") + (es ? " %" : "%")}
                </span>
                <span className="text-xs text-[rgb(var(--pnl-neg))] block mt-2">
                  {manualSetup === "reversion"
                    ? (es ? "Fuga de capital detectada en salidas prematuras" : "Capital leak detected on early exits")
                    : (es ? "Proceso consistente y repetible" : "Consistent, repeatable process")}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="tj-container">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="eyebrow">{es ? "Prueba antes de entrar" : "See it before you join"}</p>
              <h2 className="mt-5 t-h2 text-primary">{es ? "Explora la app con datos de muestra." : "Explore the app with sample data."}</h2>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-secondary">
                {es ? "La demo es navegable y no pide registro. Recorre el flujo que más se parece a tu día y decide si merece la pena solicitar acceso." : "The demo is clickable and asks for no sign-up. Follow the workflow closest to your day and decide whether it is worth requesting access."}
              </p>
              <Link href="/demo" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-[2px] border border-[rgb(var(--divider)/0.2)] px-5 text-sm font-semibold text-primary hover:bg-[rgb(var(--divider)/0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]">
                {es ? "Abrir la demo" : "Open the demo"}<ArrowRight size={15} aria-hidden />
              </Link>
            </div>
            <div className="border-l border-[rgb(var(--accent-base)/0.35)] pl-6 sm:pl-8">
              <p className="text-sm uppercase tracking-[0.16em] text-tertiary">{es ? "Criterio de acceso" : "Access principle"}</p>
              <p className="mt-4 font-serif text-2xl leading-tight text-primary">{es ? "No buscamos espectadores. Buscamos traders que quieran medir una decisión concreta." : "We are not looking for spectators. We are looking for traders willing to measure one concrete decision."}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-veil">
        <div className="tj-container">
          <div className="tj-paper border border-[rgb(var(--divider)/0.14)] p-6 sm:p-8">
            <p className="eyebrow">{es ? "Siguiente paso" : "Next step"}</p>
            <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="t-h3 text-primary">{es ? "Solicita acceso al piloto privado." : "Request access to the private pilot."}</h2>
                <p className="mt-3 max-w-2xl text-secondary">{es ? "Acceso por revisión de perfil, sin compromiso de compra y con la demo disponible antes de solicitarlo." : "Access reviewed by profile, no purchase commitment, with the demo available before you request it."}</p>
              </div>
              <Link href="/beta" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-[2px] bg-[rgb(var(--accent-base))] px-5 text-sm font-semibold text-[rgb(var(--accent-ink))] hover:bg-[rgb(var(--accent-hover))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]">{es ? data.ctaEs : data.ctaEn}<ArrowRight size={15} aria-hidden /></Link>
            </div>
          </div>
        </div>
      </section>
      <FinalCTANew />
    </>
  );
}
