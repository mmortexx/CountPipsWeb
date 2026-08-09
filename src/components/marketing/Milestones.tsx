"use client";

import { motion } from "framer-motion";
import { useLang } from "@/lib/i18n";
import { Eyebrow } from "@/components/tj/Eyebrow";
import { Reveal } from "@/components/tj/Reveal";
import { SectionHeader } from "@/components/layout/SectionHeader";

/**
 * Milestones — horizontal scrollable product timeline. Five points mark the
 * journey from v1.0 to what's next. Past milestones use a solid accent dot;
 * the upcoming one uses a hollow ring. Connected by a line that runs across
 * the row.
 *
 * Layout: a horizontally scrollable rail on small screens, a centered row on
 * wide screens. Each milestone card carries the date (tnum), title, and a
 * chip indicating past/next status. Scroll-snap keeps things tidy on touch.
 */

interface Milestone {
  date: string;
  titleEs: string;
  titleEn: string;
  kind: "past" | "next";
}

export function Milestones() {
  const { lang } = useLang();
  const es = lang === "es";

  const milestones: Milestone[] = [
    {
      date: es ? "Ene 2026" : "Jan 2026",
      titleEs: "Lanzamiento v1.0",
      titleEn: "v1.0 launch",
      kind: "past",
    },
    {
      date: es ? "Mar 2026" : "Mar 2026",
      titleEs: "Playbook con stats en vivo",
      titleEn: "Live playbook stats",
      kind: "past",
    },
    {
      date: es ? "May 2026" : "May 2026",
      titleEs: "Monte Carlo + Risk of ruin",
      titleEn: "Monte Carlo + Risk of ruin",
      kind: "past",
    },
    {
      date: es ? "Jul 2026" : "Jul 2026",
      titleEs: "Discipline Guardian",
      titleEn: "Discipline Guardian",
      kind: "past",
    },
    {
      date: es ? "Próximo" : "Next",
      titleEs: "Importador de rivales",
      titleEn: "Rival importer",
      kind: "next",
    },
  ];

  return (
    <section id="milestones" className="section cv-auto bg-veil relative overflow-hidden scroll-mt-24">
      {/* Section grain — opt-in 3 % fractalNoise overlay. */}
      <div aria-hidden="true" className="grain absolute inset-0 pointer-events-none" />

      <div className="relative z-10 tj-container">
        {/* Header */}
        <SectionHeader
          composicion="partida"
          etiqueta={es ? "Trayectoria" : "Timeline"}
          titulo={es ? (
                <>
                  De idea a <span className="text-gradient">realidad.</span>
                </>
              ) : (
                <>
                  From idea to <span className="text-gradient">reality.</span>
                </>
              )}
          entradilla={es
                ? "Doce meses, cinco hitos. Cada uno sale de la misma conversación: traders reales pidiendo una cosa concreta."
                : "Twelve months, five milestones. Each one comes from the same conversation: real traders asking for one concrete thing."}
        />

        {/* Horizontal rail */}
        <Reveal delay={0.18} y={36}>
          <div
            className="relative mt-14 overflow-x-auto pb-6 -mx-5 px-5 md:mx-0 md:px-0
 [scrollbar-width:thin] [scrollbar-color:rgb(var(--accent-base)/0.4)_transparent]
                       snap-x snap-mandatory"
            style={{ scrollbarWidth: "thin" }}
          >
            {/* Connector line — sits behind the dots, accent gradient past → muted for upcoming */}
            <div
              aria-hidden="true"
              className="absolute left-0 right-0 top-[18px] h-px pointer-events-none"
              style={{
                background:
                  "linear-gradient(to right, rgb(var(--accent-base)) 0%, rgb(var(--accent-base)) 70%, rgb(var(--accent-base) / 0.25) 100%)",
              }}
            />

            <ol className="relative flex gap-5 md:gap-8 min-w-max md:min-w-full md:justify-between">
              {milestones.map((m, i) => {
                const isPast = m.kind === "past";
                return (
                  <motion.li
                    key={m.date}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{
                      duration: 0.55,
                      delay: 0.1 + i * 0.1,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="relative snap-start shrink-0 w-[230px] md:w-auto md:flex-1 min-w-0"
                  >
                    {/* Dot */}
                    <div className="relative flex items-center justify-start h-9">
                      {isPast ? (
                        <motion.span
                          aria-hidden="true"
                          className="block w-3.5 h-3.5 rounded-full bg-[rgb(var(--accent-base))]"
                          initial={{ scale: 0, opacity: 0 }}
                          whileInView={{ scale: 1, opacity: 1 }}
                          viewport={{ once: true, margin: "-40px" }}
                          transition={{
                            type: "spring",
                            stiffness: 320,
                            damping: 18,
                            delay: 0.18 + i * 0.1,
                          }}
                        />
                      ) : (
                        <span className="relative block w-3.5 h-3.5">
                          {/* Anillo hueco estático: indicador de "en camino".
                              El halo pulsante en bucle infinito se retiró
                              (movimiento decorativo gratuito). */}
                          <span className="relative block w-3.5 h-3.5 rounded-full border-2 border-[rgb(var(--pnl-warn)/0.55)] bg-background" />
                        </span>
                      )}
                    </div>

                    {/* Card — hover now also lifts (-translate-y-1) for
                        tactile parity with the Story / Values cards that use
                        a spring y-shift. The shadow + border tokens stay
                        accent-tinted so a past milestone reads as "shipped
                        with energy" and the upcoming one stays muted. */}
                    <div className="mt-3 tj-paper rounded-[2px] border border-[rgb(var(--divider)/0.13)] p-4 transition-[box-shadow,border-color,transform] duration-300 ease-[var(--ease-suave)] hover:-translate-y-1 hover:border-[rgb(var(--accent-base)/0.30)]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-primary tnum">
                          {m.date}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-[2px] px-[0.55rem] py-[0.15rem] text-[11px] font-semibold uppercase tracking-[0.12em] tnum ${
                            isPast
                              ? "bg-[rgb(var(--divider)/0.05)] text-primary border border-[rgb(var(--divider)/0.20)]"
                              : "bg-[rgb(var(--divider)/0.05)] text-tertiary border border-dashed border-[rgb(var(--divider)/0.22)]"
                          }`}
                        >
                          {isPast
                            ? es
                              ? "Hecho"
                              : "Shipped"
                            : es
                            ? "Próximo"
                            : "Next"}
                        </span>
                      </div>
                      <h3
                        className={`mt-2 t-h4 ${
                          isPast ? "text-primary" : "text-primary/90"
                        }`}
                      >
                        {es ? m.titleEs : m.titleEn}
                      </h3>
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-tertiary tnum">
                        <span
                          className={`inline-block w-1.5 h-1.5 rounded-full ${
                            isPast ? "bg-[rgb(var(--divider)/0.70)]" : "bg-pnl-warn/70"
                          }`}
                          aria-hidden="true"
                        />
                        {String(i + 1).padStart(2, "0")} / {String(milestones.length).padStart(2, "0")}
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ol>
          </div>
        </Reveal>

        {/* Footer hint — legend dots separated by a 1px vertical hairline
            (divider token at 0.12) instead of a bare "·" glyph, so the
            rhythm matches the .divider-grad separator used across the
            site's footer codas. Hidden on touch widths where the row wraps. */}
        <Reveal delay={0.3}>
          <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-tertiary">
            <span className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[rgb(var(--accent-base))]" aria-hidden="true" />
              {es ? "En tu mano hoy" : "In your hands today"}
            </span>
            <span
              aria-hidden="true"
              className="hidden sm:block h-3 w-px bg-[rgb(var(--divider)/0.12)]"
            />
            <span className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full border-2 border-[rgb(var(--pnl-warn)/0.55)] bg-background"
                aria-hidden="true"
              />
              {es ? "En camino" : "On the way"}
            </span>
            <span className="ml-auto hidden md:inline">
              {es ? "Desliza para ver todo →" : "Scroll to see all →"}
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
