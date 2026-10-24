"use client";

import type { ReactNode } from "react";
import { Link } from "@/components/tj/LocaleLink";
import { useLang, tx } from "@/lib/i18n";
import { Palabras } from "@/components/tj/Palabras";
import { PROGRAMA, METRICAS } from "@/lib/producto";

/**
 * Hero — sección `#top`. Titular centrado, dos llamadas y, debajo, lo que
 * la portada quiera enseñar primero (las cifras de la muestra); cierran las
 * plataformas cuyo CSV entra (compatibilidad comprobada, no integración).
 */
export function Hero({ producto }: { producto?: ReactNode }) {
  const { lang } = useLang();

  /* Las tres diferencias frente a otros diarios, juntas y en voz baja.
     «Previsto» porque la venta no está abierta. */
  const datos = tx(lang, {
    es: "Pago único previsto, sin suscripción. Sin servidores de CountPips: tus operaciones, en tu equipo. Demo sin registro.",
    en: "Planned one-time payment, no subscription. No CountPips servers: your trades, on your machine. Demo without sign-up.",
    pt: "Pagamento único previsto, sem assinatura. Sem servidores do CountPips: suas operações, na sua máquina. Demo sem cadastro.",
    fr: "Paiement unique prévu, sans abonnement. Aucun serveur CountPips : vos opérations, sur votre machine. Démo sans inscription.",
    de: "Geplante Einmalzahlung, kein Abo. Keine CountPips-Server: Ihre Trades bleiben auf Ihrem Rechner. Demo ohne Registrierung.",
    it: "Pagamento unico previsto, nessun abbonamento. Nessun server CountPips: le tue operazioni restano sul tuo computer. Demo senza registrazione.",
  });

  return (
    <section id="top" className="tj-hero relative">
      <div className="tj-container pt-[clamp(6.5rem,13vh,8.75rem)] text-center">
        <p className="eyebrow">
          {tx(lang, {
            es: "Diario de trading para Windows",
            en: "Trading journal for Windows",
            pt: "Diário de trading para Windows",
            fr: "Journal de trading pour Windows",
            de: "Trading-Journal für Windows",
            it: "Diario di trading per Windows",
          })}
        </p>

        <h1 className="t-display mx-auto mt-6 max-w-[15ch] text-balance text-primary">
          <Palabras
            lang={lang}
            texto={tx(lang, {
              es: "Opera como una mesa institucional.",
              en: "Trade like an institutional desk.",
              pt: "Opere como uma mesa institucional.",
              fr: "Tradez comme un desk institutionnel.",
              de: "Traden wie ein institutioneller Desk.",
              /* «Opera» y no «Fai trading»: con dos palabras más, a 390 px el
                 titular acababa en «istituzionale.» sola (`scripts/viudas.mjs`). */
              it: "Opera come un desk istituzionale.",
            })}
          />
        </h1>

        <p className="mx-auto mt-7 max-w-[40rem] t-lede text-secondary">
          {tx(lang, {
            es: `${METRICAS} métricas de riesgo y rendimiento, un guardián que te avisa antes de romper tus reglas, y tus datos se quedan en tu equipo.`,
            en: `${METRICAS} risk and performance metrics, a guardian that warns you before you break your rules, and your data on your machine.`,
            pt: `${METRICAS} métricas de risco e desempenho, um guardião que avisa antes de quebrar suas regras, e seus dados ficam na sua máquina.`,
            fr: `${METRICAS} métriques de risque et performance, un gardien qui vous alerte avant d’enfreindre vos règles, et vos données restent sur votre machine.`,
            de: `${METRICAS} Kennzahlen für Risiko und Performance, ein Disziplin-Wächter, der vor Regelverstößen warnt, und Ihre Daten auf Ihrem Rechner.`,
            it: `${METRICAS} metriche di rischio e rendimento, un guardiano che ti avvisa prima di infrangere le tue regole, e i tuoi dati restano sul tuo computer.`,
          })}
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
          <Link href="/demo" className="cta cta--primario">
            {tx(lang, {
              es: "Ver la demo interactiva",
              en: "See the interactive demo",
              pt: "Ver a demo interativa",
              fr: "Voir la démo interactive",
              de: "Interaktive Demo ansehen",
              it: "Guarda la demo interattiva",
            })}
          </Link>
          <Link href="/pricing" className="cta cta--secundario">
            {tx(lang, { es: "Ver precios", en: "See pricing", pt: "Ver preços", fr: "Voir les tarifs", de: "Preise ansehen", it: "Vedi i prezzi" })}
          </Link>
        </div>

        <p className="mx-auto mt-7 max-w-[40rem] text-balance text-[14px] leading-[1.6] text-tertiary">{datos}</p>
      </div>

      <div className="tj-container relative mt-[clamp(2.25rem,4vw,3rem)]">
        {producto}

        {/* En fila desde `lg`: a 820 px, rótulo y nombres no caben en una línea. */}
        <div className="flex flex-col items-center gap-4 py-[clamp(2.5rem,5vw,3.5rem)] text-center lg:flex-row lg:justify-between lg:text-left">
          <p className="m-0 text-[13px] text-tertiary">
            {tx(lang, {
              es: "Plantillas de importación CSV para",
              en: "CSV import templates for",
              pt: "Modelos de importação CSV para",
              fr: "Modèles d’import CSV pour",
              de: "CSV-Importvorlagen für",
              it: "Modelli di importazione CSV per",
            })}
          </p>
          {/* Con cinco nombres en dos columnas, el último ocupa las dos para
              centrarse de verdad. */}
          <ul className="m-0 grid grid-cols-2 gap-x-8 gap-y-2 p-0 text-[15px] font-semibold tracking-[-0.01em] text-secondary [&>li:last-child:nth-child(odd)]:col-span-2 sm:flex sm:flex-wrap sm:items-center sm:justify-center">
            {PROGRAMA.plantillasCsv.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
