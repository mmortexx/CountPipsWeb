"use client";

import { PRICING_FAQ_ES, PRICING_FAQ_EN, type QA } from "@/lib/faq";
import { useLang } from "@/lib/i18n";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Reveal } from "@/components/tj/Reveal";
import { asset } from "@/lib/asset";
import { withLocale } from "@/lib/locale";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

/** Las cuatro dudas de compra, en la página de precios, entre la comparativa y el estado del producto. */

export function PricingFAQ() {
  const { lang } = useLang();
  const es = lang === "es";

  /* Las cuatro preguntas viven en `src/lib/faq.ts`, compartidas con el
     dato estructurado de la pagina, para que no puedan divergir. */
  const items: QA[] = es ? PRICING_FAQ_ES : PRICING_FAQ_EN;

  return (
    <section
      id="pricing-faq"
      aria-label={es ? "Preguntas frecuentes sobre precios" : "Pricing FAQ"}
      className="section-tight relative overflow-clip scroll-mt-24"
    >

      <div className="relative z-10 tj-container">
        <SectionHeader
          composicion="centrada"
          etiqueta={es ? "Antes de decidir" : "Before you decide"}
          titulo={es ? (
            <>Lo que casi todos <span className="text-gradient">quieren saber.</span></>
          ) : (
            <>What almost everyone <span className="text-gradient">wants to know.</span></>
          )}
          entradilla={es
            ? "Cuatro respuestas rápidas sobre la demo, el alcance y el acceso anticipado."
            : "Four quick answers about the demo, scope and early access."}
        />

        <Reveal delay={0.1} y={28}>
          <div className="mt-10 max-w-3xl mx-auto border-t border-[var(--line)]">
            <Accordion
              type="single"
              collapsible
              defaultValue="item-0"
              className="relative"
            >
              {items.map((item, i) => (
                <AccordionItem
                  key={item.q}
                  value={`item-${i}`}
                  /* Mismo motivo que en FAQ.tsx: el raíl de acento es un
                     `border-left` real y no una sombra interior, que se
                     dibujaba encima del texto de la pregunta abierta. */
                  className="border-b border-[var(--line)]"
                >
                  <AccordionTrigger className="text-left text-[15px] font-medium text-primary hover:text-primary hover:no-underline py-5 transition-colors [&>svg]:!text-tertiary [&[data-state=open]>svg]:rotate-180 [&>svg]:transition-transform [&>svg]:duration-300 [&>svg]:ease-[var(--ease-suave)]">
                    {/* Wrap the question in a min-w-0 span so the flex
                        trigger (shadcn AccordionTrigger uses
                        flex justify-between) can wrap long questions
                        to a second line on mobile without pushing the
                        chevron off the right edge. */}
                    <span className="min-w-0 break-words">{item.q}</span>
                  </AccordionTrigger>
                  <AccordionContent className="medida text-secondary leading-relaxed text-[0.95rem] pb-5">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Inline CTA to the full FAQ page. */}
          <p
            data-entra="4"
            className="mt-5 text-center text-sm text-tertiary"
          >
            {es ? "¿Más dudas?" : "More questions?"}{" "}
            <a
              /* Con barra final. Sin ella, GitHub Pages responde 301 hacia
                 `/faq/` y el visitante paga un salto de más — son los
                 dos únicos enlaces del sitio que lo hacían, y salen de
                 la página que más importa vender. */
              href={asset(withLocale("/faq/", lang))}
              /* `-my-2 py-2` amplía la zona que se puede tocar sin
                 desplazar la línea: medía 20 px de alto y es la salida
                 hacia la FAQ desde la página que más importa vender. */
              className="group/link inline-flex items-center gap-1 -my-3 py-3 text-primary hover:text-[rgb(var(--accent-base))] hover:underline font-medium transition-colors duration-200"
            >
              <span>{es ? "Ver FAQ completa" : "See full FAQ"}</span>
              <span className="transition-transform duration-200 group-hover/link:translate-x-0.5" aria-hidden="true">→</span>
            </a>
          </p>
        </Reveal>

      </div>
    </section>
  );
}
