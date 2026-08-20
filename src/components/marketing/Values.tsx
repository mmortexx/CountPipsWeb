"use client";

import { useLang } from "@/lib/i18n";
import { Link } from "@/components/tj/LocaleLink";
import { Reveal } from "@/components/tj/Reveal";
import { SectionHeader } from "@/components/layout/SectionHeader";

/**
 * Values — los cuatro principios del producto: local siempre, demo
 * honesta, disciplina por encima de métricas, y hecho por alguien que
 * opera. Retícula 2×2 de filetes —no de tarjetas— con su marca, su
 * afirmación, y el sitio donde el visitante puede ir a comprobarla.
 *
 * Movimiento: las cuatro entran escalonadas y el filete de acento del
 * lateral crece al pasar por encima. Nada se levanta: una declaración de
 * principios no es un objeto que se coge.
 */

/* ── FUERA EL «01 / 04» ────────────────────────────────────────────────
   Cada asiento llevaba un contador. Un contador dice «ésta es la primera
   de cuatro», que es exactamente lo que el lector ya está viendo: cuatro
   bloques, uno detrás de otro. No añade nada, y encima insinúa un ORDEN
   —primero esto, luego aquello— que aquí no existe: son cuatro ideas
   independientes, no cuatro pasos.

   Lo que sí falta en su lugar es lo que promete el pie de la sección:
   «No son eslóganes. Son decisiones de producto.» Una decisión de
   producto se puede ir a ver. Así que el rótulo pasa a ser DÓNDE SE
   COMPRUEBA cada principio, con su enlace: cuatro afirmaciones y cuatro
   sitios donde el visitante puede ir a contrastarlas.

   Con eso el rótulo deja de decorar —codifica algo que el lector no
   podía deducir— y la sección deja de ser un callejón sin salida: era la
   penúltima de la portada y no llevaba a ninguna parte. */
interface Value {
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
  /** Dónde se puede ir a comprobar este principio. */
  href: string;
  pruebaEs: string;
  pruebaEn: string;
  /** Small SVG mark per card — keeps the grid visually rhythmic. */
  icon: React.ReactNode;
}

const VALUES: Value[] = [
  {
    titleEs: "Local siempre",
    titleEn: "Local always",
    descEs:
      "Tus operaciones son tuyas. Punto. No salen de tu equipo; la analítica de esta web sólo se activa con tu consentimiento.",
    descEn:
      "Your trading data is yours. Period. It stays on your machine; this site's analytics only activates with your consent.",
    href: "/features/seguridad",
    pruebaEs: "Qué se guarda y dónde",
    pruebaEn: "What is stored, and where",
    icon: <LockIcon />,
  },
  {
    titleEs: "Demo honesta, sin atajos",
    titleEn: "An honest demo, no shortcuts",
    descEs:
      "Datos de muestra, sin tarjeta ni instalación. El piloto privado valida el producto con usuarios reales antes de abrir la venta.",
    descEn:
      "Sample data, no card and no installation. The private pilot validates the product with real users before opening sales.",
    href: "/demo",
    pruebaEs: "Recorrer la demo entera",
    pruebaEn: "Walk the whole demo",
    icon: <CoinIcon />,
  },
  {
    titleEs: "Disciplina > métricas",
    titleEn: "Discipline > metrics",
    descEs:
      "Las métricas sin disciplina son ruido. El diario te frena antes de la tontería.",
    descEn:
      "Metrics without discipline are noise. The journal stops you before the dumb trade.",
    href: "/features/disciplina",
    pruebaEs: "Cómo frena el Guardián",
    pruebaEn: "How the Guardian brakes",
    icon: <ShieldIcon />,
  },
  {
    titleEs: "Hecho por traders, para traders",
    titleEn: "Made by traders, for traders",
    descEs:
      "No es un SaaS de Silicon Valley. Es una app de escritorio hecha por alguien que opera.",
    descEn:
      "Not a Silicon Valley SaaS. A desktop app made by someone who trades.",
    href: "/about",
    pruebaEs: "Quién hay detrás",
    pruebaEn: "Who is behind it",
    icon: <CompassIcon />,
  },
];

