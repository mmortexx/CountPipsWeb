"use client";

import { motion } from "framer-motion";
import { useLang } from "@/lib/i18n";
import { Eyebrow } from "@/components/tj/Eyebrow";
import { Reveal } from "@/components/tj/Reveal";
import { Chip } from "@/components/tj/Chip";

/**
 * Changelog & Roadmap — vertical timeline that shows the product is
 * actively developed and gives transparency about where it's going.
 *
 * Premium motion layer:
 *  - Center accent line that fades in at top/bottom.
 *  - Timeline dots pop in (scale 0→1, springy) on view.
 *  - Cards slide in from alternating sides on desktop (left/right),
 *    stack on mobile with the line on the left.
 *  - Upcoming dots use a hollow ring to signal "in progress".
 *  - Each card uses a spring hover lift for subtle interactivity.
 */

type Entry = {
  version: string;
  title: string;
  description: string;
  date: string;
  stage: "delivered" | "pilot" | "future";
};

export function Changelog() {
  const { lang } = useLang();
  const es = lang === "es";

  const entries: Entry[] = es
    ? [
        {
          version: "01",
          title: "Demo pública",
          description:
            "Recorrido interactivo con datos deterministas para entender el producto sin registro ni instalación.",
          date: "Entregado",
          stage: "delivered",
        },
        {
          version: "02",
          title: "Acceso anticipado privado",
          description:
            "Pilotos invitados para validar operativa manual y prop firms con usuarios que quieran llevar sus propios datos.",
          date: "En preparación",
          stage: "pilot",
        },
        {
          version: "02",
          title: "Importación ampliada",
          description: "Más formatos de bróker y migración desde otros journals.",
          date: "Más adelante",
          stage: "future",
        },
        {
          version: "03",
          title: "Modo prop firm avanzado",
          description:
            "Reglas de pérdida diaria, drawdown máximo y reset por cuenta.",
          date: "Más adelante",
          stage: "future",
        },
      ]
    : [
        {
          version: "01",
          title: "Public demo",
          description:
            "An interactive, deterministic walkthrough to understand the product with no signup or install.",
          date: "Delivered",
          stage: "delivered",
        },
        {
          version: "02",
          title: "Private early access",
          description:
            "Invited pilots validating manual trading and prop-firm workflows with users ready to bring their own data.",
          date: "Preparing",
          stage: "pilot",
        },
        {
          version: "02",
          title: "Expanded imports",
          description: "More broker formats and migration from other journals.",
          date: "Later",
          stage: "future",
        },
        {
          version: "03",
          title: "Advanced prop firm mode",
          description: "Daily loss rules, max drawdown and account reset.",
          date: "Later",
          stage: "future",
        },
      ];

  return (
    <section id="changelog" className="section cv-auto bg-veil relative overflow-hidden scroll-mt-24">
      {/* Section grain — opt-in 3 % fractalNoise overlay. */}
      <div aria-hidden="true" className="grain absolute inset-0 pointer-events-none" />

      <div className="relative z-10 tj-container">
        {/* Header */}
        <div className="relative max-w-3xl mx-auto text-center">
          <Reveal>
            <div className="relative flex justify-center">
              <Eyebrow>{es ? "Estado del producto" : "Product status"}</Eyebrow>
            </div>
          </Reveal>
          <Reveal delay={0.06}>
            <h2
              className="relative mt-5 t-h2 text-primary"
            >
              {es ? (
                <>
                  Qué está listo, <span className="text-gradient">qué validamos y qué sigue.</span>
                </>
              ) : (
                <>
                  What is ready, <span className="text-gradient">what we validate and what follows.</span>
                </>
              )}
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="relative mt-4 text-lg text-secondary max-w-xl mx-auto leading-[1.6]">
              {es
                ? "Separado entre entregado, acceso anticipado y futuro. Sin testimonios ni fechas inventadas: actualizamos esta página cuando haya evidencia."
                : "Separated into delivered, early access and future. No invented testimonials or dates: we update this page when there is evidence."}
            </p>
          </Reveal>
        </div>

        {/* Timeline */}
        <div className="relative mt-16 md:mt-20">
          {/* Center line — left on mobile, center on desktop */}
          <div
            className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px md:-translate-x-1/2 bg-gradient-to-b from-transparent via-[rgb(var(--divider)/0.35)] to-transparent"
            aria-hidden
          />

          <div className="space-y-8 md:space-y-10">
            {entries.map((entry, i) => {
              const isPast = entry.stage === "delivered";
              const isPilot = entry.stage === "pilot";
              const isLeft = i % 2 === 0; // even → left side on desktop
              // Slide-in direction: left card slides from left, right card from right
              const slideX = isLeft ? -48 : 48;

              return (
                <div
                  key={entry.version}
                  className={`relative md:flex md:items-center ${
                    isLeft ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Card column */}
                  <div
                    className={`pl-12 md:pl-0 md:w-1/2 ${
                      isLeft ? "md:pr-12 md:text-right" : "md:pl-12"
                    }`}
                  >
                    <motion.div
                      initial={{ opacity: 0, x: slideX }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{
                        duration: 0.7,
                        ease: [0.22, 1, 0.36, 1],
                        delay: 0.05,
                      }}
                      className="h-full"
                    >
                      <motion.div
                        className={`tj-paper rounded-[2px] border border-[rgb(var(--divider)/0.13)] p-5 h-full min-w-0 transition-[background-color,border-color,box-shadow,transform] duration-300 ease-[var(--ease-suave)] ${
                          isPast
                            ? "hover:border-[rgb(var(--accent-base)/0.30)]"
                            : "hover:border-[rgb(var(--divider)/0.25)]"
                        }`}
                      >
                          <div
                            className={`flex flex-wrap items-center gap-2 ${
                              isLeft ? "md:justify-end" : "md:justify-start"
                            }`}
                          >
                            <Chip
                              variant={isPast ? "accent" : isPilot ? "accent" : "neutral"}
                              className={
                                isPast
                                  ? ""
                                  : "border-dashed border-[rgb(var(--divider)/0.22)] text-tertiary"
                              }
                            >
                              <span className="t-h4 tnum">{entry.version}</span>
                            </Chip>
                            {!isPast && (
                              <Chip variant="warn">
                                {isPilot ? (es ? "Acceso anticipado" : "Early access") : es ? "Futuro" : "Future"}
                              </Chip>
                            )}
                          </div>

                          {/* Título siempre a pleno contraste. Las
                              entregas futuras se atenuaban por triplicado
                              —tarjeta al 90 %, título al 90 % y descripción
                              en gris terciario—, así que media sección se
                              leía como deshabilitada. El chip "Próximo" y
                              el borde discontinuo ya dicen que aún no está;
                              no hace falta apagar el texto. */}
                          <h3 className="mt-3 t-h4 text-primary">
                            {entry.title}
                          </h3>
                          <p
                            className={`mt-1.5 text-sm leading-[1.6] ${
                              isPast || isPilot ? "text-secondary" : "text-tertiary"
                            }`}
                          >
                            {entry.description}
                          </p>

                          <div
                            className={`mt-3 flex items-center gap-1.5 text-xs text-tertiary tnum ${
                              isLeft ? "md:justify-end" : "md:justify-start"
                            }`}
                          >
                              <span
                                className={`inline-block w-1.5 h-1.5 rounded-full ${
                                isPast ? "bg-[rgb(var(--accent-base)/0.85)]" : isPilot ? "bg-pnl-pos/80" : "bg-pnl-warn/70"
                              }`}
                              aria-hidden
                            />
                            {entry.date}
                          </div>
                        </motion.div>
                    </motion.div>
                  </div>

                  {/* Node dot — pops in on view. Past: solid accent dot.
                      Future: hollow ring signals "in progress". */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{
                      duration: 0.5,
                      ease: [0.34, 1.56, 0.64, 1],
                      delay: 0.12,
                    }}
                    className="absolute left-4 md:left-1/2 top-6 md:top-1/2 -translate-x-1/2 md:-translate-y-1/2 z-10"
                    aria-hidden
                  >
                    {isPast || isPilot ? (
                      <span className="block w-3.5 h-3.5 rounded-full bg-[rgb(var(--accent-base))]" />
                    ) : (
                      <span className="relative block w-3.5 h-3.5 rounded-full border-2 border-[rgb(var(--pnl-warn)/0.85)] bg-background" />
                    )}
                  </motion.div>

                  {/* Spacer for the other half on desktop */}
                  <div className="hidden md:block md:w-1/2" aria-hidden />
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer line */}
        <Reveal delay={0.1}>
          <div className="mt-14 flex flex-col items-center gap-3 text-center">
            <div className="divider-grad w-40" aria-hidden />
            <p className="text-sm text-secondary">
              <span className="text-[rgb(var(--pnl-pos))] font-medium">✓</span>{" "}
              {es
                ? "El acceso anticipado se abre con usuarios reales. Publicamos cambios cuando están validados."
                : "Early access opens with real users. We publish changes once they are validated."}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
