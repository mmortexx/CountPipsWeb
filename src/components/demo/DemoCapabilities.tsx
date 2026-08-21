"use client";

import { useLang } from "@/lib/i18n";
import { Reveal } from "@/components/tj/Reveal";

/**
 * DemoCapabilities — índice de lo que se puede hacer en la demo,
 * encima de la ventana. Lista de mesa, no seis tarjetas con halo.
 */

interface Capability {
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
}

const capabilities: Capability[] = [
  {
    titleEs: "Registra operaciones",
    titleEn: "Log trades",
    descEs: "Formulario guiado con cálculo de riesgo automático.",
    descEn: "Guided form with automatic risk calculation.",
  },
  {
    titleEs: "Analiza 40+ métricas",
    titleEn: "Analyze 40+ metrics",
    descEs: "Sharpe, Sortino, Calmar, profit factor y más.",
    descEn: "Sharpe, Sortino, Calmar, profit factor and more.",
  },
  {
    titleEs: "Explora el calendario P&L",
    titleEn: "Explore the P&L calendar",
    descEs: "Cada día pintado por su resultado neto.",
    descEn: "Each day painted by its net result.",
  },
  {
    titleEs: "Revisa tu disciplina",
    titleEn: "Review your discipline",
    descEs: "Coste de indisciplina y cumplimiento del plan.",
    descEn: "Cost of indiscipline and plan compliance.",
  },
  {
    titleEs: "Abre una operación",
    titleEn: "Open a trade",
    descEs: "Su ficha completa: gráfico, riesgo, nota y cumplimiento.",
    descEn: "Its full record: chart, risk, note and compliance.",
  },
  {
    titleEs: "Cambia de tema",
    titleEn: "Switch theme",
    descEs: "Oscuro o claro, igual que en la app real.",
    descEn: "Dark or light, just like the real app.",
  },
];

export function DemoCapabilities() {
  const { lang } = useLang();
  const es = lang === "es";

  return (
    <section
      aria-label={es ? "Qué puedes hacer en la demo" : "What you can do in the demo"}
      className="section-tight cv-auto relative"
    >
      <div className="max-w-page mx-auto px-5 md:px-8">
        <Reveal className="text-center max-w-2xl mx-auto mb-8">
          <span className="eyebrow inline-flex items-center gap-2 justify-center">
            <span className="w-6 h-px bg-current opacity-60" />
            {es ? "Qué puedes hacer" : "What you can do"}
            <span className="w-6 h-px bg-current opacity-60" />
          </span>
          <h2
            className="mt-4 font-medium tracking-[-0.02em] leading-tight text-primary"
            style={{ fontSize: "clamp(1.6rem, 3.2vw, 2.4rem)" }}
          >
            {es ? (
              <>
                Lo que puedes hacer <span className="text-gradient">sin instalar nada.</span>
              </>
            ) : (
              <>
                What you can do <span className="text-gradient">without installing anything.</span>
              </>
            )}
          </h2>
        </Reveal>

        {/* `clip`, no `hidden`: recorta igual las esquinas contra el borde,
            pero NO crea contenedor de desplazamiento. Con `hidden`, las
            quince filas de aquí dentro colgaban su `view()` de una caja
            que no se mueve nunca y no llegaban a entrar — se veían, sí,
            pero a plena tinta y de golpe. Lo cazó `scripts/humo.mjs` en
            las cuatro pantallas. */}
        <ol className="m-0 overflow-clip rounded-[2px] border border-[rgb(var(--divider)/0.13)] p-0">
          {capabilities.map((c, i) => (
            <Reveal key={c.titleEs} delay={i * 0.04}>
              <li
                data-entra
                className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-b border-[rgb(var(--divider)/0.08)] px-4 py-4 last:border-b-0 sm:grid-cols-[2.75rem_minmax(0,14rem)_minmax(0,1fr)] sm:items-center sm:gap-5"
              >
                <span
                  className="tnum text-[11px] font-semibold"
                  style={{ color: "rgb(var(--accent-base))" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="m-0 text-[14.5px] font-semibold tracking-tight text-primary">
                  {es ? c.titleEs : c.titleEn}
                </h3>
                <p className="m-0 text-[13px] leading-[1.5] text-secondary col-span-2 sm:col-span-1">
                  {es ? c.descEs : c.descEn}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
