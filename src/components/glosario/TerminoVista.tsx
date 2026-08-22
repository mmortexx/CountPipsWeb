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
 * Una definición son una o dos frases. Cincuenta y una páginas con dos
 * frases cada una es justo lo que un buscador clasifica como contenido
 * pobre, y entonces no sirven de nada: ni posicionan ni ayudan.
 *
 * Por eso cada página añade, sin inventar contenido, cosas que sí
 * existen en los datos: a qué familia pertenece el término, cuáles son
 * sus vecinos, dónde continúa dentro del producto, y —cuando la hay— la
 * herramienta que lo calcula. Todo son enlaces reales a páginas reales.
 *
 * El resultado además cumple otra función: ninguna de las 51 páginas es
 * un callejón sin salida. Se puede entrar por cualquiera y seguir.
 */
export function TerminoVista({ termino }: { termino: TerminoGlosario }) {
  const { lang } = useLang();
  const es = lang === "es";

  const familia = CATEGORIAS[termino.category];
  const seguir = SEGUIR_LEYENDO[termino.category];
  const herramienta = HERRAMIENTA_DE[termino.slug];
  const cercanos = relacionados(termino.slug);
  const { anterior, siguiente } = vecinos(termino.slug);

  return (
    <section
      /* `bg-veil` — esta sección se quedó fuera de la pasada de velos.
         Sin superficie propia, su texto cae directamente sobre el atlas
         grabado del fondo, que se dibuja a pantalla completa en TODAS
         las anchuras. Medido antes de ponerlo: el fondo bajo los
         rótulos pequeños llegaba a 1,3:1 en el peor píxel, con más de
         un 20 % del área del texto por debajo del mínimo AA. */
      className="section-tight bg-veil"
    >
      <div className="tj-container">
        <div className="mx-auto w-full max-w-[62ch]">
          {/* Definición */}
          <Reveal>
            <p className="m-0 text-[19px] leading-[1.65] text-primary">
              {es ? termino.es : termino.en}
            </p>
          </Reveal>

          {/* Familia */}
          <Reveal delay={0.06}>
            <div className="mt-7 flex flex-wrap items-center gap-2.5 text-[13px]">
              <span className="text-tertiary">
                {es ? "Familia:" : "Family:"}
              </span>
              <Link
                href={`/glosario#${termino.category}`}
                className="inline-flex min-h-[44px] items-center rounded-[2px] border border-[rgb(var(--accent-base)/0.35)] bg-[rgb(var(--accent-base)/0.08)] px-3 font-medium text-[rgb(var(--accent-base))] hover:bg-[rgb(var(--accent-base)/0.15)] transition-colors"
              >
                {es ? familia.es : familia.en}
              </Link>
              <span className="text-tertiary">
                — {es ? familia.descEs : familia.descEn}
              </span>
            </div>
          </Reveal>

          {/* Fórmula Matemática Cuantitativa (si existe para el término) */}
          {FORMULAS_GLOSARIO[termino.slug] && (
            <Reveal delay={0.08}>
              <div className="mt-7 p-4 rounded-[2px] border border-[rgb(var(--divider)/0.14)] bg-[color-mix(in_oklab,var(--surface-2)_50%,transparent)]">
                <div className="flex items-center justify-between text-xs text-tertiary uppercase tracking-wider mb-2 font-mono">
                  <span>{es ? "Fórmula Cuantitativa" : "Quantitative Formula"}</span>
                  <span className="text-[rgb(var(--accent-base))] font-semibold">LaTeX</span>
                </div>
                <div className="py-2 text-base md:text-lg font-mono font-bold text-primary tracking-wide text-center bg-[rgb(var(--divider)/0.03)] rounded border border-[rgb(var(--divider)/0.08)] mb-2">
                  {FORMULAS_GLOSARIO[termino.slug].formula}
                </div>
                <p className="text-xs text-tertiary leading-relaxed m-0">
                  <strong className="text-secondary">{es ? "Variables:" : "Variables:"}</strong> {es ? FORMULAS_GLOSARIO[termino.slug].variablesEs : FORMULAS_GLOSARIO[termino.slug].variablesEn}
                </p>
              </div>
            </Reveal>
          )}

          {/* La herramienta que lo calcula, si existe */}
          {herramienta && (
            <Reveal delay={0.1}>
              <Link
                href={herramienta}
                className="tj-paper mt-8 flex items-center justify-between gap-4 rounded-[2px] border border-[rgb(var(--divider)/0.13)] p-4 transition-colors hover:border-[rgb(var(--accent-base)/0.35)]"
              >
                <span className="min-w-0">
                  <span className="block text-[11px] uppercase tracking-[0.14em] text-tertiary">
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
                  className="shrink-0 text-[18px]"
                  style={{ color: "rgb(var(--accent-base))" }}
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

          {/* Vecinos de familia */}
          {cercanos.length > 0 && (
            <Reveal delay={0.18}>
              <div className="mt-12">
                <p className="eyebrow m-0">
                  {es ? "De la misma familia" : "Same family"}
                </p>
                <ul className="mt-4 overflow-hidden rounded-[2px] border border-[rgb(var(--divider)/0.13)] p-0">
                  {cercanos.map((t) => (
                    <li key={t.slug} className="border-b border-[rgb(var(--divider)/0.08)] last:border-b-0">
                      <Link
                        href={`/glosario/${t.slug}`}
                        className="group grid min-h-[52px] grid-cols-1 items-baseline gap-1 px-4 py-3 transition-colors hover:bg-[color-mix(in_srgb,var(--ink)_4%,transparent)] sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-5"
                      >
                        <span
                          lang="en"
                          className="text-[14px] font-semibold text-primary transition-colors group-hover:text-[rgb(var(--accent-base))]"
                        >
                          {t.term}
                        </span>
                        <span className="line-clamp-2 text-[13px] leading-[1.5] text-secondary">
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
          <Reveal delay={0.22}>
            <nav
              aria-label={es ? "Recorrer el glosario" : "Browse the glossary"}
              className="mt-12 flex items-stretch justify-between gap-3 border-t pt-6"
              style={{ borderColor: "rgb(var(--divider) / 0.12)" }}
            >
              {anterior ? (
                <Link
                  href={`/glosario/${anterior.slug}`}
                  className="group flex min-h-[44px] max-w-[46%] flex-col justify-center text-left"
                >
                  <span className="text-[11px] uppercase tracking-[0.14em] text-tertiary">
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
                  <span className="text-[11px] uppercase tracking-[0.14em] text-tertiary">
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
