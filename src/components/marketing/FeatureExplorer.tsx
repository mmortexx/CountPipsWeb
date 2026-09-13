"use client";

import { useState, useMemo } from "react";
import { useLang } from "@/lib/i18n";

/**
 * FeatureExplorer — explorador interactivo de características.
 *
 * El visitante marca qué le importa (métricas, disciplina, seguridad,
 * velocidad, multi-cuenta, local-first…) y el componente filtra y
 * destaca las características de CountPips que coinciden, mostrando un
 * "match score" y un CTA contextual.
 *
 * ── Por qué en /features ──────────────────────────────────────────────
 * /features lista todo lo que hace la app en un bento estático. El
 * explorador convierte esa lista en una conversación: "¿qué buscas?" →
 * "esto es lo que tenemos para ti". Ayuda a quien llega con una
 * necesidad concreta a no tener que escanear 40 features a mano.
 *
 * ── Lógica ────────────────────────────────────────────────────────────
 * Cada feature tiene un conjunto de tags. El usuario togglea tags.
 * El match score = (tags coincidentes / tags del usuario) · 100.
 * Se ordenan por score y se muestran las top matches destacadas.
 *
 * ── Material ──────────────────────────────────────────────────────────
 * .tj-paper + .tj-paper-glow. Touch targets ≥44px. Sin overflow mobile.
 */

type Tag = "metrics" | "discipline" | "security" | "speed" | "local" | "multi" | "export" | "psychology";

type Feature = {
  id: string;
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
  tags: Tag[];
};

const TAGS: { id: Tag; labelEs: string; labelEn: string; icon: string }[] = [
  { id: "metrics", labelEs: "Métricas", labelEn: "Metrics", icon: "chart" },
  { id: "discipline", labelEs: "Disciplina", labelEn: "Discipline", icon: "shield" },
  { id: "security", labelEs: "Privacidad", labelEn: "Privacy", icon: "lock" },
  { id: "speed", labelEs: "Rapidez", labelEn: "Speed", icon: "bolt" },
  { id: "local", labelEs: "Local-first", labelEn: "Local-first", icon: "disk" },
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
    descEs: "Tu capital y tu peor caída en tiempo real. El drawdown se mide desde el pico, como en un fondo.",
    descEn: "Your capital and your worst drop in real time. Drawdown measured from peak, like a fund.",
    tags: ["metrics", "speed"],
  },
  {
    id: "guardian",
    titleEs: "Guardián de disciplina",
    titleEn: "Discipline Guardian",
    descEs: "Te frena antes de operar fuera de tu plan. Reglas configurables: tamaño máximo, setups prohibidos, horario.",
    descEn: "Stops you before trading outside your plan. Configurable rules: max size, banned setups, hours.",
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
    titleEs: "100 % en local",
    titleEn: "100% local",
    descEs: "Todo vive en tu disco. Sin servidores, sin telemetría, sin cuentas. Cifra la carpeta con BitLocker.",
    descEn: "Everything lives on your disk. No servers, no telemetry, no accounts. Encrypt the folder with BitLocker.",
    tags: ["security", "local", "speed"],
  },
  {
    id: "sqlite",
    titleEs: "Un archivo .sqlite",
    titleEn: "One .sqlite file",
    descEs: "Una base de datos que se abre, copia y respalda como un archivo. Sin instalaciones, sin dependencias.",
    descEn: "A database you open, copy and back up like a file. No installs, no dependencies.",
    tags: ["local", "export", "speed"],
  },
  {
    id: "multi",
    titleEs: "Multi-cuenta y multi-activo",
    titleEn: "Multi-account, multi-asset",
    descEs: "Acciones, futuros, forex, crypto. Varias cuentas con métricas independientes y consolidadas.",
    descEn: "Stocks, futures, forex, crypto. Multiple accounts with independent and consolidated metrics.",
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
    descEs: "¿Rindes mejor en London o en NY? ¿Lunes o viernes? El heatmap te lo dice con colores.",
    descEn: "Better in London or NY? Monday or Friday? The heatmap tells you in color.",
    tags: ["metrics"],
  },
  {
    id: "native",
    titleEs: "Nativa de Windows",
    titleEn: "Native Windows app",
    descEs: "WinUI 3, no Electron. Arranca en menos de 1 s y ronda los 200 MB de RAM con la sesión abierta. Siente que pertenece al sistema.",
    descEn: "WinUI 3, not Electron. Starts in under 1 s and sits around 200 MB of RAM with the session open. Feels native to the system.",
    tags: ["speed", "local"],
  },
];

