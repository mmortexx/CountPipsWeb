"use client";

import { useState, useMemo } from "react";
import { useLang } from "@/lib/i18n";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { fmtInt } from "@/lib/trading/format";
import { ResultadoAnunciado } from "@/components/tj/ResultadoAnunciado";
import { PROGRAMA, arranqueMedido, enumerar } from "@/lib/producto";

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

const TAGS: { id: Tag; labelEs: string; labelEn: string }[] = [
  { id: "metrics", labelEs: "Métricas", labelEn: "Metrics" },
  { id: "discipline", labelEs: "Disciplina", labelEn: "Discipline" },
  { id: "security", labelEs: "Privacidad", labelEn: "Privacy" },
  { id: "speed", labelEs: "Rapidez", labelEn: "Speed" },
  { id: "local", labelEs: "En tu equipo", labelEn: "On your machine" },
  { id: "multi", labelEs: "Multi-cuenta", labelEn: "Multi-account" },
  { id: "export", labelEs: "Exportar", labelEn: "Export" },
  { id: "psychology", labelEs: "Psicología", labelEn: "Psychology" },
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
    titleEs: "Curva de capital y drawdown",
    titleEn: "Equity curve and drawdown",
    descEs: "Tu balance y tu peor caída, al día con cada operación. El drawdown se mide desde el pico, como en un fondo.",
    descEn: "Your balance and your worst drop, updated with every trade. Drawdown measured from peak, like a fund.",
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
    titleEs: "Playbooks con estadísticas en vivo",
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
    descEs: "Tus operaciones viven en tu disco. Sin cuenta, sin telemetría y sin servidores de CountPips. Cifrado EFS de Windows opcional, salvo en Windows Home.",
    descEn: "Your trades live on your disk. No account, no telemetry and no CountPips servers. Optional Windows EFS encryption, except on Windows Home.",
    tags: ["security", "local", "speed"],
  },
  {
    id: "sqlite",
    titleEs: "Un archivo SQLite",
    titleEn: "One SQLite file",
    descEs: "Una base de datos SQLite en un único archivo, con copias automáticas verificadas y restauración a la vista.",
    descEn: "A SQLite database in a single file, with verified automatic backups and visible restore.",
    tags: ["local", "export", "speed"],
  },
  {
    id: "multi",
    titleEs: "Multi-cuenta y multi-activo",
    titleEn: "Multi-account, multi-asset",
    descEs: `Acciones, futuros, forex y cripto. Varias cuentas, cada una con sus métricas: ${PROGRAMA.cuentasCore} en Core e ilimitadas en Pro.`,
    descEn: `Stocks, futures, forex and crypto. Several accounts, each with its own metrics: ${PROGRAMA.cuentasCore} in Core, unlimited in Pro.`,
    tags: ["multi", "metrics"],
  },
  {
    id: "export",
    titleEs: "Exportación a CSV, JSON y PDF",
    titleEn: "Export to CSV, JSON and PDF",
    descEs: "Tus datos son tuyos. Exporta todo en formatos abiertos, sin bloqueo, cuando quieras.",
    descEn: "Your data is yours. Export everything in open formats, no lock-in, whenever you want.",
    tags: ["export", "local", "security"],
  },
  {
    id: "mae-mfe",
    titleEs: "MAE / MFE",
    titleEn: "MAE / MFE",
    descEs: "Cuánto fue en tu contra y a tu favor cada operación antes de cerrarla: detecta si sales pronto o tarde de forma sistemática.",
    descEn: "How far each trade went against you and in your favour before you closed it: spot whether you exit early or late, systematically.",
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
    descEs: `Plantillas de ${enumerar(PROGRAMA.plantillasProp, "es")}, panel de evaluación e informe en PDF.`,
    descEn: `${enumerar(PROGRAMA.plantillasProp, "en")} templates, an evaluation panel and a PDF report.`,
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
    descEs: "Lotes, resumen del año e informe para tu asesor (España). Te dice cuánto apartar, de forma orientativa; nunca calcula la cuota a pagar.",
    descEn: "Lots, yearly summary and a report for your tax adviser (Spain). It tells you roughly how much to set aside; it never computes the tax due.",
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
    descEn: "Do you perform better first thing or in the afternoon? On Mondays or Fridays? The heatmap crosses day and hour with your result.",
    tags: ["metrics"],
  },
  {
    id: "native",
    titleEs: "Nativa de Windows",
    titleEn: "Native Windows app",
    descEs: `WinUI 3, no Electron. Arranca en ${arranqueMedido("es")} y se integra con el sistema: bandeja, instancia única y tema claro u oscuro.`,
    descEn: `WinUI 3, not Electron. Starts in ${arranqueMedido("en")} and fits the system: tray, single instance and light or dark theme.`,
    tags: ["speed", "local"],
  },
];

