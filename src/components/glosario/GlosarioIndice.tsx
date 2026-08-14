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
 * El índice del glosario: las cinco familias y sus 51 términos.
 *
 * Lleva buscador porque con 51 entradas la alternativa es que el visitante
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
    <section className="section-tight">
      <div className="tj-container">
        {/* Buscador */}
        <Reveal>
          <div className="mx-auto max-w-xl">
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
              className="h-12 w-full rounded-[2px] border px-4 text-base sm:text-[15px] text-primary outline-none transition-colors placeholder:text-tertiary"
              style={{
                borderColor: "rgb(var(--divider) / 0.16)",
                background: "rgb(var(--divider) / 0.04)",
              }}
            />
            {/* Category Pills */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3.5">
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className={`min-h-[44px] sm:min-h-0 sm:h-7 px-3.5 sm:px-3 py-2.5 sm:py-0 rounded-[2px] text-xs font-medium inline-flex items-center justify-center transition-all ${
                  activeCategory === "all"
                    ? "bg-[rgb(var(--accent-base))] text-[rgb(var(--accent-ink))] font-semibold"
                    : "border border-[rgb(var(--divider)/0.12)] bg-[rgb(var(--divider)/0.03)] text-secondary hover:text-primary hover:border-[rgb(var(--divider)/0.25)] hover:bg-[rgb(var(--divider)/0.06)]"
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
                    onClick={() => setActiveCategory(cat)}
                    className={`min-h-[44px] sm:min-h-0 sm:h-7 px-3.5 sm:px-3 py-2.5 sm:py-0 rounded-[2px] text-xs font-medium inline-flex items-center justify-center transition-all ${
                      activeCategory === cat
                        ? "bg-[rgb(var(--accent-base))] text-[rgb(var(--accent-ink))] font-semibold"
                        : "border border-[rgb(var(--divider)/0.12)] bg-[rgb(var(--divider)/0.03)] text-secondary hover:text-primary hover:border-[rgb(var(--divider)/0.25)] hover:bg-[rgb(var(--divider)/0.06)]"
                    }`}
                  >
                    {es ? meta.es : meta.en}
                  </button>
                );
              })}
            </div>

            <p className="mt-2.5 text-center text-[13px] text-tertiary">
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
              <p className="text-center text-[15px] text-secondary">
                {es
                  ? "Nada con ese nombre. Prueba con una palabra de la definición."
                  : "Nothing by that name. Try a word from the definition."}
              </p>
            ) : (
              <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
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
                        className="tnum text-[12px] font-semibold"
                        style={{ color: "rgb(var(--accent-base))" }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h2 className="m-0 text-[22px] font-semibold tracking-tight text-primary">
                        {es ? meta.es : meta.en}
                      </h2>
                      <span className="tnum text-[13px] text-tertiary">
                        {lista.length}
                      </span>
                    </div>
                    <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-secondary">
                      {es ? meta.descEs : meta.descEn}
                    </p>
                    <ul className="mt-6 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
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
    <li>
      {/* La tarjeta ENTERA es el enlace, no solo el título: en móvil
          apuntar a dos palabras con el pulgar es peor que apuntar a un
          bloque de 100 px de alto.

          El `border` en reposo NO es decorativo: sin él, el
          `hover:border-…` de al lado no pintaba nada. `.tj-paper` no
          declara borde y el reglaje base deja el grosor a 0, así que
          cambiar sólo el COLOR en el hover no produce ninguna línea
          visible. La tarjeta respondía al puntero en el papel y no en la
          pantalla. Mismo arreglo en las otras cinco tarjetas de glosario
          y herramientas. */}
      <Link
        href={`/glosario/${termino.slug}`}
        className="tj-paper group flex h-full flex-col rounded-[2px] border border-[rgb(var(--divider)/0.13)] p-4 transition-colors duration-200 hover:border-[rgb(var(--accent-base)/0.35)]"
      >
        <span
          lang="en"
          className="text-[15px] font-semibold tracking-tight text-primary transition-colors group-hover:text-[rgb(var(--accent-base))]"
        >
          {termino.term}
        </span>
        <span className="mt-1.5 line-clamp-3 text-[13.5px] leading-[1.55] text-secondary">
          {es ? termino.es : termino.en}
        </span>
      </Link>
    </li>
  );
}
