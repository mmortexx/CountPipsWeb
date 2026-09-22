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
      title: es ? "Para leer tu proceso con claridad" : "To read your process clearly",
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
      /* «For operating under rules» era calco doble. En inglés de
         mercados el verbo es «trade», no «operate» —«operating» se lee
         como «funcionar»—, y además rompía el paralelismo con la tarjeta
         hermana de aquí arriba, que dice «To read your process clearly».
         Las dos son ahora «To + verbo», que es como se leen juntas. */
      title: es ? "Para operar con reglas que importan" : "To trade under rules that matter",
      body: es
        ? "Controla límites, consistencia y riesgo por cuenta cuando la evaluación no deja margen para improvisar."
        : "Control limits, consistency and risk per account when an evaluation leaves no room for improvisation.",
      action: es ? "Explorar recorrido prop" : "Explore the prop path",
    },
  ] as const;

  return (
    <section className="section-tight" aria-labelledby="profile-selector-title">
      {/* En escritorio, cabecera a la izquierda y los dos recorridos
          apilados a la derecha: con la cabecera encima, media anchura se
          quedaba en blanco y la sección pedía dos pantallas de scroll. */}
      <div className="tj-container lg:grid lg:grid-cols-2 lg:items-center lg:gap-x-16 xl:gap-x-24">
        <div className="max-w-2xl">
          <p className="eyebrow">{es ? "Elige tu recorrido" : "Choose your path"}</p>
          <h2 id="profile-selector-title" className="t-h2 mt-4 text-primary text-balance">
            {es ? <>Dos formas de operar. <span className="text-gradient tj-frase-nueva">Una lectura mejor.</span></> : <>Two ways to trade. <span className="text-gradient tj-frase-nueva">One clearer read.</span></>}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-secondary md:text-lg">
            {/* Decía «adapta la demostración», y ninguno de los dos
                recorridos toca la demo: son páginas propias. Se promete
                lo que hay al otro lado del enlace. */}
            {es
              ? "Elige el contexto que más se parece al tuyo y mira qué mide la app en él: tu proceso si operas por tu cuenta, o las reglas de la firma si te evalúan."
              : "Pick the context closest to yours and see what the app measures there: your process if you trade on your own, or the firm's rules if you're being evaluated."}
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-2 lg:mt-0 lg:grid-cols-1 lg:border-b lg:border-[var(--line)]">
          {profiles.map((profile, i) => {
            const Icon = profile.icon;
            return (
              <Link
                key={profile.id}
                href={profile.href}
                data-entra="ciclo"
                onClick={() => trackEvent("profile_selected", { profile: profile.id })}
                className={`group relative flex flex-col py-8 outline-none focus-visible:rounded-[4px] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.6)] ${
                  i === 0
                    ? "md:pr-12 lg:pr-0 lg:border-t lg:border-[var(--line)]"
                    : "border-t border-[var(--line)] md:border-t-0 md:border-l md:pl-12 lg:border-l-0 lg:border-t lg:pl-0"
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