export function Values() {
  const { lang } = useLang();
  const es = lang === "es";

  return (
    <section id="values" className="section bg-veil relative overflow-clip scroll-mt-24">
      {/* Section grain — opt-in 3 % fractalNoise overlay. */}
      <div aria-hidden="true" className="grain absolute inset-0 pointer-events-none" />

      <div className="relative z-10 tj-container">
        {/* Cabecera PARTIDA — titular a un lado, entradilla al otro.
            Aquí estaba el `max-w-2xl` con todo apilado a la izquierda,
            igual que en las otras diecisiete secciones del sitio: media
            pantalla vacía a la derecha y la misma presentación por
            enésima vez. Esta sección es la que mejor admite la partida
            porque su entradilla tiene cuerpo suficiente para sostener
            una columna propia. Ver `SectionHeader`. */}
        <SectionHeader
          composicion="partida"
          etiqueta={es ? "Principios" : "Principles"}
          titulo={
            es ? (
              <>
                Lo que <span className="text-gradient">creemos.</span>
              </>
            ) : (
              <>
                What we <span className="text-gradient">believe.</span>
              </>
            )
          }
          entradilla={
            es
              ? "Cuatro ideas que no son negociables. Si algún día dejamos de cumplirlas, la app deja de tener sentido."
              : "Four ideas that aren't negotiable. If we ever stop delivering on them, the app stops making sense."
          }
        />

        {/* 2×2 grid
            T2d — `gap-5 md:gap-6` (20px / 24px) entre tarjetas (era
            `gap-5` 20px fijo): en móvil el Δ es nulo, en desktop sube
            4px para que las 4 tarjetas respiren sin abrirse un hueco
            tipográfico. El grid sigue 1-col en móvil, 2-col en md+ (que
            es el 2×2 efectivo en lg). */}
        {/* ── Cuatro asientos, no cuatro tarjetas ─────────────────────
            Eran cajas de papel translúcido con sombra, esquina
            redondeada y un salto de 4 px al pasar el ratón. Cuatro
            afirmaciones de principios no son cuatro objetos que se
            cogen: son las entradas de una declaración.

            Pasan a una retícula de filetes, como el cuadro de cifras.
            `gap` a 0 para que los trazos se toquen y formen cuadrícula
            en vez de cuatro marcos sueltos; la separación la da el
            relleno interior. */}
        <div className="mt-10 grid md:grid-cols-2 border-t border-[rgb(var(--divider)/0.14)]">
          {VALUES.map((v, i) => (
            <Reveal key={v.href} delay={0.1 + i * 0.08} className="h-full">
              {/* Sin `data-entra`: la entrada ya la pone el `Reveal` de
                  arriba con su propio retardo escalonado. Este elemento
                  era un `motion.article` SIN props de animación —sólo un
                  envoltorio— y darle una entrada propia lo haría aparecer
                  dos veces. */}
              <article
                /* Sin salto al pasar por encima: una entrada de
                   declaración no se levanta. La única respuesta al
                   puntero es que el filo de acento del lateral se
                   marque — ya estaba y se conserva. */
                className="group relative h-full overflow-hidden border-b border-[rgb(var(--divider)/0.14)] py-6 pr-6 md:[&]:pl-0 transition-colors duration-300"
              >
                {/* Accent edge — grows on hover. Scaled up from 1.25 → 1.4
                    for a more pronounced lift; the base color is now a low
                    alpha accent tint (20 %) instead of a neutral divider
                    hairline so the brand reads through at rest and the rule
                    reads as a deliberate accent stripe, not just a brighter
                    neutral separator. Hover pushes to a 65 % accent tint. */}
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-6 bottom-6 w-px bg-[rgb(var(--accent-base)/0.20)] origin-center transition-[transform,background-color] duration-300 group-hover:scale-y-[1.4] group-hover:bg-[rgb(var(--accent-base)/0.65)]"
                />

                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {/* Icon container — switched from rounded-md to rounded-lg
                        to mirror the card radius (8px / .rounded-card) for a
                        cohesive surface language. Hover tints the icon stroke
                        to the accent green so the affordance reads as a live
                        accent, not a static mono glyph. Adds an inset accent
                        ring at base (0.18 alpha) so the icon reads as a
                        branded mark at rest, not a neutral chip — the brand
                        color is present before hover. The base ring deepens
                        to 0.30 on hover to match the existing hover shadow. */}
                    <span
                      className="shrink-0 w-10 h-10 rounded-[2px] bg-[rgb(var(--divider)/0.05)] border border-[rgb(var(--accent-base)/0.18)] flex items-center justify-center text-tertiary transition-colors duration-300 group-hover:text-[rgb(var(--accent-base))] group-hover:border-[rgb(var(--accent-base)/0.30)]"
                      aria-hidden="true"
                    >
                      {v.icon}
                    </span>
                  </div>
                </div>

                <h3 className="relative mt-5 t-h3 text-primary">
                  {es ? v.titleEs : v.titleEn}
                </h3>
                {/* T2d — `leading-[1.65]` + `max-w-[42em]` en la
                    descripción (era `leading-relaxed` = 1.625 sin
                    tope de ancho). El spec pide line-height 1.6 y
                    max-width ~42em para legibilidad móvil; en móvil el
                    max-width no activa (la tarjeta es <42em) pero en
                    desktop evita que las líneas se estiren demasiado en
                    la columna ancha. */}
                <p className="relative mt-2.5 text-sm text-secondary leading-[1.65] max-w-[42em]">
                  {es ? v.descEs : v.descEn}
                </p>

                {/* Dónde se comprueba. Va DESPUÉS de la afirmación, no
                    antes: primero se dice, luego se ofrece ir a mirar.
                    El subrayado se declara para ratón Y teclado, y el
                    filete crece con el mismo gesto que el del lateral. */}
                <Link
                  href={v.href}
                  className="relative mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[rgb(var(--accent-base))] underline decoration-[rgb(var(--accent-base)/0.35)] decoration-1 underline-offset-4 outline-none transition-colors duration-200 hover:decoration-[rgb(var(--accent-base))] focus-visible:rounded-[2px] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
                >
                  {es ? v.pruebaEs : v.pruebaEn}
                  <span aria-hidden="true">→</span>
                </Link>
              </article>
            </Reveal>
          ))}
        </div>

        {/* Footer coda — divider hidden on mobile so the long ES copy
            ("No son eslóganes. Son decisiones de producto." ~280px at
            text-sm) doesn't overflow the 335px content box when paired
            with the 64px divider + 12px gap. Text centers on mobile,
            returns to the left-aligned divider+text rhythm at sm+. */}
        <Reveal delay={0.4}>
          <div className="mt-10 flex items-center gap-3 text-sm text-tertiary justify-center text-center sm:justify-start sm:text-left">
            <span className="divider-grad w-16 hidden sm:block" aria-hidden />
            <span>
              {es
                ? "No son eslóganes. Son decisiones de producto."
                : "Not slogans. Product decisions."}
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---- Inline icons (stroke = currentColor, 20px) ----
   T2d — bump 18 → 20px para acercarse al rango 24-28px del spec
   sin saturar el container `w-9 h-9` (36px) que les deja 8px de
   padding alrededor. Las 4 mantienen el mismo viewBox 16x16 y
   strokeWidth 1.3 para que el peso visual sea idéntico entre sí. */
function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="10.5" r="1" fill="currentColor" />
    </svg>
  );
}
function CoinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5.4" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 5v6M6.4 6.4h2.4a1.2 1.2 0 0 1 0 2.4H7.2m0 0h1.6a1.2 1.2 0 0 1 0 2.4H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1.5 3 3.5v3.2c0 3 2.2 5.6 5 6.8 2.8-1.2 5-3.8 5-6.8V3.5L8 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M5.8 8.2l1.6 1.6L10.4 6.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CompassIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5.4" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10.2 5.8 8.8 8.8 5.8 10.2 7.2 7.2l3-1.4Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}
