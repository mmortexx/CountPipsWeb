"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { useLang } from "@/lib/i18n";
import { FAQ_ES, FAQ_EN, type QA } from "@/lib/faq";
import { Eyebrow } from "@/components/tj/Eyebrow";
import { Reveal } from "@/components/tj/Reveal";
import { GlossaryModal } from "@/components/tj/GlossaryModal";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

/**
 * FAQ — accordion of common questions (ES/EN) with real-time search.
 *
 * Premium motion layer:
 *  - Open accordion item gets a subtle accent border glow (via data-state).
 *  - Chevron rotation already handled by shadcn Accordion (rotate-180).
 *  - Question text shifts to accent color on hover.
 *
 * Search behaviour:
 *  - Filters question + answer text, case-insensitive, in the active language.
 *  - When the query yields no matches, shows a "no results" panel with a
 *    button that opens the GlossaryModal (controlled by FAQ's own state).
 *  - The accordion auto-collapses while a query is active so multiple matches
 *    can be scanned at a glance; the first match opens by default.
 */

/**
 * @param standalone En la página /faq el `PageHeader` ya titula
 * "Preguntas frecuentes." — con esta bandera la sección omite su
 * encabezado interno (que duplicaba el titular) y entra directa al
 * buscador y la lista.
 */
