"use client";

import { Link } from "@/components/tj/LocaleLink";
import { useLang } from "@/lib/i18n";
import { Reveal } from "@/components/tj/Reveal";
import type { FichaTermino } from "@/lib/glosario";


/** Una salida de la ficha: rótulo pequeño encima y el destino subrayado. */
function Salida({ href, rotulo, destino }: { href: string; rotulo: string; destino: string }) {
  return (
    <Link
      href={href}
      className="link-underline-host -mx-4 block rounded-[4px] px-4 py-3.5"
    >
      <span className="block text-[12px] text-tertiary">{rotulo}</span>
      <span className="mt-1 inline-block text-[15px] font-medium text-primary">
        <span className="link-underline">{destino}</span>
      </span>
    </Link>
  );
}

/**
 * La página de un término. Una definición sola es contenido pobre para un
 * buscador, así que cada página añade lo que existe en los datos: familia,
 * términos vecinos, dónde continúa en el producto y la herramienta que lo
 * calcula. Todo son enlaces reales; ninguna página es un callejón sin salida.
 */
export function TerminoVista({ ficha }: { ficha: FichaTermino }) {
  const { lang } = useLang();
  const es = lang === "es";

  const { termino, familia, seguir, formula, cercanos, anterior, siguiente } = ficha;
  const herramienta = ficha.herramienta?.href;
  const esTest = ficha.herramienta?.esTest ?? false;
  const destinoHerramienta =
    ficha.herramienta &&
    (esTest ? (es ? "Test de disciplina" : "Discipline test") : es ? ficha.herramienta.tituloEs : ficha.herramienta.tituloEn);

  return (
    <section
      className="section-tight"
    >
      <div className="tj-container">
        {/* Desde `lg` los términos vecinos van a un raíl a la derecha y se conserva la medida. */}
        <div className="lg:grid lg:grid-cols-[minmax(0,62ch)_minmax(0,17rem)] lg:items-start lg:gap-x-14">
        <div className="w-full max-w-[62ch]">
          {/* La definición es la entradilla de la cabecera (PageHeader). */}
          {formula && (
            <Reveal delay={0.08}>
              <figure className="tj-ficha m-0">
                <p className="tj-ficha-barra m-0">{es ? "Fórmula" : "Formula"}</p>
                <div className="tj-ficha-cuerpo">
                <p className="m-0 overflow-x-auto font-mono text-[15px] font-medium tracking-[0.01em] text-primary">
                  {es ? formula.formulaEs : formula.formulaEn}
                </p>
                <figcaption className="mt-4 text-[13px] leading-[1.6] text-secondary">
                  {es ? formula.variablesEs : formula.variablesEn}
                </figcaption>
                </div>
              </figure>
            </Reveal>
          )}

          <Reveal delay={0.1}>
            {/* Sin fórmula encima, el primer rótulo sube a la altura de la ceja del raíl. */}
            <div className={formula ? "mt-6 grid gap-1" : "-mt-3.5 grid gap-1"}>
              {herramienta && destinoHerramienta && (
                <Salida
                  href={herramienta}
                  rotulo={
                    esTest
                      ? es ? "Mídete, gratis y sin registro" : "Measure yourself, free and without sign-up"
                      : es ? "Calcúlalo, gratis y sin registro" : "Work it out, free and without sign-up"
                  }
                  destino={destinoHerramienta}
                />
              )}
              <Salida
                href={seguir.href}
                rotulo={es ? "Dentro del programa" : "Inside the app"}
                destino={es ? seguir.es : seguir.en}
              />
            </div>
          </Reveal>

        </div>

          {cercanos.length > 0 && (
            <Reveal delay={0.18} className="lg:col-start-2 lg:row-start-1">
              <div className="mt-12 lg:mt-0">
                <p className="eyebrow m-0">
                  {es ? "De la misma familia" : "Same family"}
                </p>
                <ul className="-mx-4 mt-3 list-none p-0">
                  {cercanos.map((t) => (
                    <li key={t.slug}>
                      <Link
                        href={`/glosario/${t.slug}`}
                        className="group grid min-h-[52px] grid-cols-1 items-baseline gap-1 rounded-[4px] px-4 py-3 transition-colors hover:bg-[color-mix(in_srgb,var(--ink)_4%,transparent)] sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-5 lg:min-h-0 lg:grid-cols-1 lg:gap-1 lg:py-2"
                      >
                        <span
                          lang="en"
                          className="text-[14px] font-medium text-primary"
                        >
                          {t.term}
                        </span>
                        <span className="medida block text-[14px] leading-[1.6] text-secondary lg:hidden">
                          {es ? t.es : t.en}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/glosario#${termino.category}`}
                  className="cta cta--secundario mt-3 h-11 text-[14px]"
                >
                  {es ? `Toda la familia ${familia.es}` : `All of ${familia.en}`}
                </Link>
              </div>
            </Reveal>
          )}

          <Reveal delay={0.22} className="lg:col-start-1 lg:row-start-2 lg:max-w-[62ch]">
            <nav
              aria-label={es ? "Recorrer el glosario" : "Browse the glossary"}
              className="mt-12 flex items-stretch justify-between gap-3 border-t border-[var(--line)] pt-6"
            >
              {anterior ? (
                <Link
                  href={`/glosario/${anterior.slug}`}
                  className="group flex min-h-[44px] max-w-[46%] flex-col justify-center text-left"
                >
                  <span className="text-[12px] text-tertiary">
                    ← {es ? "Anterior" : "Previous"}
                  </span>
                  <span
                    lang="en"
                    className="text-balance text-[14px] font-medium text-secondary transition-colors group-hover:text-primary"
                  >
                    {anterior.term}
                  </span>
                </Link>
              ) : (
                <span />
              )}
              {siguiente && (
                <Link
                  href={`/glosario/${siguiente.slug}`}
                  className="group flex min-h-[44px] max-w-[46%] flex-col justify-center text-right"
                >
                  <span className="text-[12px] text-tertiary">
                    {es ? "Siguiente" : "Next"} →
                  </span>
                  <span
                    lang="en"
                    className="text-balance text-[14px] font-medium text-secondary transition-colors group-hover:text-primary"
                  >
                    {siguiente.term}
                  </span>
                </Link>
              )}
            </nav>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
