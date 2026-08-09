"use client";

import { motion } from "framer-motion";
import { Link } from "@/components/tj/LocaleLink";
import { useLang } from "@/lib/i18n";
import { Eyebrow } from "@/components/tj/Eyebrow";
import { Reveal } from "@/components/tj/Reveal";
import { MagneticButton } from "@/components/tj/MagneticButton";

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
        "Journal completo + 40+ métricas",
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
        "Prop Firm Mode",
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
      price: 149,
      tagline: es
        ? "El núcleo del journal para construir una operativa medible."
        : "The journal core for building a measurable trading process.",
      features: coreFeatures,
      cta: es ? "Solicitar acceso anticipado" : "Request early access",
    },
    {
      id: "pro",
      name: t("pro"),
      price: 249,
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
      className="section cv-auto bg-veil relative overflow-hidden scroll-mt-24"
    >
      {/* Opt-in 3% fractalNoise grain — matches HeroVideo / Bento so the
          conversion section reads as a premium printed surface. */}
      <div className="grain absolute inset-0 pointer-events-none" aria-hidden="true" />

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
                  { k: "Lanzamiento", v: "Core $149 · Pro $249" },
                ]
              : [
                  { k: "Now", v: "No-sign-up demo" },
                  { k: "Access", v: "Private pilot" },
                  { k: "Launch", v: "Core $149 · Pro $249" },
                ]
            ).map((item) => (
              <li key={item.k} className="terms-bar__item">
                <span className="terms-bar__key">{item.k}</span>
                <span className="terms-bar__value">{item.v}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-7 md:gap-6 max-w-4xl mx-auto items-stretch">
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
          <div className="mt-12 flex items-center justify-center gap-2.5 text-sm text-tertiary">
            <span
              className="text-[rgb(var(--accent-base))] inline-flex"
              aria-hidden="true"
            >
              <ShieldIcon />
            </span>
            <span className="inline-flex items-center gap-2">
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
          <p className="mt-4 text-center text-[13px] text-tertiary">
            {es ? "Son precios de lanzamiento previstos. " : "These are planned launch prices. "}
            <Link
              href="/beta"
              className="link-underline-host -my-2 inline-flex py-2 text-secondary transition-colors hover:text-primary"
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
    <motion.div
      /* Sin `whileHover`. Los planes se levantaban y escalaban al pasar
         el ratón: eso es lo que hace una tarjeta que se puede coger, y
         una columna de una tabla de tarifas no se coge. Además el
         escalado desplazaba el precio medio píxel y lo dejaba borroso
         durante la transición — en la cifra que decide la compra. La
         respuesta al puntero la da ahora el filete superior. */
      /* ── Tabla de tarifas, no tarjetas flotantes ──────────────────
         Los dos planes eran cajas: papel translúcido, borde propio,
         sombra de elevación, esquina redondeada y —en el Pro— un halo
         de acento. Ese es el patrón del SaaS de consumo, y es lo que
         hacía que la página que MÁS tiene que transmitir seriedad
         pareciera la de una aplicación de suscripción cualquiera.

         Cómo publica sus tarifas una institución: en columnas, con
         filetes. El plan recomendado no se ilumina — se marca con un
         filete superior más grueso, que es una señal y no un adorno.
         La caja compite con lo que contiene; aquí lo que tiene que
         mandar es el precio y lo que incluye.

         Se retira también la elevación: una columna de tabla no flota.
         El `isolation: isolate` se conserva porque el Pro sigue
         necesitando su propio contexto de apilado para la marca de
         agua. */
      className={`relative p-6 sm:p-8 h-full flex flex-col transition-[border-color] duration-300 ease-[var(--ease-suave)] ${
        isPro
          ? "border-t-2 border-t-[rgb(var(--accent-base))] border-x border-b border-x-[rgb(var(--divider)/0.14)] border-b-[rgb(var(--divider)/0.14)]"
          : "border-t-2 border-t-[rgb(var(--divider)/0.28)] border-x border-b border-x-[rgb(var(--divider)/0.14)] border-b-[rgb(var(--divider)/0.14)] hover:border-t-[rgb(var(--divider)/0.45)]"
      }`}
      style={
        isPro
          ? {
              // Establish a stacking context so the "PREMIUM" watermark
              // (z-index: -1) stays trapped inside this card — paints
              // above the liquid-glass fill but below the in-flow text content.
              isolation: "isolate",
            }
          : undefined
      }
    >
      {isPro && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
          {/* "Más popular" badge — accent-tinted gradient pill with a soft
              outer glow. Replaces the prior hardcoded white-on-black chip
              with a premium green-on-green treatment that ties to the
              accent ring + glow already framing the Pro card, so the whole
              Pro surface reads as a single premium object (R20-3c). */}
          <span
            className="pill !rounded-[2px] border uppercase tracking-[0.1em] backdrop-blur-md backdrop-saturate-150"
            style={{
              /* Fondo de acento PLANO con la tinta que le corresponde.
                 Antes el texto era `--accent-pressed` (#B0905A) sobre un
                 degradado de `--accent-base` → `--accent-hover`: dorado
                 sobre dorado, ~1.4:1 de contraste. La insignia se veía
                 como una barra dorada maciza y SIN TEXTO.
                 El color sale ahora de `--accent-ink` en vez de un
                 #1A1917 fijo: ese valor solo despeja AA cuando el acento
                 es claro, y hay dos temas (claro y estilo clásico) donde
                 el acento es oscuro y hacía falta la tinta invertida.
                 Cada tema declara la suya en globals.css. */
              background: "rgb(var(--accent-base))",
              color: "rgb(var(--accent-ink))",
              borderColor: "rgb(var(--accent-base))",
            }}
          >
            {/* ── NO DICE «MÁS POPULAR» ────────────────────────────────
                Decía «Más popular» en un producto que no se ha vendido
                una sola vez — tres párrafos por encima de donde la misma
                página declara que la compra se habilita "con la entrega
                comercial" y que los precios son "previstos". Popular
                ¿entre quién? Era el único reclamo del sitio sin nada
                detrás, y estaba justo en la página donde más caro sale:
                el visitante que lo pilla deja de creerse también lo que
                sí es verdad.

                Se sustituye por una distinción que se puede comprobar
                mirando la propia tabla: Pro es el plan que incluye todo.
                Cuando existan ventas y uno sea de verdad el más elegido,
                se podrá decir — y entonces será un dato, no un adorno. */}
            {es ? "Incluye todo" : "Everything included"}
          </span>
        </div>
      )}

      {/* Aquí había una marca de agua: la palabra "PREMIUM" a 8 rem,
          rotada −12°, al 4 % de opacidad, cruzando la tarjeta de Pro.
          Se justificaba como "papelería de lujo", pero es el gesto de
          plantilla que le quedaba al sitio: decir "premium" es
          exactamente lo que no hace un producto que lo sea, y el resto
          de la página lleva meses retirando adornos por ese mismo
          criterio (el cristal, las cajas, las esquinas redondeadas).
          Una tarjeta cuyo precio es 249 $ no necesita un sello que
          anuncie su categoría; la anuncia la tabla de al lado. */}

      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl md:text-2xl font-semibold text-primary tracking-tight min-w-0 break-words">
          {plan.name}
        </h3>
        {/* "Para siempre" / "Forever" credential pill — Pro gets an
            accent-tinted bg + accent border so its forever tag reads as
            a premium credential distinct from Core's neutral pill
            (R24-1d). text-primary kept for full WCAG-AA contrast on the
            tinted backdrop in both themes. */}
        <span
          className={`pill !rounded-[2px] border shrink-0 ${
            isPro
              ? "bg-[rgb(var(--accent-base)/0.12)] text-primary border-[rgb(var(--accent-base)/0.32)]"
              : "bg-[rgb(var(--divider)/0.05)] text-tertiary border-[rgb(var(--divider)/0.10)]"
          }`}
        >
          {es ? "Lanzamiento" : "Launch"}
        </span>
      </div>

      {/* Plan tagline — one line of positioning copy right under the name.
          Soft secondary color + tight leading keep it readable without
          competing with the price below. */}
      <p className="mt-2 text-sm text-secondary leading-snug min-h-[2.6em]">
        {plan.tagline}
      </p>

      {/* Price — big visual anchor. `$` is set smaller and baseline-aligned
          so it reads as a currency prefix; the bold tabular-num number is
          the visual anchor; the `/ pago único` suffix sits inline to the
          right at the baseline in a small tertiary label. Both cards share
          the exact same baseline grid so Core $149 and Pro $249 sit on
          identical vertical lines — pixel-perfect parity. The `$` uses
          text-secondary (not the dimmest text-tertiary token) so the
          currency mark reads as part of the price in both themes rather
          than a stray dim glyph (R24-1d). */}
      <div className="mt-6 flex items-baseline gap-1 min-w-0">
        <span className="text-2xl md:text-3xl font-semibold text-secondary tnum">
          $
        </span>
        {/* El precio NO se anima. Estaba con `CountUp` subiendo de 0 a
            149 en 1,6 s, y esta misma tarjeta ya razona treinta líneas
            más arriba por qué se le quitó el `whileHover`: "el escalado
            desplazaba el precio medio píxel y lo dejaba borroso… en la
            cifra que decide la compra". Un cuentakilómetros hace lo
            mismo pero durante segundo y medio, y además obliga a leer
            dos veces para saber cuánto cuesta. El argumento valía para
            el hover y vale igual aquí. */}
        <span className="text-5xl md:text-6xl font-bold text-primary tnum leading-[0.95]">
          {plan.price}
        </span>
        <span className="ml-2 text-sm text-tertiary whitespace-nowrap">
          / {es ? "precio previsto" : "planned price"}
        </span>
      </div>

      <div className="divider-grad my-6" />

      {/* Premium accent rail — only on the Pro card. A 2 px tall gradient
          bar pinned to the top inside edge of the card, sitting just above
          the liquid-glass fill. Reads as a "selected / recommended" rail
          (think Stripe's highlighted pricing tier) and reinforces the
          gradient-border + glow without adding visual noise. */}
      {isPro && (
        <div
          aria-hidden="true"
          className="absolute top-0 left-6 right-6 h-[2px] rounded-full pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgb(var(--accent-base) / 0.85) 30%, rgb(var(--accent-hover) / 0.95) 50%, rgb(var(--accent-base) / 0.85) 70%, transparent 100%)",
          }}
        />
      )}

      <ul className="space-y-3.5 flex-1">
        {plan.features.map((f, i) => (
          <li key={f} className="flex items-start gap-3 text-sm">
            {/* Pro feature checks get an accent-tinted circular badge —
                a 20×20 rounded-full fill + inset accent ring around the
                16×16 CheckIcon — so the Pro feature list reads as a
                "ribbon of premium yes" distinct from Core's plain
                outline checks (R24-1d). Core keeps the bare CheckIcon in
                pnl-pos green for the standard positive treatment. */}
            <span
              className={`shrink-0 mt-0.5 ${
                isPro
                  ? "inline-flex items-center justify-center w-5 h-5 rounded-full bg-[rgb(var(--accent-base)/0.14)] ring-1 ring-inset ring-[rgb(var(--accent-base)/0.26)] text-[rgb(var(--accent-base))]"
                  : "text-pnl-pos"
              }`}
              aria-hidden="true"
            >
              <CheckIcon delay={0.3 + i * 0.06} />
            </span>
            <span className="text-secondary leading-[1.6] min-w-0 break-words">{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA — auto-width primary button (≤260px) centered under the feature
          list. Per the P7 spec, the Pro plan's primary action uses the brand
          gold accent fill (accent-base bg + accent-ink text) so the
          recommended tier reads as the dominant CTA on the page; Core keeps
          the restrained dark primary treatment so the two CTAs read as a
          clear hierarchy (Pro = accent / Core = neutral) rather than a pair
          of identical buttons. `h-12` keeps the tap target at 48px (≥44px
          floor). `w-fit max-w-[260px]` makes the button auto-width on every
          breakpoint instead of stretching as a full-width bar (the user
          complaint) — `mx-auto` via the flex justify-center parent centers
          it under the price column. */}
      <motion.div
        whileTap={{ scale: 0.98, transition: { type: "spring", stiffness: 400, damping: 25 } }}
        className="mt-8 flex justify-center"
      >
        {/* Este botón apuntaba a `href="#"` mientras no hubiera pasarela de
            pago. La intención era correcta —no se puede cobrar todavía—,
            pero el resultado no: es el ÚLTIMO clic del embudo. «Comprar»
            en la barra, en la portada y en el resumen traen hasta aquí,
            el visitante compara los dos planes, elige, pulsa... y la
            página salta al principio sin decir nada. Se pierde justo a
            quien ya había decidido.

            La lista de espera existe, funciona y está en ESTA misma
            página, dos secciones más abajo. Mientras no haya cobro, ese
            es el destino: en lugar de perder al interesado, se recoge su
            correo. `scroll-behavior: smooth` y `scroll-padding-top` ya
            están en `html`, así que baja suave y sin quedar tapado por la
            barra.

            Cuando entre el cobro, esto pasa a ser la URL del carrito. */}
        <MagneticButton
          href="/beta"
          strength={0.18}
          className={
            // Pro: gold accent fill + accent-ink text + accent-tinted hover
            // (deepens to accent-hover, never drops contrast). Core: dark
            // primary surface (txt-primary bg + bg text) with the same
            // shadow + lift treatment for visual parity.
            isPro
              ? "group w-full max-w-[260px] sm:w-fit sm:max-w-[260px] flex items-center justify-center gap-2 h-12 px-6 rounded-[2px] text-sm font-semibold transition-[background-color,box-shadow,transform] duration-200 bg-[rgb(var(--accent-base))] text-[rgb(var(--accent-ink))] shadow-[0_1px_2px_rgb(var(--accent-base)/0.25)] hover:bg-[rgb(var(--accent-hover))] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgb(var(--accent-base)/0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.6)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              : "group w-full max-w-[260px] sm:w-fit sm:max-w-[260px] flex items-center justify-center gap-2 h-12 px-6 rounded-[2px] text-sm font-medium transition-[background-color,box-shadow,transform] duration-200 bg-[rgb(var(--txt-primary))] text-[var(--bg)] shadow-[0_1px_2px_rgb(0_0_0/0.20)] hover:bg-[rgb(var(--txt-primary)/0.88)] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgb(0_0_0/0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.6)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
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
      </motion.div>
    </motion.div>
  );
}

function CheckIcon({ delay = 0 }: { delay?: number }) {
  return (
    <motion.svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "-20px" }}
    >
      <motion.circle
        cx="8"
        cy="8"
        r="7"
        fill="currentColor"
        initial={{ opacity: 0, scale: 0.4 }}
        whileInView={{ opacity: 0.12, scale: 1 }}
        viewport={{ once: true, margin: "-20px" }}
        transition={{ delay, duration: 0.4, ease: "backOut" }}
        style={{ transformOrigin: "center" }}
      />
      <motion.path
        d="m5 8 2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true, margin: "-20px" }}
        transition={{ delay: delay + 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />
    </motion.svg>
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
