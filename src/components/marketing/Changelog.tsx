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
          title: "Programa de escritorio",
          description:
            "Terminado el producto mínimo: diario, métricas, riesgo, psicología, modo prop firm, módulo fiscal y terminal de Mercados. Antes de abrir la venta faltan la tienda, la firma del instalador y la licencia de uso.",
          date: "Construido",
          stage: "delivered",
        },
        {
          version: "03",
          title: "Acceso anticipado privado",
          description:
            "Pilotos invitados para validar operativa manual y prop firms con usuarios que quieran llevar sus propios datos.",
          date: "En preparación",
          stage: "pilot",
        },
        {
          version: "04",
          title: "Importación ampliada",
          description: "Importadores de TradeZella, Tradervue y Edgewonk, y más formatos de bróker.",
          date: "Más adelante",
          stage: "future",
        },
        {
          version: "05",
          title: "Más prop firms",
          description:
            "Hoy hay plantillas de FTMO, Topstep, The5ers, FundedNext y Apex, cada una con su fecha de revisión.",
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
          title: "Desktop app",
          description:
            "Minimum product finished: journal, metrics, risk, psychology, prop firm mode, tax module and Markets terminal. Before sales open it still needs the store, installer signing and the end-user licence.",
          date: "Built",
          stage: "delivered",
        },
        {
          version: "03",
          title: "Private early access",
          description:
            "Invited pilots validating manual trading and prop-firm workflows with users ready to bring their own data.",
          date: "Preparing",
          stage: "pilot",
        },
        {
          version: "04",
          title: "Expanded imports",
          description: "TradeZella, Tradervue and Edgewonk importers, and more broker formats.",
          date: "Later",
          stage: "future",
        },
        {
          version: "05",
          title: "More prop firms",
          description:
            "Today there are templates for FTMO, Topstep, The5ers, FundedNext and Apex, each with its review date.",
          date: "Later",
          stage: "future",
        },
      ];

  return (
    <section id="changelog" className="section cv-auto relative overflow-clip scroll-mt-24">

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
        <ol className="relative mt-14 m-0 overflow-clip rounded-[4px] border border-[rgb(var(--divider)/0.13)] p-0">
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
                  className="tnum text-[13px] font-semibold"
                  style={{ color: "rgb(var(--accent-base))" }}
                >
                  {entry.version}
                </span>
                <div>
                  <h3 className="m-0 text-[15px] font-semibold tracking-tight text-primary">
                    {entry.title}
                  </h3>
                  <p className="mt-1 m-0 text-[13px] text-tertiary tnum">
                    <span className="sr-only">{estado}: </span>
                    {entry.date}
                  </p>
                </div>
                <p
                  className={`m-0 text-[14px] leading-[1.55] ${
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
