"use client";

import { Link } from "@/components/tj/LocaleLink";
import { ArrowRight } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { trackEvent } from "@/lib/analytics";

/** Cierre de página, compuesto como el final de un informe: un filete, el
 *  titular a la izquierda y las acciones a la derecha, sin recuadro. Antes
 *  era una lámina de cristal centrada, y un titular dentro de una caja con
 *  dos botones debajo es el cierre de cualquier plantilla.
 *  En /demo la llamada principal pasa a ser el acceso: ya se está en la demo.
 *
 *  ── Por qué hay dos textos y no uno ───────────────────────────────────
 *  Este bloque sale en 79 páginas españolas y sus 79 inglesas, y hasta
 *  ahora decía lo mismo en todas. De esas 79, sesenta y seis son fichas de
 *  glosario y calculadoras: a quien acaba de mirar qué significa «Sortino»
 *  o de calcular su tamaño de posición no se le cierra con «deja de operar
 *  a ciegas», porque no ha venido a eso. La variante `herramienta` recoge
 *  lo que esa persona sí acaba de hacer y le ofrece el paso siguiente.
 *  Dos textos, no seis: un cierre distinto por página sería ruido y
 *  además imposible de mantener en dos idiomas. */
export function FinalCTANew({
  enDemo = false,
  variante = "general",
}: { enDemo?: boolean; variante?: "general" | "herramienta" } = {}) {
  const { lang } = useLang();
  const es = lang === "es";
  const herramienta = variante === "herramienta";
  const garantias = es
    ? ["Datos de muestra", "Sin registro", "Tus datos en tu equipo"]
    : ["Sample data", "No sign-up", "Your data on your machine"];

  return (
    <section className="section relative">
      <div className="tj-container">
        <div className="tj-cierre">
          {/* `t-h2` y no `t-display`. El cierre es una sección más, y con
              `t-display` medía 84 px cuando el titular de la propia página
              mide 60: en las 79 páginas españolas que lo llevan —y sus 79
              inglesas— el pie gritaba más fuerte que el asunto de la página.
              A 48 px se lee como lo que es, el titular de la última sección,
              y queda por debajo del h1 en todas las páginas del sitio,
              incluida la portada (84). */}
          <h2 data-entra className="tj-cierre-titular t-h2 m-0 max-w-[20ch] text-balance">
            {herramienta
              ? es
                ? "La cuenta ya te sale."
                : "The numbers add up."
              : es
                ? "Deja de operar a ciegas."
                : "Stop trading blind."}{" "}
            <span className="tj-cierre-tenue tj-frase-nueva">
              {herramienta
                ? es
                  ? "Hazla con las tuyas."
                  : "Now run your own."
                : es
                  ? "Mira cómo se mide."
                  : "See how it is measured."}
            </span>
          </h2>
          <p data-entra="2" className="m-0 max-w-[34rem] text-[clamp(1.0625rem,1.3vw,1.1875rem)] leading-[1.6] tj-cierre-tenue">
            {herramienta
              ? es
                ? "Esto mismo, pero sobre tu historial entero y al día con cada operación que registras. La demo lo enseña con datos de muestra."
                : "The same thing, over your whole history and updated with every trade you log. The demo shows it with sample data."
              : es
                ? "40+ métricas, un guardián de disciplina y tus datos en tu equipo. Explora la demo y decide con criterio."
                : "40+ metrics, a discipline guardian and your data on your machine. Explore the demo and decide with clarity."}
          </p>
          <div data-entra="3" className="tj-cierre-acciones">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
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
            <p className="m-0 text-[13px] text-tertiary">{garantias.join(" · ")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
