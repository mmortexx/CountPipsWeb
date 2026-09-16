"use client";

import { useState, useMemo } from "react";
import { useLang } from "@/lib/i18n";
import { SectionHeader } from "@/components/layout/SectionHeader";

/** Índice de funciones de /features: se filtra por ejes y marca lo que es exclusivo de Pro. */

type Tag = "metrics" | "discipline" | "security" | "speed" | "local" | "multi" | "export" | "psychology";

type Feature = {
  id: string;
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
  tags: Tag[];
  pro?: boolean;
};

const TAGS: { id: Tag; labelEs: string; labelEn: string; icon: string }[] = [
  { id: "metrics", labelEs: "Métricas", labelEn: "Metrics", icon: "chart" },
  { id: "discipline", labelEs: "Disciplina", labelEn: "Discipline", icon: "shield" },
  { id: "security", labelEs: "Privacidad", labelEn: "Privacy", icon: "lock" },
  { id: "speed", labelEs: "Rapidez", labelEn: "Speed", icon: "bolt" },
  { id: "local", labelEs: "En tu equipo", labelEn: "On your machine", icon: "disk" },
  { id: "multi", labelEs: "Multi-cuenta", labelEn: "Multi-account", icon: "layers" },
  { id: "export", labelEs: "Exportar", labelEn: "Export", icon: "download" },
  { id: "psychology", labelEs: "Psicología", labelEn: "Psychology", icon: "brain" },
];

