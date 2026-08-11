"use client";

import { ArrowRight, BarChart3, BookOpenCheck, ShieldCheck, Target } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Link } from "@/components/tj/LocaleLink";
import { FinalCTANew } from "@/components/marketing/FinalCTANew";
import { useLang } from "@/lib/i18n";

export type TraderProfile = "manual" | "prop";

const DATA = {
  manual: {
    eyebrowEs: "Para traders manuales",
    eyebrowEn: "For manual traders",
    titleEs: "Tu criterio merece una pista de datos.",
    titleEn: "Your judgement deserves a data trail.",
    highlightEs: "una pista de datos.",
    highlightEn: "a data trail.",
    subtitleEs: "Registra la operación, revisa la ejecución y descubre qué setups, horarios y decisiones sostienen de verdad tu ventaja.",
    subtitleEn: "Log the trade, review the execution and discover which setups, sessions and decisions actually support your edge.",
    cards: [
      { icon: BarChart3, titleEs: "Métricas que explican", titleEn: "Metrics that explain", textEs: "Expectancy, profit factor, drawdown y distribución de R en el mismo lugar que tus operaciones.", textEn: "Expectancy, profit factor, drawdown and R distribution next to the trades that produced them." },
      { icon: BookOpenCheck, titleEs: "Playbooks vivos", titleEn: "Living playbooks", textEs: "Compara setups con una muestra real y deja de confundir una buena racha con un edge.", textEn: "Compare setups against a real sample and stop confusing a good run with an edge." },
      { icon: Target, titleEs: "Revisión sin excusas", titleEn: "No-excuse review", textEs: "Anota el plan, la gestión y el cierre para ver dónde se rompe tu proceso.", textEn: "Capture plan, management and exit so you can see where your process breaks." },
    ],
    ctaEs: "Ver la demo para operativa manual",
    ctaEn: "See the manual-trading demo",
  },
  prop: {
    eyebrowEs: "Para prop firms",
    eyebrowEn: "For prop firms",
    titleEs: "Opera con tus reglas delante.",
    titleEn: "Trade with your rules in view.",
    highlightEs: "tus reglas delante.",
    highlightEn: "your rules in view.",
    subtitleEs: "La demo enseña un flujo para traders que operan con límites de pérdida, evaluaciones y una disciplina que no admite improvisación.",
    subtitleEn: "The demo shows a workflow for traders working with loss limits, evaluations and discipline that leaves no room for improvisation.",
    cards: [
      { icon: ShieldCheck, titleEs: "Riesgo que se ve", titleEn: "Visible risk", textEs: "Revisa drawdown, rachas y exposición antes de que una operación te saque del plan.", textEn: "Review drawdown, streaks and exposure before one trade takes you outside the plan." },
      { icon: BarChart3, titleEs: "Track record limpio", titleEn: "Clean track record", textEs: "Separa el resultado de una sesión de la calidad de las decisiones que la construyeron.", textEn: "Separate a session's result from the quality of the decisions that built it." },
      /* «cohorte» era además una palabra que ningún trader de prop firm
         usa para hablar de lo suyo: lo que prepara es la siguiente
         EVALUACIÓN, que es lo que dice —y siempre dijo— la versión
         inglesa de esta misma tarjeta. */
      { icon: Target, titleEs: "Reglas verificables", titleEn: "Verifiable rules", textEs: "Usa el diario para detectar incumplimientos recurrentes y preparar la siguiente evaluación.", textEn: "Use the journal to spot recurring breaches and prepare for the next evaluation." },
    ],
    ctaEs: "Ver la demo para prop firms",
    ctaEn: "See the prop-firm demo",
  },
} as const;

