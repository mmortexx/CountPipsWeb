"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { FinalCTANew } from "@/components/marketing/FinalCTANew";
import { useLang } from "@/lib/i18n";
import { fmtMoney, fmtPct } from "@/lib/trading/format";
import { Link } from "@/components/tj/LocaleLink";

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
      { titleEs: "Métricas que explican", titleEn: "Metrics that explain", textEs: "Expectancy, profit factor, drawdown y distribución de R en el mismo lugar que tus operaciones.", textEn: "Expectancy, profit factor, drawdown and R distribution next to the trades that produced them." },
      { titleEs: "Playbooks vivos", titleEn: "Living playbooks", textEs: "Compara setups con una muestra real y deja de confundir una buena racha con una ventaja.", textEn: "Compare setups against a real sample and stop confusing a good run with an edge." },
      { titleEs: "Revisión sin excusas", titleEn: "No-excuse review", textEs: "Anota el plan, la gestión y el cierre para ver dónde se rompe tu proceso.", textEn: "Capture plan, management and exit so you can see where your process breaks." },
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
      { titleEs: "Riesgo que se ve", titleEn: "Visible risk", textEs: "Revisa drawdown, rachas y exposición antes de que una operación te saque del plan.", textEn: "Review drawdown, streaks and exposure before one trade takes you outside the plan." },
      { titleEs: "Informe de evaluación", titleEn: "Evaluation report", textEs: "Un PDF con el progreso al objetivo, el riesgo disponible hoy y el colchón hasta el límite de pérdida.", textEn: "A PDF with progress to target, risk available today and the buffer to the loss limit." },
      { titleEs: "Reglas verificables", titleEn: "Verifiable rules", textEs: "Usa el diario para detectar incumplimientos recurrentes y preparar la siguiente evaluación.", textEn: "Use the journal to spot recurring breaches and prepare for the next evaluation." },
    ],
  },
} as const;

/** Riesgo por operación del ejemplo, en %: la ficha, su colchón y el enlace al simulador. */
const RIESGO_PCT = 0.75;

/* Los mismos valores que las plantillas del programa (`PropFirmTemplates.cs`,
   revisadas el 22/07/2026): la variante más común de cada firma. */