const FEATURES: Feature[] = [
  {
    id: "ratios",
    titleEs: "40+ ratios institucionales",
    titleEn: "40+ institutional ratios",
    descEs: "Sharpe, Sortino, Calmar, profit factor, expectancy en R. Calculados de tus operaciones, no inventados.",
    descEn: "Sharpe, Sortino, Calmar, profit factor, expectancy in R. Computed from your trades, not invented.",
    tags: ["metrics"],
  },
  {
    id: "equity",
    titleEs: "Curva de equity y drawdown",
    titleEn: "Equity curve and drawdown",
    descEs: "Tu capital y tu peor caída, al día con cada operación. El drawdown se mide desde el pico, como en un fondo.",
    descEn: "Your capital and your worst drop, updated with every trade. Drawdown measured from peak, like a fund.",
    tags: ["metrics", "speed"],
  },
  {
    id: "guardian",
    titleEs: "Guardián de disciplina",
    titleEn: "Discipline Guardian",
    descEs: "Semáforo de riesgo al registrar y freno duro opcional. Reglas por cuenta: riesgo por operación, pérdida diaria y semanal, drawdown y operaciones al día.",
    descEn: "Risk light when you log a trade and an optional hard brake. Rules per account: risk per trade, daily and weekly loss, drawdown and trades per day.",
    tags: ["discipline", "psychology"],
  },
  {
    id: "playbook",
    titleEs: "Playbooks con stats en vivo",
    titleEn: "Playbooks with live stats",
    descEs: "Documenta cada setup y mide su expectancy real. Sabes qué setup funciona y cuál no, con su muestra al lado.",
    descEn: "Document each setup and measure its real expectancy. Know which setup works and which does not, with its sample beside it.",
    tags: ["metrics", "discipline"],
  },
  {
    id: "journal",
    titleEs: "Diario narrativo",
    titleEn: "Narrative journal",
    descEs: "Anota el porqué de cada operación. El contexto que las métricas no capturan: estado, sesión, error.",
    descEn: "Annotate the why of each trade. The context metrics miss: state, session, mistake.",
    tags: ["psychology", "discipline"],
  },
  {
    id: "local",
    titleEs: "En tu equipo",
    titleEn: "On your machine",
    descEs: "Tus operaciones viven en tu disco. Sin cuenta, sin telemetría y sin servidores de CountPips. Cifrado EFS de Windows opcional.",
    descEn: "Your trades live on your disk. No account, no telemetry and no CountPips servers. Optional Windows EFS encryption.",
    tags: ["security", "local", "speed"],
  },
  {
    id: "sqlite",
    titleEs: "Un archivo .sqlite",
    titleEn: "One .sqlite file",
    descEs: "Una base de datos SQLite en un único archivo, con copias automáticas verificadas y restauración a la vista.",
    descEn: "A SQLite database in a single file, with verified automatic backups and visible restore.",
    tags: ["local", "export", "speed"],
  },
  {
    id: "multi",
    titleEs: "Multi-cuenta y multi-activo",
    titleEn: "Multi-account, multi-asset",
    descEs: "Acciones, futuros, forex y cripto. Varias cuentas, cada una con sus métricas: dos en Core e ilimitadas en Pro.",
    descEn: "Stocks, futures, forex and crypto. Several accounts, each with its own metrics: two in Core, unlimited in Pro.",
    tags: ["multi", "metrics"],
  },
  {
    id: "export",
    titleEs: "Export CSV/JSON/PDF",
    titleEn: "Export CSV/JSON/PDF",
    descEs: "Tus datos son tuyos. Exporta todo en formatos abiertos, sin bloqueo, cuando quieras.",
    descEn: "Your data is yours. Export everything in open formats, no lock-in, whenever you want.",
    tags: ["export", "local", "security"],
  },
  {
    id: "mae-mfe",
    titleEs: "MAE / MFE",
    titleEn: "MAE / MFE",
    descEs: "Maximum Adverse y Favorable Excursion: detecta si sales pronto o tarde de forma sistemática.",
    descEn: "Maximum Adverse and Favorable Excursion: detect if you exit early or late, systematically.",
    tags: ["metrics"],
  },
  {
    id: "montecarlo",
    titleEs: "Monte Carlo",
    titleEn: "Monte Carlo",
    descEs: "Remuestrea tu propio histórico y dibuja el abanico de balances y caídas posibles.",
    descEn: "Resamples your own history and draws the fan of possible balances and drawdowns.",
    tags: ["metrics"],
    pro: true,
  },
  {
    id: "ruina",
    titleEs: "Riesgo de ruina",
    titleEn: "Risk of ruin",
    descEs: "La probabilidad de quebrar la cuenta, simulada con tus propias operaciones.",
    descEn: "The probability of blowing the account, simulated from your own trades.",
    tags: ["metrics", "discipline"],
    pro: true,
  },
  {
    id: "tags",
    titleEs: "Etiquetas propias",
    titleEn: "Custom tags",
    descEs: "Etiqueta operaciones por sesión, estado emocional, régimen de mercado o lo que necesites.",
    descEn: "Tag trades by session, emotional state, market regime or whatever you need.",
    tags: ["psychology", "metrics"],
  },
  {
    id: "prop",
    titleEs: "Modo prop firm",
    titleEn: "Prop firm mode",
    descEs: "Plantillas de FTMO, Topstep, The5ers, FundedNext y Apex, panel de evaluación e informe en PDF.",
    descEn: "FTMO, Topstep, The5ers, FundedNext and Apex templates, an evaluation panel and a PDF report.",
    tags: ["multi", "discipline"],
    pro: true,
  },
  {
    id: "informes",
    titleEs: "Informes en PDF",
    titleEn: "PDF reports",
    descEs: "Informe mensual, ficha de rendimiento, extracto de cuenta e informe de disciplina.",
    descEn: "Monthly report, performance factsheet, account statement and discipline report.",
    tags: ["export", "metrics"],
  },
  {
    id: "fiscal",
    titleEs: "Módulo fiscal",
    titleEn: "Tax module",
    descEs: "Lotes, resumen del año e informe para tu asesor (España). No calcula la cuota a pagar.",
    descEn: "Lots, yearly summary and a report for your tax adviser (Spain). It never computes the tax due.",
    tags: ["export"],
    pro: true,
  },
  {
    id: "calendar",
    titleEs: "Calendario de P&L",
    titleEn: "P&L calendar",
    descEs: "Cada día pintado por su resultado. Ve rachas, días malos y patrones de un vistazo.",
    descEn: "Each day painted by its result. See streaks, bad days and patterns at a glance.",
    tags: ["metrics", "psychology"],
  },
  {
    id: "heatmap",
    titleEs: "Heatmap por día y hora",
    titleEn: "Day/hour heatmap",
    descEs: "¿Rindes mejor a primera hora o por la tarde? ¿Los lunes o los viernes? El mapa de calor cruza día y hora con tu resultado.",
    descEn: "Better early or in the afternoon? On Mondays or Fridays? The heatmap crosses day and hour with your result.",
    tags: ["metrics"],
  },
  {
    id: "native",
    titleEs: "Nativa de Windows",
    titleEn: "Native Windows app",
    descEs: "WinUI 3, no Electron. Arranca en 0,7 s con 50.000 operaciones (medido) y se integra con el sistema: bandeja, instancia única y tema claro u oscuro.",
    descEn: "WinUI 3, not Electron. Starts in 0.7 s with 50,000 trades (measured) and fits the system: tray, single instance and light or dark theme.",
    tags: ["speed", "local"],
  },
];

