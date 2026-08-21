"use client";

import { Fragment } from "react";
import { useLang } from "@/lib/i18n";

/**
 * Thin trust band: a single row of trust signals with inline SVG icons,
 * separated by dots. Uses section-tight padding and centered layout.
 *
 * R24-1b polish:
 *  - Icon↔label gap 1.5 → 2 (8 px): 6 px was tight enough that the icon
 *    and label read as a single dense token; 8 px gives the icon room
 *    to breathe as its own glyph while keeping the pair cohesive.
 *  - SparkIcon rebuilt as a single 4-point star path (was 8 radiating
 *    lines — visually heavier than the other 4 icons, broke the row's
 *    stroke-weight consistency even though all share strokeWidth 1.3).
 *    The 4-point star is a single path with strokeLinejoin=round, so
 *    it renders at the same visual weight as the Shield / Lock / Globe.
 */
export function TrustStrip() {
  const { lang } = useLang();
  const es = lang === "es";

  const items = [
    {
      icon: <ShieldIcon />,
      label: es ? "Guardián de disciplina en vivo" : "Live discipline guardian",
    },
    {
      icon: <LockIcon />,
      label: es ? "SQLite WAL · Cifrado local" : "SQLite WAL · Local encryption",
    },
    {
      icon: <InfinityIcon />,
      label: es ? "App 100 % local · Cero telemetría" : "100% local app · Zero telemetry",
    },
    {
      icon: <GlobeIcon />,
      label: es ? "Windows 11 / WinUI 3 nativo" : "Native Windows 11 / WinUI 3",
    },
    {
      icon: <SparkIcon />,
      label: es ? "Demo interactiva sin registro" : "No-sign-up interactive demo",
    },
  ];

  return (
    <section
      aria-label={es ? "Confianza" : "Trust"}
      // R27-1b — `bg-veil` added: this thin trust band had no
      // background — the eye WebGL (bright red/green fibers in light
      // theme) was showing through between the icons + labels,
      // washing out the small `t-caption text-secondary` labels.
      // `bg-veil` (82 % bg in light / 74 % in dark) occludes the eye
      // while the top accent gradient hairline still paints on top
      // for the precision-machined top edge.
      className="section-tight relative overflow-clip bg-veil"
    >
      {/* Accent gradient line that sweeps across the strip on view */}
      <div
        aria-hidden="true"
        data-entra="traza"
        className="absolute left-0 right-0 top-0 h-px pointer-events-none"
        style={{
          /* El 0,9 de opacidad final que declaraba el `whileInView` vive
             ahora en el propio color. La animación de la traza va de 0 a
             1, así que sin esto el filete acabaría un 10 % más encendido
             de lo que estaba. */
          background:
            "linear-gradient(90deg, transparent 0%, rgb(var(--accent-base) / 0.9) 50%, transparent 100%)",
          transformOrigin: "left center",
        }}
      />

      <div className="relative z-10 tj-container">
        <div
          data-entra
          // R21-3a — tighter horizontal gap on mobile (gap-x-5 vs gap-x-8)
          // so pairs of trust items fit on each wrapped row instead of
          // every item ending up alone on its own line at 375px. The
          // flex-wrap + whitespace-nowrap per item is preserved so the
          // labels themselves never break mid-word.
          // T2d — gap-y bumped 3.5 → 4 (14px → 16px) so when the strip
          // wraps to 2 lines on 390px the vertical breathing matches the
          // visual weight of the icons (16px gap ≈ icon height). Slight
          // but reads as a deliberate rhythm rather than two cramped
          // lines.
          className="flex flex-wrap items-center justify-center gap-x-5 sm:gap-x-8 gap-y-4 text-secondary text-sm"
        >
          {items.map((item, i) => (
            <Fragment key={item.label}>
              {/* Sin escalón individual, y es deliberado: `ciclo` reparte
                  el retardo por `nth-child`, y aquí los hermanos alternan
                  señal y punto separador, así que las cinco señales caen
                  en las posiciones 1, 3, 5, 7 y 9 — les tocarían los
                  escalones 1, 3, 5, 2 y 4, es decir, desordenados. La
                  tira es una sola línea de cinco piezas cortas: entra
                  como bloque con su contenedor, que es lo que se lee. */}
              <div className="flex items-center gap-2">
                <span
                  className="text-primary shrink-0 inline-flex"
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                <span className="t-caption text-secondary whitespace-nowrap tnum">{item.label}</span>
              </div>
              {i < items.length - 1 && (
                <span
                  aria-hidden="true"
                  className="hidden md:inline-block w-1 h-1 rounded-[1px] bg-[rgb(var(--accent-base)/0.50)]"
                />
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---- Inline SVG icons (16×16) ---- */
function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 1.6 2.8 3.8v3.6c0 3.2 2.2 5.6 5.2 6.6 3-1 5.2-3.4 5.2-6.6V3.8L8 1.6Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="m5.8 8 1.6 1.6L10.4 6.6"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfinityIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M5 5.5c-1.7 0-3 1.1-3 2.5s1.3 2.5 3 2.5c1.8 0 2.7-1.5 3-2.5.3-1 1.2-2.5 3-2.5 1.7 0 3 1.1 3 2.5s-1.3 2.5-3 2.5c-1.8 0-2.7-1.5-3-2.5-.3-1-1.2-2.5-3-2.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect
        x="3"
        y="7"
        width="10"
        height="7"
        rx="1.4"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M5 7V5a3 3 0 0 1 6 0v2"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle cx="8" cy="10.5" r="1" fill="currentColor" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M2 8h12M8 2c1.6 1.7 2.5 3.7 2.5 6S9.6 12.3 8 14c-1.6-1.7-2.5-3.7-2.5-6S6.4 3.7 8 2Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      {/* R24-1b — single 4-point star path (was 8 radiating lines).
          Same strokeWidth 1.3 as the other 4 icons in this strip; the
          strokeLinejoin=round caps the 4 outer points softly so the
          star reads as a coordinated sparkle, not a heavier sun-burst. */}
      <path
        d="M8 2.5L9.4 6.6L13.5 8L9.4 9.4L8 13.5L6.6 9.4L2.5 8L6.6 6.6Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}
