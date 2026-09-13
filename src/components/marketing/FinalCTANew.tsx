"use client";

import { Link } from "@/components/tj/LocaleLink";
import { ArrowRight } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { trackEvent } from "@/lib/analytics";
import { Escritorio } from "@/components/tj/Escritorio";

/** Cierre de página: una lámina de cristal sobre luz difusa con el titular, una llamada y un enlace.
 *  En /demo la llamada principal pasa a ser el acceso: ya se está en la demo. */
export function FinalCTANew({ enDemo = false }: { enDemo?: boolean } = {}) {
  const { lang } = useLang();
  const es = lang === "es";
  const garantias = es
    ? ["Datos de muestra", "Sin registro", "Tus datos en tu equipo"]
    : ["Sample data", "No sign-up", "Your data on your machine"];

  return (
    <section className="section relative">
      <Escritorio curva />
      <div className="tj-container relative">
        <div className="tj-cierre tj-cristal">
          <h2 data-entra className="t-display m-0 mx-auto max-w-[18ch] text-balance">
            {es ? "Deja de operar a ciegas." : "Stop trading blind."}{" "}
            <span className="tj-cierre-tenue">{es ? "Mira cómo se mide." : "See how it is measured."}</span>
          </h2>
          <p data-entra="2" className="mx-auto mt-6 mb-0 max-w-[34rem] text-[clamp(1.0625rem,1.3vw,1.1875rem)] leading-[1.6] tj-cierre-tenue">
            {es
              ? "40+ métricas, un guardián de disciplina y tus datos en tu equipo. Explora la demo y decide con criterio."
              : "40+ metrics, a discipline guardian and your data on your machine. Explore the demo and decide with clarity."}
          </p>
          <div data-entra="3" className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <Link
              href={enDemo ? "/beta" : "/demo"}
              onClick={enDemo ? () => trackEvent("demo_early_access_clicked") : undefined}
              className="cta cta--primario"
            >
              {enDemo ? (es ? "Solicitar acceso" : "Request access") : es ? "Ver la demo" : "See the demo"}
              <ArrowRight size={16} aria-hidden />
            </Link>
            <Link
              href="/pricing"
              onClick={enDemo ? () => trackEvent("demo_pricing_clicked") : undefined}
              className="cta cta--secundario"
            >
              {es ? "Ver precios" : "See pricing"}
            </Link>
          </div>
          <p className="mt-8 mb-0 text-[13px] text-tertiary">{garantias.join(" · ")}</p>
        </div>
      </div>
    </section>
  );
}
