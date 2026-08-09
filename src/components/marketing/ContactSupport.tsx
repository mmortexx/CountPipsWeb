"use client";

import { motion } from "framer-motion";
import type { ComponentType } from "react";
import { Mail, BookOpen, MessagesSquare, ArrowRight } from "lucide-react";

import { useLang } from "@/lib/i18n";
import { SUPPORT_EMAIL } from "@/lib/forms";
import { Eyebrow } from "@/components/tj/Eyebrow";
import { Reveal } from "@/components/tj/Reveal";

/**
 * ContactSupport — three contact-option cards shown right under the FAQ.
 *
 * Design:
 *  - Tres láminas de papel (`tj-paper` + filete) en `grid md:grid-cols-3`.
 *  - Cada una: chip de icono, título, descripción, meta opcional y una fila
 *    de llamada con la flecha que avanza al pasar el ratón.
 *  - SIN levantamiento al pasar por encima. Lo llevaba (`y: -4`) y se retiró:
 *    en este sistema la respuesta al puntero es que el filete se marque, no
 *    que el objeto se despegue de la página.
 *  - Un trazo de acento aparece en el canto superior al pasar el ratón.
 *  - Sólo acento acromático — el color queda reservado al resultado.
 */

type Card = {
  icon: ComponentType<{ className?: string }>;
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
  metaEs?: string;
  metaEn?: string;
  ctaEs: string;
  ctaEn: string;
  href: string;
};

const CARDS: Card[] = [
  {
    icon: Mail,
    titleEs: "Email",
    titleEn: "Email",
    // La dirección sale de `@/lib/forms` y NO se escribe aquí. Estaba
    // copiada a mano en este archivo, en la FAQ y en StillHaveQuestions,
    // mientras el formulario de contacto y la lista de espera sí usaban la
    // constante: media web centralizada y media duplicada. Es la misma
    // trampa que dejó la miniatura de redes apuntando al dominio viejo —
    // una cadena repetida no da error de compilación, sólo se queda atrás
    // el día que cambia.
    descEs: SUPPORT_EMAIL,
    descEn: SUPPORT_EMAIL,
    /* «Respuesta en 24h» era un compromiso de servicio sin nadie detrás
       que pueda cumplirlo hoy. Se sustituye por algo que sí es cierto y
       que además tranquiliza igual: quien escribe recibe respuesta de la
       persona que hace el producto, no de un centro de soporte. */
    metaEs: "Contesta quien lo desarrolla",
    metaEn: "Answered by the developer",
    ctaEs: "Escribir",
    ctaEn: "Write us",
    href: `mailto:${SUPPORT_EMAIL}`,
  },
  /* Aquí había dos tarjetas más, ambas con `href="#"`: un portal de
     documentación que no existe y una comunidad de Discord y Telegram que
     tampoco. Prometer «Guías y tutoriales» y «Unirme» para no llevar a
     ninguna parte es peor que no ofrecerlo.

     La de documentación se conserva porque el destino SÍ existe —la FAQ
     hace de documentación, y así lo declara ya el pie del sitio—, pero
     dice lo que hay y lleva donde hay que llevar. La de comunidad se va
     hasta que la comunidad exista. */
  {
    icon: BookOpen,
    titleEs: "Preguntas frecuentes",
    titleEn: "Frequently asked",
    descEs: "Acceso anticipado, datos, compatibilidad y privacidad",
    descEn: "Early access, data, compatibility and privacy",
    ctaEs: "Consultar",
    ctaEn: "Browse",
    href: "#faq",
  },
];

