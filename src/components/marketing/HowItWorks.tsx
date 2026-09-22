"use client";

import { useLang } from "@/lib/i18n";
import { SectionHeader } from "@/components/layout/SectionHeader";

/** 3-step "how it works" — capture, analyze, improve. */
export function HowItWorks() {
  const { lang } = useLang();
  const es = lang === "es";

  const steps = [
    {
      n: "01",
      title: es ? "Registra tu operación" : "Log your trade",
      desc: es
        ? "Entra el instrumento, dirección, entrada, stop y objetivo. Arrastra capturas del gráfico. Todo se guarda en tu equipo, al instante."
        : "Enter instrument, direction, entry, stop and target. Drop chart screenshots. Everything is saved on your machine, instantly.",
      kbd: "Ctrl + Enter",
    },
    {
      n: "02",
      title: es ? "Analiza tus métricas" : "Analyse your metrics",
      desc: es
        ? "Más de 40 métricas institucionales recalculadas con cada operación: expectancy, profit factor, Sharpe, drawdown, win rate por setup."
        : "Over 40 institutional metrics recalculated with every trade: expectancy, profit factor, Sharpe, drawdown, win rate by setup.",
      kbd: "Ctrl + 3",
    },
    {
      n: "03",
      title: es ? "Mejora tu disciplina" : "Improve your discipline",
      desc: es
        ? "El ritual pre/post mercado y el coste de indisciplina te muestran lo que tu comportamiento te cuesta — en dinero real."
        : "The pre/post-market ritual and the cost-of-indiscipline metric show what your behaviour costs you — in real money.",
      kbd: "Ctrl + 4",
    },
  ];

  return (
    <section className="section relative overflow-clip">
      <div className="relative z-10 tj-container">
        {/* Header */}
        <SectionHeader
          composicion="partida"
          etiqueta={es ? "El ciclo de sesión" : "The session cycle"}
          titulo={es ? (
              <>
                Registrar. Medir. Frenar{" "}
                <span className="text-gradient">a tiempo.</span>
              </>
            ) : (
              <>
                Log. Measure. Brake{" "}
                <span className="text-gradient">in time.</span>
              </>
            )}
          entradilla={es
              ? "El mismo ritual de una mesa: anotar la operación, leer las métricas y dejar que el Guardián avise, o frene si lo activas, cuando el plan no lo permite."
              : "The same desk ritual: log the trade, read the metrics, and let the Guardian warn you, or brake you if you turn it on, when the plan does not allow it."}
        />

        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((s) => (
            <li
              data-entra="ciclo"
              key={s.n}
              className="min-w-0 border-t border-[var(--line-2)] pt-6"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="tnum text-[13px] font-semibold text-tertiary">{s.n}</span>
                <kbd className="hidden md:inline-flex items-center px-1.5 h-6 rounded-[4px] text-[12px] font-mono text-tertiary shadow-[inset_0_0_0_1px_var(--ficha-filo)]">
                  {s.kbd}
                </kbd>
              </div>
              <h3 className="mt-10 t-h3 text-primary">{s.title}</h3>
              <p className="mt-2 text-[15px] text-secondary leading-[1.6]">{s.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

