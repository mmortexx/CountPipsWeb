"use client";

import { Link } from "@/components/tj/LocaleLink";
import { ArrowRight, Check } from "lucide-react";
import { useLang } from "@/lib/i18n";

/** Cierre de página: un único bloque de tinta con la llamada principal. */
export function FinalCTANew() {
  const { lang } = useLang();
  const es = lang === "es";
  const garantias = es
    ? ["Datos de muestra", "Sin registro para explorar", "Acceso anticipado privado", "100 % local"]
    : ["Sample data", "No sign-up to explore", "Private early access", "100 % local"];

  return (
    <section className="section relative">
      <div className="tj-container">
        <div className="tj-cierre">
          <h2 data-entra className="t-h1 m-0">
            {es ? "Deja de operar a ciegas." : "Stop trading blind."}{" "}
            <span className="tj-cierre-tenue sm:block">{es ? "Mira cómo se mide." : "See how it is measured."}</span>
          </h2>
          <div className="mt-10 grid gap-8 border-t border-[var(--line-2)] pt-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-16">
            <p data-entra="2" className="m-0 max-w-[36rem] text-[clamp(1.0625rem,1.3vw,1.1875rem)] leading-[1.6] tj-cierre-tenue">
              {es
                ? "40+ métricas, guardián de disciplina y tus datos en tu máquina. Explora la demo con datos de muestra y decide con criterio."
                : "40+ metrics, a discipline guardian, and your data on your machine. Explore the sample-data demo and decide with clarity."}
            </p>
            <div data-entra="3" className="flex flex-wrap gap-3">
              <Link href="/demo" className="cta cta--primario">
                {es ? "Ver la demo" : "See the demo"}
                <ArrowRight size={16} aria-hidden />
              </Link>
              <Link href="/pricing" className="cta cta--secundario">
                {es ? "Ver precios" : "See pricing"}
              </Link>
            </div>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-7 gap-y-2.5 text-[14px] tj-cierre-tenue">
            {garantias.map((g) => (
              <li key={g} className="flex items-center gap-2">
                <Check size={14} strokeWidth={2} aria-hidden className="shrink-0 text-white" />
                {g}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
