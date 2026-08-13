"use client";

import dynamic from "next/dynamic";
import { Link } from "@/components/tj/LocaleLink";
import { useLang } from "@/lib/i18n";
import { Reveal } from "@/components/tj/Reveal";
import { HERRAMIENTAS, type Herramienta } from "@/lib/herramientas";

/**
 * Resuelve el componente de cada herramienta y lo monta.
 *
 * ── Por qué el mapa está aquí y no en `herramientas.ts` ───────────────
 * Ese archivo son DATOS y lo importa el mapa del sitio, que se genera en
 * el servidor. Si llevara dentro los `import()` de seis componentes de
 * cliente, cada uno con sus animaciones, el mapa del sitio arrastraría
 * medio paquete de la web para escribir un XML de catorce líneas.
 *
 * Aquí, en cambio, se cargan bajo demanda: quien abre la calculadora de
 * riesgo no descarga el simulador de Monte Carlo.
 */
const COMPONENTES = {
  RiskCalculator: dynamic(() =>
    import("@/components/marketing/RiskCalculator").then((m) => m.RiskCalculator),
  ),
  RMultipleSimulator: dynamic(() =>
    import("@/components/marketing/RMultipleSimulator").then((m) => m.RMultipleSimulator),
  ),
  EdgeSignificanceChecker: dynamic(() =>
    import("@/components/marketing/EdgeSignificanceChecker").then(
      (m) => m.EdgeSignificanceChecker,
    ),
  ),
  EquityProjector: dynamic(() =>
    import("@/components/marketing/EquityProjector").then((m) => m.EquityProjector),
  ),
  SavingsCalculator: dynamic(() =>
    import("@/components/marketing/SavingsCalculator").then((m) => m.SavingsCalculator),
  ),
  SessionClock: dynamic(() =>
    import("@/components/marketing/SessionClock").then((m) => m.SessionClock),
  ),
} as const;

export function HerramientaVista({ herramienta }: { herramienta: Herramienta }) {
  const { lang } = useLang();
  const es = lang === "es";

  const Componente = COMPONENTES[herramienta.componente];
  const otras = HERRAMIENTAS.filter((h) => h.slug !== herramienta.slug).slice(0, 3);

  return (
    <>
      <Componente num="01" />

      {/* Aviso obligado en una web de trading: estas calculadoras devuelven
          lo que se deduce de los números que introduce el visitante, y
          nada más. Sin esta línea, una herramienta que dice «arriesga
          este tamaño» se puede leer como una recomendación. */}
      <section className="section-tight">
        <div className="tj-container">
          <div className="mx-auto max-w-[62ch]">
            <Reveal>
              <p className="m-0 text-[13.5px] leading-relaxed text-tertiary">
                {es
                  ? "Esta herramienta calcula a partir de lo que tú escribes. No es asesoramiento financiero ni una recomendación de operar: "
                  : "This tool computes from what you type. It is not financial advice or a recommendation to trade: "}
                <Link
                  href="/terminos#no-advice"
                  className="link-underline-host -my-2 inline-flex py-2 text-secondary transition-colors hover:text-primary"
                >
                  <span className="link-underline">
                    {es ? "condiciones de uso" : "terms of use"}
                  </span>
                </Link>
              </p>
            </Reveal>

            {/* Otras herramientas — ninguna página es un callejón. */}
            <Reveal delay={0.08}>
              <div className="mt-12">
                <p className="eyebrow m-0">
                  {es ? "Otras herramientas" : "Other tools"}
                </p>
                <ul className="mt-4 grid list-none gap-3 p-0 sm:grid-cols-3">
                  {otras.map((h) => (
                    <li key={h.slug}>
                      <Link
                        href={`/herramientas/${h.slug}`}
                        className="tj-paper group flex h-full flex-col rounded-[2px] border border-[rgb(var(--divider)/0.13)] p-3.5 transition-colors hover:border-[rgb(var(--accent-base)/0.35)]"
                      >
                        <span className="text-[14px] font-semibold text-primary transition-colors group-hover:text-[rgb(var(--accent-base))]">
                          {es ? h.tituloEs : h.tituloEn}
                        </span>
                        <span className="mt-1 text-[12.5px] leading-[1.5] text-secondary">
                          {es ? h.resumenEs : h.resumenEn}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-[13.5px]">
                  {/* `-my-3 py-3` y no `-my-2 py-2`: con el relleno menor
                      la zona tocable se quedaba en 36 px de alto. El
                      margen negativo devuelve lo que suma el relleno, así
                      que crece la zona y no se mueve la línea. */}
                  <Link
                    href="/herramientas"
                    className="link-underline-host -my-3 inline-flex py-3 text-secondary transition-colors hover:text-primary"
                  >
                    <span className="link-underline">
                      {es ? "Ver las siete herramientas" : "See all seven tools"}
                    </span>
                  </Link>
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
