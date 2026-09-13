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
      icon: <CaptureIcon />,
      kbd: "Ctrl + Enter",
    },
    {
      n: "02",
      title: es ? "Analiza tus métricas" : "Analyze your metrics",
      desc: es
        ? "Más de 40 métricas institucionales recalculadas con cada operación: expectancy, profit factor, Sharpe, drawdown, win rate por setup."
        : "Over 40 institutional metrics recalculated with every trade: expectancy, profit factor, Sharpe, drawdown, win rate by setup.",
      icon: <AnalyzeIcon />,
      kbd: "Ctrl + 3",
    },
    {
      n: "03",
      title: es ? "Mejora tu disciplina" : "Improve your discipline",
      desc: es
        ? "El ritual pre/post mercado y el coste de indisciplina te muestran lo que tu comportamiento te cuesta — en dinero real."
        : "The pre/post-market ritual and the cost-of-indiscipline metric show what your behavior costs you — in real money.",
      icon: <ImproveIcon />,
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
                <kbd className="hidden md:inline-flex items-center px-1.5 h-6 rounded-[4px] text-[12px] font-mono text-secondary bg-[var(--chip)] border border-[var(--chip-line)]">
                  {s.kbd}
                </kbd>
              </div>
              <div className="mt-8">{s.icon}</div>
              <h3 className="mt-6 t-h3 text-primary">{s.title}</h3>
              <p className="mt-2 text-[15px] text-secondary leading-[1.6]">{s.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ----- Step illustrations (inline SVG) ----- */

function CaptureIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="8" y="14" width="48" height="34" rx="2" stroke="rgb(var(--accent-base))" strokeWidth="1.6" />
      <path d="M8 22h48" stroke="rgb(var(--accent-base))" strokeWidth="1.6" />
      {/* Barra de título Windows 11: minimizar, maximizar, cerrar a la derecha. */}
      <path d="M42 18h6" stroke="rgb(var(--accent-base))" strokeWidth="1.2" strokeLinecap="round" />
      <rect x="50.2" y="16.4" width="3.2" height="3.2" stroke="rgb(var(--accent-base))" strokeWidth="1.1" />
      <path d="M56.2 16.4l3.2 3.2M59.4 16.4l-3.2 3.2" stroke="rgb(var(--accent-base))" strokeWidth="1.1" strokeLinecap="round" />
      {/* Candlesticks */}
      <g stroke="rgb(var(--pnl-pos))" strokeWidth="1.4" strokeLinecap="round">
        <path d="M22 36v-6M22 42v4" />
      </g>
      <rect x="20" y="30" width="4" height="12" fill="rgb(var(--pnl-pos))" opacity="0.25" stroke="rgb(var(--pnl-pos))" strokeWidth="1.2" />
      <g stroke="rgb(var(--pnl-neg))" strokeWidth="1.4" strokeLinecap="round">
        <path d="M32 34v-4M32 44v2" />
      </g>
      <rect x="30" y="30" width="4" height="14" fill="rgb(var(--pnl-neg))" opacity="0.25" stroke="rgb(var(--pnl-neg))" strokeWidth="1.2" />
      <g stroke="rgb(var(--pnl-pos))" strokeWidth="1.4" strokeLinecap="round">
        <path d="M42 38v-4M42 44v2" />
      </g>
      <rect x="40" y="34" width="4" height="12" fill="rgb(var(--pnl-pos))" opacity="0.25" stroke="rgb(var(--pnl-pos))" strokeWidth="1.2" />
      {/* Plus badge */}
      <rect x="44" y="38" width="12" height="12" fill="rgb(var(--accent-base))" />
      <path d="M50 41v6M47 44h6" stroke="rgb(var(--accent-ink))" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function AnalyzeIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      {/* Bars */}
      <g>
        <rect x="10" y="34" width="8" height="20" rx="1.5" fill="rgb(var(--accent-base))" opacity="0.35" />
        <rect x="22" y="24" width="8" height="30" rx="1.5" fill="rgb(var(--accent-base))" opacity="0.55" />
        <rect x="34" y="18" width="8" height="36" rx="1.5" fill="rgb(var(--accent-base))" opacity="0.75" />
        <rect x="46" y="28" width="8" height="26" rx="1.5" fill="rgb(var(--accent-base))" />
      </g>
      {/* Trend line */}
      <path d="M14 36 L26 26 L38 20 L50 30" stroke="rgb(var(--pnl-pos))" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dot */}
      <circle cx="38" cy="20" r="2.5" fill="rgb(var(--pnl-pos))" />
      <circle cx="38" cy="20" r="5" fill="none" stroke="rgb(var(--pnl-pos))" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

function ImproveIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      {/* Compass ring */}
      <circle cx="32" cy="32" r="22" stroke="rgb(var(--accent-base))" strokeWidth="1.4" opacity="0.4" />
      <circle cx="32" cy="32" r="16" stroke="rgb(var(--accent-base))" strokeWidth="1.2" opacity="0.6" />
      {/* Tick marks */}
      <g stroke="rgb(var(--accent-base))" strokeWidth="1.4" strokeLinecap="round">
        <path d="M32 10v4M32 50v4M10 32h4M50 32h4" />
      </g>
      {/* Needle */}
      <path d="M32 32 L46 22" stroke="rgb(var(--pnl-pos))" strokeWidth="2" strokeLinecap="round" />
      <path d="M32 32 L24 44" stroke="rgb(var(--pnl-neg))" strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="32" r="3" fill="rgb(var(--accent-base))" />
      {/* Up arrow badge */}
      <circle cx="48" cy="48" r="7" fill="rgb(var(--pnl-pos))" opacity="0.15" stroke="rgb(var(--pnl-pos))" strokeWidth="1.2" />
      <path d="M44 50 L48 46 L52 50" stroke="rgb(var(--pnl-pos))" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
