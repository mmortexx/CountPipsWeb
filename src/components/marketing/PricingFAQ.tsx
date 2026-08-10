"use client";

import { motion, useReducedMotion } from "framer-motion";
import { PRICING_FAQ_ES, PRICING_FAQ_EN, type QA } from "@/lib/faq";
import { useLang } from "@/lib/i18n";
import { Eyebrow } from "@/components/tj/Eyebrow";
import { Reveal } from "@/components/tj/Reveal";
import { asset } from "@/lib/asset";
import { withLocale } from "@/lib/locale";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

/**
 * PricingFAQ — small, pricing-specific accordion (4 items) shown on the
 * Pricing page between Comparison and TrustStrip.
 *
 * Distinct from the main marketing FAQ.tsx:
 *  - Narrower scope: only questions a trader has before requesting beta access
 *    (what happens now, data, future pricing and invitation).
 *  - No search bar (the set is small enough that a search would feel heavy).
 *  - Centered institutional header above the accordion (eyebrow + headline
 *    + lead + 3 reassurance pills) — mirrors the Pricing header rhythm so
 *    the two sections read as one continuous conversion story.
 *  - Single `.tj-paper rounded-[2px] border border-[rgb(var(--divider)/0.13)]` container holds the
 *    accordion; each item tints with `rgb(var(--divider)/0.04)` when open
 *    and picks up a subtle accent border + glow so the active item reads as
 *    "lit".
 *
 * Institutional polish (R2-b):
 *  - `.tj-paper rounded-[2px] border border-[rgb(var(--divider)/0.13)]` container with `` elevation +
 *    `p-2 md:p-3` padding so each accordion item has breathing room.
 *  - Accordion headers `text-sm font-medium text-primary` + the shadcn
 *    chevron (rotates 180° on open via `[&[data-state=open]>svg]:rotate-180`).
 *  - Smooth open animation via Radix's built-in height transition.
 *  - `rgb(var(--divider)/0.04)` tint + `rgb(var(--accent-base)/0.30)` border +
 *    accent glow on the open item so the active question reads as lifted.
 *    Open state also gains a 3 px inset accent rail on the left edge so the
 *    "lit" item reads as a focused institutional FAQ row (R20-3c).
 *  - Centered header above the accordion — eyebrow + headline with
 *    `.text-gradient` highlight + lead + 3 reassurance pills.
 *  - Subtle radial accent glow + `.grain` texture layer over the
 *    section so it shares the premium printed surface with Pricing /
 *    FinalCTA.
 */

