"use client";

import { ArrowRight, BriefcaseBusiness, UserRound } from "lucide-react";
import { Link } from "@/components/tj/LocaleLink";
import { useLang } from "@/lib/i18n";
import { trackEvent } from "@/lib/analytics";

/**
 * First decision on the landing page. Both profiles have the same visual
 * weight and lead to a purpose-built narrative; the page never guesses which
 * trader the visitor is.
 */
export function ProfileSelector() {
  const { lang } = useLang();
  const es = lang === "es";

  /* Los antetítulos van en caja normal y la MAYÚSCULA la pone el CSS
     (`uppercase` en el `<p>` que los pinta). Estaban escritos en
     mayúsculas literales — "OPERATIVA MANUAL", "PROP FIRMS" —, y eso
     cambia el texto real, no su aspecto: algunos lectores de pantalla
     deletrean letra a letra lo que viene todo en mayúsculas, así que se
     oía "O-P-E-R-A-T-I-V-A". El resto del sitio ya lo hacía bien (ver
     `.eyebrow` en globals.css); estas dos eran la excepción. En pantalla
     no cambia nada. */
  const profiles = [
    {
      id: "manual",
      href: "/traders/manual",
      icon: UserRound,
      eyebrow: es ? "Operativa manual" : "Manual trading",
      title: es ? "Para leer tu proceso con claridad" : "For reading your process clearly",
      body: es
        ? "Revisa contexto, ejecución y disciplina sin convertir cada sesión en una hoja de cálculo."
        : "Review context, execution and discipline without turning every session into a spreadsheet.",
      action: es ? "Explorar recorrido manual" : "Explore the manual path",
    },
    {
      id: "prop",
      href: "/traders/prop-firms",
      icon: BriefcaseBusiness,
      eyebrow: "Prop firms",
      title: es ? "Para operar con reglas que importan" : "For operating under rules that matter",
      body: es
        ? "Controla límites, consistencia y riesgo por cuenta cuando la evaluación no deja margen para improvisar."
        : "Control limits, consistency and risk by account when an evaluation leaves no room for improvisation.",
      action: es ? "Explorar recorrido prop" : "Explore the prop path",
    },
  ] as const;

  return (
    <section className="section-tight" aria-labelledby="profile-selector-title">
      <div className="tj-container">
        <div className="max-w-2xl">
          <p className="eyebrow">{es ? "Elige tu recorrido" : "Choose your path"}</p>
          <h2 id="profile-selector-title" className="t-h2 mt-4 text-primary text-balance">
            {es ? <>Dos formas de operar. <span className="text-gradient">Una lectura mejor.</span></> : <>Two ways to trade. <span className="text-gradient">One clearer read.</span></>}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-secondary md:text-lg">
            {es ? "Selecciona el contexto que más se parece al tuyo y adapta la demostración a las decisiones que realmente tomas." : "Select the context closest to yours and adapt the demonstration to the decisions you actually make."}
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-2">
          {profiles.map((profile, i) => {
            const Icon = profile.icon;
            return (
              <Link
                key={profile.id}
                href={profile.href}
                data-entra="ciclo"
                onClick={() => trackEvent("profile_selected", { profile: profile.id })}
                className={`group relative flex flex-col py-8 outline-none focus-visible:rounded-[4px] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.6)] ${
                  i === 0 ? "md:pr-12" : "border-t border-[var(--line)] md:border-t-0 md:border-l md:pl-12"
                }`}
              >
                <p className="flex items-center gap-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-tertiary">
                  <Icon size={16} strokeWidth={1.75} aria-hidden className="text-primary" />
                  {profile.eyebrow}
                </p>
                <h3 className="mt-5 text-[clamp(1.375rem,2vw,1.75rem)] leading-tight text-primary">{profile.title}</h3>
                <p className="mt-3 max-w-md text-[15px] leading-relaxed text-secondary">{profile.body}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-[15px] font-medium text-primary">
                  {profile.action}
                  <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
