"use client";

import { Link } from "@/components/tj/LocaleLink";
import { ArrowRight } from "lucide-react";
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
          <h2 data-entra className="t-h1 m-0 max-w-[22ch]">
            {es ? "Deja de operar a ciegas." : "Stop trading blind."}{" "}
            <span className="tj-cierre-tenue">{es ? "Mira cómo se mide." : "See how it is measured."}</span>
          </h2>
          <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <p data-entra="2" className="max-w-[34rem] text-[clamp(1.0625rem,1.3vw,1.1875rem)] leading-[1.6] tj-cierre-tenue">
              {es
                ? "40+ métricas, guardián de disciplina y tus datos en tu máquina. Explora la demo con datos de muestra y decide con criterio."
                : "40+ metrics, a discipline guardian, and your data on your machine. Explore the sample-data demo and decide with clarity."}
            </p>
            <div data-entra="3" className="flex flex-col gap-5 lg:items-end">
              <div className="flex flex-wrap gap-3">
                <Link href="/demo" className="cta cta--primario">
                  {es ? "Ver la demo" : "See the demo"}
                  <ArrowRight size={16} aria-hidden />
                </Link>
                <Link href="/pricing" className="cta cta--secundario">
                  {es ? "Ver precios" : "See pricing"}
                </Link>
              </div>
              <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[14px] tj-cierre-tenue lg:justify-end">
                {garantias.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
