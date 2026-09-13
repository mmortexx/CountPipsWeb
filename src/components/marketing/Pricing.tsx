"use client";

import { Link } from "@/components/tj/LocaleLink";
import { useLang } from "@/lib/i18n";
import { Eyebrow } from "@/components/tj/Eyebrow";
import { Reveal } from "@/components/tj/Reveal";
import { MagneticButton } from "@/components/tj/MagneticButton";
import { SelloPrevisto } from "@/components/tj/SelloPrevisto";
import { PRECIO_CORE, PRECIO_PRO, MONEDA } from "@/lib/precios";

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

  const coreFeatures = es
    ? [
        // «Diario» y no «Journal»: es el nombre que el producto se da a sí
        // mismo en el resto del sitio. Ver el commit del vocabulario.
        "Diario completo + 40+ métricas",
        "Calendario y curva de equity",
        "Gestión de riesgo",
        "Psicología y disciplina",
        "Importación CSV",
        "2 cuentas de trading",
        "Playbook con stats en vivo",
        "Informes PDF básicos",
      ]
    : [
        "Full journal + 40+ metrics",
        "Calendar and equity curve",
        "Risk management",
        "Psychology and discipline",
        "CSV import",
        "2 trading accounts",
        "Playbook with live stats",
        "Basic PDF reports",
      ];

  const proFeatures = es
    ? [
        "Todo lo de Core",
        "Cuentas ilimitadas",
        /* «Modo prop firm», como lo llama la tabla comparativa de esta
           MISMA página. Estaba en inglés en la lista y en castellano en la
           tabla, a dos scrolls de distancia. */
        "Modo prop firm",
        "Informes PDF avanzados",
        "Simulador Monte Carlo",
        "Risk of ruin",
        "Informe de track record",
        "Importador de rivales (5 min)",
      ]
    : [
        "Everything in Core",
        "Unlimited accounts",
        "Prop Firm Mode",
        "Advanced PDF reports",
        "Monte Carlo simulator",
        "Risk of ruin",
        "Track record report",
        "Rival importer (5 min)",
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
        ? "Controles avanzados para exigencia prop y multi-cuenta."
        : "Advanced controls for prop-firm and multi-account work.",
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
                : "text-3xl md:text-4xl font-semibold tracking-tight text-primary text-balance mt-5"
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

        {/* La demo es pública; la compra se habilita cuando la entrega
            comercial esté lista. El acceso anticipado sigue siendo privado. */}
        <Reveal delay={0.08} y={20}>
          <ul className="terms-bar mt-10" aria-label={es ? "Condiciones de acceso" : "Access terms"}>
            {(es
              ? [
                  { k: "Ahora", v: "Demo sin registro" },
                  { k: "Acceso", v: "Piloto privado" },
                  { k: "Lanzamiento", v: `Core ${MONEDA}${PRECIO_CORE} · Pro ${MONEDA}${PRECIO_PRO}` },
                ]
              : [
                  { k: "Now", v: "No-sign-up demo" },
                  { k: "Access", v: "Private pilot" },
                  { k: "Launch", v: `Core ${MONEDA}${PRECIO_CORE} · Pro ${MONEDA}${PRECIO_PRO}` },
                ]
            ).map((item) => (
              <li key={item.k} className="terms-bar__item">
                <span className="terms-bar__key">{item.k}</span>
                <span className="terms-bar__value">{item.v}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 max-w-[60rem] mx-auto items-stretch">
          {plans.map((plan, i) => (
            <Reveal key={plan.id} delay={0.12 + i * 0.08} y={32} className="h-full">
              <PlanCard plan={plan} es={es} />
            </Reveal>
          ))}
        </div>

        {/* Línea de cierre — centrada, simple. Antes prometía la garantía
            de 30 días (retirada: no se ofrecen reembolsos). El escudo se
            reaprovecha para la promesa que sí se sostiene y que es el
            argumento de venta real del producto: los datos no salen del
            equipo. */}
        <Reveal delay={0.16}>
          <div className="mt-12 flex items-start justify-center gap-2.5 text-center text-sm text-tertiary sm:items-center">
            <span
              className="text-[rgb(var(--accent-base))] inline-flex"
              aria-hidden="true"
            >
              <ShieldIcon />
            </span>
            <span className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <span className="font-medium text-secondary">
                {es ? "Demo pública" : "Public demo"}
              </span>
              <span className="text-tertiary" aria-hidden="true">
                ·
              </span>
              <span>{es ? "Compra habilitada con la entrega comercial" : "Purchase opens with commercial delivery"}</span>
            </span>
          </div>
        </Reveal>

        {/* La garantía de 30 días se retiró de aquí y no se sustituyó por
            nada, así que la página quedó sin decir UNA palabra sobre
            devoluciones. Para un pago único sin prueba gratuita, ese
            silencio es fricción: quien duda, no compra.

            No invento la política —es una decisión legal y comercial que
            no me corresponde— pero sí cierro el hueco enlazando a donde
            está explicado que las condiciones se publican al abrir la
            venta, que hoy es la respuesta verdadera. */}
        <Reveal delay={0.2}>
          <p className="mt-4 text-center text-[14px] text-tertiary">
            {es ? "Son precios de lanzamiento previstos. " : "These are planned launch prices. "}
            <Link
              href="/beta"
              className="link-underline-host -my-3 inline-flex py-3 text-secondary transition-colors hover:text-primary"
            >
              <span className="link-underline">
                {es ? "Solicitar acceso anticipado" : "Request early access"}
              </span>
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function PlanCard({ plan, es }: { plan: Plan; es: boolean }) {
  const isPro = plan.popular;

  return (
    <div
      data-entra
      className={`relative flex h-full flex-col rounded-[8px] border p-7 sm:p-9 ${
        isPro
          ? "border-[rgb(var(--txt-primary))] bg-[var(--raised)] shadow-[0_1px_2px_rgb(11_15_20/0.06),0_12px_32px_-12px_rgb(11_15_20/0.18)]"
          : "border-[var(--line-2)] bg-[var(--raised)]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl md:text-2xl font-semibold text-primary tracking-tight min-w-0 break-words">
          {plan.name}
        </h3>
        {isPro && (
          <span className="inline-flex shrink-0 items-center rounded-[4px] bg-[rgb(var(--accent-base))] px-2.5 py-1.5 text-[12px] font-semibold leading-none text-[rgb(var(--accent-ink))]">
            {es ? "Incluye todo" : "Everything included"}
          </span>
        )}
      </div>

      <p className="mt-2 text-[15px] text-secondary leading-snug min-h-[2.6em]">
        {plan.tagline}
      </p>

      <div className="mt-8 flex items-baseline gap-1 min-w-0">
        <span className="text-2xl md:text-3xl font-medium text-secondary tnum">$</span>
        <span className="text-5xl md:text-6xl font-semibold tracking-[-0.03em] text-primary tnum leading-[0.95]">
          {plan.price}
        </span>
      </div>

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
              : "group flex w-full items-center justify-center gap-2 h-12 px-6 rounded-[4px] text-[15px] font-semibold transition-colors duration-200 border border-[var(--line-2)] text-primary hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.6)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
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

      <p className="mt-8 border-t border-[var(--line)] pt-6 text-[12px] font-semibold uppercase tracking-[0.08em] text-tertiary">
        {isPro ? (es ? "Todo lo de Core, y además" : "Everything in Core, plus") : (es ? "Incluye" : "Includes")}
      </p>
      <ul className="mt-4 space-y-3 flex-1">
        {(isPro ? plan.features.slice(1) : plan.features).map((f) => (
          <li key={f} className="flex items-start gap-3 text-[15px]">
            <span className="shrink-0 mt-[3px] text-[rgb(var(--accent-base))]" aria-hidden="true">
              <CheckIcon tinta="rgb(var(--accent-ink))" />
            </span>
            <span className="text-secondary leading-[1.55] min-w-0 break-words">{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* El disco se estampa y la marca se DIBUJA encima, en ese orden. Antes
   eran un `motion.circle` con `scale` y un `motion.path` con
   `pathLength`; ahora son `data-entra="sello"` y `data-entra="trazo"`,
   con el mismo desfase entre los dos (el trazo arranca un poco después,
   cuando ya hay disco sobre el que dibujar).

   El `pathLength="1"` no es decorativo: normaliza el recorrido del
   trazo a la unidad para que `stroke-dasharray: 1` valga sin medir la
   longitud real. Ver `tj-dibuja` en globals.css.

   Ya no recibe `delay`: el escalonado por columna lo daba el retardo que
   le pasaba la fila, y ahora lo da la posición del icono en la ventana,
   que es la misma información sin tener que propagarla. */
/* La marca va en la tinta del disco, no en su mismo color.
   El disco y el trazo iban los DOS en `currentColor`: medido sobre la
   pagina compilada daba 1,00:1 en los dos planes y en los dos temas, o
   sea que el ✓ no existia en pantalla — dieciseis vinetas que eran un
   disco liso. Cada familia de color declara su tinta (`--accent-ink`,
   `--pnl-ink`, `--sig-ink`) y es esa la que se usa aqui. */
function CheckIcon({ tinta }: { tinta: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle data-entra="sello" cx="8" cy="8" r="7" fill="currentColor" />
      <path
        data-entra="trazo"
        pathLength="1"
        d="m5 8 2 2 4-4"
        stroke={tinta}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 1.6 2.8 3.8v3.6c0 3.2 2.2 5.6 5.2 6.6 3-1 5.2-3.4 5.2-6.6V3.8L8 1.6Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="m5.8 8 1.6 1.6L10.4 6.6"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
