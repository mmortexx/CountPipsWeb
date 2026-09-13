"use client";

import { useLang } from "@/lib/i18n";
import { Link } from "@/components/tj/LocaleLink";
import { Reveal } from "@/components/tj/Reveal";
import { SectionHeader } from "@/components/layout/SectionHeader";

/**
 * Values — los cuatro principios del producto: local siempre, demo
 * honesta, disciplina por encima de métricas, y hecho por alguien que
 * opera. Retícula 2×2 de filetes —no de tarjetas— con su marca, su
 * afirmación, y el sitio donde el visitante puede ir a comprobarla.
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
  /** Small SVG mark per card — keeps the grid visually rhythmic. */
  icon: React.ReactNode;
}

const VALUES: Value[] = [
  {
    titleEs: "Local siempre",
    titleEn: "Local always",
    descEs:
      "Tus operaciones son tuyas. Viven en tu equipo y solo salen si activas una función que lo necesita; la analítica de esta web solo se activa con tu consentimiento.",
    descEn:
      "Your trading data is yours. It lives on your machine and only leaves if you turn on a feature that needs it; this site's analytics only activates with your consent.",
    href: "/features/seguridad",
    pruebaEs: "Qué se guarda y dónde",
    pruebaEn: "What is stored, and where",
    icon: <LockIcon />,
  },
  {
    titleEs: "Demo honesta, sin atajos",
    titleEn: "An honest demo, no shortcuts",
    descEs:
      "Datos de muestra, sin tarjeta ni instalación. El piloto privado valida el producto con usuarios reales antes de abrir la venta.",
    descEn:
      "Sample data, no card and no installation. The private pilot validates the product with real users before opening sales.",
    href: "/demo",
    pruebaEs: "Recorrer la demo entera",
    pruebaEn: "Walk the whole demo",
    icon: <CoinIcon />,
  },
  {
    titleEs: "Disciplina > métricas",
    titleEn: "Discipline > metrics",
    descEs:
      "Las métricas sin disciplina son ruido. El Guardián te avisa antes de romper tus reglas y, si lo activas, te frena.",
    descEn:
      "Metrics without discipline are noise. The Guardian warns you before you break your rules and, if you turn it on, brakes you.",
    href: "/features/disciplina",
    pruebaEs: "Cómo frena el Guardián",
    pruebaEn: "How the Guardian brakes",
    icon: <ShieldIcon />,
  },
  {
    titleEs: "Hecho por un trader, para traders",
    titleEn: "Made by a trader, for traders",
    descEs:
      "No es un SaaS de Silicon Valley. Es una app de escritorio hecha por alguien que opera.",
    descEn:
      "Not a Silicon Valley SaaS. A desktop app made by someone who trades.",
    href: "/about",
    pruebaEs: "Quién hay detrás",
    pruebaEn: "Who is behind it",
    icon: <CompassIcon />,
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
          etiqueta={es ? "Principios" : "Principles"}
          titulo={
            es ? (
              <>
                Lo que <span className="text-gradient">creemos.</span>
              </>
            ) : (
              <>
                What we <span className="text-gradient">believe.</span>
              </>
            )
          }
          entradilla={
            es
              ? "Cuatro ideas que no son negociables. Si algún día dejamos de cumplirlas, la app deja de tener sentido."
              : "Four ideas that aren't negotiable. If we ever stop delivering on them, the app stops making sense."
          }
        />

        <div className="mt-10 grid md:grid-cols-2 border-t border-[var(--line)]">
          {VALUES.map((v, i) => (
            <Reveal key={v.href} delay={0.1 + i * 0.08} className="h-full">
              <article
                className={`group relative h-full border-b border-[var(--line)] py-8 md:py-10 ${
                  i % 2 === 1 ? "md:border-l md:pl-12" : "md:pr-12"
                }`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-[var(--chip)] text-primary" aria-hidden="true">
                  {v.icon}
                </span>

                <h3 className="mt-6 t-h3 text-primary">
                  {es ? v.titleEs : v.titleEn}
                </h3>
                <p className="mt-2.5 text-[15px] text-secondary leading-[1.65] max-w-[42em]">
                  {es ? v.descEs : v.descEn}
                </p>

                <Link
                  href={v.href}
                  className="mt-2 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-primary outline-none transition-colors duration-200 hover:text-secondary focus-visible:rounded-[4px] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
                >
                  {es ? v.pruebaEs : v.pruebaEn}
                  <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
                </Link>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.4}>
          <div className="mt-10 flex items-center gap-3 text-sm text-tertiary justify-center text-center sm:justify-start sm:text-left">
            <span>
              {es
                ? "No son eslóganes. Son decisiones de producto."
                : "Not slogans. Product decisions."}
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="10.5" r="1" fill="currentColor" />
    </svg>
  );
}
function CoinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5.4" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 5v6M6.4 6.4h2.4a1.2 1.2 0 0 1 0 2.4H7.2m0 0h1.6a1.2 1.2 0 0 1 0 2.4H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1.5 3 3.5v3.2c0 3 2.2 5.6 5 6.8 2.8-1.2 5-3.8 5-6.8V3.5L8 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M5.8 8.2l1.6 1.6L10.4 6.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CompassIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5.4" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10.2 5.8 8.8 8.8 5.8 10.2 7.2 7.2l3-1.4Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}
