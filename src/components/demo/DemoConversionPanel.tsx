"use client";

import { ArrowRight, Check, LockKeyhole, MousePointer2 } from "lucide-react";
import { Link } from "@/components/tj/LocaleLink";
import { Reveal } from "@/components/tj/Reveal";
import { useLang } from "@/lib/i18n";
import { trackEvent } from "@/lib/analytics";

/**
 * The conversion bridge after the interactive window. It makes the demo's
 * promise explicit, sets a truthful boundary around sample data, and gives
 * visitors two next steps without forcing a form before they understand the
 * product.
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
    <section id="demo-next-step" className="section-tight border-y border-[rgb(var(--divider)/0.1)] scroll-mt-24">
      <div className="tj-container">
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
                  <span className="tnum text-xs font-semibold tracking-[0.16em] text-[rgb(var(--accent-base))]">{number}</span>
                  <h3 className="mt-2 text-sm font-semibold text-primary">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-secondary">{body}</p>
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal delay={0.08} className="h-full">
            <aside className="tj-paper h-full border border-[rgb(var(--divider)/0.16)] p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center border border-[rgb(var(--accent-base)/0.28)] bg-[rgb(var(--accent-base)/0.08)] text-[rgb(var(--accent-base))]">
                  <LockKeyhole size={18} strokeWidth={1.6} aria-hidden />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-tertiary">{es ? "Límite honesto" : "Honest boundary"}</p>
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
              <div className="mt-7 grid gap-2 sm:grid-cols-2">
                <Link
                  href="/pricing"
                  onClick={() => trackEvent("demo_pricing_clicked")}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[2px] bg-[rgb(var(--accent-base))] px-4 text-sm font-semibold text-[rgb(var(--accent-ink))] transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-[rgb(var(--accent-hover))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]"
                >
                  {es ? "Ver precios" : "See pricing"}
                  <ArrowRight size={15} aria-hidden />
                </Link>
                <Link
                  href="/beta"
                  onClick={() => trackEvent("demo_early_access_clicked")}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[2px] border border-[rgb(var(--divider)/0.2)] px-4 text-sm font-semibold text-primary transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-[rgb(var(--divider)/0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]"
                >
                  <MousePointer2 size={15} aria-hidden />
                  {es ? "Acceso anticipado" : "Early access"}
                </Link>
              </div>
            </aside>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
