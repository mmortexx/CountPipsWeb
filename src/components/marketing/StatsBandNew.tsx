"use client";

import { useLang } from "@/lib/i18n";
import { Reveal } from "@/components/tj/Reveal";
import { HERRAMIENTAS } from "@/lib/herramientas";

/**
 * StatsBandNew — la banda de credenciales de la home: tres cifras que
 * definen el producto (métricas calculadas · datos que no salen del
 * equipo · calculadoras abiertas).
 *
 * El encabezado de este fichero describía «4 columnas» y enumeraba
 * «30 días garantía / 149 $ pago único», dos datos que ya no existen:
 * la garantía se retiró porque no se ofrecen reembolsos, y el precio
 * nunca estuvo en esta banda. Un comentario que describe algo que el
 * código dejó de hacer engaña más que la falta de comentario, sobre
 * todo en un fichero donde lo que se documenta son CIFRAS.
 *
 * R24-1d — alineada con el vocabulario de tokens del sistema de
 * marketing (text-primary / text-tertiary en vez de los tokens
 * --ink / --ink-3 del "HTML de referencia" de Claude Design), con
 * utility classes del design system (.section-tight, .border-b,
 * .max-w-page) en vez de estilos inline hardcodeados, `tnum` en los
 * números grandes, una animación de entrada Reveal escalonada, y un
 * pequeño acento verde (accent dot) encima de cada estadística que
 * ancla visualmente la banda a la paleta de acento del resto de la
 * página (mismo patrón que los dots de reassurance pills en
 * PricingFAQ y los dots de value chip en ValueTestimonials).
 */
export function StatsBandNew() {
  const { lang } = useLang();
  const es = lang === "es";
  const stats = [
    { v: "40+", l: es ? "métricas institucionales calculadas en tiempo real" : "institutional metrics computed in real time" },
    { v: "0 bytes", l: es ? "enviados a la nube — todo vive en tu equipo" : "sent to the cloud — everything stays on your machine" },
    /* ── LA TERCERA CIFRA ERA UNA FLECHA ──────────────────────────────
       La cuarta estadística era «30 días de garantía» y se retiró bien:
       ya no se ofrecen reembolsos. Pero el hueco se tapó con el glifo
       «↗», renderizado al mismo tamaño que «40+» y «0 bytes», en fila
       con ellos y con la misma tipografía de cifra. Una flecha no es un
       dato, y puesta en el sitio de un dato el visitante la lee como si
       lo fuera durante medio segundo — que es justo el medio segundo
       que cuesta la credibilidad.

       Se sustituye por un número REAL y comprobable: las calculadoras
       abiertas que hay en la web, ahora mismo, sin registrarse. Sale de
       `HERRAMIENTAS`, así que si mañana se añade o se quita una, la
       cifra cambia sola en vez de quedarse mintiendo. */
    {
      v: String(HERRAMIENTAS.length),
      l: es
        ? "calculadoras abiertas — sin registro ni instalación"
        : "open calculators — no sign-up, no install",
    },
  ];
  return (
    <section
      // R27-1b — `bg-veil` added: this 4-column stats band had no
      // background — the eye WebGL (bright red/green fibers in light
      // theme) was showing through between the stats, washing out
      // the `text-[13.5px] text-tertiary` descriptions under each
      // big number. `bg-veil` (82 % bg in light / 74 % in dark)
      // occludes the eye; the `border-b` bottom hairline is
      // preserved for the section's lower edge.
      className="section-tight border-b border-[rgb(var(--divider)/0.10)] relative overflow-hidden bg-veil"
    >
      {/* T2c — `tj-container` hereda los gutters fluidos (clamp(1.25rem,
          4vw, 2.25rem)) definidos por T2a en globals.css, sustituyendo al
          `px-5 md:px-8` hardcodeado que dejaba 20 px fijos en móvil. La
          rejilla pasa a `gap-y-10` en móvil (era 8) para que las tres
          cifras apiladas respiren; el divider vertical sigue solo en sm+. */}
      <div className="tj-container">
        {/* Filete superior + divisores verticales. La banda eran tres
            cifras sueltas flotando en el aire, sin tarjeta ni estructura:
            se leía como el hueco entre dos secciones y no como el bloque
            de credenciales que es. Los divisores son bordes reales, así
            que desaparecen solos al apilarse en móvil. */}
        <div className="h-px w-full bg-[rgb(var(--divider)/0.12)]" aria-hidden="true" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-10 pt-10 sm:gap-y-0 sm:pt-10 sm:divide-x sm:divide-[rgb(var(--divider)/0.10)]">
          {stats.map((s, i) => (
            <Reveal key={s.v} delay={i * 0.08} y={14} className="flex flex-col sm:px-7 md:px-9 sm:first:pl-0 sm:last:pr-0">
              {/* Accent dot — small credential marker above the number,
                  ties the band to the accent palette used across the
                  rest of the pricing page (R24-1d). */}
              <span
                className="size-1.5 rounded-full bg-[rgb(var(--accent-base))] mb-3.5"
                aria-hidden="true"
              />
              <div
                className="font-serif tnum text-primary"
                style={{
                  fontSize: "clamp(2.4rem, 3.6vw, 3.4rem)",
                  fontWeight: 400,
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                {s.v}
              </div>
              <div className="mt-2.5 text-[13.5px] text-secondary leading-snug" style={{ maxWidth: "22em" }}>
                {s.l}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
