"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { useLang } from "@/lib/i18n";
import { FAQ_ES, FAQ_EN, type QA } from "@/lib/faq";
import { paraBuscar } from "@/lib/busqueda";
import { Eyebrow } from "@/components/tj/Eyebrow";
import { Reveal } from "@/components/tj/Reveal";
import { ResultadoAnunciado } from "@/components/tj/ResultadoAnunciado";
import { openGlossary } from "@/lib/overlays";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

/**
 * Preguntas frecuentes (ES/EN) en acordeón, con búsqueda en vivo sobre
 * pregunta y respuesta en el idioma activo. Sin resultados, ofrece abrir el
 * glosario, que pinta `OverlayHost`: importarlo aquí metería el glosario y
 * Radix Dialog en el arranque de /faq.
 *
 * @param standalone En /faq el `PageHeader` ya titula: la sección omite su
 * encabezado visible y entra directa al buscador y la lista.
 */
export function FAQ({ standalone = false }: { standalone?: boolean } = {}) {
  const { t, lang } = useLang();
  const es = lang === "es";

  const [query, setQuery] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState<"all" | "security" | "access" | "product">("all");

  // Rellena la búsqueda desde `?q=` (p. ej. la caja de la página 404).
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q && q.trim() !== "") setQuery(q);
  }, []);

  const items: QA[] = es ? FAQ_ES : FAQ_EN;

  // Filtro por texto y categoría; las categorías son índices en la lista.
  const filtered = React.useMemo(() => {
    const q = paraBuscar(query.trim());
    return items.filter((it, idx) => {
      if (activeCategory === "security") {
        if (![1, 2, 10, 12].includes(idx)) return false;
      } else if (activeCategory === "access") {
        if (![0, 5, 6, 7, 8].includes(idx)) return false;
      } else if (activeCategory === "product") {
        if (![3, 4, 9, 11].includes(idx)) return false;
      }

      if (q === "") return true;
      return (
        paraBuscar(it.q).includes(q) || paraBuscar(it.a).includes(q)
      );
    });
  }, [items, query, activeCategory]);

  const categories = [
    { id: "all" as const, labelEs: "Todas las preguntas", labelEn: "All questions" },
    { id: "security" as const, labelEs: "Seguridad y datos", labelEn: "Security & data" },
    { id: "access" as const, labelEs: "Licencia y acceso", labelEn: "Licence & access" },
    { id: "product" as const, labelEs: "Producto y funciones", labelEn: "Product & features" },
  ];

  // Al buscar o filtrar, la `key` del acordeón cambia para abrir la primera coincidencia.
  const hasQuery = query.trim() !== "" || activeCategory !== "all";
  const noResults = filtered.length === 0;
  const anuncio = noResults
    ? es ? "No se encontraron resultados." : "No results found."
    : `${filtered.length} ${filtered.length === 1 ? (es ? "pregunta" : "question") : es ? "preguntas" : "questions"}`;

  return (
    <section
      id="faq"
      /* Basta `.section`: tras `.tj-cabecera` abre con el mismo aire que el
         resto de páginas. */
      className="section cv-auto relative overflow-clip scroll-mt-24"
    >
      <div className="relative z-10 tj-container">
        {/* Encabezado interno: en `standalone` se omite el eyebrow (lo aporta el
            PageHeader). */}
        <div className="relative max-w-3xl mx-auto text-center">
          {!standalone && (
            <Reveal>
              <div className="relative flex justify-center">
                <Eyebrow>{t("faqEyebrow")}</Eyebrow>
              </div>
            </Reveal>
          )}
          {/* El h2 debe existir (índice lateral y encabezados SEO); en `standalone`
              va `sr-only` para no duplicar el titular del PageHeader. */}
          <Reveal delay={0.06}>
            <h2
              className={
                standalone
                  ? "sr-only"
                  : "relative t-h2 text-primary mt-5"
              }
            >
              {es ? (
                <>
                  Preguntas frecuentes
                </>
              ) : (
                <>
                  Frequently asked questions
                </>
              )}
            </h2>
          </Reveal>
        </div>

        {/* En `/faq`, desde `lg`, buscador, filtros y enlace al glosario van a un
            raíl izquierdo y las preguntas ocupan el resto. Se coloca por
            rejilla sin duplicar JSX: el orden del documento (y del tabulador)
            sigue siendo buscador, lista, glosario. */}
        <div
          className={
            standalone
              ? "grid gap-x-14 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:grid-rows-[auto_minmax(0,1fr)] lg:items-start"
              : "contents"
          }
        >
        <Reveal
          delay={0.1}
          y={24}
          className={standalone ? "lg:col-start-1 lg:row-start-1" : undefined}
        >
          <div className={`tj-no-print mt-8 max-w-3xl ${standalone ? "lg:max-w-none" : "mx-auto"}`}>
            <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-tertiary pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={es ? "Buscar en las preguntas…" : "Search questions…"}
              aria-label={es ? "Buscar en las preguntas frecuentes" : "Search frequently asked questions"}
              className="tj-campo w-full h-11 pl-10 pr-3 text-base sm:text-sm text-primary placeholder:text-tertiary outline-none transition-[border-color,box-shadow,background-color] duration-200 hover:border-[rgb(var(--divider)/0.25)] focus-visible:border-[rgb(var(--accent-base)/0.50)] focus-visible:bg-[rgb(var(--divider)/0.07)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.20)] focus-visible:ring-offset-0"
            />
            </div>
            <div
              className={`flex flex-wrap items-center gap-1.5 mt-3.5 ${
                standalone
                  ? "lg:mt-3 lg:flex-col lg:items-stretch lg:gap-0 lg:border-t lg:border-[var(--line)]"
                  : "justify-center"
              }`}
            >
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  aria-pressed={activeCategory === cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`min-h-[44px] sm:min-h-0 sm:h-8 px-3.5 py-2.5 sm:py-0 rounded-[4px] text-[13px] font-medium inline-flex items-center justify-center transition-colors ${
                    standalone
                      ? "lg:h-auto lg:min-h-[40px] lg:justify-start lg:rounded-none lg:border-b lg:border-b-[var(--line)] lg:border-l-2 lg:border-l-transparent lg:pr-0 lg:pl-3 lg:py-2.5 lg:text-left"
                      : ""
                  } ${
                    activeCategory === cat.id
                      ? standalone
                        ? "bg-[var(--ink)] text-[var(--bg)] lg:bg-transparent lg:text-primary lg:font-semibold lg:border-l-[rgb(var(--accent-base))]"
                        : "bg-[var(--ink)] text-[var(--bg)]"
                      : "text-secondary hover:text-primary"
                  }`}
                >
                  {es ? cat.labelEs : cat.labelEn}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal
          delay={0.12}
          y={32}
          className={standalone ? "lg:col-start-2 lg:row-start-1 lg:row-span-2" : undefined}
        >
          <div className={`relative mt-8 max-w-3xl border-t border-[var(--line)] ${standalone ? "lg:max-w-none" : "mx-auto"}`}>
            <ResultadoAnunciado texto={anuncio} />
            {noResults ? (
              /* Sin resultados: ofrece el glosario. */
              <div className="relative px-4 py-12 text-center">
                <p className="text-base font-medium text-primary">
                  {es
                    ? "No se encontraron resultados"
                    : "No results found"}
                </p>
                <p className="mt-2 text-sm text-secondary">
                  {es
                    ? "Prueba con otra palabra o consulta el glosario de trading."
                    : "Try another word or browse the trading glossary."}
                </p>
                <button
                  type="button"
                  onClick={(e) => openGlossary(e.currentTarget)}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-[rgb(var(--accent-hover))] hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.5)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-[4px]"
                >
                  {es ? "Abrir el glosario" : "Open the glossary"}
                </button>
              </div>
            ) : (
              <Accordion
                type="single"
                collapsible
                key={hasQuery ? `search-${query.trim()}` : "default"}
                defaultValue="item-0"
                className="relative"
              >
                {filtered.map((item, i) => (
                  <AccordionItem
                    key={item.q}
                    value={`item-${i}`}
                    /* Abierta, la pregunta no cambia de caja (como en /pricing):
                       la marca es la respuesta y el chevrón girado. */
                    className="border-b border-[var(--line)]"
                  >
                    <AccordionTrigger className="text-left text-primary hover:text-primary hover:no-underline py-5 transition-colors [&>svg]:!text-tertiary hover:[&>svg]:!text-primary [&[data-state=open]>svg]:rotate-180 [&>svg]:transition-[transform,color] [&>svg]:duration-300 [&>svg]:ease-[var(--ease-suave)]">
                      {/* `min-w-0` para que preguntas largas se partan en 375 px sin
                          empujar el chevrón. Sin número delante: la lista se
                          filtra al buscar y se renumeraría. */}
                      <span className="min-w-0 break-words">{item.q}</span>
                    </AccordionTrigger>
                    <AccordionContent className="medida text-secondary text-[15px] leading-[1.7] pb-5">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </Reveal>


        <Reveal
          delay={0.26}
          className={standalone ? "lg:col-start-1 lg:row-start-2 lg:self-start" : undefined}
        >
          <div className={`mt-6 ${standalone ? "-ml-3 lg:ml-0 lg:mt-4" : "text-center"}`}>
            <button
              type="button"
              onClick={(e) => openGlossary(e.currentTarget)}
              /* `min-h-[44px] px-3`: suelo táctil, y el relleno separa el foco
                 del texto. */
              className={`link-underline-host min-h-[44px] px-3 text-sm text-tertiary transition-colors inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.5)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-[4px] ${
                standalone ? "text-left" : ""
              }`}
            >
              <span>
                {es ? "¿Buscas un término? " : "Looking for a term? "}
                <span className="link-underline text-secondary">
                  {es ? "Consulta el glosario" : "Browse the glossary"}
                </span>
                .
              </span>
            </button>
          </div>
        </Reveal>
        </div>
      </div>
    </section>
  );
}
