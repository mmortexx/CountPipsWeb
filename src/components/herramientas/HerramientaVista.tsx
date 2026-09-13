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
  DisciplineCost: dynamic(() =>
    import("@/components/marketing/DisciplineCost").then((m) => m.DisciplineCost),
  ),
  CommissionDragCalculator: dynamic(() =>
    import("@/components/marketing/CommissionDragCalculator").then(
      (m) => m.CommissionDragCalculator,
    ),
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

      {/* Cinta de Acceso Rápido entre las 8 Herramientas */}
      <section className="border-t border-[rgb(var(--divider)/0.10)] py-4">
        <div className="tj-container">
          {/* `tj-fila-sigue` añade la pista de que la fila sigue: sin ella
              la última herramienta quedaba partida contra el canto en las
              ocho páginas, y eso no se lee como «hay más» sino como un
              texto cortado.

              Se llamaba `tj-cinta`, que es la clase de la banda de
              símbolos de la portada. Con ese nombre esta fila heredaba la
              animación de la banda y se desplazaba sola hasta sacarse de
              la vista. Ver el comentario del bloque en globals.css. */}
          <div className="tj-fila-sigue flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
            <span className="text-[12px] font-mono text-tertiary uppercase tracking-wider whitespace-nowrap pr-2">
              {es ? "Herramientas:" : "Tools:"}
            </span>
            {HERRAMIENTAS.map((h, i) => {
              const active = h.slug === herramienta.slug;
              return (
                <Link
                  key={h.slug}
                  href={`/herramientas/${h.slug}`}
                  className={`min-h-[44px] px-3.5 rounded-[2px] text-xs font-mono transition-all inline-flex items-center gap-1.5 whitespace-nowrap ${
                    active
                      ? "bg-[rgb(var(--accent-base))] text-[rgb(var(--accent-ink))] font-bold shadow-sm"
                      : "border border-[rgb(var(--divider)/0.15)] bg-[var(--surface-1)] text-secondary hover:text-primary hover:border-[rgb(var(--divider)/0.3)]"
                  }`}
                >
                  <span className="opacity-60">{String(i + 1).padStart(2, "0")}.</span>
                  <span>{es ? h.tituloEs : h.tituloEn}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Aviso obligado en una web de trading: estas calculadoras devuelven
          lo que se deduce de los números que introduce el visitante, y
          nada más. Sin esta línea, una herramienta que dice «arriesga
          este tamaño» se puede leer como una recomendación. */}
      <section
        className="section-tight"
      >
        <div className="tj-container">
          <div className="mx-auto max-w-[62ch]">
            <Reveal>
              <p className="m-0 text-[14px] leading-relaxed text-tertiary">
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
                <ul className="mt-4 overflow-hidden rounded-[2px] border border-[rgb(var(--divider)/0.13)] p-0">
                  {otras.map((h) => (
                    <li key={h.slug} className="border-b border-[rgb(var(--divider)/0.08)] last:border-b-0">
                      <Link
                        href={`/herramientas/${h.slug}`}
                        className="group grid min-h-[52px] grid-cols-1 gap-1 px-4 py-3 transition-colors hover:bg-[color-mix(in_srgb,var(--ink)_4%,transparent)] sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)] sm:items-baseline sm:gap-5"
                      >
                        <span className="text-[14px] font-semibold text-primary transition-colors group-hover:text-[rgb(var(--accent-base))]">
                          {es ? h.tituloEs : h.tituloEn}
                        </span>
                        <span className="text-[13px] leading-[1.5] text-secondary">
                          {es ? h.resumenEs : h.resumenEn}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-[14px]">
                  {/* `-my-3 py-3` y no `-my-2 py-2`: con el relleno menor
                      la zona tocable se quedaba en 36 px de alto. El
                      margen negativo devuelve lo que suma el relleno, así
                      que crece la zona y no se mueve la línea. */}
                  <Link
                    href="/herramientas"
                    className="link-underline-host -my-3 inline-flex py-3 text-secondary transition-colors hover:text-primary"
                  >
                    <span className="link-underline">
                      {es ? "Ver todas las herramientas" : "See all tools"}
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
