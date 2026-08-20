"use client";

import { useState, useCallback } from "react";
import { useLang } from "@/lib/i18n";

/**
 * DataFlowComparison — visualización animada de a dónde van tus datos.
 *
 * Dos columnas: CountPips (local) vs Herramienta en la nube. Al pulsar
 * "Añadir operación" un punto viaja:
 *   · CountPips: del formulario al archivo local .sqlite. Corta, directa,
 *     sin salir del equipo.
 *   · Nube: del formulario → internet → servidor del proveedor → vuelta
 *     (latencia, dependencia, exposición).
 *
 * Refuerza el value prop de /features/seguridad: "tus datos no salen de
 * tu equipo. Nunca." De forma visual, no con texto.
 *
 * ── Por qué animado y no estático ─────────────────────────────────────
 * Un diagrama estático dice "es local". Una animación que se ejecuta
 * ante tus ojos MUESTRA la diferencia: un salto corto vs un viaje de
 * ida y vuelta. Es la forma más honesta de visualizar el riesgo de la
 * nube sin sermones.
 *
 * ── Material ──────────────────────────────────────────────────────────
 * .tj-paper. Touch targets ≥44px. Sin overflow mobile.
 */
export function DataFlowComparison({ num = "02" }: { num?: string }) {
  const { lang } = useLang();
  const es = lang === "es";

  // Cada "envío" incrementa un contador; el punto animado viaja.
  const [pulses, setPulses] = useState(0);

  const send = useCallback(() => setPulses((p) => p + 1), []);

  return (
    <section className="section-tight bg-veil border-t border-[rgb(var(--divider)/0.06)]">
      <div className="tj-container">
        {/* Header */}
        <div className="max-w-2xl mb-8">
          <div className="inline-flex items-center gap-3 mb-5">
            <span className="tnum" style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.04em", color: "rgb(var(--accent-base))" }}>
              § {num}
            </span>
            <span aria-hidden style={{ width: 22, height: 1, background: "rgb(var(--divider) / 0.13)" }} />
            <span className="tnum" style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--ink-3)" }}>
              {es ? "FLUJO DE DATOS" : "DATA FLOW"}
            </span>
          </div>
          <h2
            className="font-serif m-0"
            style={{
              fontSize: "clamp(1.85rem, 3.3vw, 2.8rem)",
              fontWeight: 400,
              letterSpacing: "-0.022em",
              lineHeight: 1.1,
              color: "var(--ink)",
              textWrap: "balance",
            }}
          >
            {es ? (
              <>
                Añade una operación. <span style={{ color: "rgb(var(--accent-base))" }}>Mira a dónde va.</span>
              </>
            ) : (
              <>
                Add a trade. <span style={{ color: "rgb(var(--accent-base))" }}>Watch where it goes.</span>
              </>
            )}
          </h2>
          <p className="mt-4" style={{ fontSize: "clamp(1rem, 1.2vw, 1.08rem)", lineHeight: 1.6, color: "var(--ink-2)" }}>
            {es
              ? "Pulsa el botón. En CountPips la operación viaja a tu archivo local. En una herramienta en la nube, sale de tu equipo, cruza internet y llega a un servidor ajeno."
              : "Press the button. In CountPips the trade travels to your local file. In a cloud tool, it leaves your machine, crosses the internet, and reaches someone else's server."}
          </p>
        </div>

        {/* Trigger button */}
        <button
          type="button"
          onClick={send}
          className="mb-8 inline-flex items-center justify-center gap-2 min-h-[44px] px-6 rounded-[2px] text-[14px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]"
          style={{
            background: "color-mix(in oklab, rgb(var(--accent-base)) 14%, transparent)",
            color: "rgb(var(--accent-base))",
            border: "1px solid color-mix(in oklab, rgb(var(--accent-base)) 38%, transparent)",
          }}
          aria-label={es ? "Añadir una operación y ver el flujo de datos" : "Add a trade and see the data flow"}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {es ? "Añadir operación" : "Add trade"}
          {pulses > 0 && (
            <span className="tnum ml-1 px-1.5 py-0.5 rounded-[2px] text-[10px]" style={{ background: "rgb(var(--divider) / 0.16)", color: "var(--ink-2)" }}>
              {pulses}
            </span>
          )}
        </button>

        {/* Two-column flow diagram */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* ─── CountPips (local) ─── */}
          <FlowColumn
            title="CountPips"
            subtitle={es ? "100 % local" : "100% local"}
            color="rgb(var(--accent-base))"
            steps={[
              { label: es ? "Tu operación" : "Your trade", icon: "form" },
              { label: es ? "Archivo .sqlite" : ".sqlite file", icon: "file", sub: es ? "En tu disco" : "On your disk" },
            ]}
            pulseKey={pulses}
            pulseId="local"
            travelMs={500}
          />

          {/* ─── Cloud ─── */}
          <FlowColumn
            title={es ? "Herramienta en la nube" : "Cloud tool"}
            subtitle={es ? "Servidor ajeno" : "Third-party server"}
            color="rgb(var(--pnl-neg))"
            steps={[
              { label: es ? "Tu operación" : "Your trade", icon: "form" },
              { label: es ? "Internet" : "Internet", icon: "cloud", sub: es ? "Sale de tu equipo" : "Leaves your machine" },
              { label: es ? "Servidor" : "Server", icon: "server", sub: es ? "Del proveedor" : "Vendor's server" },
              { label: es ? "Vuelve" : "Returns", icon: "back", sub: es ? "Con latencia" : "With latency" },
            ]}
            pulseKey={pulses}
            pulseId="cloud"
            travelMs={1400}
          />
        </div>

        {/* Footer note */}
        <p className="mt-6 text-[12px] leading-[1.55] max-w-2xl" style={{ color: "var(--ink-3)" }}>
          {es
            ? "Cada punto es una operación. En CountPips nunca sale de tu equipo: el flujo local no depende de exponer tu historial a un servidor. Tu historial es tuyo."
            : "Each dot is a trade. In CountPips it stays on your machine: the local-first workflow does not depend on exposing your history to a server. Your history is yours."}
        </p>
      </div>
    </section>
  );
}

