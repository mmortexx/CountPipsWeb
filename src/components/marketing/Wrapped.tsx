"use client";

import { useLang } from "@/lib/i18n";
import { Eyebrow } from "@/components/tj/Eyebrow";
import { Reveal } from "@/components/tj/Reveal";
import { CountUp } from "@/components/tj/CountUp";
import { Money } from "@/components/tj/Money";
import { METRICS, TRADES, nombreSetup, rankByExpectancy, weekdayBreakdown } from "@/lib/trading/data";

/** Spotify Wrapped-style annual stats recap. Playful but professional. */
export function Wrapped() {
  const { lang } = useLang();
  const es = lang === "es";

  // Pull "annual" highlights from the deterministic sample.
  const topSetup = rankByExpectancy(TRADES, (t) => t.setup)[0];
  const topInstrument = rankByExpectancy(TRADES, (t) => t.instrument)[0];
  const byDay = weekdayBreakdown(TRADES);
  const bestDay = [...byDay].sort((a, b) => b.pnl - a.pnl)[0];

  const dayLabel: Record<string, { es: string; en: string }> = {
    Lun: { es: "Lunes", en: "Monday" },
    Mar: { es: "Martes", en: "Tuesday" },
    Mié: { es: "Miércoles", en: "Wednesday" },
    Jue: { es: "Jueves", en: "Thursday" },
    Vie: { es: "Viernes", en: "Friday" },
    Sáb: { es: "Sábados", en: "Saturdays" },
    Dom: { es: "Domingos", en: "Sundays" },
  };
  const bestDayName = dayLabel[bestDay.day]?.[lang] ?? bestDay.day;

  const totalOperado = TRADES.reduce((s, t) => s + Math.abs(t.grossPnl), 0);

  const cards = [
    {
      key: "streak",
      tone: "accent" as const,
      label: es ? "Tu mejor racha" : "Your best streak",
      /* La cifra va MUCHO más grande que en el resto de tarjetas, y es a
         propósito: ésta ocupa dos filas de la rejilla, así que tiene el
         doble de alto que sus vecinas. Con el tamaño de las pequeñas, el
         sobrante se repartía como aire arriba y abajo y la tarjeta se leía
         descolgada — mucho hueco vacío y un número perdido en medio, justo
         al lado de dos tarjetas bien servidas.

         Una pieza que ocupa el doble tiene que PESAR el doble; si no, no
         hay motivo para que ocupe el doble. Los límites suben en vez de
         subir sólo el `cqi` porque las dos columnas miden lo mismo de
         ancho: por ancho no se distinguiría. */
      value: (
        <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1 min-w-0">
          <CountUp to={METRICS.maxWinStreak} className="t-display text-[clamp(3rem,17cqi,5.5rem)] tnum text-primary whitespace-nowrap leading-none" />
          <span className="text-[clamp(0.95rem,3cqi,1.25rem)] text-tertiary font-medium">{es ? "ganadoras seguidas" : "winners in a row"}</span>
        </span>
      ),
      sub: es
        ? "Confianza que no se confunde con suerte."
        : "Confidence that doesn't get confused with luck.",
    },
    {
      key: "setup",
      tone: "pos" as const,
      label: es ? "Tu setup más rentable" : "Your most profitable setup",
      value: (
        <span className="flex flex-col gap-1 min-w-0">
          <span className="t-display text-[clamp(1.5rem,7cqi,2.25rem)] text-pnl-pos break-words leading-tight">{nombreSetup(topSetup.name, lang)}</span>
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1 tnum min-w-0">
            {/* R27-1d — bumped text-xl→text-2xl (always 24px) so the green
                P&L figure (text-pnl-pos #0B8B4B ≈ 4.3:1 on the tj-paper
                card surface) clears WCAG AA in light theme. At 20px/500
                (text-xl) it failed AA normal-text (4.5:1); at 24px/500 it
                qualifies as WCAG "large text" (≥24px regular) which only
                requires 3:1. Desktop was already text-2xl so no visual
                change there. */}
            <Money value={topSetup.totalPnl} sign colorizeSign className="text-2xl font-medium whitespace-nowrap" />
            {/* R20-3b: added tnum so the `count` and `winRate` digits align
                with the adjacent Money figure — mixed proportional /
                tabular figures in the same baseline row looked jittery when
                the win-rate changed. */}
            <span className="tnum text-sm text-tertiary whitespace-nowrap">
              {es ? `${topSetup.count} ops · ${(topSetup.winRate * 100).toFixed(0)}% win` : `${topSetup.count} trades · ${(topSetup.winRate * 100).toFixed(0)}% win`}
            </span>
          </span>
        </span>
      ),
      sub: es
        ? "El filón del año. Crécelo — o destrózalo con más datos."
        : "The goldmine of the year. Scale it — or break it with more data.",
    },
    {
      key: "day",
      tone: "accent" as const,
      label: es ? "Tu día más productivo" : "Your most productive day",
      value: (
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1 min-w-0">
          <span className="t-display text-[clamp(1.5rem,7cqi,2.25rem)] text-primary whitespace-nowrap leading-tight">{bestDayName}</span>
          {/* R27-1d — same text-xl→text-2xl bump as the setup card Money
              above, for the same WCAG AA light-theme reason. */}
          <Money value={bestDay.pnl} sign colorizeSign className="text-2xl font-medium whitespace-nowrap" />
        </span>
      ),
      sub: es
        ? "Donde el mercado más te ha dado. ¿Repetible, o azar?"
        : "Where the market gave you most. Repeatable, or luck?",
    },
    {
      key: "total",
      tone: "accent" as const,
      label: es ? "Total operado" : "Total traded",
      value: (
        <span className="flex flex-col items-start gap-1 min-w-0">
          <Money value={totalOperado} compact colorizeSign={false} className="t-display text-[clamp(1.75rem,9cqi,2.75rem)] tnum text-primary whitespace-nowrap" />
          <span className="text-base text-tertiary">{es ? "de volumen bruto" : "gross volume"}</span>
        </span>
      ),
      sub: es
        ? "No es el P&L — es cuánto capital pusiste en juego."
        : "Not the P&L — how much capital you put at risk.",
    },
    {
      key: "discipline",
      tone: "warn" as const,
      label: es ? "Coste de indisciplina" : "Cost of indiscipline",
      value: (
        <span className="flex items-baseline gap-2 min-w-0">
          <Money value={METRICS.costOfIndiscipline} colorizeSign className="t-display text-[clamp(1.75rem,9cqi,2.75rem)] tnum text-pnl-warn whitespace-nowrap" />
        </span>
      ),
      sub: es
        ? "Lo que dejaste en la mesa por no seguir tu propio plan."
        : "What you left on the table by not following your own plan.",
    },
    {
      key: "instrument",
      tone: "pos" as const,
      label: es ? "Instrumento top" : "Top instrument",
      value: (
        <span className="flex flex-col gap-1 min-w-0">
          <span className="t-display text-[clamp(1.5rem,7cqi,2.25rem)] text-primary break-words leading-tight">{topInstrument.name}</span>
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1 tnum min-w-0">
            {/* R27-1d — same text-xl→text-2xl bump as the setup card Money
                above, for the same WCAG AA light-theme reason. */}
            <Money value={topInstrument.totalPnl} sign colorizeSign className="text-2xl font-medium whitespace-nowrap" />
            {/* R20-3b: tnum on the count chip — same rationale as the setup
                card above. */}
            <span className="tnum text-sm text-tertiary whitespace-nowrap">
              {es ? `${topInstrument.count} ops` : `${topInstrument.count} trades`}
            </span>
          </span>
        </span>
      ),
      sub: es
        ? "El activo que mejor te leyó este año."
        : "The asset that read you best this year.",
    },
  ];

  return (
    <section className="section cv-auto relative overflow-clip bg-veil">
      {/* Section grain — opt-in 3 % fractalNoise overlay. */}
      <div aria-hidden="true" className="grain absolute inset-0 pointer-events-none" />

      <div className="relative max-w-page mx-auto px-5 md:px-8">
        {/* Section header */}
        <div className="relative">
          <Reveal className="relative max-w-3xl">
            <Eyebrow>{es ? "Tu año, resumido" : "Your year, wrapped"}</Eyebrow>
            <h2 className="mt-5 t-h2 text-primary">
              {es ? (
                <>
                  Tu <span className="text-gradient">Wrapped</span> de trading.
                </>
              ) : (
                <>
                  Your trading <span className="text-gradient">Wrapped.</span>
                </>
              )}
            </h2>
            <p className="mt-4 text-lg text-secondary leading-relaxed">
              {es
                ? "El diario no solo cuenta operaciones: cuenta hábitos. Estos son los tuyos, en grande."
                : "The journal doesn't just count trades: it counts habits. Here are yours, in big numbers."}
            </p>
          </Reveal>
        </div>

        {/* Cards grid — bento layout: hero streak (col-span-3 row-span-2) on the
            left, two col-span-3 cards stacked on the right, then a clean row of
            three col-span-2 cards. Total cells = 6+3+3+2+2+2 = 18 = 3×6 → no gaps. */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[minmax(180px,auto)]">
          {cards.map((c, i) => {
            const span =
              i === 0
                ? "md:col-span-3 md:row-span-2"
                : i === 1
                ? "md:col-span-3"
                : i === 2
                ? "md:col-span-3"
                : "md:col-span-2";
            const glowColor =
              c.tone === "pos"
                ? "rgb(var(--pnl-pos))"
                : c.tone === "warn"
                ? "rgb(var(--pnl-warn))"
                : "rgb(var(--accent-base))";
            return (
              <article
                data-entra="ciclo"
                key={c.key}
                className={`group relative tj-paper rounded-[2px] border border-[rgb(var(--divider)/0.13)] overflow-hidden transition-[background-color,border-color,box-shadow,transform] duration-300 ease-[var(--ease-suave)] hover:border-[rgb(var(--accent-base)/0.35)] ${span}`}
              >
                <div className="relative p-6 md:p-7 flex flex-col h-full justify-between gap-4 cq-wrap min-w-0">
                  {/* R24-1c: editorial index (01 — 06) before the eyebrow so
                      the bento reads as a numbered sequence (magazine
                      rhythm). tnum + tabular-nums so the indices align
                      digit-for-digit across the grid. */}
                  <span className="eyebrow inline-flex items-center gap-2">
                    <span className="tnum tabular-nums" style={{ color: "rgb(var(--accent-base))", fontWeight: 600 }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span aria-hidden className="w-px h-3" style={{ background: "rgb(var(--divider) / 0.18)" }} />
                    <span
                      className="w-1.5 h-1.5 rounded-[1px]"
                      style={{
                        background: glowColor,
                      }}
                    />
                    {c.label}
                  </span>

                  <div className="flex-1 flex items-center">{c.value}</div>

                  <p className="text-[13px] text-tertiary leading-relaxed">{c.sub}</p>
                </div>
              </article>
            );
          })}
        </div>

        <Reveal delay={0.1} className="mt-8">
          <p className="text-xs text-tertiary text-center">
            {es
              ? "Datos de muestra deterministas — en tu diario saldrían los tuyos."
              : "Deterministic sample data — your journal would show your own."}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
