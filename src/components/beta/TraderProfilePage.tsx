"use client";

import { useState } from "react";
import { BarChart3, BookOpenCheck, ShieldCheck, Target, CheckCircle2, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { FinalCTANew } from "@/components/marketing/FinalCTANew";
import { useLang } from "@/lib/i18n";
import { fmtMoney } from "@/lib/trading/format";

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
      { icon: BarChart3, titleEs: "Informe de evaluación", titleEn: "Evaluation report", textEs: "Un PDF con el progreso al objetivo, el riesgo disponible hoy y el colchón hasta el límite de pérdida.", textEn: "A PDF with progress to target, risk available today and the buffer to the loss limit." },
      { icon: Target, titleEs: "Reglas verificables", titleEn: "Verifiable rules", textEs: "Usa el diario para detectar incumplimientos recurrentes y preparar la siguiente evaluación.", textEn: "Use the journal to spot recurring breaches and prepare for the next evaluation." },
    ],
  },
} as const;

/* Los mismos valores que las plantillas del programa (`PropFirmTemplates.cs`,
   revisadas el 22/07/2026): la variante más común de cada firma. */
const PROP_FIRMS = [
  { id: "ftmo" as const, name: "FTMO", typeEs: "Drawdown estático", typeEn: "Static drawdown", dailyPct: 5, maxDDPct: 10, phase1Pct: 10, phase2Pct: 0, trailingType: "static" },
  { id: "topstep" as const, name: "Topstep", typeEs: "Drawdown trailing", typeEn: "Trailing drawdown", dailyPct: 2, maxDDPct: 4, phase1Pct: 6, phase2Pct: 0, trailingType: "trailing" },
  { id: "the5ers" as const, name: "The5ers", typeEs: "Drawdown estático", typeEn: "Static drawdown", dailyPct: 5, maxDDPct: 5, phase1Pct: 8, phase2Pct: 0, trailingType: "static" },
];

const PROP_BALANCES = [25000, 50000, 100000, 200000];

