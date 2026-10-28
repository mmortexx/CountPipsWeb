"use client";

import { useLang, tx } from "@/lib/i18n";
import { SelloPrevisto } from "@/components/tj/SelloPrevisto";

export function ProductStatus() {
  const { lang } = useLang();
  const rows = [
    {
      estado: tx(lang, {
        es: "Disponible",
        en: "Available",
        pt: "Disponível",
        fr: "Disponible",
        de: "Verfügbar",
        it: "Disponibile",
      }),
      previsto: false,
      title: tx(lang, {
        es: "Listo para probar",
        en: "Ready to test",
        pt: "Pronto para testar",
        fr: "Prêt à tester",
        de: "Bereit zum Testen",
        it: "Pronto da provare",
      }),
      text: tx(lang, {
        es: "Demo navegable, métricas y diario local.",
        en: "Clickable demo, metrics and local journal.",
        pt: "Demo navegável, métricas e diário local.",
        fr: "Démo interactive, métriques et journal local.",
        de: "Klickbare Demo, Kennzahlen und lokales Journal.",
        it: "Demo interattiva, metriche e diario locale.",
      }),
    },
    {
      estado: tx(lang, {
        es: "Por invitación",
        en: "By invitation",
        pt: "Por convite",
        fr: "Sur invitation",
        de: "Auf Einladung",
        it: "Su invito",
      }),
      previsto: false,
      title: tx(lang, {
        es: "Piloto privado",
        en: "Private pilot",
        pt: "Piloto privado",
        fr: "Pilote privé",
        de: "Privates Pilotprojekt",
        it: "Progetto pilota privato",
      }),
      text: tx(lang, {
        es: "Flujos de disciplina, riesgo y prop firm con usuarios invitados.",
        en: "Discipline, risk and prop-firm workflows with invited users.",
        pt: "Fluxos de disciplina, risco e prop firm com usuários convidados.",
        fr: "Flux de discipline, risque et prop firm avec des utilisateurs invités.",
        de: "Disziplin-, Risiko- und Prop-Firm-Workflows mit eingeladenen Nutzern.",
        it: "Flussi di disciplina, rischio e prop firm con utenti invitati.",
      }),
    },
    {
      estado: "",
      previsto: true,
      title: tx(lang, {
        es: "Apertura comercial",
        en: "Commercial launch",
        pt: "Abertura comercial",
        fr: "Lancement commercial",
        de: "Kommerzieller Start",
        it: "Lancio commerciale",
      }),
      text: tx(lang, {
        es: "Entrega, licencia, soporte y precios definitivos.",
        en: "Delivery, licensing, support and final pricing.",
        pt: "Entrega, licença, suporte e preços definitivos.",
        fr: "Livraison, licence, support et tarifs définitifs.",
        de: "Bereitstellung, Lizenzierung, Support und endgültige Preise.",
        it: "Distribuzione, licenza, supporto e prezzi definitivi.",
      }),
    },
  ];
  return (
    <section className="section">
      <div className="tj-container">
        <div className="tj-split grid gap-8 lg:items-end">
          <div className="min-w-0">
            <h2 className="t-h2 text-primary">
              {tx(lang, {
                es: (
                  <>
                    Lo que está listo.{" "}
                    {/* Bloque que no se parte mientras quepa: evita la viuda «comprobando.» (`scripts/viudas.mjs`) sin salirse a 320 px. */}
                    <span className="tj-frase-nueva">Y lo que aún <span className="inline-block">estamos comprobando.</span></span>
                  </>
                ),
                en: (
                  <>
                    What is ready.{" "}
                    <span className="tj-frase-nueva">And what we are still validating.</span>
                  </>
                ),
                pt: (
                  <>
                    O que está pronto.{" "}
                    <span className="tj-frase-nueva">E o que ainda estamos{"\u00a0"}validando.</span>
                  </>
                ),
                fr: (
                  <>
                    Ce qui est prêt.{" "}
                    <span className="tj-frase-nueva">Et ce que nous validons{"\u00a0"}encore.</span>
                  </>
                ),
                de: (
                  <>
                    Was bereit ist.{" "}
                    <span className="tj-frase-nueva">Und was wir noch{"\u00a0"}prüfen.</span>
                  </>
                ),
                it: (
                  <>
                    Cosa è pronto.{" "}
                    <span className="tj-frase-nueva">E cosa stiamo ancora{"\u00a0"}verificando.</span>
                  </>
                ),
              })}
            </h2>
          </div>
          <div data-orden className="grid gap-3 sm:grid-cols-3">
            {rows.map(({ estado, previsto, title, text }) => (
              <div key={title} className="border-t border-[var(--line-2)] pt-4">
                {previsto ? (
                  <SelloPrevisto />
                ) : (
                  <span className="rotulo-estado">{estado}</span>
                )}
                <h3 className="mt-3 t-h5 text-primary">{title}</h3>
                <p className="mt-2 text-sm leading-[1.6] text-secondary">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Alias para los imports internos que aún usan el nombre anterior. */
export const BetaStatus = ProductStatus;
