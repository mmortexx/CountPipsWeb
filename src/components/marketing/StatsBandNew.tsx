"use client";

import type { CSSProperties, ReactNode } from "react";
import { Link } from "@/components/tj/LocaleLink";
import { useLang } from "@/lib/i18n";
import { Reveal } from "@/components/tj/Reveal";
import { FECHA_PUBLICACION } from "@/lib/publicacion";
import { LOCALE_FECHA } from "@/lib/trading/format";

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
export function StatsBandNew({ herramientas }: { herramientas: number }) {
  const { lang } = useLang();
  const es = lang === "es";
  const stats = [
    { v: "40+", l: es ? "métricas institucionales calculadas con cada operación" : "institutional metrics computed with every trade" },
    { v: "0", l: es ? "servidores de CountPips con tus operaciones: viven en tu equipo" : "CountPips servers holding your trades: they live on your machine" },
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
       `HERRAMIENTAS` (lo pasa la página al construir), así que si mañana se añade o se quita una, la
       cifra cambia sola en vez de quedarse mintiendo. */
    {
      v: String(herramientas),
      l: es
        ? "herramientas gratis en la web — sin registro ni instalación"
        : "free tools on the site — no sign-up, no install",
    },
  ];
  /* FUENTE Y FECHA DE CORTE. Una cifra suelta se lee como reclamo; con su
     llamada y la fecha a la que vale, como dato. Es lo que hacen las
     gestoras (docs/analisis-referentes.md, recomendación 1). La fecha es
     la de la publicación, no la del reloj de quien mira. */
  const enlace = (href: string, texto: string) => (
    <Link href={href} className="link-underline-host text-secondary hover:text-primary">
      {texto}
    </Link>
  );
  const notas: ReactNode[] = es
    ? [
        <>Por operación y por periodo, en la versión en pruebas del programa.</>,
        <>Las operaciones se guardan en un archivo de tu disco; lo que sale a internet está listado en {enlace("/features/seguridad", "Seguridad")}.</>,
        <>Las calculadoras abiertas hoy en {enlace("/herramientas", "Herramientas")}; el test de disciplina no entra en la cuenta.</>,
      ]
    : [
        <>Per trade and per period, in the pre-release version of the application.</>,
        <>Trades are stored in a file on your disk; everything that goes online is listed under {enlace("/features/seguridad", "Security")}.</>,
        <>The calculators open today under {enlace("/herramientas", "Tools")}; the discipline test is not counted.</>,
      ];
  const corte = FECHA_PUBLICACION
    ? new Date(FECHA_PUBLICACION).toLocaleDateString(LOCALE_FECHA[es ? "es" : "en"], { year: "numeric", month: "long", timeZone: "UTC" })
    : "";

  return (
    <section className="section-tight relative">
      <div className="tj-container">
        {/* Filete ENCIMA de cada cifra y no entre ellas: se lee como el
            cuadro de un informe anual, no como tres tarjetas. */}
        {/* En móvil, cifra y texto en la misma fila: apiladas, las tres
            cifras eran casi una pantalla entera. */}
        <div className="grid grid-cols-1 gap-y-5 sm:grid-cols-3 sm:gap-x-8">
          {stats.map((s, i) => (
            <Reveal key={s.v} delay={i * 0.06} y={10} className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-x-4 border-t border-[var(--line-2)] pt-5 sm:flex sm:flex-col sm:items-stretch sm:pt-6">
              <div
                className="tnum text-primary"
                style={{
                  fontSize: "clamp(2.5rem, 4vw, 3.5rem)",
                  fontWeight: 500,
                  letterSpacing: "-0.035em",
                  lineHeight: 1,
                }}
              >
                <span
                  className="tj-cifra-cuenta"
                  style={{ "--hasta": parseInt(s.v, 10) || 0, "--sufijo": `"${s.v.replace(/^\d+/, "")}"` } as CSSProperties}
                >
                  <span className="tj-cifra-real">{s.v}</span>
                </span>
                <sup aria-hidden className="tj-llamada">{i + 1}</sup>
              </div>
              <div className="max-w-[22em] text-balance text-[15px] leading-snug text-secondary sm:mt-3">{s.l}</div>
            </Reveal>
          ))}
        </div>
        <div className="tj-notas-cifras">
          <ol>
            {notas.map((n, i) => (
              <li key={i}>
                <span aria-hidden className="tj-notas-num">{i + 1}</span>
                <span>{n}</span>
              </li>
            ))}
          </ol>
          {corte && <p>{es ? `Cifras a ${corte}.` : `Figures as of ${corte}.`}</p>}
        </div>
      </div>
    </section>
  );
}
