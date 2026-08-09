"use client";

import { motion } from "framer-motion";
import { useLang } from "@/lib/i18n";
import { Reveal } from "@/components/tj/Reveal";

/**
 * DemoCapabilities — a 6-card grid that previews what visitors can do
 * inside the live demo, right above the demo window. Bilingual. Glass cards
 * with accent icon chips, kept compact so they don't push the demo below
 * the fold on desktop.
 */

/* ---------- Icons ---------- */

function FormIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16.5" cy="16" r="0.9" fill="currentColor" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 20h16M6 20v-7M11 20V8M16 20v-11M21 20V5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="21" cy="5" r="1.2" fill="currentColor" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="6" y="12" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.55" />
      <rect x="11" y="12" width="3" height="3" rx="0.5" fill="currentColor" />
      <rect x="15.5" y="15" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3l7 3v5.5c0 4.5-3 7.7-7 9.5-4-1.8-7-5-7-9.5V6l7-3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="m9 12 2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 4.5A1.5 1.5 0 016.5 3H18a1 1 0 011 1v16a1 1 0 01-1 1H6.5A1.5 1.5 0 015 20.5v-16z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 8h6M9 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 18.5h13" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3a9 9 0 100 18c1.66 0 2-1.5 1-2.5s-.5-2.5 1-2.5h2a5 5 0 005-5c0-4.5-4-8-9-8z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="7.5" cy="11.5" r="1.1" fill="currentColor" />
      <circle cx="10" cy="8" r="1.1" fill="currentColor" />
      <circle cx="14" cy="8" r="1.1" fill="currentColor" />
      <circle cx="16.5" cy="11.5" r="1.1" fill="currentColor" />
    </svg>
  );
}

interface Capability {
  icon: React.ReactNode;
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
}

const capabilities: Capability[] = [
  {
    icon: <FormIcon />,
    titleEs: "Registra operaciones",
    titleEn: "Log trades",
    descEs: "Formulario guiado con cálculo de riesgo automático.",
    descEn: "Guided form with automatic risk calculation.",
  },
  {
    icon: <ChartIcon />,
    titleEs: "Analiza 40+ métricas",
    titleEn: "Analyze 40+ metrics",
    descEs: "Sharpe, Sortino, Calmar, profit factor y más.",
    descEn: "Sharpe, Sortino, Calmar, profit factor and more.",
  },
  {
    icon: <CalendarIcon />,
    titleEs: "Explora el calendario P&L",
    titleEn: "Explore the P&L calendar",
    descEs: "Cada día pintado por su resultado neto.",
    descEn: "Each day painted by its net result.",
  },
  {
    icon: <ShieldIcon />,
    titleEs: "Revisa tu disciplina",
    titleEn: "Review your discipline",
    descEs: "Coste de indisciplina y cumplimiento del plan.",
    descEn: "Cost of indiscipline and plan compliance.",
  },
  {
    // El playbook ya no sale en la demo (se dejó fuera al recortarla a
    // cuatro secciones); esta tarjeta apunta ahora al detalle de una
    // operación, que sí se puede abrir desde la lista.
    icon: <BookIcon />,
    titleEs: "Abre una operación",
    titleEn: "Open a trade",
    descEs: "Su ficha completa: gráfico, riesgo, nota y cumplimiento.",
    descEn: "Its full record: chart, risk, note and compliance.",
  },
  {
    icon: <PaletteIcon />,
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
                Seis cosas que puedes <span className="text-gradient">probar ahora mismo.</span>
              </>
            ) : (
              <>
                Six things you can <span className="text-gradient">try right now.</span>
              </>
            )}
          </h2>
        </Reveal>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {capabilities.map((c, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <motion.div
                whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 24 } }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                // T3c — swap `liquid-glass` por `.tj-paper`: papel translúcido
                // cálido en las 6 tarjetas de capacidades. depth-1 → depth-2
                // hover, accent top-edge bar, icon chip y hover bg/shadow se
                // conservan.
                className="group tj-paper transition-[background-color,border-color,box-shadow,transform] duration-300 ease-[var(--ease-suave)] rounded-[2px] p-5 h-full flex flex-col gap-3 border border-[rgb(var(--divider)/0.10)] hover:border-[rgb(var(--accent-base)/0.32)] hover:bg-[rgb(var(--accent-base)/0.04)] hover:shadow-[0_8px_24px_-8px_rgb(var(--accent-base)/0.25)] relative overflow-hidden min-w-0"
              >
                {/* Accent top-edge bar — mirrors the ExperimentsPage /
                    FiscalPage KPI card pattern, tying each feature card
                    to the demo's accent identity. Subtle 2px strip at the
                    card's top edge. */}
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-[2px] bg-[rgb(var(--accent-base)/0.45)]"
                />
                {/* Icon container — accent-tinted chip that deepens on hover.
                    Rings are theme-aware (white/8 dark → black/8 light via
                    --divider) so the chip reads cleanly over the eye without
                    flattening into the glass surface. The inset top specular
                    (shadow-[inset_0_1px_0...]) reads as a polished material
                    chip, not a flat square. */}
                <span
                  className="relative w-9 h-9 rounded-md flex items-center justify-center text-primary transition-[background-color,color,box-shadow] duration-300 ease-[var(--ease-suave)] bg-[rgb(var(--divider)/0.08)] ring-1 ring-inset ring-[rgb(var(--divider)/0.10)] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.10)] group-hover:bg-[rgb(var(--accent-base)/0.12)] group-hover:ring-[rgb(var(--accent-base)/0.30)] group-hover:text-[rgb(var(--accent-base))]"
                  aria-hidden="true"
                >
                  {c.icon}
                </span>
                <div>
                  <h3 className="text-sm md:text-base font-medium text-primary leading-tight">
                    {es ? c.titleEs : c.titleEn}
                  </h3>
                  <p className="mt-1 text-xs md:text-sm text-secondary leading-relaxed">
                    {es ? c.descEs : c.descEn}
                  </p>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