export function PricingFAQ() {
  const { lang } = useLang();
  const es = lang === "es";
  const reduce = useReducedMotion();

  /* Las cuatro preguntas viven en `src/lib/faq.ts`, compartidas con el
     dato estructurado de la pagina, para que no puedan divergir. */
  const items: QA[] = es ? PRICING_FAQ_ES : PRICING_FAQ_EN;

  /* Reassurance signals describe the current commercial path honestly. */
  const pills = [
    es ? "Demo sin registro" : "No-sign-up demo",
    es ? "Datos de muestra" : "Sample data",
    es ? "Acceso anticipado privado" : "Private early access",
  ];

  return (
    <section
      id="pricing-faq"
      aria-label={es ? "Preguntas frecuentes sobre precios" : "Pricing FAQ"}
      className="section-tight bg-veil relative overflow-hidden scroll-mt-24"
    >
      {/* Opt-in 3% fractalNoise grain — matches HeroVideo / Bento /
          Pricing so the FAQ reads as a continuation of the same premium
          printed surface. */}
      <div className="grain absolute inset-0 pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 tj-container">
        {/* Centered header — eyebrow + headline + lead + reassurance
            pills. Mirrors the Pricing section's header rhythm so the
            two sections read as one continuous conversion story. */}
        <Reveal className="text-center max-w-2xl mx-auto">
          <Eyebrow className="justify-center">
            {es ? "Antes de decidir" : "Before you decide"}
          </Eyebrow>
          <h2 className="mt-5 text-3xl md:text-4xl font-semibold tracking-tight text-primary text-balance">
            {es ? (
              <>
                Lo que casi todos <span className="text-gradient">quieren saber.</span>
              </>
            ) : (
              <>
                What almost everyone <span className="text-gradient">wants to know.</span>
              </>
            )}
          </h2>
          <p className="mt-4 text-base md:text-lg text-secondary leading-relaxed">
            {es
              ? "Cuatro respuestas rápidas sobre la demo, el alcance y el acceso anticipado. Si te queda alguna duda, escríbenos."
              : "Four quick answers about the demo, scope and early access. If anything is still unclear, email us."}
          </p>

          {/* Compact reassurance row — three pills summarizing the
              local-first, one-time payment and no-subscription promises.
              Centered so they read as a single horizontal credential
              strip directly under the lead. */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {pills.map((label, i) => (
              <motion.span
                key={label}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.5,
                  delay: 0.18 + i * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="pill !rounded-[2px] bg-[rgb(var(--divider)/0.05)] text-secondary border border-[rgb(var(--divider)/0.10)] tnum"
              >
                <span className="size-1.5 rounded-full bg-[rgb(var(--accent-base))]" aria-hidden="true" />
                {label}
              </motion.span>
            ))}
          </div>
        </Reveal>

        {/* Accordion — single tj-paper container holds all 5 items.
            `max-w-3xl` keeps the line-length comfortable for reading
            the answers; `mx-auto` centers it under the header. */}
        <Reveal delay={0.1} y={28}>
          <div className="mt-10 max-w-3xl mx-auto tj-paper rounded-[2px] border border-[rgb(var(--divider)/0.13)] p-2 md:p-3">
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
                  className="border-b border-l-2 border-l-transparent border-b-[rgb(var(--divider)/0.10)] last:border-b-0 px-4 md:px-5 transition-[border-color,background-color] duration-300 data-[state=closed]:hover:bg-[rgb(var(--divider)/0.03)] data-[state=open]:border-l-[rgb(var(--accent-base))] data-[state=open]:bg-[rgb(var(--divider)/0.04)]"
                >
                  <AccordionTrigger className="text-left text-sm font-medium text-primary hover:text-primary hover:no-underline py-5 transition-colors [&>svg]:!text-tertiary [&[data-state=open]>svg]:!text-[rgb(var(--accent-base))] [&[data-state=open]>svg]:rotate-180 [&>svg]:transition-transform [&>svg]:duration-300 [&>svg]:ease-[var(--ease-suave)] data-[state=open]:text-[rgb(var(--accent-base))]">
                    {/* Wrap the question in a min-w-0 span so the flex
                        trigger (shadcn AccordionTrigger uses
                        flex justify-between) can wrap long questions
                        to a second line on mobile without pushing the
                        chevron off the right edge. */}
                    <span className="min-w-0 break-words">{item.q}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-secondary leading-relaxed text-[0.95rem] pb-5">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Inline CTA to the full FAQ page. */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 text-center text-sm text-tertiary"
          >
            {es ? "¿Más dudas?" : "More questions?"}{" "}
            <a
              href={asset(withLocale("/faq", lang))}
              /* `-my-2 py-2` amplía la zona que se puede tocar sin
                 desplazar la línea: medía 20 px de alto y es la salida
                 hacia la FAQ desde la página que más importa vender. */
              className="group/link inline-flex items-center gap-1 -my-2 py-2 text-primary hover:text-[rgb(var(--accent-base))] hover:underline font-medium transition-colors duration-200"
            >
              <span>{es ? "Ver FAQ completa" : "See full FAQ"}</span>
              <span className="transition-transform duration-200 group-hover/link:translate-x-0.5" aria-hidden="true">→</span>
            </a>
          </motion.p>
        </Reveal>

        {/* Subtle accent line under the section — respects reduced motion. */}
        <motion.div
          aria-hidden="true"
          className="mt-12 h-px max-w-md mx-auto"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgb(var(--accent-base) / 0.4) 50%, transparent 100%)",
          }}
          initial={{ scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: reduce ? 0.6 : 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </section>
  );
}
