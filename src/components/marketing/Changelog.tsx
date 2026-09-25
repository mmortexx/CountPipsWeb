"use client";

import { useLang } from "@/lib/i18n";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { SelloPrevisto } from "@/components/tj/SelloPrevisto";

/**
 * Estado del producto: lista de hitos entregados, en piloto y previstos.
 * Lo previsto no lleva fecha (no se inventan): solo el sello «Previsto».
 */

type Entry = {
  version: string;
  title: string;
  description: string;
  date?: string;
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
          stage: "future",
        },
        {
          version: "05",
          title: "Más prop firms",
          description:
            "Más plantillas además de las cinco de hoy: FTMO, Topstep, The5ers, FundedNext y Apex, cada una con su fecha de revisión.",
          stage: "future",
        },
      ]
    : [
        {
          version: "01",
          title: "Public demo",
          description:
            "An interactive, deterministic walkthrough to understand the product with no sign-up or install.",
          date: "Delivered",
          stage: "delivered",
        },
        {
          version: "02",
          title: "Desktop app",
          description:
            "The minimum product is finished: journal, metrics, risk, psychology, prop firm mode, tax module and Markets terminal. Before sales open it still needs the store, installer signing and the end-user licence.",
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
          stage: "future",
        },
        {
          version: "05",
          title: "More prop firms",
          description:
            "More templates beyond today’s five: FTMO, Topstep, The5ers, FundedNext and Apex, each with its review date.",
          stage: "future",
        },
      ];

  return (
    <section id="changelog" className="section cv-auto relative overflow-clip scroll-mt-24">

      <div className="relative z-10 tj-container">
        <SectionHeader
          composicion="partida"
          etiqueta={es ? "Estado del producto" : "Product status"}
          titulo={es ? (
            <>Qué está listo, <span className="text-gradient">qué validamos y qué sigue.</span></>
          ) : (
            <>What’s ready, <span className="text-gradient">what we’re testing and what comes next.</span></>
          )}
          entradilla={es
            ? "Separado entre entregado, acceso anticipado y futuro. Sin testimonios ni fechas inventadas: actualizamos esta página cuando haya evidencia."
            : "Separated into delivered, early access and future. No invented testimonials or dates: we update this page when there is evidence."}
        />

        {/* `clip` y no `hidden` — misma razón que en `DemoCapabilities`:
            `hidden` abre contenedor de desplazamiento y deja sin entrada
            a los hitos de dentro (cuatro, medidos en /about). */}
        <ol className="relative mt-14 m-0 border-t border-[var(--line)] p-0">
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
                className="grid gap-2 border-b border-[var(--line)] py-5 sm:grid-cols-[3.5rem_minmax(0,1.1fr)_minmax(0,1.6fr)_6rem] sm:items-baseline sm:gap-5"
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
                  {entry.date ? (
                    <p className="mt-1 m-0 text-[13px] text-tertiary tnum">
                      <span className="sr-only">{estado}: </span>
                      {entry.date}
                    </p>
                  ) : null}
                </div>
                <p
                  className={`medida m-0 text-[14px] leading-[1.55] ${
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

      </div>
    </section>
  );
}