export function FeatureExplorer() {
  const { lang } = useLang();
  const es = lang === "es";
  const [selected, setSelected] = useState<Tag[]>([]);

  const toggle = (t: Tag) =>
    setSelected((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));

  // Score + sort
  const scored = useMemo(() => {
    if (selected.length === 0) return FEATURES.map((f) => ({ ...f, score: 0, matches: [] as Tag[] }));
    return FEATURES.map((f) => {
      const matches = f.tags.filter((t) => selected.includes(t));
      const score = Math.round((matches.length / selected.length) * 100);
      return { ...f, score, matches };
    }).sort((a, b) => b.score - a.score);
  }, [selected]);

  const topMatches = scored.filter((f) => f.score > 0);
  const hasSelection = selected.length > 0;

  return (
    <section className="section-tight">
      <div className="tj-container">
        <SectionHeader
          className="mb-8"
          etiqueta={es ? "Índice" : "Index"}
          titulo={es ? (
            <>Elige el eje. <span className="text-gradient tj-frase-nueva">Sale lo que encaja.</span></>
          ) : (
            <>Pick the axis. <span className="text-gradient tj-frase-nueva">What fits comes up.</span></>
          )}
          entradilla={es
            ? "Todo lo que hace el programa. Marca uno o varios ejes y la lista se recorta a lo que hace de verdad en ese terreno."
            : "Everything the program does. Mark one or more axes and the list trims to what it actually does in that ground."}
        />

        {/* Tag chips */}
        <div className="flex flex-wrap gap-2 mb-8">
          {TAGS.map((t) => {
            const active = selected.includes(t.id);
            return (
              <button
                key={t.id}
                onClick={() => toggle(t.id)}
                className="inline-flex items-center gap-2 min-h-[44px] px-3.5 rounded-[4px] border text-[14px] font-medium transition-[background-color,border-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]"
                style={{
                  background: active ? "var(--ink)" : "transparent",
                  borderColor: active ? "var(--ink)" : "var(--line-2)",
                  color: active ? "var(--bg)" : "var(--ink-2)",
                }}
                aria-pressed={active}
              >
                <TagIcon name={t.icon} />
                {es ? t.labelEs : t.labelEn}
              </button>
            );
          })}
          {hasSelection && (
            <button
              onClick={() => setSelected([])}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-[4px] text-[13px] font-medium transition-colors"
              style={{ color: "var(--ink-3)" }}
              aria-label={es ? "Limpiar selección" : "Clear selection"}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {es ? "Limpiar" : "Clear"}
            </button>
          )}
        </div>

        {/* Results */}
        {hasSelection ? (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <span className="tnum" style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)" }}>
                {es ? "En este recorte" : "In this cut"} · {topMatches.length}
              </span>
              {topMatches.length === 0 && (
                <span className="text-[13px]" style={{ color: "var(--ink-3)" }}>
                  {es ? "Nada en esos ejes — prueba otro." : "Nothing on those axes — try another."}
                </span>
              )}
            </div>
            <ListaFunciones items={topMatches} es={es} />
          </div>
        ) : (
          // Empty state — show all features as a static grid
          <div>
            <div className="mb-4">
              <span className="tnum" style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)" }}>
                {es ? "Todas las características" : "All features"} · {FEATURES.length}
              </span>
            </div>
            <ListaFunciones items={FEATURES} es={es} />
          </div>
        )}
      </div>
    </section>
  );
}

function ListaFunciones({ items, es }: { items: Feature[]; es: boolean }) {
  return (
    <ul className="m-0 border-t border-[var(--line)] p-0">
      {items.map((f) => (
        <li
          key={f.id}
          /* La descripción se acota en caracteres, no en fracciones: con
             `1.8fr` corría hasta el final del contenedor y las líneas
             pasaban de cien caracteres, que es donde el ojo ya pierde el
             renglón al volver. */
          className="grid gap-1 border-b border-[var(--line)] py-4 sm:grid-cols-[minmax(0,17rem)_minmax(0,72ch)] sm:items-baseline sm:gap-10"
        >
          <h3 className="m-0 flex items-baseline gap-2.5 text-[15px] font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
            {es ? f.titleEs : f.titleEn}
            {f.pro && (
              <span className="relative -top-px rounded-[4px] border border-[var(--line-2)] px-1.5 py-px text-[10px] font-semibold uppercase tracking-[0.08em] text-tertiary">
                Pro
              </span>
            )}
          </h3>
          <p className="m-0 text-[14px] leading-[1.5]" style={{ color: "var(--ink-2)" }}>
            {es ? f.descEs : f.descEn}
          </p>
        </li>
      ))}
    </ul>
  );
}

/* ── TagIcon — iconos SVG inline ── */
function TagIcon({ name }: { name: string }) {
  const s = 14;
  switch (name) {
    case "chart":
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 14h12M4 11V7M7.5 11V4M11 11V8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>;
    case "shield":
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 1.5l5 2v4c0 3-2 5.5-5 7-3-1.5-5-4-5-7v-4l5-2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>;
    case "lock":
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.4" /><path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>;
    case "bolt":
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M9 1L3 9h4l-1 6 6-8H8l1-6z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>;
    case "disk":
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2.5" y="2.5" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" /><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" /></svg>;
    case "layers":
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 2l6 3-6 3-6-3 6-3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /><path d="M2 8l6 3 6-3M2 11l6 3 6-3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>;
    case "download":
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 2v8M5 7l3 3 3-3M3 14h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
    case "brain":
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 3a2 2 0 00-2 2 2 2 0 00-1 4 2 2 0 001 3 2 2 0 004 0V5a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>;
    default:
      return null;
  }
}
