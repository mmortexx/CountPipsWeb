"use client";

import { useLang } from "@/lib/i18n";
import { Link } from "@/components/tj/LocaleLink";
import { Reveal } from "@/components/tj/Reveal";
import { SectionHeader } from "@/components/layout/SectionHeader";

/**
 * Los cuatro principios del producto en una retícula 2×2 de filetes: cada uno
 * con su afirmación y el sitio donde el visitante puede comprobarla.
 */

interface Value {
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
  /** Dónde se puede ir a comprobar este principio. */
  href: string;
  pruebaEs: string;
  pruebaEn: string;
}

const VALUES: Value[] = [
  {
    titleEs: "Local siempre",
    titleEn: "Local always",
    descEs:
      "Tus operaciones son tuyas. Viven en tu equipo y solo salen si activas una función que lo necesita; la analítica de esta web solo se activa con tu consentimiento.",
    descEn:
      "Your trading data is yours. It lives on your machine and only leaves if you turn on a feature that needs it; this site’s analytics only activates with your consent.",
    href: "/features/seguridad",
    pruebaEs: "Qué se guarda y dónde",
    pruebaEn: "What is stored, and where",
  },
  {
    titleEs: "Demo honesta, sin atajos",
    titleEn: "An honest demo, no shortcuts",
    descEs:
      "Datos de muestra, sin tarjeta ni instalación. El piloto privado valida el producto con usuarios reales antes de abrir la venta.",
    descEn:
      "Sample data, no card and no installation. The private pilot validates the product with real users before sales open.",
    href: "/demo",
    pruebaEs: "Recorrer la demo entera",
    pruebaEn: "Walk the whole demo",
  },
  {
    titleEs: "Disciplina antes que métricas",
    titleEn: "Discipline before metrics",
    descEs:
      "Las métricas sin disciplina son ruido. El Guardián te avisa antes de romper tus reglas y, si lo activas, te frena.",
    descEn:
      "Metrics without discipline are noise. The Guardian warns you before you break your rules and, if you turn it on, stops you.",
    href: "/features/disciplina",
    pruebaEs: "Cómo frena el Guardián",
    pruebaEn: "How the brake works",
  },
  {
    /* Un principio tiene que poder comprobarse: este se comprueba en la ficha técnica. */
    titleEs: "Hecha para tenerla abierta mientras operas",
    titleEn: "Built to stay open while you trade",
    descEs:
      "Una app de escritorio que arranca en menos de un segundo, funciona sin conexión y no te pide cuenta.",
    descEn:
      "A desktop app that starts in under a second, works offline and asks for no account.",
    href: "/features/seguridad#ficha-tecnica",
    pruebaEs: "Ver la ficha técnica",
    pruebaEn: "See the spec sheet",
  },
];

export function Values() {
  const { lang } = useLang();
  const es = lang === "es";

  return (
    <section id="values" className="section relative overflow-clip scroll-mt-24">

      <div className="relative z-10 tj-container">
        <SectionHeader
          composicion="partida"
          titulo={
            es ? (
              <>
                Lo que creemos.
              </>
            ) : (
              <>
                What we believe.
              </>
            )
          }
          entradilla={
            es
              ? "Cuatro ideas que no son negociables. Si algún día dejamos de cumplirlas, la app deja de tener sentido."
              : "Four ideas that aren’t negotiable. If we ever stop delivering on them, the app stops making sense."
          }
        />

        <div className="mt-10 grid md:grid-cols-2 border-t border-[var(--line)]">
          {VALUES.map((v, i) => (
            <Reveal key={v.href} delay={0.1 + i * 0.08} className="h-full">
              <article
                className={`group relative flex h-full flex-col border-b border-[var(--line)] py-6 md:py-10 ${
                  i % 2 === 1 ? "md:border-l md:pl-12" : "md:pr-12"
                }`}
              >
                <h3 className="t-h3 text-primary">
                  {es ? v.titleEs : v.titleEn}
                </h3>
                <p className="mt-2.5 text-[15px] text-secondary leading-[1.7] max-w-[42em]">
                  {es ? v.descEs : v.descEn}
                </p>

                {/* `mt-auto`: los enlaces de una fila quedan a la misma altura aunque
                    los cuerpos midan dos o tres líneas. */}
                <Link
                  href={v.href}
                  className="link-underline-host mt-auto pt-2 inline-flex min-h-[44px] items-center text-sm font-medium text-primary outline-none focus-visible:rounded-[4px] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
                >
                  <span className="link-underline">{es ? v.pruebaEs : v.pruebaEn}</span>
                </Link>
              </article>
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  );
}
