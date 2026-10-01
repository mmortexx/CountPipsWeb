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
import { herramientaPorSlug } from "@/lib/herramientas";


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
  const esTest = herramienta === "/test";
  const fichaHerramienta = herramienta && !esTest ? herramientaPorSlug(herramienta.split("/").pop() ?? "") : undefined;
  const destinoHerramienta = esTest
    ? es ? "Test de disciplina" : "Discipline test"
    : fichaHerramienta && (es ? fichaHerramienta.tituloEs : fichaHerramienta.tituloEn);
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
          {/* La definición es la entradilla de la cabecera (PageHeader), a
              `t-lede` como la de cualquier página: aquí debajo abría un
              segundo bloque a 150 px del titular. */}
          {/* Fórmula, cuando el término es cuantitativo */}
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

          {/* Salidas: la herramienta que lo calcula, si existe, y dónde sigue en el programa. */}
          <Reveal delay={0.1}>
            <div className="mt-6 grid gap-1">
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
                {/* La familia es la ceja de la página; aquí queda la puerta
                    a la familia entera. */}
                <Link
                  href={`/glosario#${termino.category}`}
                  className="cta cta--secundario mt-3 h-11 text-[14px]"
                >
                  {es ? `Toda la familia ${familia.es}` : `All of ${familia.en}`}
                </Link>
              </div>
            </Reveal>
          )}

          {/* Hojear el glosario entero */}
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