export function TraderProfileBody({ profile }: { profile: TraderProfile }) {
  const { lang } = useLang();
  const es = lang === "es";
  const data = DATA[profile];

  // Estado interactivo para prop firm
  const [selectedFirm, setSelectedFirm] = useState<"ftmo" | "topstep" | "the5ers">("ftmo");
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

  // Límite de pérdida total: fijo sobre el balance inicial o trailing sobre el pico
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

      <section className="section">
        <div className="tj-container">
          <SectionHeader
            composicion="partida"
            etiqueta={es ? "Un flujo pensado para tu contexto" : "A workflow shaped for your context"}
            titulo={es ? "La pregunta no es cuánto ganaste." : "The question is not how much you made."}
            entradilla={es ? "Es qué parte de tu proceso merece repetirse, y qué parte necesita una regla antes de volver al mercado." : "It is which part of your process deserves repeating, and which part needs a rule before you return to the market."}
          />
          <ol className="mt-12 m-0 border-t border-[var(--line)] p-0">
            {data.cards.map(({ titleEs, titleEn, textEs, textEn }, i) => (
              <li
                key={titleEs}
                className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-3 gap-y-1 border-b border-[var(--line)] py-5 md:grid-cols-[2.75rem_minmax(0,16rem)_minmax(0,1fr)] md:items-baseline md:gap-x-6"
              >
                <span
                  className="tnum text-[12px] font-semibold"
                  style={{ color: "rgb(var(--accent-base))" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="m-0 text-[clamp(1.125rem,1.6vw,1.375rem)] font-medium text-primary">
                  {es ? titleEs : titleEn}
                </h3>
                <p className="col-start-2 m-0 text-[15px] leading-[1.6] text-secondary md:col-start-3">
                  {es ? textEs : textEn}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* SECCIÓN INTERACTIVA ESPECÍFICA POR PERFIL */}
      {profile === "prop" ? (
        <section className="section">
          <div className="tj-container">
            <SectionHeader
              etiqueta={es ? "Reglas de evaluación y fondeo" : "Evaluation & funding rules"}
              titulo={es ? "El Guardián calibrado para tu firma y cuenta." : "The Guardian calibrated for your firm and account."}
              entradilla={es ? "Elige firma y tamaño de cuenta. El modo prop firm aplica la plantilla de la firma y sigue la pérdida diaria, el drawdown y el objetivo con cada operación que registras. Ejemplo con valores de muestra." : "Pick a firm and account size. Prop firm mode applies the firm template and tracks daily loss, drawdown and the target with every trade you log. Example with sample values."}
              className="mb-10"
            />

            {/* Selectores: Firma y Balance */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              {/* `items-stretch` y `min-h-8`, no `items-center` y `h-8`. Con
                  alto FIJO, "FTMO (Drawdown estático)" envolvía a tres líneas
                  a 390 px y la tercera —"estático)"— se salía por debajo del
                  fondo de su propia ficha, encima de la fila de importes. Es
                  el mismo fallo que el deslizador de 36 px de la sexta tanda:
                  una altura escrita a mano que el contenido desborda. Con el
                  mínimo, la ficha crece y las tres comparten la más alta. */}
              <div className="flex items-stretch gap-1 p-1 rounded-[4px] border border-[rgb(var(--divider)/0.12)] bg-[rgb(var(--divider)/0.03)]">
                {PROP_FIRMS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFirm(f.id)}
                    className={`toque-comodo min-h-8 px-3 py-1.5 rounded-[4px] text-xs font-semibold leading-tight text-center transition-all ${
                      selectedFirm === f.id
                        ? "bg-[rgb(var(--accent-base))] text-[rgb(var(--accent-ink))]"
                        : "text-secondary hover:text-primary"
                    }`}
                  >
                    {f.name} ({es ? f.typeEs : f.typeEn})
                  </button>
                ))}
              </div>

              <div className="flex items-stretch gap-1 p-1 rounded-[4px] border border-[rgb(var(--divider)/0.12)] bg-[rgb(var(--divider)/0.03)]">
                {PROP_BALANCES.map((bal) => (
                  <button
                    key={bal}
                    type="button"
                    onClick={() => {
                      setPropBalance(bal);
                      setCurrentEquity(bal * 1.035);
                    }}
                    className={`toque-comodo min-h-8 px-3 py-1.5 rounded-[4px] text-xs font-semibold leading-tight tnum transition-all ${
                      propBalance === bal
                        ? "bg-primary text-[var(--surface)]"
                        : "text-secondary hover:text-primary"
                    }`}
                  >
                    {es ? `${bal / 1000}\u00a0k $` : `$${bal / 1000}k`}
                  </button>
                ))}
              </div>
            </div>

            {/* Monitor de Trailing Drawdown y Distancia al Umbral */}
            <div className="p-4 rounded-[8px] border border-[rgb(var(--divider)/0.12)] bg-[rgb(var(--divider)/0.02)] mb-6">
              {/* Apilado por debajo de `sm`: en una sola fila, el rotulo y la
                  cifra se metian el uno dentro del otro a 390 px. */}
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-xs mb-2">
                <span className="font-semibold text-primary">
                  {es ? "Colchón hasta el límite de pérdida total" : "Buffer to the overall loss limit"}
                </span>
                <span className="font-bold text-primary tnum">
                  {fmtMoney(distanceToLiquidation, lang)}
                </span>
              </div>
              <div className="relative h-2.5 rounded-[4px] overflow-hidden bg-[rgb(var(--divider)/0.12)]">
                <div
                  className="h-full rounded-[4px] transition-all duration-300"
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
              <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[12px] tnum text-tertiary">
                <span>{es ? "Límite:" : "Limit:"} {fmtMoney(liquidationThreshold, lang)}</span>
                <span>{es ? "Equity actual:" : "Current equity:"} {fmtMoney(currentEquity, lang)}</span>
                <span>{es ? "Pico máximo:" : "High-water mark:"} {fmtMoney(peakEquity, lang)}</span>
              </div>
            </div>

            {/* Matriz de parámetros de prop firm */}
            <div data-orden className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="caja-cifra tj-paper rounded-[8px] border border-[rgb(var(--divider)/0.14)] p-5">
                <div className="mb-2 flex items-start justify-between gap-2 text-xs uppercase tracking-wider text-tertiary [&>span]:min-w-0">
                  <span>{es ? `Límite diario (${firm.dailyPct}\u00a0%)` : `Daily limit (${firm.dailyPct}%)`}</span>
                  <AlertTriangle size={14} className="text-[rgb(var(--pnl-neg))]" />
                </div>
                <div className="cifra-xl font-semibold text-[rgb(var(--pnl-neg))] tnum">
                  −{fmtMoney(dailyLossLimit, lang)}
                </div>
                <p className="text-xs text-tertiary mt-2 leading-relaxed">
                  {es ? "Aviso preventivo antes de tocarlo; con el freno duro activado, dejas de registrar operaciones nuevas." : "A preventive alert before you reach it; with the hard brake on, new trades stop being logged."}
                </p>
              </div>

              <div className="caja-cifra tj-paper rounded-[8px] border border-[rgb(var(--divider)/0.14)] p-5">
                <div className="mb-2 flex items-start justify-between gap-2 text-xs uppercase tracking-wider text-tertiary [&>span]:min-w-0">
                  <span>{es ? `Max Drawdown (${firm.maxDDPct}\u00a0%)` : `Max Drawdown (${firm.maxDDPct}%)`}</span>
                  <ShieldCheck size={14} className="text-[rgb(var(--accent-base))]" />
                </div>
                <div className="cifra-xl font-semibold text-primary tnum">
                  −{fmtMoney(maxTrailingLoss, lang)}
                </div>
                <p className="text-xs text-tertiary mt-2 leading-relaxed">
                  {firm.trailingType === "static"
                    ? (es ? "Drawdown estático respecto al balance de inicio." : "Static drawdown anchored to initial balance.")
                    : (es ? "Trailing ajustado dinámicamente al pico de balance." : "Trailing dynamically tracking balance peak.")}
                </p>
              </div>

              <div className="caja-cifra tj-paper rounded-[8px] border border-[rgb(var(--divider)/0.14)] p-5">
                <div className="mb-2 flex items-start justify-between gap-2 text-xs uppercase tracking-wider text-tertiary [&>span]:min-w-0">
                  <span>{es ? `Fase 1 (+${firm.phase1Pct}\u00a0%) ${firm.phase2Pct > 0 ? `/ F2 (+${firm.phase2Pct}\u00a0%)` : ""}` : `Phase 1 (+${firm.phase1Pct}%) ${firm.phase2Pct > 0 ? `/ P2 (+${firm.phase2Pct}%)` : ""}`}</span>
                  <CheckCircle2 size={14} className="text-[rgb(var(--pnl-pos))]" />
                </div>
                <div className="cifra-xl font-semibold text-[rgb(var(--pnl-pos))] tnum">
                  +{fmtMoney(phase1Target, lang)}{" "}
                  {firm.phase2Pct > 0 && (
                    <span className="block text-sm font-normal text-secondary">
                      / +{fmtMoney(phase2Target, lang)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-tertiary mt-2 leading-relaxed">
                  {es ? "Objetivo de la plantilla; ajústalo a tu desafío concreto." : "The template target; adjust it to your specific challenge."}
                </p>
              </div>

              <div className="caja-cifra tj-paper rounded-[8px] border border-[rgb(var(--divider)/0.14)] p-5">
                <div className="mb-2 flex items-start justify-between gap-2 text-xs uppercase tracking-wider text-tertiary [&>span]:min-w-0">
                  <span>{es ? "Riesgo por operación (0,75\u00a0%)" : "Risk per trade (0.75%)"}</span>
                  <Target size={14} className="text-[rgb(var(--accent-base))]" />
                </div>
                <div className="cifra-xl font-semibold text-primary tnum">
                  {fmtMoney(maxSafeRiskPerTrade, lang)}
                </div>
                <p className="text-xs text-tertiary mt-2 leading-relaxed">
                  {es ? `Deja ${Math.floor(firm.dailyPct / 0.75)} pérdidas seguidas de colchón antes del límite diario.` : `Leaves a buffer of ${Math.floor(firm.dailyPct / 0.75)} straight losses before the daily limit.`}
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="section">
          <div className="tj-container">
            <SectionHeader
              etiqueta={es ? "Playbooks en vivo" : "Live playbooks"}
              titulo={es ? "Separa tus patrones ganadores de tus impulsos." : "Separate your winning patterns from your impulses."}
              entradilla={es ? "Un trader manual no falla por análisis técnico, falla por falta de consistencia en la ejecución. El playbook compara la muestra real de cada setup; aquí, con datos de muestra." : "A manual trader does not fail due to technical charts, but from inconsistent execution. The playbook compares the real sample of each setup; shown here with sample data."}
              className="mb-10"
            />

            {/* Selector de setup manual */}
            <div className="tj-segmentado tj-segmentado-apila mb-6 sm:max-w-xl" role="group">
              {[
                { id: "breakout" as const, labelEs: "Ruptura de rango", labelEn: "Range Breakout" },
                { id: "sweep" as const, labelEs: "Barrido de liquidez", labelEn: "Liquidity Sweep" },
                { id: "reversion" as const, labelEs: "Reversión a la media", labelEn: "Mean Reversion" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={manualSetup === s.id}
                  onClick={() => setManualSetup(s.id)}
                  className="toque-comodo"
                >
                  {es ? s.labelEs : s.labelEn}
                </button>
              ))}
            </div>

            {/* Tarjeta de métricas del setup */}
            <div data-orden className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="caja-cifra tj-paper rounded-[8px] border border-[rgb(var(--divider)/0.14)] p-5">
                <span className="text-xs uppercase tracking-wider text-tertiary block mb-2">{es ? "Expectancy en R" : "Expectancy in R"}</span>
                <span style={{ fontSize: "clamp(1.05rem, 3.4vw, 1.5rem)" }}
                  className="whitespace-nowrap font-semibold text-[rgb(var(--pnl-pos))] tnum">
                  {es
                    ? (manualSetup === "breakout" ? "+0,84 R" : manualSetup === "sweep" ? "+0,97 R" : "+0,40 R")
                    : (manualSetup === "breakout" ? "+0.84 R" : manualSetup === "sweep" ? "+0.97 R" : "+0.40 R")}
                </span>
                <span className="text-xs text-secondary block mt-2">
                  {manualSetup === "breakout"
                    ? (es ? "42 operaciones registradas" : "42 recorded trades")
                    : manualSetup === "sweep"
                    ? (es ? "31 operaciones registradas" : "31 recorded trades")
                    : (es ? "19 operaciones registradas" : "19 recorded trades")}
                </span>
              </div>

              <div className="caja-cifra tj-paper rounded-[8px] border border-[rgb(var(--divider)/0.14)] p-5">
                <span className="text-xs uppercase tracking-wider text-tertiary block mb-2">{es ? "Win Rate & Payoff" : "Win Rate & Payoff"}</span>
                <span style={{ fontSize: "clamp(1.05rem, 3.4vw, 1.5rem)" }}
                  className="whitespace-nowrap font-semibold text-primary tnum">
                  {es
                    ? (manualSetup === "breakout" ? "54\u00a0% · 1:2,4 R:R" : manualSetup === "sweep" ? "48\u00a0% · 1:3,1 R:R" : "61\u00a0% · 1:1,3 R:R")
                    : (manualSetup === "breakout" ? "54% · 1:2.4 R:R" : manualSetup === "sweep" ? "48% · 1:3.1 R:R" : "61% · 1:1.3 R:R")}
                </span>
                <span className="text-xs text-secondary block mt-2">
                  {manualSetup === "reversion"
                    ? (es ? "Muestra aún corta para confirmar la ventaja" : "Sample still too short to confirm the edge")
                    : (es ? "Ventaja confirmada con esta muestra" : "Edge confirmed with this sample")}
                </span>
              </div>

              <div className="caja-cifra tj-paper rounded-[8px] border border-[rgb(var(--divider)/0.14)] p-5">
                <span className="text-xs uppercase tracking-wider text-tertiary block mb-2">{es ? "Cumplimiento de plan" : "Plan compliance"}</span>
                <span style={{ fontSize: "clamp(1.05rem, 3.4vw, 1.5rem)" }}
                  className="whitespace-nowrap font-semibold text-primary tnum">
                  {(manualSetup === "breakout" ? "92" : manualSetup === "sweep" ? "86" : "74") + (es ? "\u00a0%" : "%")}
                </span>
                {/* El color seguia al rotulo y no al mensaje: estaba fijo en
                    rojo mientras el texto cambia de aviso a elogio segun el
                    setup, asi que "Proceso consistente y repetible" salia
                    pintado de perdida en dos de los tres casos. Y va en la
                    familia del semaforo, no en la del P&L: esto es un
                    veredicto sobre el proceso, no una cifra de dinero. */}
                <span className={`text-xs block mt-2 ${
                  manualSetup === "reversion"
                    ? "text-[rgb(var(--sig-red))]"
                    : "text-[rgb(var(--sig-green))]"
                }`}>
                  {manualSetup === "reversion"
                    ? (es ? "Fuga de capital detectada en salidas prematuras" : "Capital leak detected on early exits")
                    : (es ? "Proceso consistente y repetible" : "Consistent, repeatable process")}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      <FinalCTANew />
    </>
  );
}