export function FeatureExplorer({ num = "02" }: { num?: string }) {
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

  const topMatches = scored.filter((f) => f.score > 0).slice(0, 4);
  const hasSelection = selected.length > 0;

  return (
    <section className="section-tight border-t border-[rgb(var(--divider)/0.06)]">
      <div className="tj-container">
        <div className="max-w-2xl mb-8">
          <div className="inline-flex items-center gap-3 mb-5">
            <span className="eyebrow">
              {es ? "ÍNDICE" : "INDEX"}
            </span>
          </div>
          <h2
            className="font-serif m-0"
            style={{
              fontSize: "clamp(1.85rem, 3.3vw, 2.8rem)",
              fontWeight: 400,
              letterSpacing: "-0.022em",
              lineHeight: 1.1,
              color: "var(--ink)",
              textWrap: "balance",
            }}
          >
            {es ? (
              <>
                Elige el eje. <span style={{ color: "rgb(var(--accent-base))" }}>Sale lo que encaja.</span>
              </>
            ) : (
              <>
                Pick the axis. <span style={{ color: "rgb(var(--accent-base))" }}>What fits comes up.</span>
              </>
            )}
          </h2>
          <p className="mt-4" style={{ fontSize: "clamp(1rem, 1.2vw, 1.08rem)", lineHeight: 1.6, color: "var(--ink-2)" }}>
            {es
              ? "Marca uno o varios ejes. El índice se recorta a lo que el producto hace de verdad en ese terreno."
              : "Mark one or more axes. The index trims to what the product actually does in that ground."}
          </p>
        </div>

        {/* Tag chips */}
        <div className="flex flex-wrap gap-2 mb-8">
          {TAGS.map((t) => {
            const active = selected.includes(t.id);
            return (
              <button
                key={t.id}
                onClick={() => toggle(t.id)}
                className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-[2px] text-[14px] font-medium transition-[background,border-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]"
                style={{
                  background: active
                    ? "color-mix(in oklab, rgb(var(--accent-base)) 14%, transparent)"
                    : "color-mix(in oklab, var(--surface-2) 40%, transparent)",
                  border: active
                    ? "1px solid color-mix(in oklab, rgb(var(--accent-base)) 45%, transparent)"
                    : "1px solid rgb(var(--divider) / 0.12)",
                  color: active ? "rgb(var(--accent-base))" : "var(--ink-2)",
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
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-[2px] text-[13px] font-medium transition-colors"
              style={{ color: "var(--ink-3)", border: "1px solid rgb(var(--divider) / 0.12)" }}
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
              <span className="tnum" style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)" }}>
                {es ? "En este recorte" : "In this cut"} · {topMatches.length}
              </span>
              {topMatches.length === 0 && (
                <span className="text-[13px]" style={{ color: "var(--ink-3)" }}>
                  {es ? "Nada en esos ejes — prueba otro." : "Nothing on those axes — try another."}
                </span>
              )}
            </div>
            <ul className="m-0 overflow-hidden rounded-[2px] border border-[rgb(var(--divider)/0.13)] p-0">
              {topMatches.map((f) => (
                <li
                  key={f.id}
                  className="grid gap-1 border-b border-[rgb(var(--divider)/0.08)] px-4 py-3.5 last:border-b-0 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_auto] sm:items-baseline sm:gap-6"
                >
                  <h3 className="m-0 text-[15px] font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
                    {es ? f.titleEs : f.titleEn}
                  </h3>
                  <p className="m-0 text-[14px] leading-[1.5]" style={{ color: "var(--ink-2)" }}>
                    {es ? f.descEs : f.descEn}
                  </p>
                  <span className="tnum text-[12px] text-tertiary sm:justify-self-end">
                    {f.matches.length} {es ? "ejes" : "axes"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          // Empty state — show all features as a static grid
          <div>
            <div className="mb-4">
              <span className="tnum" style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)" }}>
                {es ? "Todas las características" : "All features"} · {FEATURES.length}
              </span>
            </div>
            <ul className="m-0 overflow-hidden rounded-[2px] border border-[rgb(var(--divider)/0.13)] p-0">
              {FEATURES.map((f) => (
                <li
                  key={f.id}
                  className="grid gap-1 border-b border-[rgb(var(--divider)/0.08)] px-4 py-3.5 last:border-b-0 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.8fr)] sm:items-baseline sm:gap-6"
                >
                  <h3 className="m-0 text-[15px] font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
                    {es ? f.titleEs : f.titleEn}
                  </h3>
                  <p className="m-0 text-[14px] leading-[1.5]" style={{ color: "var(--ink-2)" }}>
                    {es ? f.descEs : f.descEn}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
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