/* ── FlowColumn — una columna del diagrama con pasos conectados ── */
function FlowColumn({
  title,
  subtitle,
  color,
  steps,
  pulseKey,
  pulseId,
  travelMs,
  /* Sin `travelPath` ni `es`: las dos llegaban y ninguna se leía. La
     distinción recta/ramificada ya la marca el número de `steps` (dos
     pasos en local, cuatro en la nube — ése ES el argumento del
     diagrama), y los textos entran ya traducidos desde arriba. */
}: {
  title: string;
  subtitle: string;
  color: string;
  steps: { label: string; icon: string; sub?: string }[];
  pulseKey: number;
  pulseId: string;
  travelMs: number;
}) {
  return (
    <div
      className="tj-paper relative rounded-[2px] p-5 sm:p-6 transition-[transform,border-color] duration-200 ease-[var(--ease-suave)] hover:-translate-y-0.5"
      style={{ border: `1px solid color-mix(in oklab, ${color} 22%, rgb(var(--divider) / 0.10))` }}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>{title}</div>
          <div className="tnum text-[10px]" style={{ letterSpacing: "0.14em", textTransform: "uppercase", color }}>{subtitle}</div>
        </div>
        <span aria-hidden className="inline-flex items-center justify-center w-7 h-7 rounded-[2px]" style={{ background: `color-mix(in oklab, ${color} 12%, transparent)`, border: `1px solid color-mix(in oklab, ${color} 30%, transparent)` }}>
          <span className="w-2 h-2 rounded-[1px]" style={{ background: color }} />
        </span>
      </div>

      {/* Steps with animated dot */}
      <div className="relative">
        {steps.map((step, i) => (
          <div key={i} className="relative flex items-start gap-3" style={{ marginBottom: i < steps.length - 1 ? 28 : 0 }}>
            {/* Node */}
            <div className="relative shrink-0">
              <div
                className="flex items-center justify-center rounded-[2px]"
                style={{
                  width: 40,
                  height: 40,
                  background: `color-mix(in oklab, ${color} 8%, transparent)`,
                  border: `1px solid color-mix(in oklab, ${color} 22%, transparent)`,
                  color,
                }}
              >
                <StepIcon name={step.icon} />
              </div>
              {/* Animated pulse dot — appears at this node when the pulse reaches it */}
              <PulseDot
                pulseKey={pulseKey}
                pulseId={`${pulseId}-${i}`}
                delay={(i / (steps.length - 1)) * travelMs}
                color={color}
              />
            </div>
            {/* Label */}
            <div className="pt-1.5 min-w-0">
              <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>{step.label}</div>
              {step.sub && <div className="text-[11px]" style={{ color: "var(--ink-3)" }}>{step.sub}</div>}
            </div>
            {/* Connector line to next step */}
            {i < steps.length - 1 && (
              <div
                aria-hidden
                className="absolute"
                style={{
                  left: 20,
                  top: 40,
                  width: 1,
                  height: 28,
                  background: `linear-gradient(180deg, color-mix(in oklab, ${color} 30%, transparent), color-mix(in oklab, ${color} 12%, transparent))`,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── PulseDot — el punto animado que viaja por los nodos ── */
function PulseDot({ pulseKey, pulseId, delay, color }: { pulseKey: number; pulseId: string; delay: number; color: string }) {
  // Only render the dot when there's been at least one pulse AND the key matches
  // The dot animates in (scale 0→1→0) at the calculated delay after the button press
  if (pulseKey === 0) return null;
  /* La `key` cambia con cada pulsación, así que React sustituye el
     elemento por uno nuevo y la animación CSS vuelve a empezar desde el
     primer fotograma. Es lo mismo que conseguía `AnimatePresence`
     —reiniciar el pulso en cada disparo— sin necesitar la biblioteca:
     aquí no hay salida que animar, el punto se apaga solo al final de su
     propio recorrido de opacidad.

     El retardo viene en milisegundos y se pasa como estilo en línea
     porque es distinto para cada nodo de la cadena: es el que escalona
     el viaje del punto de un nodo al siguiente. */
  return (
    <span
      key={`${pulseId}-${pulseKey}`}
      className="tj-pulso pointer-events-none absolute top-1/2 left-1/2 rounded-[1px]"
      style={{
        width: 8,
        height: 8,
        background: color,
        animationDelay: `${delay}ms`,
      }}
      aria-hidden="true"
    />
  );
}

/* ── StepIcon — iconos SVG inline para cada tipo de nodo ── */
function StepIcon({ name }: { name: string }) {
  const s = 18;
  switch (name) {
    case "form":
      return (
        <svg width={s} height={s} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="3" y="2.5" width="14" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6 6.5h8M6 9.5h8M6 12.5h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "file":
      return (
        <svg width={s} height={s} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M5 2.5h7l3 3v10a1.5 1.5 0 01-1.5 1.5h-8.5A1.5 1.5 0 013.5 15.5V4A1.5 1.5 0 015 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M12 2.5V5.5h3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M6.5 9.5h7M6.5 12h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "cloud":
      return (
        <svg width={s} height={s} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M5.5 14a3 3 0 01-.5-5.97A4 4 0 0112.5 7a3.5 3.5 0 011 6.86" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5.5 14h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "server":
      return (
        <svg width={s} height={s} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="3" y="3.5" width="14" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="3" y="11.5" width="14" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="6" cy="6" r="0.8" fill="currentColor" />
          <circle cx="6" cy="14" r="0.8" fill="currentColor" />
        </svg>
      );
    case "back":
      return (
        <svg width={s} height={s} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M3 10a7 7 0 1112 4.95" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M15 13v3h-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}
