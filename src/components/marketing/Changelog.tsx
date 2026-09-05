"use client";

import { useLang } from "@/lib/i18n";
import { Eyebrow } from "@/components/tj/Eyebrow";
import { Reveal } from "@/components/tj/Reveal";
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
          description: "Más formatos de bróker y migración desde otros diarios.",
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

        {/* `clip` y no `hidden` — misma razón que en `DemoCapabilities`:
            `hidden` abre contenedor de desplazamiento y deja sin entrada
            a los hitos de dentro (cuatro, medidos en /about). */}
        <ol className="relative mt-14 m-0 overflow-clip rounded-[2px] border border-[rgb(var(--divider)/0.13)] p-0">
          {entries.map((entry) => {
            const isPast = entry.stage === "delivered";
            const isPilot = entry.stage === "pilot";
            const estado = isPast
              ? (es ? "Entregado" : "Delivered")
              : isPilot
                ? (es ? "Acceso anticipado" : "Early access")
                : (es ? "Previsto" : "Planned");
            return (
              <li
                key={entry.version}
                data-entra
                className="grid gap-2 border-b border-[rgb(var(--divider)/0.08)] px-4 py-4 last:border-b-0 sm:grid-cols-[3.5rem_minmax(0,1.1fr)_minmax(0,1.6fr)_auto] sm:items-baseline sm:gap-5"
              >
                <span
                  className="tnum text-[12px] font-semibold"
                  style={{ color: "rgb(var(--accent-base))" }}
                >
                  {entry.version}
                </span>
                <div>
                  <h3 className="m-0 text-[15px] font-semibold tracking-tight text-primary">
                    {entry.title}
                  </h3>
                  <p className="mt-1 m-0 text-[12px] text-tertiary tnum">
                    {estado}
                    <span aria-hidden> · </span>
                    {entry.date}
                  </p>
                </div>
                <p
                  className={`m-0 text-[13.5px] leading-[1.55] ${
                    isPast || isPilot ? "text-secondary" : "text-tertiary"
                  }`}
                >
                  {entry.description}
                </p>
                {!isPast && !isPilot ? (
                  <span className="sm:justify-self-end">
                    <SelloPrevisto es="Previsto" en="Planned" />
                  </span>
                ) : (
                  <span className="hidden sm:block" aria-hidden />
                )}
              </li>
            );
          })}
        </ol>

        {/* Footer line */}
        <Reveal delay={0.1}>
          <div className="mt-14 flex flex-col items-center gap-3 text-center">
            <div className="divider-grad w-40" aria-hidden />
            <p className="text-sm text-secondary">
              <span className="text-[rgb(var(--sig-green))] font-medium">✓</span>{" "}
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
