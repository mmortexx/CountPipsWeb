"use client";

import type { ReactNode } from "react";
import { Link } from "@/components/tj/LocaleLink";
import { useLang, tx } from "@/lib/i18n";
import { trackEvent } from "@/lib/analytics";

/**
 * Primera decisión de la portada. Los dos perfiles pesan lo mismo y llevan a
 * un recorrido propio; la página no adivina qué trader es el visitante.
 */
export function ProfileSelector() {
  const { lang } = useLang();

  /* Antetítulos en caja normal, nunca en mayúsculas literales: algunos lectores
     las deletrean letra a letra. */
  const profiles = [
    {
      id: "manual",
      href: "/traders/manual",
      eyebrow: tx(lang, { es: "Operativa manual", en: "Manual trading" }),
      title: tx(lang, { es: "Para leer tu proceso con claridad", en: "To read your process clearly" }),
      body: tx(lang, {
        es: "Revisa contexto, ejecución y disciplina sin convertir cada sesión en una hoja de cálculo.",
        en: "Review context, execution and discipline without turning every session into a spreadsheet.",
      }),
      action: tx(lang, { es: "Explorar recorrido manual", en: "Explore the manual path" }),
    },
    {
      id: "prop",
      href: "/traders/prop-firms",
      eyebrow: "Prop firms",
      /* En inglés de mercados el verbo es «trade», no «operate»; y «To + verbo»
         mantiene el paralelismo con la tarjeta hermana. */
      title: tx(lang, { es: "Para operar con reglas que importan", en: "To trade under rules that matter" }),
      body: tx(lang, {
        es: "Controla límites, consistencia y riesgo por cuenta cuando la evaluación no deja margen para improvisar.",
        en: "Control limits, consistency and risk per account when an evaluation leaves no room for improvisation.",
      }),
      action: tx(lang, { es: "Explorar recorrido prop", en: "Explore the prop path" }),
    },
  ] as const;

  return (
    <section className="section-tight" aria-labelledby="profile-selector-title">
      {/* Cabecera partida y, debajo, los dos recorridos lado a lado: apilados a
          la derecha dejaban media columna vacía bajo el titular. */}
      <div className="tj-container">
        <div className="tj-split grid gap-y-6 lg:items-end">
          <h2 id="profile-selector-title" className="t-h2 text-primary text-balance">
            {tx<ReactNode>(lang, {
              es: (
                <>
                  Dos formas de operar. <span className="tj-frase-nueva">Una lectura mejor.</span>
                </>
              ),
              en: (
                <>
                  Two ways to trade. <span className="tj-frase-nueva">One clearer read.</span>
                </>
              ),
            })}
          </h2>
          <p className="medida t-entradilla text-secondary lg:pb-1">
            {/* Promete lo que hay tras el enlace: los recorridos son páginas
                propias, no tocan la demo. */}
            {tx(lang, {
              es: "Elige el contexto que más se parece al tuyo y mira qué mide la app en él: tu proceso si operas por tu cuenta, o las reglas de la firma si te evalúan.",
              en: "Pick the context closest to yours and see what the app measures there: your process if you trade on your own, or the firm’s rules if you’re being evaluated.",
            })}
          </p>
        </div>

        <div className="mt-10 grid border-[var(--line)] md:grid-cols-2 md:border-y">
          {profiles.map((profile, i) => {
            return (
              <Link
                key={profile.id}
                href={profile.href}
                data-entra="ciclo"
                onClick={() => trackEvent("profile_selected", { profile: profile.id })}
                className={`group relative flex flex-col py-8 outline-none focus-visible:rounded-[4px] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.6)] ${
                  i === 0
                    ? "md:pr-12"
                    : "border-t border-[var(--line)] md:border-t-0 md:border-l md:pl-12"
                }`}
              >
                <p className="eyebrow">
                  {profile.eyebrow}
                </p>
                <h3 className="mt-5 t-h3 text-primary">{profile.title}</h3>
                <p className="mt-3 max-w-md text-[15px] leading-[1.7] text-secondary">{profile.body}</p>
                <span className="mt-6 inline-flex text-[15px] font-medium text-primary">
                  <span className="link-underline">{profile.action}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
