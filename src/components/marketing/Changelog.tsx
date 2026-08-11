"use client";

import { useLang } from "@/lib/i18n";
import { Eyebrow } from "@/components/tj/Eyebrow";
import { Reveal } from "@/components/tj/Reveal";
import { Chip } from "@/components/tj/Chip";
import { SelloPrevisto } from "@/components/tj/SelloPrevisto";

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
          /* Iba numerada 01 · 02 · 02 · 03: el «02» estaba repetido, así
             que la hoja de ruta se leía con un paso duplicado y otro
             ausente. React además usa este valor como clave de la lista
             y avisaba por consola de dos hermanos con la misma. */
          version: "03",
          title: "Importación ampliada",
          description: "Más formatos de bróker y migración desde otros journals.",
          date: "Más adelante",
          stage: "future",
        },
        {
          version: "04",
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
          // Mismo arreglo de numeración que en la versión española.
          version: "03",
          title: "Expanded imports",
          description: "More broker formats and migration from other journals.",
          date: "Later",
          stage: "future",
        },
        {
          version: "04",
          title: "Advanced prop firm mode",
          description: "Daily loss rules, max drawdown and account reset.",
          date: "Later",
          stage: "future",
        },
      ];

  return (
    <section id="changelog" className="section cv-auto bg-veil relative overflow-clip scroll-mt-24">
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
                    {/* La entrada va en el envoltorio y NO también en la
                        tarjeta: el de dentro era un `motion.div` sin props
                        de animación, y dos entradas anidadas multiplican
                        sus opacidades — la tarjeta empezaría a 0 × 0 y
                        llegaría tarde a su propio sitio. */}
                    <div
                      data-entra={isLeft ? "izq" : "der"}
                      className="h-full"
                    >
                      <div
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
                              /* El borde discontinuo se va DE AQUÍ: el sello
                                 que hay justo al lado ya dice que la entrega
                                 está prevista, y decirlo dos veces con la
                                 misma línea de trazos no lo dice más fuerte,
                                 sólo hace que el número de versión parezca
                                 él mismo provisional. La versión es firme;
                                 lo previsto es la fecha. */
                              className={isPast ? "" : "text-tertiary"}
                            >
                              <span className="t-h4 tnum">{entry.version}</span>
                            </Chip>
                            {/* El chip ámbar de «Futuro» era el tercer
                                dialecto del sitio para decir lo mismo, y
                                encima con color de aviso: una entrega
                                planificada no es una advertencia. Pasa al
                                sello, que es la misma pieza que marca el
                                precio previsto y las filas pendientes del
                                estado. El acceso anticipado SÍ conserva su
                                chip: eso no está previsto, está abierto. */}
                            {!isPast && (
                              isPilot ? (
                                <Chip variant="accent">
                                  {es ? "Acceso anticipado" : "Early access"}
                                </Chip>
                              ) : (
                                <SelloPrevisto es="Previsto" en="Planned" />
                              )
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
                        </div>
                    </div>
                  </div>

                  {/* Node dot — pops in on view. Past: solid accent dot.
                      Future: hollow ring signals "in progress". */}
                  <div
                    data-entra="sello"
                    className="absolute left-4 md:left-1/2 top-6 md:top-1/2 -translate-x-1/2 md:-translate-y-1/2 z-10"
                    aria-hidden
                  >
                    {isPast || isPilot ? (
                      <span className="block w-3.5 h-3.5 rounded-full bg-[rgb(var(--accent-base))]" />
                    ) : (
                      <span className="relative block w-3.5 h-3.5 rounded-full border-2 border-[rgb(var(--pnl-warn)/0.85)] bg-background" />
                    )}
                  </div>

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
