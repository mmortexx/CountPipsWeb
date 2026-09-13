"use client";

import { CalendarDays, BookOpen, LineChart, NotebookPen, Layers } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { getCal } from "@/lib/trading/fixtures";
import { nombreSetup, type SetupName } from "@/lib/trading/data";
import { fmtPct, fmtR } from "@/lib/trading/format";

/**
 * FeaturesBento — sección `#features` del HTML. Rejilla bento con 5
 * tarjetas: calendario de P&L grande (span 7), rendimiento por hora
 * (span 5), playbooks, diario narrativo, multi-cuenta multi-activo.
 *
 * `num` — ordinal del eyebrow. Por defecto el de la home ("03"); las
 * páginas internas pasan el suyo para mantener su propia secuencia.
 */
export function FeaturesBento({ num = "03" }: { num?: string }) {
  const { lang } = useLang();
  const es = lang === "es";
  const cal = getCal();

  return (
    <section
      id="features"
      className="section relative overflow-clip"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 60% at 30% 0%, color-mix(in oklab, var(--ink) 5%, transparent), transparent 60%)",
        }}
      />
      {/* P6 — `style={{ maxWidth: 1280 }}` removed: was overriding
          tj-container's --page-w (1080px) and producing a section 200px
          wider than every sibling on /features (PageHeader, FeatureExplorer,
          Gallery, HowItWorks, MoreFeatures all run at 1080px). The 12-col
          bento still breathes: col-span-7 = 621px, col-span-5 = 438px,
          col-span-4 = 346px at 1080−gap. Unified mancha = Anthropic-grade
          cross-section consistency. */}
      <div className="relative tj-container">
        <div className="max-w-[760px] mb-12">
          <div className="inline-flex items-center gap-3 mb-5">
            <span className="tnum text-xs font-medium tracking-wide text-[rgb(var(--accent-base))]">
              § {num}
            </span>
            <span aria-hidden className="w-[22px] h-px bg-[rgb(var(--divider)/0.13)]" />
            <span className="tnum text-[11px] tracking-[0.2em] uppercase text-tertiary">
              {es ? "CARACTERÍSTICAS" : "FEATURES"}
            </span>
          </div>
          <h2 className="font-serif m-0 text-3xl sm:text-4xl lg:text-5xl font-normal tracking-[-0.022em] leading-[1.08] text-primary text-balance">
            {es ? (
              <>
                Todo lo que una mesa profesional
                <br />
                espera de un <span className="text-[rgb(var(--accent-base))]">diario</span>.
              </>
            ) : (
              <>
                Everything a professional desk
                <br />
                expects from a <span className="text-[rgb(var(--accent-base))]">journal</span>.
              </>
            )}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Calendario grande (span 7) */}
          <div
            data-entra
            // R25-1e — snappy hover lift (separate transition from the
            // entrance so hover doesn't feel laggy). All 5 bento cards
            // share this treatment for a coordinated hover rhythm.
            // R26-1b — added an absolute inset accent-glow div so the
            // bento cards match the canonical “lift + accent border
            // glow” hover vocabulary used by Integrations / TestimonialsWall
            // / ValueTestimonials / Story / Milestones / ContactSupport.
            // T2h — card padding now responsive: 20px on mobile (p-5),
            // 24px from sm. Original was flat `padding: 24` which felt
            // tight against the edge on 320–390px viewports.
            // T3c — swap a `.tj-paper`: papel translúcido cálido en vez de
            // glass frío. Border, rounded, hover lift, padding y minHeight
            // intactos. El sweep de acento del top-edge se conserva.
            className="tj-realce tj-paper tj-hoja tj-hoja--pliego group lg:col-span-7 min-w-0 relative overflow-hidden p-6 sm:p-7"
            style={{
              minHeight: 360,
            }}
          >
            {/* R25-1e — premium top-edge accent sweep. The calendar is
                the bento's anchor (span 7); a 2px accent gradient at the
                top edge marks it as the lead card. Same vocabulary as the
                GuaranteeBanner + DownloadCTA + Pro pricing-card top sweep. */}
            <div
              aria-hidden
              className="absolute top-0 left-0 right-0"
              style={{
                height: 2,
                background: "linear-gradient(90deg, transparent, rgb(var(--accent-base) / 0.55), transparent)",
              }}
            />
            <div className="flex items-center gap-2 mb-2">
              <span
                className="inline-grid place-items-center rounded-[2px] border border-[rgb(var(--accent-base)/0.20)] w-[30px] h-[30px] bg-[rgb(var(--accent-base)/0.14)] text-[rgb(var(--accent-base))]"
              >
                <CalendarDays size={15} aria-hidden />
              </span>
              <span className="tnum text-[11px] tracking-[0.14em] uppercase text-tertiary">
                {es ? "Calendario de P&L" : "P&L calendar"}
              </span>
            </div>
            <h3 className="font-serif m-0 text-2xl sm:text-3xl font-normal tracking-[-0.02em] text-primary">
              {es ? "Cada día, en un vistazo" : "Every day, at a glance"}
            </h3>
            {/* Mes + iniciales de los días. `cal.label` y `cal.chip` se
                calculaban en las fixtures pero no se pintaban en ninguna
                parte: sin mes ni cabecera de semana, el desfase del
                primer día era un hueco sin explicación. */}
            <div className="mt-4 flex items-baseline justify-between gap-3">
              <span
                className="tnum"
                style={{ fontSize: 11.5, letterSpacing: "0.06em", color: "var(--ink-2)", textTransform: "capitalize" }}
              >
                {cal.label[lang]}
              </span>
              <span
                className="tnum"
                style={{ fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-3)" }}
              >
                {cal.chip[lang]}
              </span>
            </div>
            <div
              className="mt-2.5 grid grid-cols-7 gap-1.5 tnum"
              style={{ fontSize: 9.5, letterSpacing: "0.06em", color: "var(--ink-3)" }}
              aria-hidden
            >
              {(es
                ? ["L", "M", "X", "J", "V", "S", "D"]
                : ["M", "T", "W", "T", "F", "S", "S"]
              ).map((d, i) => (
                <span key={i} className="text-center">
                  {d}
                </span>
              ))}
            </div>
            <div
              className="mt-1.5 grid grid-cols-7 gap-1.5"
            >
              {cal.cells.map((c, i) => {
                const cellStyle = c.style
                  ? { ...parseInlineStyle(c.style), padding: "4px" }
                  : { padding: "4px" };
                return (
                  <div key={i} style={cellStyle}>
                    {/* Tinta explícita en vez de opacidad. El número del día
                        iba al 75 % de opacidad y eso lo dejaba en 4,19:1
                        sobre la celda teñida.
                        Va en la MISMA tinta que el importe, no en una más
                        apagada: sobre una celda ya teñida, atenuar el día lo
                        empujaba por debajo del mínimo en tema oscuro. La
                        jerarquía entre día e importe la llevan el cuerpo y el
                        peso, que es donde no cuesta contraste. */}
                    <span className="tnum" style={{ fontSize: 9.5, color: "var(--ink)" }}>{c.day}</span>
                    <span className="tnum" style={{ fontSize: 9.5, fontWeight: 600, lineHeight: 1, color: "var(--ink)" }}>{c.val}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div className="flex items-center gap-3">
                <span
                  className="tnum"
                  style={{ fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-3)" }}
                >
                  {es ? "Total mes" : "Month total"}
                </span>
                <span
                  className="tnum"
                  style={{ fontSize: 22, fontWeight: 700, color: cal.pnlColor }}
                >
                  {cal.pnl}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                {[
                  { c: "rgb(var(--accent-base))", l: "≥ 60 $" },
                  { c: "color-mix(in oklab, rgb(var(--accent-base)) 35%, transparent)", l: "20–60 $" },
                  { c: "color-mix(in oklab, rgb(var(--accent-base)) 18%, transparent)", l: "0–20 $" },
                  { c: "rgb(var(--pnl-neg) / 0.22)", l: es ? "Negativo" : "Negative" },
                ].map((g) => (
                  <span key={g.l} className="inline-flex items-center gap-1" style={{ fontSize: 9.5, color: "var(--ink-2)" }}>
                    <span className="inline-block rounded" style={{ width: 9, height: 9, background: g.c }} />
                    {g.l}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Rendimiento por hora (span 5) */}
          <div
            data-entra="2"
            className="tj-realce tj-paper tj-hoja group lg:col-span-5 min-w-0 relative overflow-hidden p-6 sm:p-7"
            style={{
              minHeight: 360,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="inline-grid place-items-center rounded-[2px] border border-[rgb(var(--accent-base)/0.20)] w-[30px] h-[30px] bg-[rgb(var(--accent-base)/0.14)] text-[rgb(var(--accent-base))]"
              >
                <LineChart size={15} aria-hidden />
              </span>
              <span className="tnum text-[11px] tracking-[0.14em] uppercase text-tertiary">
                {es ? "Rendimiento por hora" : "Hourly performance"}
              </span>
            </div>
            <h3 className="font-serif m-0 text-2xl sm:text-3xl font-normal tracking-[-0.02em] text-primary">
              {es ? "Sabe cuándo rendirte y cuándo apretar" : "Knows when to push and when to back off"}
            </h3>
            {/* Bar chart hardcoded 24 barras (horas) */}
            <div className="mt-5 flex items-end gap-[3px]" style={{ height: 100 }}>
              {[
                6, 8, 12, 18, 24, 32, 38, 44, 52, 60, 58, 50, 56, 68, 72, 64, 48, 38, 30, 22, 18, 14, 10, 8,
              ].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t"
                  style={{
                    height: `${h}%`,
                    background:
                      i === 9
                        ? "rgb(var(--accent-base))"
                        : "color-mix(in oklab, rgb(var(--accent-base)) 40%, transparent)",
                  }}
                  aria-hidden
                />
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <div className="tnum" style={{ fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-3)" }}>
                  {es ? "Mejor ventana" : "Best window"}
                </div>
                <div className="tnum" style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)" }}>
                  10:00 – 11:30
                </div>
              </div>
              <span
                className="tnum"
                style={{
                  fontSize: 10,
                  padding: "4px 10px",
                  borderRadius: 4,
                  background: "color-mix(in oklab, rgb(var(--accent-base)) 14%, transparent)",
                  color: "rgb(var(--accent-base))",
                  border: "1px solid color-mix(in oklab, rgb(var(--accent-base)) 30%, transparent)",
                }}
              >
                {es ? "+27 % sobre media" : "+27% over average"}
              </span>
            </div>

            {/* Eje de horas. Sin él, 24 barras sin etiquetar no dicen a
                qué hora corresponde el pico: era un adorno con forma de
                gráfico, no un gráfico. */}
            <div
              className="mt-2 flex items-center justify-between tnum"
              style={{ fontSize: 9.5, letterSpacing: "0.08em", color: "var(--ink-3)" }}
              aria-hidden
            >
              {["00", "06", "12", "18", "23"].map((h) => (
                <span key={h}>{h}</span>
              ))}
            </div>

            {/* Las peores ventanas. Esta tarjeta terminaba aquí y el
                `minHeight: 360` que la iguala con el calendario dejaba
                ~390 px de vacío absoluto debajo del chip: al lado de una
                tarjeta densa se leía como un bloque a medio hacer. La
                otra cara del dato —cuándo NO operar— es justo lo que
                promete el titular y llena el hueco con información. */}
            <div
              className="mt-5 pt-4 border-t"
              style={{ borderColor: "rgb(var(--divider) / 0.12)" }}
            >
              <div
                className="tnum"
                style={{ fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-3)" }}
              >
                {es ? "Ventanas a evitar" : "Windows to avoid"}
              </div>
              <ul className="mt-2.5 flex flex-col gap-2">
                {[
                  { w: "14:00 – 15:00", n: es ? "18 ops" : "18 trades", r: fmtR(-0.8, lang, 1) },
                  { w: "17:00 – 18:00", n: es ? "11 ops" : "11 trades", r: fmtR(-1.2, lang, 1) },
                  { w: "21:00 – 22:00", n: es ? "7 ops" : "7 trades", r: fmtR(-0.4, lang, 1) },
                ].map((row) => (
                  <li
                    key={row.w}
                    className="flex items-center justify-between gap-3 tnum"
                    style={{ fontSize: 12 }}
                  >
                    <span style={{ color: "var(--ink-2)" }}>{row.w}</span>
                    <span className="flex-1 h-px" style={{ background: "rgb(var(--divider) / 0.10)" }} aria-hidden />
                    <span style={{ color: "var(--ink-3)", fontSize: 11 }}>{row.n}</span>
                    <span style={{ color: "rgb(var(--pnl-neg))", fontWeight: 600, minWidth: 44, textAlign: "right" }}>
                      {row.r}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Playbooks (span 4) */}
          <div
            data-entra="2"
            className="tj-realce tj-paper tj-hoja group lg:col-span-4 min-w-0 relative overflow-hidden p-6 sm:p-7"
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="inline-grid place-items-center rounded-[2px] border border-[rgb(var(--accent-base)/0.20)] w-[30px] h-[30px] bg-[rgb(var(--accent-base)/0.14)] text-[rgb(var(--accent-base))]"
              >
                <BookOpen size={15} aria-hidden />
              </span>
              <span className="tnum text-[11px] tracking-[0.14em] uppercase text-tertiary">
                {es ? "Playbooks" : "Playbooks"}
              </span>
            </div>
            <h3 className="font-serif m-0 text-xl sm:text-2xl font-normal tracking-[-0.02em] text-primary">
              {es ? "Sólo setups que tienen edge" : "Only setups with edge"}
            </h3>
            <div className="mt-4 space-y-2.5">
              {/* Los cuatro nombres iban en español fijo y se pintaban
                  igual en `/en/features`. Salen del mismo catálogo que la
                  demo (`SETUP_NAMES`), así que el visitante inglés lee
                  «Breakout» aquí y «Breakout» en el diario, y el español
                  «Ruptura» en los dos sitios. Los porcentajes son los de
                  la maqueta, no los de `TRADES`: esta tarjeta ilustra la
                  forma de la vista, no publica un resultado. */}
              {[
                /* El acierto va como NÚMERO y no como texto, y no es un
                   capricho: el mismo campo servía de rótulo («62 %») y de
                   ancho de la barra (`width: s.w`). «62 %», con el espacio
                   que pide la ortografía castellana, no es una medida CSS
                   válida, así que el navegador la descartaba y las CUATRO
                   barras se pintaban enteras. Medido a 1440 px: las cuatro
                   a 197 px de 197. La tarjeta que promete «sólo setups que
                   tienen edge» enseñaba el Reversal —41 % de acierto, «Sin
                   ventaja»— con la barra roja llena de lado a lado. */
                { k: "Breakout", wr: 0.62, exp: 1.8, n: 58, c: "rgb(var(--pnl-pos))", badge: es ? "Edge probado" : "Proven edge" },
                { k: "Pullback", wr: 0.58, exp: 1.4, n: 42, c: "rgb(var(--pnl-pos))", badge: es ? "Edge probado" : "Proven edge" },
                { k: "Reversal", wr: 0.41, exp: -0.3, n: 30, c: "rgb(var(--pnl-neg))", badge: es ? "Sin ventaja" : "No edge" },
                { k: "Trend", wr: 0.55, exp: 2.1, n: 70, c: "rgb(var(--pnl-pos))", badge: es ? "Edge probado" : "Proven edge" },
              ].map((s) => (
                <div key={s.k} className="p-2 rounded-[2px] border border-[rgb(var(--divider)/0.08)] bg-[rgb(var(--divider)/0.02)] hover:border-[rgb(var(--accent-base)/0.3)] transition-colors">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-primary">
                      {nombreSetup(s.k as SetupName, lang)}
                    </span>
                    <div className="flex items-center gap-2 font-mono text-[10px]">
                      <span className="text-tertiary">{s.n} {es ? "ops" : "trades"}</span>
                      <span style={{ color: s.c, fontWeight: 700 }}>{fmtR(s.exp, lang, 1)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-[2px] overflow-hidden bg-[rgb(var(--divider)/0.13)]">
                      <div className="h-full rounded-[2px]" style={{ width: `${Math.round(s.wr * 100)}%`, background: s.c }} />
                    </div>
                    <span
                      className="tnum font-mono text-xs font-semibold"
                      style={{ color: s.c, minWidth: 38, textAlign: "right" }}
                    >
                      {fmtPct(s.wr, lang, 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Diario narrativo (span 4) */}
          <div
            data-entra="3"
            className="tj-realce tj-paper tj-hoja group lg:col-span-4 min-w-0 relative overflow-hidden p-6 sm:p-7"
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="inline-grid place-items-center rounded-[2px] border border-[rgb(var(--accent-base)/0.20)] w-[30px] h-[30px] bg-[rgb(var(--accent-base)/0.14)] text-[rgb(var(--accent-base))]"
              >
                <NotebookPen size={15} aria-hidden />
              </span>
              <span className="tnum text-[11px] tracking-[0.14em] uppercase text-tertiary">
                {es ? "Diario narrativo" : "Narrative journal"}
              </span>
            </div>
            <h3 className="font-serif m-0 text-xl sm:text-2xl font-normal tracking-[-0.02em] text-primary">
              {es ? "Lo que pasó, lo que sentiste" : "What happened, what you felt"}
            </h3>
            <div
              className="mt-4 rounded-[2px] p-4"
              style={{
                background: "color-mix(in oklab, var(--surface-2) 50%, transparent)",
                border: "1px solid rgb(var(--divider) / 0.06)",
              }}
            >
              <p
                className="m-0"
                style={{ fontSize: 13, lineHeight: 1.55, color: "var(--ink-2)" }}
              >
                {es
                  ? "“Entré en NQ por ruptura del rango NY, pero moví el stop a +1R para ‘asegurar’. Error: el plan era aguantar a 2R. Terminé saliendo en BE después de que el precio llegó al objetivo sin mí.”"
                  : "“Entered NQ on NY range break, but moved stop to +1R to ‘be safe’. Mistake: the plan was to hold to 2R. I ended up exiting at BE after price hit the target without me.”"}
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: "var(--ink-3)" }}>
                <span className="tnum">2026-07-22 · 14:42</span>
                <span aria-hidden>·</span>
                <span>{es ? "Nota post-trade" : "Post-trade note"}</span>
              </div>
            </div>
          </div>

          {/* Multi-cuenta multi-activo (span 4) */}
          <div
            data-entra="4"
            className="tj-realce tj-paper tj-hoja group lg:col-span-4 min-w-0 relative overflow-hidden p-6 sm:p-7"
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="inline-grid place-items-center rounded-[2px] border border-[rgb(var(--accent-base)/0.20)] w-[30px] h-[30px] bg-[rgb(var(--accent-base)/0.14)] text-[rgb(var(--accent-base))]"
              >
                <Layers size={15} aria-hidden />
              </span>
              <span className="tnum text-[11px] tracking-[0.14em] uppercase text-tertiary">
                {es ? "Multi-cuenta, multi-activo" : "Multi-account, multi-asset"}
              </span>
            </div>
            <h3 className="font-serif m-0 text-xl sm:text-2xl font-normal tracking-[-0.02em] text-primary">
              {es ? "Una cuenta o diez, en la misma vista" : "One account or ten, in the same view"}
            </h3>
            <div className="mt-4 space-y-2 text-xs font-mono">
              {[
                { name: "Apex 150k (#1)", balance: "154.820 $", pnl: "+1.420 $", status: "FUNDED", pnlPos: true },
                { name: "Topstep 50k (#2)", balance: "51.240 $", pnl: "+650 $", status: "PASSED", pnlPos: true },
                { name: "IBKR Futures Core", balance: "84.190 $", pnl: "+2.100 $", status: "MASTER", pnlPos: true },
              ].map((acc) => (
                <div
                  key={acc.name}
                  className="flex items-center justify-between p-2.5 rounded-[2px] border border-[rgb(var(--divider)/0.1)] bg-[rgb(var(--divider)/0.03)]"
                >
                  <div>
                    <div className="text-primary font-semibold text-[11px]">{acc.name}</div>
                    <div className="text-tertiary text-[10px]">{acc.balance}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[rgb(var(--pnl-pos))] font-bold text-[11px]">{acc.pnl}</div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgb(var(--accent-base)/0.12)] text-[rgb(var(--accent-base))] font-semibold">
                      {acc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Parsea un string estilo CSS inline (formato `"prop:val;prop:val"`) a un
 * objeto JS compatible con el `style` prop de React. Solo se usa para
 * los strings generados por `fixtures.ts` (background/borderRadius/
 * aspectRatio/display/etc.). Suficiente para los casos del calendario.
 */
function parseInlineStyle(s: string): React.CSSProperties {
  const out: Record<string, string> = {};
  for (const decl of s.split(";")) {
    const [k, v] = decl.split(":");
    if (!k || !v) continue;
    const key = k.trim();
    const val = v.trim();
    const camel = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = val;
  }
  return out as React.CSSProperties;
}
