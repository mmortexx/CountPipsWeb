"use client";

import { Link } from "@/components/tj/LocaleLink";
import { useLang, tx, type Lang } from "@/lib/i18n";
import { Eyebrow } from "@/components/tj/Eyebrow";
import { Reveal } from "@/components/tj/Reveal";
import { MagneticButton } from "@/components/tj/MagneticButton";
import { SelloPrevisto } from "@/components/tj/SelloPrevisto";
import { PRECIO_CORE, PRECIO_PRO, FECHA_TIPO_EUR, aproxEur } from "@/lib/precios";
import { fmtInt, LOCALE_FECHA } from "@/lib/trading/format";

type Plan = {
  id: "core" | "pro";
  name: string;
  price: number;
  popular?: boolean;
  /** Frase de posicionamiento bajo el nombre del plan. */
  tagline: string;
  features: string[];
  cta: string;
};

/**
 * @param standalone En /pricing el `PageHeader` ya titula: se oculta el
 * encabezado interno para no repetirlo.
 */
export function Pricing({ standalone = false }: { standalone?: boolean } = {}) {
  const { t, lang } = useLang();

  /* Los mismos niveles que `LicenseGate` y `PLAN.md` §10 del programa. */
  const coreFeatures = [
    tx(lang, { es: "Diario, 40+ métricas y calendario", en: "Journal, 40+ metrics and calendar", pt: "Diário, 40+ métricas e calendário", fr: "Journal, 40+ métriques et calendrier", de: "Journal, 40+ Kennzahlen und Kalender" }),
    tx(lang, { es: "Curva de capital y drawdown", en: "Equity curve and drawdown", pt: "Curva de capital e drawdown", fr: "Courbe de capital et drawdown", de: "Equity-Kurve und Drawdown" }),
    tx(lang, { es: "Gestión de riesgo y freno duro opcional", en: "Risk management and optional hard brake", pt: "Gestão de risco e freio rígido opcional", fr: "Gestion du risque et arrêt forcé optionnel", de: "Risikomanagement und optionale Notbremse" }),
    tx(lang, { es: "Psicología y disciplina", en: "Psychology and discipline", pt: "Psicologia e disciplina", fr: "Psychologie et discipline", de: "Psychologie und Disziplin" }),
    tx(lang, { es: "Playbook con estadísticas en vivo", en: "Playbook with live statistics", pt: "Playbook com estatísticas ao vivo", fr: "Playbook avec statistiques en direct", de: "Playbook mit Live-Statistiken" }),
    tx(lang, { es: "Importación CSV y exportación completa", en: "CSV import and full export", pt: "Importação CSV e exportação completa", fr: "Import CSV et export complet", de: "CSV-Import und vollständiger Export" }),
    tx(lang, { es: "Copias de seguridad automáticas", en: "Automatic backups", pt: "Backups automáticos", fr: "Sauvegardes automatiques", de: "Automatische Backups" }),
    tx(lang, { es: "Informe mensual en PDF", en: "Monthly PDF report", pt: "Relatório mensal em PDF", fr: "Rapport mensuel en PDF", de: "Monatlicher PDF-Bericht" }),
    tx(lang, { es: "2 cuentas de trading", en: "2 trading accounts", pt: "2 contas de trading", fr: "2 comptes de trading", de: "2 Trading-Konten" }),
  ];

  const proFeatures = [
    tx(lang, { es: "Todo lo de Core", en: "Everything in Core", pt: "Tudo do Core", fr: "Tout ce qui est inclus dans Core", de: "Alles aus Core" }),
    tx(lang, { es: "Cuentas ilimitadas", en: "Unlimited accounts", pt: "Contas ilimitadas", fr: "Comptes illimités", de: "Unbegrenzte Konten" }),
    tx(lang, { es: "Modo prop firm e informe de evaluación en PDF", en: "Prop firm mode and PDF evaluation report", pt: "Modo prop firm e relatório de avaliação em PDF", fr: "Mode prop firm et rapport d’évaluation en PDF", de: "Prop-Firm-Modus und PDF-Evaluierungsbericht" }),
    tx(lang, { es: "Simulador Monte Carlo y riesgo de ruina", en: "Monte Carlo simulator and risk of ruin", pt: "Simulador de Monte Carlo e risco de ruína", fr: "Simulateur Monte Carlo et risque de ruine", de: "Monte-Carlo-Simulator und Ruin-Risiko" }),
    tx(lang, { es: "Experimentos con validación estadística", en: "Experiments with statistical validation", pt: "Experimentos com validação estatística", fr: "Expériences avec validation statistique", de: "Experimente mit statistischer Validierung" }),
    tx(lang, { es: "Módulo fiscal y página Negocio", en: "Tax module and Business page", pt: "Módulo fiscal e página Negócio", fr: "Module fiscal et page Activité", de: "Steuermodul und Geschäftsübersicht" }),
    tx(lang, { es: "API local", en: "Local API", pt: "API local", fr: "API locale", de: "Lokale API" }),
    tx(lang, { es: "Alertas de mercado, curva de tipos y fortaleza de divisas", en: "Market alerts, yield curve and currency strength", pt: "Alertas de mercado, curva de juros e força de moedas", fr: "Alertes de marché, courbe des taux et force relative des devises", de: "Marktalarme, Zinskurve und Währungsstärke" }),
  ];

  const plans: Plan[] = [
    {
      id: "core",
      name: t("core"),
      price: PRECIO_CORE,
      tagline: tx(lang, {
        es: "El núcleo del diario para construir una operativa medible.",
        en: "The journal core for building a measurable trading process.",
        pt: "O núcleo do diário para construir uma operação mensurável.",
        fr: "Le socle du journal pour bâtir un processus de trading rigoureux.",
        de: "Der Journal-Kern für einen messbaren Trading-Prozess.",
      }),
      features: coreFeatures,
      cta: tx(lang, { es: "Solicitar acceso anticipado", en: "Request early access", pt: "Solicitar acesso antecipado", fr: "Demander l’accès anticipé", de: "Vorabzugang anfordern" }),
    },
    {
      id: "pro",
      name: t("pro"),
      price: PRECIO_PRO,
      popular: true,
      tagline: tx(lang, {
        es: "Para prop firms, varias cuentas, fiscalidad y análisis avanzado.",
        en: "For prop firms, multiple accounts, tax and advanced analysis.",
        pt: "Para prop firms, várias contas, fiscalidade e análise avançada.",
        fr: "Pour les prop firms, les comptes multiples, la fiscalité et l’analyse avancée.",
        de: "Für Prop-Firms, mehrere Konten, Steuern und erweiterte Analysen.",
      }),
      features: proFeatures,
      cta: tx(lang, { es: "Solicitar acceso anticipado", en: "Request early access", pt: "Solicitar acesso antecipado", fr: "Demander l’accès anticipé", de: "Vorabzugang anfordern" }),
    },
  ];

  return (
    <section
      id="pricing"
      className={`section cv-auto relative overflow-clip scroll-mt-24 ${standalone ? "!pt-[clamp(2.5rem,5vw,4rem)]" : ""}`}
    >

      <div className="relative z-10 tj-container">
        {/* En `standalone` se omiten eyebrow y lead (los aporta el PageHeader) y
            el h2 va `sr-only`: debe existir para el índice y el SEO. */}
        <Reveal className="text-center max-w-3xl mx-auto">
          {!standalone && (
            <Eyebrow className="justify-center">
              {tx(lang, {
                es: "Precios de lanzamiento",
                en: "Launch pricing",
                pt: "Preços de lançamento",
                fr: "Tarifs de lancement",
                de: "Einführungspreise",
              })}
            </Eyebrow>
          )}
          <h2
            className={
              standalone
                ? "sr-only"
                : "t-h2 text-primary mt-5 max-w-[24ch] mx-auto"
            }
          >
            {tx(lang, {
              es: (
                <>
                  Dos niveles. Una decisión{" "}
                  informada.
                </>
              ),
              en: (
                <>
                  Two tiers. One informed{" "}
                  decision.
                </>
              ),
              pt: (
                <>
                  Dois planos. Uma decisão{" "}
                  informada.
                </>
              ),
              fr: (
                <>
                  Deux formules. Un choix{" "}
                  éclairé.
                </>
              ),
              de: (
                <>
                  Zwei Stufen. Eine fundierte{" "}
                  Entscheidung.
                </>
              ),
            })}
          </h2>
          {!standalone && (
            <p className="mt-4 t-entradilla text-secondary">
              {tx(lang, {
                es: "Dos niveles claros para dos formas de operar. Prueba la demo, compara el alcance y solicita acceso anticipado si quieres entrar antes de la apertura comercial.",
                en: "Two clear tiers for two ways of trading. Try the demo, compare the scope and request early access if you want in before commercial launch.",
                pt: "Dois planos claros para duas formas de operar. Experimente a demo, compare o escopo e solicite acesso antecipado se quiser entrar antes do lançamento comercial.",
                fr: "Deux offres claires pour deux approches de marché. Testez la démo, comparez le périmètre et demandez votre accès anticipé avant l’ouverture commerciale.",
                de: "Zwei klare Stufen für zwei Trading-Ansätze. Testen Sie die Demo, vergleichen Sie den Umfang und fordern Sie Vorabzugang an, wenn Sie vor dem kommerziellen Start einsteigen möchten.",
              })}
            </p>
          )}
        </Reveal>

        <div className={`relative ${standalone ? "" : "mt-10"}`}>
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 items-stretch">
          {plans.map((plan) => (
            <div key={plan.id} className="h-full">
              <PlanCard plan={plan} lang={lang} />
            </div>
          ))}
        </div>
        </div>


        {/* Sin política de devoluciones inventada: se enlaza a donde se explica
            que las condiciones se publican al abrir la venta. */}
        <Reveal delay={0.2}>
          <p className="mt-10 text-sm leading-[1.6] text-tertiary">
            {tx(lang, {
              es: "La demo es pública; la compra se abrirá con el lanzamiento. ",
              en: "The demo is public; purchase opens at launch. ",
              pt: "A demo é pública; as compras serão abertas no lançamento. ",
              fr: "La démo est publique ; l’achat sera ouvert au lancement. ",
              de: "Die Demo ist öffentlich; der Kauf öffnet beim Launch. ",
            })}
            <Link
              href="/beta"
              className="link-underline-host -my-3 inline-flex py-3 text-secondary transition-colors hover:text-primary"
            >
              <span className="link-underline">
                {tx(lang, { es: "Cómo funciona el acceso anticipado", en: "How early access works", pt: "Como funciona o acesso antecipado", fr: "Comment fonctionne l’accès anticipé", de: "So funktioniert der Vorabzugang" })}
              </span>
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

const fechaTipo = new Date(FECHA_TIPO_EUR).toLocaleDateString(LOCALE_FECHA.es, {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function PlanCard({ plan, lang }: { plan: Plan; lang: Lang }) {
  const isPro = plan.popular;
  const dolarDetras = lang === "es" || lang === "fr" || lang === "de";

  return (
    <div
      data-entra
      className="tj-cristal relative flex h-full flex-col"
    >
      {/* Dos zonas: arriba nivel, precio y acción; debajo, tras un filete, lo
          que incluye. */}
      <div className="p-7 sm:p-9">
      <div className="flex items-center justify-between gap-3">
        <h3 className="t-h3 text-primary min-w-0 break-words">
          {plan.name}
        </h3>
      </div>

      {/* Reserva dos renglones solo entre 768 y 1279 px, donde la descripción de
          Pro parte en dos, para alinear los precios. */}
      <p className="mt-2 text-[15px] text-secondary leading-[1.7] md:min-h-[3.4em] xl:min-h-0">
        {plan.tagline}
      </p>

      {/* El orden del símbolo lo pone el DOM, no `flex-row-reverse`: el orden
          visual y el leído (y el copiado) tienen que coincidir. */}
      <div className="mt-8 flex items-baseline min-w-0 gap-1">
        {dolarDetras ? (
          <>
            <span className="text-5xl md:text-6xl font-normal tracking-[-0.035em] text-primary tnum leading-[0.95]">
              {fmtInt(plan.price, lang)}
            </span>
            <span className="text-2xl md:text-3xl font-normal text-tertiary tnum">$</span>
          </>
        ) : (
          <>
            <span className="text-2xl md:text-3xl font-normal text-tertiary tnum">$</span>
            <span className="text-5xl md:text-6xl font-normal tracking-[-0.035em] text-primary tnum leading-[0.95]">
              {fmtInt(plan.price, lang)}
            </span>
          </>
        )}
      </div>
      {lang === "es" && (
        <p className="mt-3 mb-0 text-[14px] text-tertiary tnum">
          <span className="whitespace-nowrap">{`≈\u00a0${fmtInt(aproxEur(plan.price), lang)}\u00a0€`}</span> al cambio de {fechaTipo}
        </p>
      )}

      <SelloPrevisto
        className="mt-4 self-start"
        es="Precio previsto"
        en="Planned price"
        pt="Preço previsto"
        fr="Prix prévisionnel"
        de="Geplanter Preis"
        detalleEs="se fija con la entrega comercial"
        detalleEn="set at commercial launch"
        detallePt="definido no lançamento comercial"
        detalleFr="défini au lancement commercial"
        detalleDe="beim Verkaufsstart festgelegt"
      />

      <div
        data-entra
        className="mt-8"
      >
        <MagneticButton
          href="/beta"
          strength={0.18}
          className={
            isPro
              ? "group flex w-full items-center justify-center gap-2 h-12 px-6 rounded-[4px] text-[15px] font-semibold transition-colors duration-200 bg-[rgb(var(--accent-base))] text-[rgb(var(--accent-ink))] hover:bg-[rgb(var(--accent-hover))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.6)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              : "group flex w-full items-center justify-center gap-2 h-12 px-6 rounded-[4px] text-[15px] font-semibold transition-colors duration-200 bg-transparent text-primary shadow-[inset_0_0_0_1px_var(--line-2)] hover:bg-[color-mix(in_srgb,var(--ink)_5%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.6)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          }
        >
          {plan.cta}
        </MagneticButton>
      </div>

      </div>
      <div className="flex-1 border-t border-[var(--ficha-division)] px-7 pt-6 pb-7 sm:px-9 sm:pb-9">
      <p className="m-0 text-[13px] font-medium text-tertiary">
        {isPro
          ? tx(lang, { es: "Todo lo de Core, y además", en: "Everything in Core, plus", pt: "Tudo do Core, e além disso", fr: "Tout ce qui est inclus dans Core, plus", de: "Alles aus Core, plus" })
          : tx(lang, { es: "Incluye", en: "Includes", pt: "Inclui", fr: "Comprend", de: "Enthält" })}
      </p>
      <ul className="mt-4 space-y-3">
        {(isPro ? plan.features.slice(1) : plan.features).map((f) => (
          <li key={f} className="text-[15px] leading-[1.7] text-secondary break-words">
            {f}
          </li>
        ))}
      </ul>
      </div>
    </div>
  );
}