export function TraderProfileBody({ profile }: { profile: TraderProfile }) {
  const { lang } = useLang();
  const es = lang === "es";
  const data = DATA[profile];
  return (
    <>
      <PageHeader
        eyebrowEs={data.eyebrowEs}
        eyebrowEn={data.eyebrowEn}
        titleEs={data.titleEs}
        titleEn={data.titleEn}
        titleHighlightEs={data.highlightEs}
        titleHighlightEn={data.highlightEn}
        subtitleEs={data.subtitleEs}
        subtitleEn={data.subtitleEn}
        breadcrumbEs={profile === "manual" ? "Operativa manual" : "Prop firms"}
        breadcrumbEn={profile === "manual" ? "Manual trading" : "Prop firms"}
      />

      <section className="section bg-veil">
        <div className="tj-container">
          <SectionHeader
            composicion="partida"
            etiqueta={es ? "Un flujo pensado para tu contexto" : "A workflow shaped for your context"}
            titulo={es ? "La pregunta no es cuánto ganaste." : "The question is not how much you made."}
            entradilla={es ? "Es qué parte de tu proceso merece repetirse, y qué parte necesita una regla antes de volver al mercado." : "It is which part of your process deserves repeating, and which part needs a rule before you return to the market."}
          />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {data.cards.map(({ icon: Icon, titleEs, titleEn, textEs, textEn }) => (
              <article key={titleEs} className="tj-paper border border-[rgb(var(--divider)/0.14)] p-5 sm:p-6">
                <Icon size={18} className="text-[rgb(var(--accent-base))]" aria-hidden />
                <h2 className="mt-5 text-lg font-semibold text-primary">{es ? titleEs : titleEn}</h2>
                <p className="mt-3 text-sm leading-relaxed text-secondary">{es ? textEs : textEn}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="tj-container">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="eyebrow">{es ? "Prueba antes de entrar" : "See it before you join"}</p>
              <h2 className="mt-5 t-h2 text-primary">{es ? "Explora la app con datos de muestra." : "Explore the app with sample data."}</h2>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-secondary">
                {es ? "La demo es navegable y no pide registro. Recorre el flujo que más se parece a tu día y decide si merece la pena solicitar acceso." : "The demo is clickable and asks for no sign-up. Follow the workflow closest to your day and decide whether it is worth requesting access."}
              </p>
              <Link href="/demo" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-[2px] border border-[rgb(var(--divider)/0.2)] px-5 text-sm font-semibold text-primary hover:bg-[rgb(var(--divider)/0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]">
                {es ? "Abrir la demo" : "Open the demo"}<ArrowRight size={15} aria-hidden />
              </Link>
            </div>
            <div className="border-l border-[rgb(var(--accent-base)/0.35)] pl-6 sm:pl-8">
              <p className="text-sm uppercase tracking-[0.16em] text-tertiary">{es ? "Criterio de acceso" : "Access principle"}</p>
              <p className="mt-4 font-serif text-2xl leading-tight text-primary">{es ? "No buscamos espectadores. Buscamos traders que quieran medir una decisión concreta." : "We are not looking for spectators. We are looking for traders willing to measure one concrete decision."}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-veil">
        <div className="tj-container">
          <div className="tj-paper border border-[rgb(var(--divider)/0.14)] p-6 sm:p-8">
            <p className="eyebrow">{es ? "Siguiente paso" : "Next step"}</p>
            <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="t-h3 text-primary">{es ? "Solicita acceso al piloto privado." : "Request access to the private pilot."}</h2>
                <p className="mt-3 max-w-2xl text-secondary">{es ? "Acceso por revisión de perfil, sin compromiso de compra y con la demo disponible antes de solicitarlo." : "Access reviewed by profile, no purchase commitment, with the demo available before you request it."}</p>
              </div>
              <Link href="/beta" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-[2px] bg-[rgb(var(--accent-base))] px-5 text-sm font-semibold text-[rgb(var(--accent-ink))] hover:bg-[rgb(var(--accent-hover))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]">{es ? data.ctaEs : data.ctaEn}<ArrowRight size={15} aria-hidden /></Link>
            </div>
          </div>
        </div>
      </section>
      <FinalCTANew />
    </>
  );
}