const PROP_FIRMS = [
  { id: "ftmo" as const, name: "FTMO", typeEs: "Drawdown estático", typeEn: "Static drawdown", dailyPct: 5, maxDDPct: 10, phase1Pct: 10, phase2Pct: 0, trailingType: "static" },
  { id: "topstep" as const, name: "Topstep", typeEs: "Drawdown dinámico", typeEn: "Trailing drawdown", dailyPct: 2, maxDDPct: 4, phase1Pct: 6, phase2Pct: 0, trailingType: "trailing" },
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
  const maxSafeRiskPerTrade = propBalance * (RIESGO_PCT / 100);

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
            entradilla={es ? "Es qué parte de tu proceso merece repetirse, y qué parte necesita una regla antes de volver al mercado." : "It’s which part of your process is worth repeating, and which part needs a rule before you go back to the market."}
          />
          {/* Sin 01/02/03: son tres capacidades, no tres pasos. */}
          <ul className="mt-12 m-0 list-none border-t border-[var(--line)] p-0">
            {data.cards.map(({ titleEs, titleEn, textEs, textEn }) => (
              <li
                key={titleEs}
                className="grid gap-y-1 border-b border-[var(--line)] py-5 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] md:items-baseline md:gap-x-6"
              >
                <h3 className="m-0 text-[clamp(1.125rem,1.6vw,1.375rem)] font-medium text-primary">
                  {es ? titleEs : titleEn}
                </h3>
                <p className="medida m-0 text-[15px] leading-[1.6] text-secondary">
                  {es ? textEs : textEn}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* SECCIÓN INTERACTIVA ESPECÍFICA POR PERFIL */}
      {profile === "prop" ? (
        <section className="section">
          <div className="tj-container">
            <SectionHeader
              etiqueta={es ? "Reglas de evaluación y fondeo" : "Evaluation & funding rules"}
              titulo={es ? "Las reglas de tu firma, con cada operación." : "Your firm’s rules, with every trade."}
              entradilla={es ? "Elige firma y tamaño de cuenta. El modo prop firm aplica la plantilla de la firma y sigue la pérdida diaria, el drawdown y el objetivo con cada operación que registras. Ejemplo con valores de muestra." : "Pick a firm and account size. Prop firm mode applies the firm template and tracks daily loss, drawdown and the target with every trade you log. Example with sample values."}
              className="mb-10"
            />

            {/* Selectores: Firma y Balance. Los dos son ya el conmutador
                segmentado del sitio —el mismo que el selector de setups de
                más abajo y los del proyector—. Eran dos fichas hechas a
                mano que ni siquiera coincidían entre sí puestas una al lado
                de la otra: la de firma pintaba el elegido con el acento y
                la de importe con la tinta. */}
            <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:flex-wrap sm:items-start sm:gap-4">
              <div className="tj-segmentado tj-segmentado-apila sm:max-w-2xl sm:flex-1" role="group">
                {PROP_FIRMS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={selectedFirm === f.id}
                    onClick={() => setSelectedFirm(f.id)}
                    className="toque-comodo"
                  >
                    <span className="flex flex-col items-center py-1 leading-tight">
                      <span>{f.name}</span>
                      <span className="text-[11px] font-normal text-tertiary">{es ? f.typeEs : f.typeEn}</span>
                    </span>
                  </button>
                ))}
              </div>

              <div className="tj-segmentado" role="group">
                {PROP_BALANCES.map((bal) => (
                  <button
                    key={bal}
                    type="button"
                    aria-pressed={propBalance === bal}
                    onClick={() => {
                      setPropBalance(bal);
                      setCurrentEquity(bal * 1.035);
                    }}
                    className="toque-comodo"
                  >
                    {es ? `${bal / 1000}\u00a0k $` : `$${bal / 1000}k`}
                  </button>
                ))}
              </div>
            </div>

            {/* Monitor de Trailing Drawdown y Distancia al Umbral */}
            <div className="mb-6 border-y border-[var(--ficha-division)] py-4">
              {/* Apilado por debajo de `sm`: en una sola fila, el rotulo y la
                  cifra se metian el uno dentro del otro a 390 px. */}
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-xs mb-2">
                <span className="font-semibold text-primary">
                  {es ? "Colchón hasta el límite de pérdida total" : "Buffer to the overall loss limit"}
                </span>
                <span className="font-semibold text-primary tnum">
                  {fmtMoney(distanceToLiquidation, lang)}
                </span>
              </div>
              <div className="relative h-[3px] rounded-[1px] overflow-hidden bg-[var(--ficha-division)]">
                <div
                  className="h-full transition-[width] duration-300"
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
            <div className="tj-matriz grid-cols-1 border-b border-[var(--ficha-division)] sm:grid-cols-2 lg:grid-cols-4">
              <div className="caja-cifra p-5">
                <div className="mb-2 flex items-start justify-between gap-2 text-xs text-tertiary [&>span]:min-w-0">
                  <span>{es ? `Límite diario (${firm.dailyPct}\u00a0%)` : `Daily limit (${firm.dailyPct}%)`}</span>
                </div>
                <div className="cifra-xl font-semibold text-[rgb(var(--pnl-neg))] tnum">
                  −{fmtMoney(dailyLossLimit, lang)}
                </div>
                <p className="text-xs text-tertiary mt-2 leading-relaxed">
                  {es ? "Aviso cuando te acercas. El freno duro va con tus propias reglas de riesgo: pon tu pérdida diaria dentro de este límite y dejarás de registrar operaciones nuevas antes de tocarlo." : "An alert as you get close. The hard brake runs on your own risk rules: set your daily loss inside this limit and new trades stop being logged before you reach it."}
                </p>
              </div>

              <div className="caja-cifra p-5">
                <div className="mb-2 flex items-start justify-between gap-2 text-xs text-tertiary [&>span]:min-w-0">
                  <span>{es ? `Drawdown m\u00e1ximo (${firm.maxDDPct}\u00a0%)` : `Max drawdown (${firm.maxDDPct}%)`}</span>
                </div>
                <div className="cifra-xl font-semibold text-[rgb(var(--pnl-neg))] tnum">
                  −{fmtMoney(maxTrailingLoss, lang)}
                </div>
                <p className="text-xs text-tertiary mt-2 leading-relaxed">
                  {firm.trailingType === "static"
                    ? (es ? "Drawdown estático respecto al balance de inicio." : "Static drawdown anchored to initial balance.")
                    : (es ? "Drawdown dinámico: sigue al pico del balance." : "Trailing drawdown: follows the balance peak.")}
                </p>
              </div>

              <div className="caja-cifra p-5">
                <div className="mb-2 flex items-start justify-between gap-2 text-xs text-tertiary [&>span]:min-w-0">
                  <span>{es ? `Fase 1 (+${firm.phase1Pct}\u00a0%) ${firm.phase2Pct > 0 ? `/ F2 (+${firm.phase2Pct}\u00a0%)` : ""}` : `Phase 1 (+${firm.phase1Pct}%) ${firm.phase2Pct > 0 ? `/ P2 (+${firm.phase2Pct}%)` : ""}`}</span>
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

              <div className="caja-cifra p-5">
                <div className="mb-2 flex items-start justify-between gap-2 text-xs text-tertiary [&>span]:min-w-0">
                  <span>{es ? "Riesgo por operación" : "Risk per trade"} ({fmtPct(RIESGO_PCT / 100, lang, 2)})</span>
                </div>
                <div className="cifra-xl font-semibold text-primary tnum">
                  {fmtMoney(maxSafeRiskPerTrade, lang)}
                </div>
                <p className="text-xs text-tertiary mt-2 leading-relaxed">
                  {es ? `Deja ${Math.floor(firm.dailyPct / RIESGO_PCT)} pérdidas seguidas de colchón antes del límite diario.` : `Leaves a buffer of ${Math.floor(firm.dailyPct / RIESGO_PCT)} straight losses before the daily limit.`}
                </p>
              </div>
            </div>

            {/* Las reglas de la firma elegida viajan en la dirección: el
                simulador abre ya con su objetivo, su drawdown y su tipo. */}
            <p className="mt-6 text-[14px]">
              <Link
                href={`/herramientas/prueba-de-fondeo?objetivo=${firm.phase1Pct}&dd=${firm.maxDDPct}&tipo=${firm.trailingType === "static" ? "estatico" : "dinamico"}&riesgo=${RIESGO_PCT}`}
                className="link-underline-host group -my-3 inline-flex items-center gap-1.5 py-3 text-secondary transition-colors hover:text-primary"
              >
                <span className="link-underline">
                  {es
                    ? `Cuántas veces aprobarías la prueba de ${firm.name}, con tu acierto y tu payoff`
                    : `How often you would pass the ${firm.name} challenge, with your win rate and payoff`}
                </span>
                <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </Link>
            </p>
          </div>
        </section>
      ) : (
        <section className="section">
          <div className="tj-container">
            <SectionHeader
              etiqueta={es ? "Playbooks en vivo" : "Live playbooks"}
              titulo={es ? "Separa tus patrones ganadores de tus impulsos." : "Separate your winning patterns from your impulses."}
              entradilla={es ? "Un trader manual rara vez falla por el análisis: falla porque no ejecuta siempre igual. El playbook compara la muestra real de cada setup; aquí, con datos de muestra." : "A manual trader does not fail because of technical analysis: they fail because execution is not consistent. The playbook compares the real sample of each setup — here, with sample data."}
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
            <div className="tj-matriz grid-cols-1 border-b border-[var(--ficha-division)] md:grid-cols-3">
              <div className="caja-cifra p-5">
                <span className="text-xs text-tertiary block mb-2">{es ? "Expectancy en R" : "Expectancy in R"}</span>
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

              <div className="caja-cifra p-5">
                <span className="text-xs text-tertiary block mb-2">{es ? "Acierto y payoff" : "Win rate & payoff"}</span>
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

              <div className="caja-cifra p-5">
                <span className="text-xs text-tertiary block mb-2">{es ? "Cumplimiento de plan" : "Plan compliance"}</span>
                <span style={{ fontSize: "clamp(1.05rem, 3.4vw, 1.5rem)" }}
                  className="whitespace-nowrap font-semibold text-primary tnum">
                  {(manualSetup === "breakout" ? "92" : manualSetup === "sweep" ? "86" : "74") + (es ? "\u00a0%" : "%")}
                </span>
                {/* El color seguia al rotulo y no al mensaje: estaba fijo en
                    rojo mientras el texto cambia de aviso a elogio segun el
                    setup, asi que "Proceso estable y repetible" salia
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
                    : (es ? "Proceso estable y repetible" : "Consistent, repeatable process")}
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
