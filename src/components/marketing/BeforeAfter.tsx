"use client";

import { X, Check } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { SectionHeader } from "@/components/layout/SectionHeader";

/** Antes y después, fila a fila: cada costumbre sin diario frente a lo que cambia al medirla. */
export function BeforeAfter() {
  const { lang } = useLang();
  const es = lang === "es";

  const filas: [string, string][] = es
    ? [
        ["Operas por instinto", "Cada operación tiene un plan"],
        ["No recuerdas por qué entraste", "El motivo queda escrito en cada operación"],
        ["Repites los mismos errores", "Sabes qué funcionó y qué no"],
        ["No sabes tu win rate real", "Conoces tu expectancy por setup"],
        ["Pierdes dinero y no sabes por qué", "Ves cuánto te cuesta romper el plan"],
      ]
    : [
        ["You trade on instinct", "Every trade has a plan"],
        ["You don’t remember why you entered", "The reason is written on every trade"],
        ["You repeat the same mistakes", "You know what worked and what didn’t"],
        ["You don’t know your real win rate", "You know your expectancy per setup"],
        ["You lose money and don’t know why", "You see what breaking the plan costs you"],
      ];

  return (
    <section className="section relative">
      <div className="tj-container">
        <SectionHeader
          composicion="partida"
          etiqueta={es ? "Antes y después" : "Before and after"}
          titulo={
            es ? (
              <>
                El mismo trader. <span className="text-gradient tj-frase-nueva">Otra forma de mirarse.</span>
              </>
            ) : (
              <>
                The same trader. <span className="text-gradient tj-frase-nueva">A different way to look.</span>
              </>
            )
          }
          entradilla={
            es
              ? "No te prometemos rentabilidad. Te damos un espejo: lo que haces hoy, sin maquillaje, y lo que cambia cuando cada operación tiene un plan."
              : "We don’t promise profits. We give you a mirror: what you do today, without makeup, and what changes when every trade has a plan."
          }
        />

        <div className="mt-12">
          <div className="grid grid-cols-2 gap-6 border-b border-[var(--line-2)] pb-3 text-[13px] font-medium text-tertiary sm:gap-12">
            <span>{es ? "Sin diario" : "Without a journal"}</span>
            <span className="text-primary">{es ? "Con CountPips" : "With CountPips"}</span>
          </div>
          <ul className="m-0 list-none p-0">
            {filas.map(([antes, despues]) => (
              <li
                data-entra="ciclo"
                key={antes}
                className="grid grid-cols-2 gap-6 border-b border-[var(--line)] py-4 text-[15px] leading-[1.5] sm:gap-12"
              >
                <span className="flex min-w-0 items-start gap-3 text-tertiary">
                  <X size={16} strokeWidth={2} aria-hidden className="mt-[3px] shrink-0 text-pnl-neg" />
                  <span className="sr-only">{es ? "Sin diario: " : "Without a journal: "}</span>
                  {antes}
                </span>
                <span className="flex min-w-0 items-start gap-3 text-primary">
                  <Check size={16} strokeWidth={2} aria-hidden className="mt-[3px] shrink-0 text-[rgb(var(--sig-green))]" />
                  <span className="sr-only">{es ? "Con CountPips: " : "With CountPips: "}</span>
                  {despues}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