export function FeatureExplorer() {
  const { lang } = useLang();
  const es = lang === "es";
  const [selected, setSelected] = useState<Tag[]>([]);

  const toggle = (t: Tag) =>
    setSelected((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));

  // Puntúa por la fracción de ejes marcados que cumple cada función y ordena.
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
          titulo={es ? (
            <>Elige el eje. <span className="tj-frase-nueva">Sale lo que encaja.</span></>
          ) : (
            <>Pick an axis. <span className="tj-frase-nueva">See what fits.</span></>
          )}
          entradilla={es
            ? "Todo lo que hace el programa. Marca uno o varios ejes y la lista se recorta a lo que hace de verdad en ese terreno."
            : "Everything the program does. Mark one or more axes and the list narrows to what it actually does there."}
        />

        <div className="flex flex-wrap gap-2 mb-8">
          {TAGS.map((t) => {
            const active = selected.includes(t.id);
            return (
              <button
                key={t.id}
                onClick={() => toggle(t.id)}
                type="button"
                className="tj-filtro"
                aria-pressed={active}
              >
                {es ? t.labelEs : t.labelEn}
              </button>
            );
          })}
          {hasSelection && (
            <button
              type="button"
              onClick={() => setSelected([])}
              className="link-underline inline-flex items-center min-h-[36px] px-2 text-sm text-secondary"
            >
              {es ? "Limpiar selección" : "Clear selection"}
            </button>
          )}
        </div>

        <ResultadoAnunciado
          texto={
            !hasSelection
              ? ""
              : topMatches.length === 0
                ? es ? "Nada en esos ejes." : "Nothing on those axes."
                : `${fmtInt(topMatches.length, lang)} ${es ? (topMatches.length === 1 ? "función" : "funciones") : topMatches.length === 1 ? "feature" : "features"} ${es ? "en este recorte" : "in this cut"}`
          }
        />
        {hasSelection ? (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <span className="tnum text-[13px] text-tertiary">
                {es ? "En este recorte" : "In this cut"} · {fmtInt(topMatches.length, lang)}
              </span>
              {topMatches.length === 0 && (
                <span className="text-[13px]" style={{ color: "var(--ink-3)" }}>
                  {es ? "Nada en esos ejes. Prueba otro." : "Nothing on those axes — try another."}
                </span>
              )}
            </div>
            <ListaFunciones items={topMatches} es={es} />
          </div>
        ) : (
          // Sin selección: todas las funciones.
          <div>
            <div className="mb-4">
              <span className="tnum text-[13px] text-tertiary">
                {fmtInt(FEATURES.length, lang)} {es ? "características" : "features"}
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
    /* En escritorio, dos columnas: en una sola la lista sería muy larga. */
    <ul className="m-0 grid border-t border-[var(--line)] p-0 lg:grid-cols-2 lg:gap-x-14">
      {items.map((f) => (
        <li
          key={f.id}
          /* La medida de la descripción la pone `.medida` en el propio párrafo:
             `ch` en la celda se mediría con la tipografía de la celda, no la
             del párrafo. */
          className="grid content-start gap-1 border-b border-[var(--line)] py-4 sm:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] sm:items-baseline sm:gap-10 lg:grid-cols-1 lg:gap-1.5"
        >
          {/* La insignia va junto al titular, no dentro: dentro, el lector leería
              «Monte CarloPro». */}
          <div className="flex items-baseline gap-2.5">
            <h3 className="m-0 t-h5" style={{ color: "var(--ink)" }}>
              {es ? f.titleEs : f.titleEn}
            </h3>
            {f.pro && (
              <span className="relative -top-px rounded-[4px] border border-[var(--line-2)] px-1.5 py-px text-[11px] font-semibold text-tertiary">
                Pro
              </span>
            )}
          </div>
          <p className="medida m-0 text-[14px] leading-[1.6]" style={{ color: "var(--ink-2)" }}>
            {es ? f.descEs : f.descEn}
          </p>
        </li>
      ))}
    </ul>
  );
}

