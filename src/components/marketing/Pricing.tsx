"use client";

import { Link } from "@/components/tj/LocaleLink";
import { useLang } from "@/lib/i18n";
import { Eyebrow } from "@/components/tj/Eyebrow";
import { Reveal } from "@/components/tj/Reveal";
import { Escritorio } from "@/components/tj/Escritorio";
import { MagneticButton } from "@/components/tj/MagneticButton";
import { SelloPrevisto } from "@/components/tj/SelloPrevisto";
import { PRECIO_CORE, PRECIO_PRO, FECHA_TIPO_EUR, aproxEur } from "@/lib/precios";

type Plan = {
  id: "core" | "pro";
  name: string;
  price: number;
  popular?: boolean;
  /** One-line positioning tagline shown under the plan name. */
  tagline: string;
  features: string[];
  cta: string;
};

/**
 * @param standalone Cuando la sección vive en su propia página bajo un
 * `PageHeader` que ya dice "Lo compras una vez…", oculta el encabezado
 * interno para no repetir el mismo titular dos veces en una pantalla.
 */
export function Pricing({ standalone = false }: { standalone?: boolean } = {}) {
  const { t, lang } = useLang();
  const es = lang === "es";

  /* Los mismos niveles que `LicenseGate` y `PLAN.md` §10 del programa. */
  const coreFeatures = es
    ? [
        "Diario, 40+ métricas y calendario",
        "Curva de equity y drawdown",
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
        {/* Header — centered, matches Stripe / Linear / Vercel pricing
            pages. El h2 siempre se renderiza (necesario para el TOC + SEO);
            en modo standalone (/pricing) se omiten el eyebrow y el lead
            porque el PageHeader ya aporta su propio kicker + subtítulo. */}
        <Reveal className="text-center max-w-3xl mx-auto">
          {!standalone && <Eyebrow className="justify-center">{t("pricingEyebrow")}</Eyebrow>}
          {/* Mismo caso que en FAQ: en /pricing el PageHeader ya titula
              "Lo compras una vez. Es tuyo para siempre.", así que este h2
              repetía el titular en pantalla. Se conserva en el documento
              (índice + SEO) pero oculto a la vista con `sr-only`. */}
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
                <span className="text-gradient">informada.</span>
              </>
            ) : (
              <>
                Two tiers. One informed{" "}
                <span className="text-gradient">decision.</span>
              </>
            )}
          </h2>
          {!standalone && (
            <p className="mt-4 text-lg text-secondary leading-relaxed">
              {t("pricingLead")}
            </p>
          )}
        </Reveal>

        <div className="relative mt-10">
          <Escritorio className="tj-escritorio--ancho" />
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 max-w-[60rem] mx-auto items-stretch">
          {plans.map((plan) => (
            <div key={plan.id} className="h-full">
              <PlanCard plan={plan} es={es} />
            </div>
          ))}
        </div>
        </div>


        {/* La garantía de 30 días se retiró de aquí y no se sustituyó por
            nada, así que la página quedó sin decir UNA palabra sobre
            devoluciones. Para un pago único sin prueba gratuita, ese
            silencio es fricción: quien duda, no compra.

            No invento la política —es una decisión legal y comercial que
            no me corresponde— pero sí cierro el hueco enlazando a donde
            está explicado que las condiciones se publican al abrir la
            venta, que hoy es la respuesta verdadera. */}
        <Reveal delay={0.2}>
          <p className="mt-12 text-center text-[14px] text-tertiary">
            {es ? "La demo es pública; la compra se abrirá con el lanzamiento. " : "The demo is public; purchase opens at launch. "}
            <Link
              href="/beta"
              className="link-underline-host -my-3 inline-flex py-3 text-secondary transition-colors hover:text-primary"
            >
              {/* No repite la etiqueta de los dos botones que tiene justo
                  encima: dice a dónde lleva, que es otra cosa. */}
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

const fechaTipo = new Date(FECHA_TIPO_EUR).toLocaleDateString("es-ES", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function PlanCard({ plan, es }: { plan: Plan; es: boolean }) {
  const isPro = plan.popular;

  return (
    <div
      data-entra
      className="tj-cristal relative flex h-full flex-col rounded-[12px]"
    >
      {/* Dos zonas, como una ficha: arriba el nivel, el precio y la
          acción; debajo, tras un filete de borde a borde, lo que incluye. */}
      <div className="p-7 sm:p-9">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl md:text-2xl font-semibold text-primary tracking-tight min-w-0 break-words">
          {plan.name}
        </h3>
      </div>

      <p className="mt-2 text-[15px] text-secondary leading-snug min-h-[2.75em]">
        {plan.tagline}
      </p>

      {/* EL ORDEN LO PONE EL DOM, NO `flex-row-reverse`.
          En español el símbolo va detrás («149 $») y en inglés delante
          («$149»), y eso se conseguía invirtiendo la fila con CSS: en
          pantalla salía bien, pero en el documento el símbolo seguía
          delante. Un lector de pantalla leía «dólar, ciento cuarenta y
          nueve» en la página española, y quien copiara el precio se
          llevaba «$149». El orden visual y el orden leído tienen que ser
          el mismo. */}
      <div className="mt-8 flex items-baseline min-w-0 gap-1">
        {es ? (
          <>
            <span className="text-5xl md:text-6xl font-semibold tracking-[-0.03em] text-primary tnum leading-[0.95]">
              {plan.price}
            </span>
            <span className="text-2xl md:text-3xl font-medium text-secondary tnum">$</span>
          </>
        ) : (
          <>
            <span className="text-2xl md:text-3xl font-medium text-secondary tnum">$</span>
            <span className="text-5xl md:text-6xl font-semibold tracking-[-0.03em] text-primary tnum leading-[0.95]">
              {plan.price}
            </span>
          </>
        )}
      </div>
      {es && (
        <p className="mt-3 mb-0 text-[14px] text-tertiary tnum">
          <span className="whitespace-nowrap">{`≈\u00a0${aproxEur(plan.price)}\u00a0€`}</span> al cambio de {fechaTipo}
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
          <svg
            className="transition-transform duration-200 group-hover:translate-x-0.5"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3 8h9M8 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </MagneticButton>
      </div>

      </div>
      <div className="flex-1 border-t border-[var(--ficha-division)] px-7 pt-6 pb-7 sm:px-9 sm:pb-9">
      <p className="m-0 text-[11px] font-medium uppercase tracking-[0.1em] text-tertiary">
        {isPro ? (es ? "Todo lo de Core, y además" : "Everything in Core, plus") : (es ? "Incluye" : "Includes")}
      </p>
      <ul className="mt-4 space-y-3">
        {(isPro ? plan.features.slice(1) : plan.features).map((f) => (
          <li key={f} className="flex items-start gap-3 text-[15px]">
            <span className="shrink-0 mt-[4px] text-primary" aria-hidden="true">
              <CheckIcon />
            </span>
            <span className="text-secondary leading-[1.55] min-w-0 break-words">{f}</span>
          </li>
        ))}
      </ul>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        data-entra="trazo"
        pathLength="1"
        d="m3.5 8.5 3 3 6-7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

