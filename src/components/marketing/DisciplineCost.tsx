"use client";

import { useLang } from "@/lib/i18n";

/**
 * DisciplineCost — sección § 05·b del HTML. Lo que la indisciplina
 * cuesta: tabla de expectancy (en plan / fuera de plan) + factura
 * detallada de indisciplina.
 *
 * `num` — ordinal del eyebrow. Por defecto el de la home ("05·b"); las
 * páginas internas pasan el suyo para mantener su propia secuencia.
 */
export function DisciplineCost({ num = "05·b" }: { num?: string }) {
  const { lang } = useLang();
  const es = lang === "es";
  return (
    <section
      className="section-tight bg-veil border-t border-[rgb(var(--divider)/0.06)]"
    >
      <div className="max-w-[1240px] mx-auto px-5 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
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
              {es ? "COSTE REAL" : "REAL COST"}
            </span>
          </div>
          <h2
            className="font-serif m-0"
            style={{
              fontSize: "clamp(2rem, 3.6vw, 3rem)",
              fontWeight: 400,
              letterSpacing: "-0.022em",
              lineHeight: 1.08,
              color: "var(--ink)",
              textWrap: "balance",
            }}
          >
            {es ? (
              <>
                Lo que tu <span style={{ color: "rgb(var(--accent-base))" }}>indisciplina</span> te cuesta.
              </>
            ) : (
              <>
                What your <span style={{ color: "rgb(var(--accent-base))" }}>indiscipline</span> costs you.
              </>
            )}
          </h2>
          <p
            className="mt-5 mb-7"
            style={{
              fontSize: "clamp(1rem, 1.3vw, 1.1rem)",
              lineHeight: 1.62,
              color: "var(--ink-2)",
              maxWidth: "36em",
            }}
          >
            {es
              ? "Cuando operas en plan ganas. Cuando lo rompes, pierdes. El gap entre ambas cosas es lo que te está costando el dinero."
              : "When you trade the plan, you earn. When you break it, you lose. The gap between the two is what costs you money."}
          </p>
          {/* Tabla expectancy — R21-3b: outer keeps rounded corners + border
              via overflow-hidden; inner wrapper is overflow-x-auto so the
              3-col grid can scroll horizontally on very narrow viewports
              (e.g. 320px iPhone SE, where the es-ES "Expectancy" header at
              10px/0.14em tracking + the longest row label "Fuera de plan"
              at 13.5px together push the grid's min-content past 280px).
              The custom-scroll class styles the scrollbar to match the
              site's liquid-glass aesthetic. min-w-0 on the row label span
              lets the 1fr column shrink below its content's min-content
              width so break-words can wrap long labels instead of pushing
              the value column off the right edge. */}
          <div
            className="rounded-[2px] overflow-hidden"
            style={{
              border: "1px solid rgb(var(--divider) / 0.13)",
              // R27-1e dejó pendiente el valor verde "+29,73 $" de esta
              // tabla, marginal en AA (~4,0:1): al 50% de opacidad, lo que
              // hay detrás del cristal (aurora del fondo) se cuela lo
              // bastante como para aclarar el fondo efectivo. Subido al
              // 70%, el mismo valor que ya usa la factura de al lado
              // (línea de abajo) sin queja previa, para que --surface pese
              // más que lo que asome detrás. Pendiente de remedir con el
              // navegador cuando esté disponible.
              background: "color-mix(in oklab, var(--surface) 70%, transparent)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
            }}
          >
          <div className="overflow-x-auto custom-scroll">
            <div className="grid grid-cols-3 text-sm min-w-[260px]" style={{ padding: "10px 14px", borderBottom: "1px solid rgb(var(--divider) / 0.06)", color: "var(--ink-3)" }}>
              <span className="tnum min-w-0" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" }}>{es ? "Modo" : "Mode"}</span>
              <span className="tnum text-right min-w-0" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" }}>{es ? "Operaciones" : "Trades"}</span>
              <span className="tnum text-right min-w-0" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" }}>{es ? "Expectancy" : "Expectancy"}</span>
            </div>
            {[
              { l: es ? "En plan" : "In plan", n: 36, v: "+29,73 $", c: "rgb(var(--pnl-pos))" },
              { l: es ? "Fuera de plan" : "Off plan", n: 24, v: "−38,47 $", c: "rgb(var(--pnl-neg))" },
              { l: es ? "Gap" : "Gap", n: "—", v: "−68,20 $", c: "rgb(var(--pnl-neg))", highlight: true },
            ].map((row, i) => (
              <div
                key={row.l}
                className="grid grid-cols-3 group/row relative transition-colors duration-200 min-w-[260px]"
                style={{
                  padding: "12px 14px 12px 16px",
                  borderBottom: i < 2 ? "1px solid rgb(var(--divider) / 0.06)" : undefined,
                  background: row.highlight ? "color-mix(in oklab, rgb(var(--pnl-neg)) 6%, transparent)" : undefined,
                }}
              >
                {/* R20-3b: hover rail — accent on neutral rows, deeper red on the gap row.
                    Sits behind the row content via z-index 0 and pointer-events: none.
                    R24-1c: the Gap row now shows its red rail STATICALLY
                    (opacity-100 instead of opacity-0) so the most important
                    row reads as stamped even without hover — the hover
                    transition still applies to the other rows. */}
                <span
                  aria-hidden
                  className={`absolute left-0 top-0 bottom-0 pointer-events-none transition-opacity duration-200 ${row.highlight ? "opacity-100" : "opacity-0 group-hover/row:opacity-100"}`}
                  style={{
                    width: 2,
                    background: row.highlight
                      ? "rgb(var(--pnl-neg))"
                      : "rgb(var(--accent-base))",
                  }}
                />
                <span className="relative min-w-0 break-words" style={{ fontSize: 13.5, color: "var(--ink)", fontWeight: row.highlight ? 600 : 400 }}>{row.l}</span>
                <span className="tnum text-right relative min-w-0" style={{ fontSize: 13.5, color: "var(--ink-2)" }}>{row.n}</span>
                <span className="tnum text-right relative min-w-0" style={{ fontSize: row.highlight ? 16 : 14, fontWeight: 700, color: row.c }}>{row.v}</span>
              </div>
            ))}
          </div>
          </div>
          <p className="mt-3" style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.5 }}>
            {es
              ? "Expectancy = promedio ganado por operación. El gap es la diferencia: lo que dejas de ganar por romper tus reglas."
              : "Expectancy = average earned per trade. The gap is the difference: what you leave on the table by breaking your rules."}
          </p>
        </div>

        {/* Mockup factura */}
        <div
          className="relative"
          style={{
            padding: 22,
            borderRadius: 3,
            border: "1px solid rgb(var(--divider) / 0.13)",
            background: "color-mix(in oklab, var(--surface) 70%, transparent)",
            backdropFilter: "blur(20px) saturate(1.4)",
            WebkitBackdropFilter: "blur(20px) saturate(1.4)",
            boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.08)",
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <span
              className="tnum"
              style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)" }}
            >
              {es ? "Factura de indisciplina · julio 2026" : "Indiscipline invoice · July 2026"}
            </span>
            <span
              className="tnum self-start sm:self-auto"
              style={{
                fontSize: 10,
                padding: "3px 9px",
                borderRadius: 4,
                background: "rgb(var(--pnl-neg) / 0.14)",
                color: "rgb(var(--pnl-neg))",
                border: "1px solid rgb(var(--pnl-neg) / 0.28)",
              }}
            >
              #IND-2026-07
            </span>
          </div>
          <ul className="m-0 p-0 list-none space-y-2.5 mb-4">
            {[
              { l: es ? "Operar fuera de horario" : "Trading off-hours", pct: 32 },
              { l: es ? "Tamaño excesivo" : "Oversize", pct: 27 },
              { l: es ? "Sin stop loss" : "No stop loss", pct: 18 },
              { l: es ? "Perseguir el precio" : "Chasing price", pct: 14 },
              { l: es ? "Mover stop a mano" : "Manually moving stop", pct: 9 },
            ].map((row) => (
              <li key={row.l}>
                <div className="flex items-center justify-between mb-1 gap-2">
                  <span className="min-w-0 break-words" style={{ fontSize: 13, color: "var(--ink)" }}>{row.l}</span>
                  <span className="tnum shrink-0" style={{ fontSize: 12, color: "var(--ink-2)" }}>{row.pct} %</span>
                </div>
                <div className="h-1 rounded-[2px] overflow-hidden relative" style={{ background: "rgb(var(--divider) / 0.13)", boxShadow: "inset 0 1px 0 rgb(0 0 0 / 0.18)" }}>
                  <div
                    className="h-full rounded-[2px] relative"
                    style={{
                      width: `${row.pct * 2.5}%`,
                      // R20-3b: gradient fill — solid red on the leading edge,
                      // a hair translucent at the trailing edge so the bar reads
                      // as a meter rather than a flat slab. Top inset highlight
                      // (rgb white 0.18) gives a “metallic” fill catch.
                      background:
                        "linear-gradient(90deg, rgb(var(--pnl-neg)) 0%, color-mix(in oklab, rgb(var(--pnl-neg)) 70%, transparent) 100%)",
                      boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.20)",
                      transition: "width 0.45s var(--ease-suave)",
                    }}
                  >
                    {/* R24-1c: bright leading-edge cap — a 2px solid pnl-neg
                        pill at the right end of the fill so each bar reads as
                        a meter with a clearly defined “current value” edge
                        rather than a fading tint. Sits flush to the fill’s
                        right edge via absolute right-0 top-0 bottom-0. */}
                    <span
                      aria-hidden
                      className="absolute right-0 top-0 bottom-0"
                      style={{
                        width: 2,
                        background: "rgb(var(--pnl-neg))",
                      }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between pt-3 border-t gap-2 relative" style={{ borderColor: "rgb(var(--divider) / 0.06)", marginTop: 4, paddingTop: 14, paddingBottom: 4, background: "color-mix(in oklab, rgb(var(--pnl-neg)) 4%, transparent)", borderRadius: 3, paddingLeft: 12, paddingRight: 12, marginLeft: -4, marginRight: -4 }}>
            {/* R24-1c: total row now reads as a stamped footer — tinted
                pnl-neg/4 backdrop + tiny accent-red TOTAL badge before the
                label so the “Month total” row stands apart from the
                invoice line items above. The negative margin + padding
                lets the backdrop extend slightly past the line items’ left
                edge so the total reads as a sibling-level summary. */}
            <span className="inline-flex items-center gap-2 min-w-0">
              <span
                aria-hidden
                className="tnum inline-flex items-center justify-center"
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  color: "rgb(var(--pnl-neg))",
                  background: "color-mix(in oklab, rgb(var(--pnl-neg)) 14%, transparent)",
                  border: "1px solid color-mix(in oklab, rgb(var(--pnl-neg)) 32%, transparent)",
                  borderRadius: 4,
                  padding: "2px 5px",
                }}
              >
                {es ? "TOTAL" : "TOTAL"}
              </span>
              <span className="min-w-0 break-words" style={{ fontSize: 13, color: "var(--ink-2)" }}>{es ? "Total del mes" : "Month total"}</span>
            </span>
            <span
              className="tnum font-serif shrink-0"
              style={{ fontSize: 28, fontWeight: 400, color: "rgb(var(--pnl-neg))" }}
            >
              −577,10 $
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
