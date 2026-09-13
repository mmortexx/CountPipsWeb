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
    <section className="section-tight relative">
      <div className="tj-container">
        <div className="grid grid-cols-1 gap-y-10 border-y border-[var(--line)] py-10 sm:grid-cols-3 sm:gap-y-0 sm:divide-x sm:divide-[var(--line)] md:py-12">
          {stats.map((s, i) => (
            <Reveal key={s.v} delay={i * 0.06} y={10} className="flex flex-col sm:px-8 sm:first:pl-0 sm:last:pr-0">
              <div
                className="tnum text-primary"
                style={{
                  fontSize: "clamp(2.5rem, 4vw, 3.5rem)",
                  fontWeight: 500,
                  letterSpacing: "-0.035em",
                  lineHeight: 1,
                }}
              >
                {s.v}
              </div>
              <div className="mt-3 max-w-[22em] text-[15px] leading-snug text-secondary">{s.l}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
