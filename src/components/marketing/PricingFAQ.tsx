"use client";

import { pricingFaq } from "@/lib/faq";
import { useLang, tx } from "@/lib/i18n";
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

/** Las cuatro dudas de compra, en /pricing, entre la comparativa y el estado del producto. */

export function PricingFAQ() {
  const { lang } = useLang();

  /* Las preguntas viven en `src/lib/faq.ts`, compartidas con el dato
     estructurado de la página para que no diverjan. */
  const items = pricingFaq(lang);

  return (
    <section
      id="pricing-faq"
      aria-label={tx(lang, {
        es: "Preguntas frecuentes sobre precios",
        en: "Pricing FAQ",
        pt: "Perguntas frequentes sobre preços",
        fr: "Foire aux questions sur les tarifs",
        de: "Häufige Fragen zu Preisen",
        it: "Domande frequenti sui prezzi",
      })}
      className="section-tight relative overflow-clip scroll-mt-24"
    >

      {/* Titular a la izquierda y respuestas en la segunda columna, en la línea
          del resto de la página. */}
      <div className="relative z-10 tj-container tj-split grid gap-y-8 lg:items-start">
        <SectionHeader
          titulo={tx(lang, {
            es: <>Lo que casi todos quieren saber.</>,
            en: <>What almost everyone wants to know.</>,
            pt: <>O que quase todos querem saber.</>,
            fr: <>Ce que presque tout le monde veut savoir.</>,
            de: <>Was fast jeder wissen möchte.</>,
            it: <>Cosa quasi tutti vogliono sapere.</>,
          })}
          entradilla={tx(lang, {
            es: "Cuatro respuestas rápidas sobre la demo, el alcance y el acceso anticipado.",
            en: "Four quick answers about the demo, scope and early access.",
            pt: "Quatro respostas rápidas sobre a demo, o escopo e o acesso antecipado.",
            fr: "Quatre réponses rapides sur la démo, la portée et l’accès anticipé.",
            de: "Vier schnelle Antworten zur Demo, zum Umfang und zum Vorabzugang.",
            it: "Quattro risposte rapide su demo, ambito e accesso anticipato.",
          })}
        />

        <Reveal delay={0.1} y={28}>
          <div className="border-t border-[var(--line)]">
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
                  className="border-b border-[var(--line)]"
                >
                  <AccordionTrigger className="text-left text-primary hover:text-primary hover:no-underline py-5 transition-colors [&>svg]:!text-tertiary hover:[&>svg]:!text-primary [&[data-state=open]>svg]:rotate-180 [&>svg]:transition-[transform,color] [&>svg]:duration-(--dur-abre)">
                    {/* `min-w-0` para que preguntas largas se partan en móvil sin
                        empujar el chevrón. */}
                    <span className="min-w-0 break-words">{item.q}</span>
                  </AccordionTrigger>
                  <AccordionContent className="medida text-secondary text-[15px] leading-[1.7] pb-5">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <p
            data-entra="4"
            className="mt-5 text-sm text-tertiary"
          >
            {tx(lang, {
              es: "¿Más dudas?",
              en: "More questions?",
              pt: "Mais dúvidas?",
              fr: "D’autres questions\u00a0?",
              de: "Weitere Fragen?",
              it: "Altre domande?",
            })}{" "}
            <a
              /* Con barra final: sin ella GitHub Pages responde 301 hacia `/faq/`. */
              href={asset(withLocale("/faq/", lang))}
              /* `-my-3 py-3` amplía la zona táctil sin desplazar la línea. */
              className="link-underline-host inline-flex -my-3 py-3 text-primary font-medium"
            >
              <span className="link-underline">
                {tx(lang, {
                  es: "Ver FAQ completa",
                  en: "See full FAQ",
                  pt: "Ver FAQ completa",
                  fr: "Voir toute la FAQ",
                  de: "Vollständige FAQ ansehen",
                  it: "Vedi tutta la FAQ",
                })}
              </span>
            </a>
          </p>
        </Reveal>

      </div>
    </section>
  );
}