export function ContactSupport() {
  const { lang } = useLang();
  const es = lang === "es";

  return (
    <section
      id="support"
      aria-label={es ? "Soporte" : "Support"}
      // R27-1b — `bg-veil` added: this section's only backing was the
      // 3 % fractalNoise grain overlay (transparent in hue). The eye
      // WebGL (bright red/green fibers in light theme) was showing
      // through, washing out the "¿No encuentras tu respuesta?"
      // heading + subtitle + the 3 support card titles. `bg-veil`
      // (82 % bg in light / 74 % in dark) occludes the eye while
      // the grain overlay still paints on top. The cards themselves
      // (`tj-paper border border-[rgb(var(--divider)/0.13)]`) have their own opaque surface and
      // are unaffected.
      className="section-tight relative overflow-hidden bg-veil scroll-mt-24"
    >
      {/* Section grain — opt-in 3 % fractalNoise overlay. */}
      <div aria-hidden="true" className="grain absolute inset-0 pointer-events-none" />
      <div className="relative z-10 tj-container">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal>
            <div className="flex justify-center">
              <Eyebrow>{es ? "Soporte" : "Support"}</Eyebrow>
            </div>
          </Reveal>
          <Reveal delay={0.06}>
            <h2
              className="mt-5 t-h2 text-primary"
            >
              {es ? (
                <>
                  ¿No encuentras tu <span className="text-gradient">respuesta?</span>
                </>
              ) : (
                <>
                  Can&apos;t find your <span className="text-gradient">answer?</span>
                </>
              )}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-4 text-lg text-secondary leading-relaxed max-w-xl mx-auto">
              {es
                ? "Tres caminos para resolver cualquier duda. Te respondemos rápido y en tu idioma."
                : "Three ways to solve any question. We reply quickly and in your language."}
            </p>
          </Reveal>
        </div>

        {/* Dos columnas, no tres: se retiró la tarjeta de comunidad por
            apuntar a un Discord que no existe. Con `md:grid-cols-3` las
            dos que quedan se irían a la izquierda dejando un hueco. */}
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {CARDS.map((c, i) => {
            const Icon = c.icon;
            const title = es ? c.titleEs : c.titleEn;
            const desc = es ? c.descEs : c.descEn;
            const meta = es ? c.metaEs : c.metaEn;
            const cta = es ? c.ctaEs : c.ctaEn;
            return (
              <Reveal key={c.titleEn} delay={0.12 + i * 0.06} y={20}>
                <motion.a
                  href={c.href}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  aria-label={`${title} — ${cta}`}
                  className="group relative flex flex-col tj-paper rounded-[2px] border border-[rgb(var(--divider)/0.13)] p-5 sm:p-6 h-full overflow-hidden transition-[background-color,border-color,box-shadow,transform] duration-300 ease-[var(--ease-suave)] hover:border-[rgb(var(--accent-base)/0.30)]"
                >
                  {/* Hover accent sweep */}
                  <span
                    aria-hidden="true"
                    className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent 0%, rgb(var(--accent-base)) 50%, transparent 100%)",
                    }}
                  />

                  <div className="flex items-start gap-4">
                    {/* Icon container — accent-tinted on hover so the icon
                        "lights up" in the brand green when the card is
                        hovered. Base bg + border swapped from neutral
                        divider tints to low-alpha accent tints (6 % / 15 %)
                        so the icon reads as a branded mark at rest, not a
                        neutral chip — the brand color is present before
                        hover, then deepens to 12 % / 30 % on hover. */}
                    <span
                      className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[rgb(var(--accent-base)/0.06)] border border-[rgb(var(--accent-base)/0.15)] shadow-[inset_0_1px_0_rgb(var(--divider)/0.08)] text-primary group-hover:bg-[rgb(var(--accent-base)/0.12)] group-hover:border-[rgb(var(--accent-base)/0.30)] group-hover:text-[rgb(var(--accent-base))] group-hover:shadow-[inset_0_1px_0_rgb(var(--divider)/0.10)] transition-[background-color,border-color,box-shadow,color] duration-300"
                      aria-hidden="true"
                    >
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="t-h3 text-primary">
                        {title}
                      </h3>
                      <p className="mt-1 text-sm text-secondary break-words">
                        {desc}
                      </p>
                      {meta && (
                        <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-primary font-semibold tnum">
                          {meta}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto pt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                    {cta}
                    <ArrowRight className="size-4 transition-transform duration-300 ease-[var(--ease-suave)] group-hover:translate-x-1" />
                  </div>
                </motion.a>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
