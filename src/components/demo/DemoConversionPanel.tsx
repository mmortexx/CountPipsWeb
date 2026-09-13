"use client";

import { Check, LockKeyhole } from "lucide-react";
import { Reveal } from "@/components/tj/Reveal";
import { Escritorio } from "@/components/tj/Escritorio";
import { useLang } from "@/lib/i18n";

/**
 * The bridge after the interactive window: how to read the demo and the
 * honest boundary around sample data. The next steps live in the closing
 * block right below.
 */
export function DemoConversionPanel() {
  const { lang } = useLang();
  const es = lang === "es";

  const steps = es
    ? [
        ["01", "Elige una pantalla", "Resumen, operaciones, analítica o diario."],
        ["02", "Abre una operación", "Revisa contexto, riesgo y cumplimiento en una sola ficha."],
        ["03", "Cambia el punto de vista", "Filtra, ordena y compara lo que realmente mueve tu proceso."],
        ["04", "Decide con evidencia", "Pasa a precios o solicita acceso anticipado si quieres llevar tus datos."],
      ]
    : [
        ["01", "Choose a screen", "Dashboard, trades, analytics or journal."],
        ["02", "Open a trade", "Review context, risk and compliance in one record."],
        ["03", "Change the lens", "Filter, sort and compare what actually moves your process."],
        ["04", "Decide with evidence", "Move to pricing or request early access for your own data."],
      ];

  return (
    <section id="demo-next-step" className="section-tight relative scroll-mt-24">
      <Escritorio />
      <div className="tj-container relative">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <Reveal>
            <p className="eyebrow">{es ? "Cómo leer la demo" : "How to read the demo"}</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-primary md:text-4xl text-balance">
              {es ? <>Una visita corta. <span className="text-gradient">Una decisión más clara.</span></> : <>A short visit. <span className="text-gradient">A clearer decision.</span></>}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-secondary md:text-lg">
              {es
                ? "La demo enseña el recorrido que decide si el producto merece un sitio en tu rutina. No intenta fingir que ya tienes una cuenta: te deja entender la herramienta primero."
                : "The demo shows the workflow that decides whether the product deserves a place in your routine. It does not pretend you already have an account: it lets you understand the tool first."}
            </p>
            <ol className="mt-8 grid gap-5 sm:grid-cols-2">
              {steps.map(([number, title, body]) => (
                <li key={number} className="border-t border-[rgb(var(--divider)/0.16)] pt-4">
                  <span className="tnum text-xs font-semibold tracking-[0.08em] text-tertiary">{number}</span>
                  <h3 className="mt-2 text-sm font-semibold text-primary">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-secondary">{body}</p>
                </li>
              ))}
            </ol>
          </Reveal>

          <div className="relative">
            <aside className="tj-cristal relative rounded-[12px] p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-[6px] bg-[color-mix(in_srgb,var(--ink)_6%,transparent)] text-primary">
                  <LockKeyhole size={18} strokeWidth={1.6} aria-hidden />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-tertiary">{es ? "Límite honesto" : "Honest boundary"}</p>
                  <h3 className="mt-1 text-lg font-semibold text-primary">{es ? "Datos de muestra, cero riesgo." : "Sample data, zero risk."}</h3>
                </div>
              </div>
              <ul className="mt-6 space-y-3 text-sm leading-relaxed text-secondary">
                {(es
                  ? ["No pide email ni tarjeta para explorar.", "Las operaciones no salen del navegador.", "Las funciones no visibles se etiquetan, no se simulan."]
                  : ["No email or card required to explore.", "Trades never leave the browser.", "Unavailable features are labelled, not faked."]
                ).map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[rgb(var(--pnl-pos))]" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
