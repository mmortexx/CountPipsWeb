"use client";

import { Link } from "@/components/tj/LocaleLink";
import { useLang, type Lang } from "@/lib/i18n";
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
  const es = lang === "es";

  /* Los mismos niveles que `LicenseGate` y `PLAN.md` §10 del programa. */
  const coreFeatures = es
    ? [
        "Diario, 40+ métricas y calendario",
        "Curva de capital y drawdown",
        "Gestión de riesgo y freno duro opcional",
        "Psicología y disciplina",
        "Playbook con estadísticas en vivo",
        "Importación CSV y exportación completa",
        "Copias de seguridad automáticas",
        "Informe mensual en PDF",
        "2 cuentas de trading",
      ]
    : [
        "Journal, 40+ metrics and calendar",
        "Equity curve and drawdown",
        "Risk management and optional hard brake",
        "Psychology and discipline",
        "Playbook with live statistics",
        "CSV import and full export",
        "Automatic backups",
        "Monthly PDF report",
        "2 trading accounts",
      ];

  const proFeatures = es
    ? [
        "Todo lo de Core",
        "Cuentas ilimitadas",
        "Modo prop firm e informe de evaluación en PDF",
        "Simulador Monte Carlo y riesgo de ruina",
        "Experimentos con validación estadística",
        "Módulo fiscal y página Negocio",
        "API local",
        "Alertas de mercado, curva de tipos y fortaleza de divisas",
      ]
    : [
        "Everything in Core",
        "Unlimited accounts",
        "Prop firm mode and PDF evaluation report",
        "Monte Carlo simulator and risk of ruin",
        "Experiments with statistical validation",
        "Tax module and Business page",
        "Local API",
        "Market alerts, yield curve and currency strength",
      ];

  const plans: Plan[] = [
    {
      id: "core",
      name: t("core"),
      price: PRECIO_CORE,
      tagline: es
        ? "El núcleo del diario para construir una operativa medible."
        : "The journal core for building a measurable trading process.",
      features: coreFeatures,
      cta: es ? "Solicitar acceso anticipado" : "Request early access",
    },
    {
      id: "pro",
      name: t("pro"),
      price: PRECIO_PRO,
      popular: true,
      tagline: es
        ? "Para prop firms, varias cuentas, fiscalidad y análisis avanzado."
        : "For prop firms, multiple accounts, tax and advanced analysis.",
      features: proFeatures,
      cta: es ? "Solicitar acceso anticipado" : "Request early access",
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
          {!standalone && <Eyebrow className="justify-center">{t("pricingEyebrow")}</Eyebrow>}
          <h2
            className={
              standalone
                ? "sr-only"
                : "t-h2 text-primary mt-5 max-w-[24ch] mx-auto"
            }
          >
            {es ? (
              <>
                Dos niveles. Una decisión{" "}
                informada.
              </>
            ) : (
              <>
                Two tiers. One informed{" "}
                decision.
              </>
            )}
          </h2>
          {!standalone && (
            <p className="mt-4 t-entradilla text-secondary">
              {t("pricingLead")}
            </p>
          )}
        </Reveal>

        <div className={`relative ${standalone ? "" : "mt-10"}`}>
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 items-stretch">
          {plans.map((plan) => (
            <div key={plan.id} className="h-full">
              <PlanCard plan={plan} es={es} />
            </div>
          ))}
        </div>
        </div>


        {/* Sin política de devoluciones inventada: se enlaza a donde se explica
            que las condiciones se publican al abrir la venta. */}
        <Reveal delay={0.2}>
          <p className="mt-10 text-sm leading-[1.6] text-tertiary">
            {es ? "La demo es pública; la compra se abrirá con el lanzamiento. " : "The demo is public; purchase opens at launch. "}
            <Link
              href="/beta"
              className="link-underline-host -my-3 inline-flex py-3 text-secondary transition-colors hover:text-primary"
            >
              <span className="link-underline">
                {es ? "Cómo funciona el acceso anticipado" : "How early access works"}
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

function PlanCard({ plan, es }: { plan: Plan; es: boolean }) {
  const isPro = plan.popular;
  const lang: Lang = es ? "es" : "en";

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
        {es ? (
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
      {es && (
        <p className="mt-3 mb-0 text-[14px] text-tertiary tnum">
          <span className="whitespace-nowrap">{`≈\u00a0${fmtInt(aproxEur(plan.price), lang)}\u00a0€`}</span> al cambio de {fechaTipo}
        </p>
      )}

      <SelloPrevisto
        className="mt-4 self-start"
        es="Precio previsto"
        en="Planned price"
        detalleEs="se fija con la entrega comercial"
        detalleEn="set at commercial launch"
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
        {isPro ? (es ? "Todo lo de Core, y además" : "Everything in Core, plus") : (es ? "Incluye" : "Includes")}
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

