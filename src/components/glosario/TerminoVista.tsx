"use client";

import { Link } from "@/components/tj/LocaleLink";
import { useLang } from "@/lib/i18n";
import { Reveal } from "@/components/tj/Reveal";
import {
  CATEGORIAS,
  HERRAMIENTA_DE,
  SEGUIR_LEYENDO,
  FORMULAS_GLOSARIO,
  relacionados,
  vecinos,
  type TerminoGlosario,
} from "@/lib/glosario";

/**
 * La página de un término.
 *
 * ── El riesgo que hay que evitar aquí ─────────────────────────────────
 * Una definición son una o dos frases. Medio centenar de páginas con dos
 * frases cada una es justo lo que un buscador clasifica como contenido
 * pobre, y entonces no sirven de nada: ni posicionan ni ayudan.
 *
 * Por eso cada página añade, sin inventar contenido, cosas que sí
 * existen en los datos: a qué familia pertenece el término, cuáles son
 * sus vecinos, dónde continúa dentro del producto, y —cuando la hay— la
 * herramienta que lo calcula. Todo son enlaces reales a páginas reales.
 *
 * El resultado además cumple otra función: ninguna de las páginas es
 * un callejón sin salida. Se puede entrar por cualquiera y seguir.
 */
export function TerminoVista({ termino }: { termino: TerminoGlosario }) {
  const { lang } = useLang();
  const es = lang === "es";

  const familia = CATEGORIAS[termino.category];
  const seguir = SEGUIR_LEYENDO[termino.category];
  const herramienta = HERRAMIENTA_DE[termino.slug];
  const formula = FORMULAS_GLOSARIO[termino.slug];
  const cercanos = relacionados(termino.slug);
  const { anterior, siguiente } = vecinos(termino.slug);

  return (
    <section
      className="section-tight"
    >
      <div className="tj-container">
        {/* A 1.440 px la ficha medía 62 caracteres pegados al margen y
            dejaba vacía la mitad derecha de la página. Desde `lg` los
            términos vecinos se van a un raíl a la derecha: la medida de
            lectura se conserva, la página se equilibra y lo que antes
            había que buscar al final queda a la vista junto a la
            definición. Por debajo de `lg` no cambia nada. */}
        <div className="lg:grid lg:grid-cols-[minmax(0,62ch)_minmax(0,17rem)] lg:items-start lg:gap-x-14">
        <div className="w-full max-w-[62ch]">
          {/* Definición */}
          <Reveal>
            <p className="m-0 text-[19px] leading-[1.65] text-primary">
              {es ? termino.es : termino.en}
            </p>
          </Reveal>

          {/* Familia */}
          <Reveal delay={0.06}>
            <p className="m-0 mt-6 text-[14px] leading-relaxed text-tertiary">
              {es ? "Familia " : "Family "}
              <Link
                href={`/glosario#${termino.category}`}
                className="link-underline-host -my-2 inline-flex py-2 font-medium text-primary"
              >
                <span className="link-underline">{es ? familia.es : familia.en}</span>
              </Link>
              {" — "}
              {es ? familia.descEs : familia.descEn}
            </p>
          </Reveal>

          {/* Fórmula, cuando el término es cuantitativo */}
          {formula && (
            <Reveal delay={0.08}>
              <figure className="m-0 mt-9 rounded-[12px] bg-[color-mix(in_srgb,var(--ink)_4%,transparent)] px-5 py-6 sm:px-7">
                <p className="eyebrow m-0">{es ? "Fórmula" : "Formula"}</p>
                <p className="m-0 mt-4 overflow-x-auto font-mono text-[15px] font-medium tracking-[0.01em] text-primary sm:text-[17px]">
                  {es ? formula.formulaEs : formula.formulaEn}
                </p>
                <figcaption className="mt-4 text-[13px] leading-[1.6] text-secondary">
                  {es ? formula.variablesEs : formula.variablesEn}
                </figcaption>
              </figure>
            </Reveal>
          )}

          {/* La herramienta que lo calcula, si existe */}
          {herramienta && (
            <Reveal delay={0.1}>
              <Link
                href={herramienta}
                className="group -mx-4 mt-6 flex items-center justify-between gap-4 rounded-[4px] px-4 py-3.5 transition-colors hover:bg-[color-mix(in_srgb,var(--ink)_4%,transparent)]"
              >
                <span className="min-w-0">
                  <span className="block text-[12px] uppercase tracking-[0.08em] text-tertiary">
                    {es ? "Calcúlalo" : "Work it out"}
                  </span>
                  <span className="mt-1 block text-[15px] font-medium text-primary">
                    {es
                      ? "Hay una herramienta para esto, gratis y sin registro"
                      : "There is a tool for this, free and with no sign-up"}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="shrink-0 text-[18px] text-tertiary transition-[color,transform] duration-300 group-hover:translate-x-1 group-hover:text-primary"
                >
                  →
                </span>
              </Link>
            </Reveal>
          )}

          {/* Dónde continúa dentro del producto */}
          <Reveal delay={0.14}>
            <p className="mt-8 text-[15px] leading-relaxed text-secondary">
              {es ? "Dentro del programa: " : "Inside the app: "}
              <Link
                href={seguir.href}
                className="link-underline-host -my-2 inline-flex py-2 text-primary transition-colors hover:text-[rgb(var(--accent-base))]"
              >
                <span className="link-underline">
                  {es ? seguir.es : seguir.en}
                </span>
              </Link>
            </p>
          </Reveal>

        </div>

          {/* Vecinos de familia */}
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
                        className="group grid min-h-[52px] grid-cols-1 items-baseline gap-1 rounded-[4px] px-4 py-3 transition-colors hover:bg-[color-mix(in_srgb,var(--ink)_4%,transparent)] sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-5 lg:grid-cols-1 lg:gap-1"
                      >
                        <span
                          lang="en"
                          className="text-[14px] font-semibold text-primary"
                        >
                          {t.term}
                        </span>
                        <span className="line-clamp-2 text-[14px] leading-[1.5] text-secondary">
                          {es ? t.es : t.en}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          )}

          {/* Hojear el glosario entero */}
          <Reveal delay={0.22} className="lg:col-start-1 lg:row-start-2 lg:max-w-[62ch]">
            <nav
              aria-label={es ? "Recorrer el glosario" : "Browse the glossary"}
              className="mt-12 flex items-stretch justify-between gap-3 border-t border-[rgb(var(--divider)/0.1)] pt-6"
            >
              {anterior ? (
                <Link
                  href={`/glosario/${anterior.slug}`}
                  className="group flex min-h-[44px] max-w-[46%] flex-col justify-center text-left"
                >
                  <span className="text-[12px] uppercase tracking-[0.08em] text-tertiary">
                    ← {es ? "Anterior" : "Previous"}
                  </span>
                  <span
                    lang="en"
                    className="truncate text-[14px] font-medium text-secondary transition-colors group-hover:text-primary"
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
                  <span className="text-[12px] uppercase tracking-[0.08em] text-tertiary">
                    {es ? "Siguiente" : "Next"} →
                  </span>
                  <span
                    lang="en"
                    className="truncate text-[14px] font-medium text-secondary transition-colors group-hover:text-primary"
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
