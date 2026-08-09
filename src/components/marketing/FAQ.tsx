"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { useLang } from "@/lib/i18n";
import { SUPPORT_EMAIL } from "@/lib/forms";
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

type QA = { q: string; a: string };

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

  // Pre-fill the search from `?q=` (e.g. the 404 page's search box) on mount.
  // SSR-safe: guarded against `window` being undefined during server render.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q && q.trim() !== "") setQuery(q);
  }, []);

  const items: QA[] = es
    ? [
        {
          q: "¿Cuál es el estado de compra?",
          a: "La demo es pública y no pide registro ni tarjeta. Core $149 y Pro $249 son precios de lanzamiento previstos hasta que la entrega comercial esté abierta.",
        },
        {
          q: "¿Mis datos están seguros?",
          a: "Tus datos viven en un único archivo .sqlite dentro de tu equipo. Nunca se suben a ningún servidor: no hay servidor. Puedes cifrar la carpeta con BitLocker/VeraCrypt para una capa extra de seguridad.",
        },
        {
          q: "¿Puedo exportar mis datos?",
          a: "Sí. Puedes exportar todo tu journal a CSV (para Excel o Google Sheets), PDF (informes listos para compartir) y JSON (backup completo y reimportable). Tus datos son tuyos: puedes llevártelos cuando quieras, sin API que cerrar ni servidor que apagar.",
        },
        {
          q: "¿Funciona en Mac o Linux?",
          a: "CountPips es una app nativa de Windows (WinUI 3). En Mac o Linux puedes ejecutarla a través de una máquina virtual con Windows o Parallels. Estamos explorando activamente una versión local-first para Mac y Linux: si quieres entrar en el acceso anticipado, escríbenos.",
        },
        {
          q: "¿Puedo importar de otro journal?",
          a: "Sí. Aceptamos importación desde CSV (formato flexible con mapeo de columnas) y un importador dedicado para journals populares. Si tu journal actual exporta a CSV, lo tienes en tu CountPips en menos de 5 minutos.",
        },
        {
          q: "¿Cómo se selecciona el acceso anticipado?",
          a: "Revisamos las solicitudes por perfil y fase del producto, no por orden de llegada. Si encaja con el piloto privado, escribiremos con los pasos de invitación.",
        },
        {
          q: "¿Qué está listo y qué se está validando?",
          a: "La demo, el journal, las métricas y los recorridos de riesgo están listos para explorar. El piloto privado valida la instalación y el flujo con usuarios reales; la página de estado explica lo que todavía no prometemos.",
        },
        {
          q: "¿Qué métodos de pago aceptáis?",
          a: "La demo no tiene coste. La compra se abrirá cuando la entrega comercial, la licencia y el soporte estén listos; el acceso anticipado no es una preventa.",
        },
        {
          q: "¿Puedo ver el producto antes de solicitar acceso?",
          a: "Sí. Puedes explorar la demo en vivo con datos deterministas, sin registro y sin descargar nada. La aplicación instalada se entrega sólo a participantes del piloto privado invitados.",
        },
        {
          q: "¿Cuál es la diferencia entre Core y Pro?",
          a: "Core incluye el journal completo, 40+ métricas, 2 cuentas de trading, gestión de riesgo, disciplina e informes PDF básicos. Pro desbloquea además: cuentas ilimitadas, modo prop firm, simulador Monte Carlo, informe de track record, risk of ruin, informes PDF avanzados y el importador de rivales que migra tu journal anterior en 5 minutos.",
        },
        {
          q: "¿Cómo funcionará la privacidad de mis datos?",
          a: "La aplicación está diseñada local-first: las operaciones viven en tu equipo y la web no pide credenciales, capital, extractos ni datos financieros. El piloto privado valida el flujo sin exponer esos datos.",
        },
        {
          q: "¿Podré usarlo en varios ordenadores?",
          a: "La política de dispositivos se concretará antes de la venta. Durante el piloto privado recibirás instrucciones de instalación sólo si eres invitado.",
        },
        {
          q: "¿Qué ocurre si cambio de ordenador durante el piloto?",
          a: "El equipo de CountPips te indicará el procedimiento para mover tu entorno. No pediremos credenciales ni datos financieros para hacerlo.",
        },
      ]
    : [
        {
          q: "What is the purchase status?",
          a: "The demo is public and requires no sign-up or card. Core is planned at $149 and Pro at $249 until commercial delivery opens.",
        },
        {
          q: "Are my data safe?",
          a: "Your data lives in a single .sqlite file on your machine. It never gets uploaded to any server: there is no server. You can encrypt the folder with BitLocker/VeraCrypt for an extra layer of security.",
        },
        {
          q: "Can I export my data?",
          a: "Yes. You can export your entire journal to CSV (for Excel or Google Sheets), PDF (ready-to-share reports), and JSON (full, re-importable backup). Your data is yours: take it with you whenever you want — no API to shut down, no server to turn off.",
        },
        {
          q: "Does it work on Mac or Linux?",
          a: "CountPips is a native Windows app (WinUI 3). On Mac or Linux you can run it through a Windows virtual machine or Parallels. We're actively exploring a local-first version for Mac and Linux — if you'd like early access, drop us a line.",
        },
        {
          q: "Can I import from another journal?",
          a: "Yes. We support CSV import (flexible format with column mapping) and a dedicated importer for popular journals. If your current journal exports to CSV, you'll have it in your CountPips in less than 5 minutes.",
        },
        {
          q: "How is early access selected?",
          a: "We review applications by profile and product phase, not by order of arrival. If it fits the private pilot, we will write with invitation steps.",
        },
        {
          q: "What is ready and what is being validated?",
          a: "The demo, journal, metrics and risk journeys are ready to explore. The private pilot validates installation and workflow with real users; the product status page explains what is not promised yet.",
        },
        {
          q: "What payment methods do you accept?",
          a: "The demo is free. Purchase opens when commercial delivery, licensing and support are ready; early access is not a pre-order.",
        },
        {
          q: "Can I see the product before requesting access?",
          a: "Yes. Explore the live demo with deterministic data, no signup and nothing to download. The desktop installer is delivered only to invited private-pilot participants.",
        },
        {
          q: "What's the difference between Core and Pro?",
          a: "Core includes the full journal, 40+ metrics, 2 trading accounts, risk management, discipline, and basic PDF reports. Pro additionally unlocks unlimited accounts, prop firm mode, the Monte Carlo simulator, track record report, risk of ruin, advanced PDF reports, and the rival importer that migrates your old journal in 5 minutes.",
        },
        {
          q: "How will my data stay private?",
          a: "The app is designed local-first: trades live on your machine and the website never asks for credentials, capital, statements or financial data. The private pilot validates the workflow without exposing those data.",
        },
        {
          q: "Will I be able to use it on multiple computers?",
          a: "The device policy will be defined before sales open. During the private pilot, invited participants receive installation instructions.",
        },
        {
          q: "What if I change computers during the pilot?",
          a: "The CountPips team will provide the procedure to move your environment. We will not ask for credentials or financial data to do it.",
        },
      ];

  // Real-time filter on question + answer text (active language).
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return items;
    return items.filter(
      (it) =>
        it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q)
    );
  }, [items, query]);

  // While searching, force a fresh `key` so the first match opens by default
  // and stale accordion state from the unfiltered list doesn't persist.
  const hasQuery = query.trim() !== "";
  const noResults = filtered.length === 0;

  return (
    <section
      id="faq"
      /* En `/faq` la cabecera de página ya titula, así que aquí el h2 se
         vuelve invisible (sigue existiendo para el indice y para SEO).
         Con el padding completo de `.section` eso dejaba ~145 px de
         vacio absoluto entre la regla del hero y el buscador. */
      className={`${standalone ? "pt-10 pb-[clamp(4rem,8vw,7rem)]" : "section"} cv-auto bg-veil relative overflow-hidden scroll-mt-24`}
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

        {/* Search input — filters FAQ items in real time */}
        <Reveal delay={0.1} y={24}>
          <div className="relative mt-8 max-w-3xl mx-auto">
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
              className="w-full bg-[rgb(var(--divider)/0.05)] border border-[rgb(var(--divider)/0.10)] rounded-[2px] h-11 pl-10 pr-3 text-sm text-primary placeholder:text-tertiary outline-none transition-[border-color,box-shadow,background-color] duration-200 hover:border-[rgb(var(--divider)/0.25)] focus-visible:border-[rgb(var(--accent-base)/0.50)] focus-visible:bg-[rgb(var(--divider)/0.07)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.20)] focus-visible:ring-offset-0"
            />
          </div>
        </Reveal>

        <Reveal delay={0.12} y={32}>
          {/* Pasa de cristal a papel, pero NO a retícula: dentro hay un
              acordeón de trece preguntas que se abren y se cierran, y una
              superficie es lo que dice «aquí se actúa». Una retícula
              desnuda es para leer un dato, no para operar sobre él.

              El cristal, además, no era cristal: la paleta viva le quita
              el desenfoque y lo deja en un fondo plano sin grano, que es
              justo lo que hacía que esta caja se viera apagada al lado
              de las secciones de papel de la misma página. */}
          <div className="tj-paper relative mt-6 max-w-3xl mx-auto rounded-[2px] border border-[rgb(var(--divider)/0.13)] p-2 md:p-3">
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
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-[rgb(var(--accent-hover))] hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.5)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-sm"
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
                    /* El raíl de acento del elemento abierto es un
                       `border-left`, no un `box-shadow: inset`. La sombra
                       interior se dibuja DENTRO de la caja, encima del
                       texto: la pregunta abierta quedaba pegada al raíl y
                       en la respuesta se comía la primera letra. Un borde
                       ocupa espacio de verdad, así que empuja el
                       contenido en vez de invadirlo. Se declara
                       transparente en reposo para que abrir y cerrar no
                       desplace nada horizontalmente. */
                    className="border-b border-l-2 border-l-transparent border-b-[rgb(var(--divider)/0.08)] last:border-b-0 px-4 md:px-5 transition-[border-color,background-color] duration-300 data-[state=closed]:hover:bg-[rgb(var(--divider)/0.04)] data-[state=open]:border-l-[rgb(var(--accent-base))] data-[state=open]:bg-[rgb(var(--divider)/0.05)]"
                  >
                    <AccordionTrigger className="text-left text-base md:text-[1.05rem] font-medium text-primary hover:text-[rgb(var(--accent-hover))] hover:no-underline py-5 transition-colors [&>svg]:!text-tertiary [&[data-state=open]>svg]:!text-[rgb(var(--accent-base))] [&[data-state=open]>svg]:rotate-180 [&>svg]:transition-transform [&>svg]:duration-300 [&>svg]:ease-[var(--ease-suave)] data-[state=open]:text-[rgb(var(--accent-base))]">
                      {/* Wrap the question in a min-w-0 span so the flex
                          trigger (shadcn AccordionTrigger uses
                          flex justify-between) can wrap long questions
                          like "What's the difference between Core and Pro?"
                          on a 375px viewport without pushing the chevron
                          off the right edge. */}
                      <span className="min-w-0 break-words">{item.q}</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-secondary leading-relaxed text-[0.95rem] pb-5">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="mt-6 text-center text-sm text-tertiary">
            {es ? "¿No encuentras tu respuesta?" : "Didn't find your answer?"}{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="link-underline text-primary hover:text-[rgb(var(--accent-hover))] font-medium transition-colors"
            >
              {es ? "Escríbenos" : "Email us"}
            </a>
            .
          </p>
        </Reveal>

        {/* Glossary trigger — reinforces the frozen-glossary philosophy.
            Same controlled instance powers the "no results" link above. */}
        <Reveal delay={0.26}>
          <div className="mt-4 text-center">
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
                  className="min-h-[44px] px-3 text-sm text-tertiary hover:text-primary transition-colors inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.5)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-sm"
                >
                  {es
                    ? "¿No encuentras tu término? Consulta el glosario →"
                    : "Can't find your term? Browse the glossary →"}
                </button>
              }
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