export function FAQ({ standalone = false }: { standalone?: boolean } = {}) {
  const { t, lang } = useLang();
  const es = lang === "es";

  // GlossaryModal is controlled by FAQ so the "no results" link can open it.
  const [glossaryOpen, setGlossaryOpen] = React.useState(false);

  const [query, setQuery] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState<"all" | "security" | "access" | "product">("all");

  // Pre-fill the search from `?q=` (e.g. the 404 page's search box) on mount.
  // SSR-safe: guarded against `window` being undefined during server render.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q && q.trim() !== "") setQuery(q);
  }, []);

  const items: QA[] = es ? FAQ_ES : FAQ_EN;

  // Real-time filter on question + answer text + category (active language).
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it, idx) => {
      // Category classification
      if (activeCategory === "security") {
        if (![1, 2, 10, 12].includes(idx)) return false;
      } else if (activeCategory === "access") {
        if (![0, 5, 6, 7, 8].includes(idx)) return false;
      } else if (activeCategory === "product") {
        if (![3, 4, 9, 11].includes(idx)) return false;
      }

      if (q === "") return true;
      return (
        it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q)
      );
    });
  }, [items, query, activeCategory]);

  const categories = [
    { id: "all" as const, labelEs: "Todas las preguntas", labelEn: "All questions" },
    { id: "security" as const, labelEs: "Seguridad y Datos", labelEn: "Security & Data" },
    { id: "access" as const, labelEs: "Licencia y Acceso", labelEn: "License & Access" },
    { id: "product" as const, labelEs: "Producto y Funciones", labelEn: "Product & Features" },
  ];

  // While searching or filtering, force a fresh `key` so the first match opens by default
  const hasQuery = query.trim() !== "" || activeCategory !== "all";
  const noResults = filtered.length === 0;

  return (
    <section
      id="faq"
      /* En `/faq` la cabecera de página ya titula, así que aquí el h2 se
         vuelve invisible (sigue existiendo para el indice y para SEO).
         Con el padding completo de `.section` eso dejaba ~145 px de
         vacio absoluto entre la regla del hero y el buscador. */
      className={`${standalone ? "pt-10 pb-[clamp(4rem,8vw,7rem)]" : "section"} cv-auto relative overflow-clip scroll-mt-24`}
    >
      <div className="relative z-10 tj-container">
        {/* Encabezado interno — el h2 siempre se renderiza (necesario para
            el TOC + SEO); en modo standalone (/faq) se omite el eyebrow
            porque el PageHeader ya aporta su propio kicker arriba. */}
        <div className="relative max-w-3xl mx-auto text-center">
          {!standalone && (
            <Reveal>
              <div className="relative flex justify-center">
                <Eyebrow>{t("faqEyebrow")}</Eyebrow>
              </div>
            </Reveal>
          )}
          {/* En /faq el PageHeader ya titula "Preguntas frecuentes.", así
              que este h2 se repetía A LA VISTA dos veces seguidas. El
              comentario de arriba tiene razón en que el h2 debe seguir
              EXISTIENDO (lo consumen el índice lateral y el esquema de
              encabezados para SEO), pero eso no obliga a mostrarlo: con
              `sr-only` sigue en el documento y en el árbol de
              accesibilidad, y deja de duplicar el titular en pantalla. */}
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
                  Preguntas <span className="text-gradient">frecuentes</span>
                </>
              ) : (
                <>
                  Frequently asked <span className="text-gradient">questions</span>
                </>
              )}
            </h2>
          </Reveal>
        </div>

        {/* En `/faq` el bloque entero medía 768 px y se quedaba pegado al
            margen izquierdo: a 1.440 px la mitad derecha de la página
            estaba vacía mientras el formulario de contacto de más abajo
            sí ocupaba las dos columnas. Desde `lg` el buscador, los
            filtros y el enlace al glosario se van a un raíl estrecho a la
            izquierda y las preguntas ocupan el resto. La
            colocación se hace por rejilla para no duplicar el JSX: en el
            documento el orden sigue siendo buscador → lista → glosario,
            que es como se lee sin CSS y como se tabula. */}
        <div
          className={
            standalone
              ? "grid gap-x-14 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:grid-rows-[auto_minmax(0,1fr)] lg:items-start"
              : "contents"
          }
        >
        {/* Search input — filters FAQ items in real time */}
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
            {/* Category Pills */}
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
          {/* Pasa de cristal a papel, pero NO a retícula: dentro hay un
              acordeón de trece preguntas que se abren y se cierran, y una
              superficie es lo que dice «aquí se actúa». Una retícula
              desnuda es para leer un dato, no para operar sobre él.

              El cristal, además, no era cristal: la paleta viva le quita
              el desenfoque y lo deja en un fondo plano sin grano, que es
              justo lo que hacía que esta caja se viera apagada al lado
              de las secciones de papel de la misma página. */}
          <div className={`relative mt-8 max-w-3xl border-t border-[var(--line)] ${standalone ? "lg:max-w-none" : "mx-auto"}`}>
            {noResults ? (
              /* ───── No-results panel — links to the GlossaryModal ───── */
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
                  onClick={() => setGlossaryOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-[rgb(var(--accent-hover))] hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.5)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-[4px]"
                >
                  {es ? "Abrir glosario →" : "Open glossary →"}
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
                    /* Abierta, la pregunta no cambia de caja: sin raíl
                       lateral ni relleno. La marca es la propia respuesta
                       y el chevrón girado. */
                    className="border-b border-b-[var(--ficha-division)] last:border-b-0 px-4 md:px-5"
                  >
                    <AccordionTrigger className="text-left text-base md:text-[1.05rem] font-medium text-primary hover:text-[rgb(var(--accent-hover))] hover:no-underline py-5 transition-colors [&>svg]:!text-tertiary [&[data-state=open]>svg]:!text-[rgb(var(--accent-base))] [&[data-state=open]>svg]:rotate-180 [&>svg]:transition-transform [&>svg]:duration-300 [&>svg]:ease-[var(--ease-suave)] data-[state=open]:text-[rgb(var(--accent-base))]">
                      {/* Wrap the question in a min-w-0 span so the flex
                          trigger (shadcn AccordionTrigger uses
                          flex justify-between) can wrap long questions
                          like "What's the difference between Core and Pro?"
                          on a 375px viewport without pushing the chevron
                          off the right edge. */}
                      {/* Sangría francesa: el número en su propia celda y la
                          pregunta en la suya. Con los dos en el mismo flujo
                          en línea, la segunda línea de una pregunta larga
                          volvía al margen y se metía debajo del número. */}
                      <span className="flex min-w-0 items-baseline gap-2.5">
                        <span
                          className="tnum shrink-0 text-[12px] font-semibold text-tertiary"
                          aria-hidden
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="min-w-0 break-words">{item.q}</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="medida text-secondary leading-relaxed text-[0.95rem] pb-5">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </Reveal>


        {/* Glossary trigger — reinforces the frozen-glossary philosophy.
            Same controlled instance powers the "no results" link above. */}
        <Reveal
          delay={0.26}
          className={standalone ? "lg:col-start-1 lg:row-start-2 lg:self-start" : undefined}
        >
          <div className={`mt-6 ${standalone ? "-ml-3 lg:ml-0 lg:mt-6 lg:border-t lg:border-[var(--line)] lg:pt-5" : "text-center"}`}>
            <GlossaryModal
              open={glossaryOpen}
              onOpenChange={setGlossaryOpen}
              trigger={
                <button
                  type="button"
                  /* `min-h-[44px] px-3` — es un botón de verdad, no un
                     enlace suelto en mitad de un párrafo, y medía 20 px
                     de alto. El relleno lateral además separa el foco
                     del texto para que el anillo no lo estrangule. */
                  className={`min-h-[44px] px-3 text-sm text-tertiary hover:text-primary transition-colors inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.5)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-[4px] ${
                    standalone ? "text-left" : ""
                  }`}
                >
                  {es
                    ? "¿No encuentras tu término? Consulta el glosario →"
                    : "Can't find your term? Browse the glossary →"}
                </button>
              }
            />
          </div>
        </Reveal>
        </div>
      </div>
    </section>
  );
}
