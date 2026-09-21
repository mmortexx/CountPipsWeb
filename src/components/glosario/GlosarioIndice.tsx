"use client";

import { useMemo, useState } from "react";
import { Link } from "@/components/tj/LocaleLink";
import { useLang } from "@/lib/i18n";
import { Reveal } from "@/components/tj/Reveal";
import {
  CATEGORIAS,
  ORDEN_CATEGORIAS,
  TERMINOS,
  terminosPorCategoria,
} from "@/lib/glosario";

/**
 * El índice del glosario: las cinco familias y sus términos.
 *
 * Lleva buscador porque con medio centenar de entradas la alternativa es que el visitante
 * recorra la página entera con la vista. Filtra por nombre Y por
 * definición: quien no recuerda cómo se llama algo lo busca por lo que
 * hace («cuánto puedo perder», «racha»), y así también lo encuentra.
 *
 * El buscador NO es el de la ventana emergente que ya existía. Aquel sigue
 * en su sitio para consultar sin salir de la página; éste es la puerta de
 * entrada de quien llega desde un buscador, que es gente distinta llegando
 * por un camino distinto.
 */
export function GlosarioIndice() {
  const { lang } = useLang();
  const es = lang === "es";
  const [q, setQ] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const norm = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  const filtrados = useMemo(() => {
    const t = norm(q.trim());
    if (!t && activeCategory === "all") return null;

    let base = TERMINOS;
    if (activeCategory !== "all") {
      base = base.filter((x) => x.category === activeCategory);
    }

    if (!t) return base;

    return base.filter(
      (x) =>
        norm(x.term).includes(t) ||
        norm(es ? x.es : x.en).includes(t),
    );
  }, [q, activeCategory, es]);

  return (
    <section
      className="section-tight"
    >
      <div className="tj-container">
        {/* Buscador */}
        <Reveal>
          <div className="tj-no-print max-w-2xl">
            <label htmlFor="glos-q" className="sr-only">
              {es ? "Buscar un término" : "Search a term"}
            </label>
            <input
              id="glos-q"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={
                es
                  ? "Busca por nombre o por lo que significa…"
                  : "Search by name or by what it means…"
              }
              className="h-12 w-full tj-campo px-5 text-base sm:text-[15px] text-primary outline-none transition-colors placeholder:text-tertiary focus:border-[var(--line-2)] focus:bg-[var(--bg)]"
            />
            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-1 mt-4">
              <button
                type="button"
                aria-pressed={activeCategory === "all"}
                onClick={() => setActiveCategory("all")}
                className={`min-h-[44px] sm:min-h-0 sm:h-8 px-3.5 py-2.5 sm:py-0 rounded-[4px] text-[13px] font-medium inline-flex items-center justify-center transition-all ${
                  activeCategory === "all"
                    ? "bg-[var(--ink)] text-[var(--bg)]"
                    : "text-secondary hover:text-primary"
                }`}
              >
                {es ? "Todas las familias" : "All families"}
              </button>
              {ORDEN_CATEGORIAS.map((cat) => {
                const meta = CATEGORIAS[cat];
                return (
                  <button
                    key={cat}
                    type="button"
                    aria-pressed={activeCategory === cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`min-h-[44px] sm:min-h-0 sm:h-8 px-3.5 py-2.5 sm:py-0 rounded-[4px] text-[13px] font-medium inline-flex items-center justify-center transition-all ${
                      activeCategory === cat
                        ? "bg-[var(--ink)] text-[var(--bg)]"
                        : "text-secondary hover:text-primary"
                    }`}
                  >
                    {es ? meta.es : meta.en}
                  </button>
                );
              })}
            </div>

            <p className="mt-2.5 text-[14px] text-tertiary">
              {filtrados
                ? `${filtrados.length} ${
                    filtrados.length === 1
                      ? es
                        ? "término"
                        : "term"
                      : es
                        ? "términos"
                        : "terms"
                  }`
                : `${TERMINOS.length} ${es ? "términos en cinco familias" : "terms across five families"}`}
            </p>
          </div>
        </Reveal>

        {/* Resultados de búsqueda */}
        {filtrados && (
          <div className="mt-10">
            {filtrados.length === 0 ? (
              /* Alineado a la izquierda, bajo los controles que lo han
                 provocado, y con la salida a mano: centrado en un contenedor
                 vacío se quedaba flotando lejos del buscador. */
              <div className="border-t border-[var(--line)] pt-6">
                <p className="m-0 text-[15px] text-secondary">
                  {es
                    ? "Nada con ese nombre. Prueba con una palabra de la definición."
                    : "Nothing by that name. Try a word from the definition."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQ("");
                    setActiveCategory("all");
                  }}
                  className="link-underline-host -my-2 mt-2 inline-flex py-2 text-[14px] text-secondary transition-colors hover:text-primary"
                >
                  <span className="link-underline">
                    {es ? `Ver los ${TERMINOS.length} términos` : `See all ${TERMINOS.length} terms`}
                  </span>
                </button>
              </div>
            ) : (
              <ul className="m-0 grid border-t border-[var(--line)] p-0 lg:grid-cols-2 lg:gap-x-14">
                {filtrados.map((t) => (
                  <TarjetaTermino key={t.slug} termino={t} es={es} />
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Listado por familias */}
        {!filtrados && (
          <div className="mt-14 flex flex-col gap-14">
            {ORDEN_CATEGORIAS.map((cat, i) => {
              const meta = CATEGORIAS[cat];
              const lista = terminosPorCategoria(cat);
              return (
                <Reveal key={cat} delay={i * 0.04}>
                  <section id={cat} className="scroll-mt-28">
                    <div className="flex items-baseline gap-3">
                      <span
                        className="tnum text-[13px] text-tertiary"
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h2 className="m-0 text-[22px] font-semibold tracking-tight text-primary">
                        {es ? meta.es : meta.en}
                      </h2>
                      <span className="tnum text-[14px] text-tertiary">
                        {lista.length}
                      </span>
                    </div>
                    <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-secondary">
                      {es ? meta.descEs : meta.descEn}
                    </p>
                    <ul className="mt-6 grid border-t border-[var(--line)] p-0 lg:grid-cols-2 lg:gap-x-14">
                      {lista.map((t) => (
                        <TarjetaTermino key={t.slug} termino={t} es={es} />
                      ))}
                    </ul>
                  </section>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function TarjetaTermino({
  termino,
  es,
}: {
  termino: (typeof TERMINOS)[number];
  es: boolean;
}) {
  return (
    <li className="border-b border-[var(--line)]">
      <Link
        href={`/glosario/${termino.slug}`}
        /* Los `66ch` de la columna se miden con la tipografía de ESTE enlace,
           no con la del texto de 14 px que lleva dentro: daban 119 caracteres
           de definición. La columna pasa a repartir ancho y punto; la medida
           del texto la pone `.medida` en el `span`. Ver la nota en globals.css. */
        className="group grid min-h-[56px] grid-cols-1 items-baseline gap-1 py-4 transition-colors duration-150 focus-visible:bg-[color-mix(in_srgb,var(--ink)_4%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgb(var(--accent-base)/0.55)] sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-6 lg:grid-cols-1 lg:gap-1.5"
      >
        <span
          lang="en"
          className="text-[15px] font-semibold tracking-tight text-primary"
        >
          {termino.term}
        </span>
        <span className="medida block text-[14px] leading-[1.5] text-secondary transition-colors group-hover:text-primary">
          {es ? termino.es : termino.en}
        </span>
      </Link>
    </li>
  );
}
