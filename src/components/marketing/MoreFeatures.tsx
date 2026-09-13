"use client";

import { useLang } from "@/lib/i18n";
import type { ReactNode } from "react";
import { SectionHeader } from "@/components/layout/SectionHeader";

/** Secondary feature grid — 8 cards with icon + title + 1-line description. */
export function MoreFeatures() {
  const { lang } = useLang();
  const es = lang === "es";

  const features: { icon: ReactNode; title: string; desc: string }[] = [
    {
      icon: <PdfIcon />,
      title: es ? "Exportación PDF" : "PDF export",
      desc: es
        ? "Informes de operaciones y mensuales con tu branding, listos para enviar."
        : "Trade and monthly reports with your branding, ready to send.",
    },
    {
      icon: <MonteCarloIcon />,
      title: "Monte Carlo",
      desc: es
        ? "Simula 1.000 permutaciones de tu secuencia para estimar el drawdown realista."
        : "Simulate 1,000 permutations of your sequence to estimate realistic drawdown.",
    },
    {
      icon: <RiskOfRuinIcon />,
      title: es ? "Risk of ruin" : "Risk of ruin",
      desc: es
        ? "Probabilidad de quebrar tu cuenta en función de win rate, payoff y riesgo %."
        : "Probability of blowing your account based on win rate, payoff and risk %.",
    },
    {
      icon: <PropFirmIcon />,
      title: es ? "Modo Prop Firm" : "Prop firm mode",
      desc: es
        ? "Reglas de daily loss, max drawdown y objetivos de fase — cumplidas o alertadas."
        : "Daily loss, max drawdown and phase goal rules — tracked or alerted.",
    },
    {
      icon: <TrackRecordIcon />,
      title: es ? "Informe de track record" : "Track record report",
      desc: es
        ? "Exporta tu historial en PDF con curva de equity, métricas y distribuciones."
        : "Export your history as PDF with equity curve, metrics and distributions.",
    },
    {
      icon: <MultiAccountIcon />,
      title: es ? "Múltiples cuentas" : "Multiple accounts",
      desc: es
        ? "Lleva tu cuenta personal, fondeos y desafíos prop en un solo archivo local."
        : "Manage personal, funded and prop challenge accounts in one local file.",
    },
    {
      icon: <MaeMfeIcon />,
      title: "MAE / MFE",
      desc: es
        ? "Maximum Adverse y Favorable Excursion: detecta si sales pronto o tarde de forma sistemática."
        : "Maximum Adverse and Favorable Excursion: detect if you exit early or late, systematically.",
    },
    {
      icon: <TagsIcon />,
      title: es ? "Tags personalizados" : "Custom tags",
      desc: es
        ? "Etiqueta operaciones por sesión, estado emocional, sentimiento de mercado o lo que necesites."
        : "Tag trades by session, emotional state, market regime or whatever you need.",
    },
  ];

  return (
    <section className="section relative overflow-clip">
      <div className="relative tj-container">
        {/* `apilada` y no `partida`: en /features esta sección viene justo
            detrás de `HowItWorks`, que ya parte su cabecera en dos
            columnas. Dos cabeceras partidas seguidas dejan de leerse
            como una decisión y empiezan a leerse como una plantilla. */}
        <SectionHeader
          composicion="apilada"
          etiqueta={es ? "Y mucho más" : "And much more"}
          titulo={es ? (
              <>
                Funciones que <span className="text-gradient">no son decorativas.</span>
              </>
            ) : (
              <>
                Features that <span className="text-gradient">aren't decorative.</span>
              </>
            )}
          entradilla={es
              ? "Cada una existe porque un trader la pidió para tomar mejores decisiones — no para llenar la landing."
              : "Each one exists because a trader asked for it to make better decisions — not to fill up the landing."}
        />

        {/* ── Ocho entradas de un índice, no ocho tarjetas ─────────────
            Eran cajas con hueco de 20 px entre ellas y un salto de 4 px
            al pasar el ratón. Ocho funciones enumeradas no son ocho
            objetos que se cogen: son las entradas de un índice, y un
            índice se compone en retícula.

            La rejilla pasa de 3 a 2/4 columnas por una razón de trazo,
            no de gusto: 8 no es divisible por 3, así que en tres
            columnas la última fila quedaba coja y el filete inferior
            colgaba sobre el hueco, con la cuadrícula abierta por la
            esquina. En 2 (sm) y en 4 (lg) las filas cierran exactas.

            El filete vertical se resuelve con un margen de −1 px y el
            recorte del contenedor, no con `nth-child`: así el trazo
            izquierdo de la primera columna se sale y se recorta, y la
            regla vale igual para 2 columnas que para 4 sin que un
            punto de ruptura tenga que deshacer lo que hizo el anterior.
            Ese encadenado de reglas es justo lo que se rompe callado
            cuando alguien cambia el número de columnas. */}
        <div className="mt-10 overflow-clip border-t border-[rgb(var(--divider)/0.14)]">
          <div className="-ml-px grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <article
                data-entra="ciclo"
                key={f.title}
                className="group min-w-0 p-5 border-b border-l border-[rgb(var(--divider)/0.14)]"
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-[2px] border border-[rgb(var(--divider)/0.16)] flex items-center justify-center text-[rgb(var(--accent-base))] mb-4 transition-colors duration-200 group-hover:border-[rgb(var(--accent-base)/0.40)]"
                >
                  {f.icon}
                </div>
                <h3 className="t-h4 text-primary">{f.title}</h3>
                {/* T2h: leading-relaxed (1.625) → leading-[1.6] per spec. */}
                <p className="mt-1.5 text-[13px] text-secondary leading-[1.6]">{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----- Feature icons (inline SVG, 18×18 in 10×10 box) ----- */

function PdfIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 2h8l4 4v16H6V2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 2v4h4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <text x="7.5" y="18.5" fontSize="6.5" fontWeight="700" fill="currentColor" fontFamily="monospace">PDF</text>
    </svg>
  );
}

function MonteCarloIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 18c2-6 4-9 6-9s4 4 6 4 4-7 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 18c2-3 4-4 6-4s4 2 6 2 4-3 6-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      <path d="M3 18c2-1 4-1 6-1s4 0 6 0 4 1 6 1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}

function RiskOfRuinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 16v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M5 21h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 3 L6 12h12L12 3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="12" cy="15" r="1.5" fill="currentColor" />
    </svg>
  );
}

function PropFirmIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 6V4M16 6V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 14l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrackRecordIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l8 3v6c0 4.5-3.2 7.6-8 9-4.8-1.4-8-4.5-8-9V6l8-3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MultiAccountIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="8" y="9" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <path d="M7 13h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

function MaeMfeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 17h18" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
      <path d="M7 17V9M7 9l-2 2M7 9l2 2" stroke="rgb(var(--pnl-neg))" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 17v6M17 23l-2-2M17 23l2-2" stroke="rgb(var(--pnl-pos))" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TagsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 11l7-7 7 7-7 7-7-7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="8" cy="11" r="1.5" fill="currentColor" />
      <path d="M14 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" opacity="0.55" />
    </svg>
  );
}
