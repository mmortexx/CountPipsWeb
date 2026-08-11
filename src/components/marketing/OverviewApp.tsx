"use client";

import { Link } from "@/components/tj/LocaleLink";
import { ShieldCheck, ArrowRight, Play } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { getKpis } from "@/lib/trading/fixtures";
import { WindowFrame } from "@/components/tj/WindowFrame";
import { FeatureImage } from "@/components/tj/FeatureImage";
import { asset } from "@/lib/asset";
import { withLocale } from "@/lib/locale";

/**
 * OverviewApp — sección `#overview` del HTML. Muestra la app con el
 * chrome de ventana (barra de título + tabs), los KPIs y la curva de
 * rendimiento + calendario, todo estático. Sin tabs interactivas (la
 * versión interactiva completa vive en /demo).
 *
 * Los datos vienen de `src/lib/trading/fixtures.ts`.
 */
export function OverviewApp() {
  const { lang } = useLang();
  const es = lang === "es";
  const kpis = getKpis();

  return (
    <section
      id="overview"
      // R27-1b — `bg-veil` added: in light theme the eye WebGL
      // background (bright red/green fibers) was showing through this
      // transparent section, washing out the "Todo tu día de trading,
      // en una pantalla" heading + body copy + the trust badge rail
      // below the CTAs. `bg-veil` mixes the page bg at 82 % in light
      // (74 % in dark) — enough to occlude the eye while the section's
      // decorative halos (right-side radial + bottom vignette) still
      // paint on top and read as soft accent blooms. The left column's
      // heading + copy + trust badges also get the `tj-legible-text`
      // halo (applied on the inner wrapper below) so any residual
      // brightening from the section's own accent halo (right-side
      // radial at top:-160) doesn't wash out the text.
      className="section relative overflow-clip bg-veil scroll-mt-24"
    >
      {/* Halo derecho superior */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 70% at 74% -12%, color-mix(in oklab, var(--ink) 6%, transparent), transparent 58%)",
        }}
      />
      {/* Halo accent derecho */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          top: -160,
          right: -40,
          width: 680,
          height: 560,
          background:
            "radial-gradient(circle, color-mix(in oklab, rgb(var(--accent-base)) 13%, transparent), transparent 72%)",
          filter: "blur(64px)",
          /* Halo bajado de 0.28 a 0.10 y SIN el bucle `tj-glow` de 9 s.
             Una mancha de color latiendo en la esquina es adorno puro:
             no marca nada, y el latido llama la atención sobre el vacío.
             Se conserva a intensidad mínima solo como separación tonal
             entre esta sección y el hero. */
          opacity: 0.1,
        }}
      />
      {/* Viñeta inferior */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 120%, transparent, var(--bg) 78%)",
        }}
      />

      <div className="relative max-w-[1280px] mx-auto px-5 md:px-8">
        {/* Cabecera de sección */}
        <div className="flex items-center justify-between flex-wrap gap-4 pb-3.5 border-b" style={{ borderColor: "rgb(var(--divider) / 0.06)" }}>
          <div className="inline-flex items-center gap-3">
            <span
              className="tnum"
              style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.04em", color: "rgb(var(--accent-base))" }}
            >
              § 01
            </span>
            <span aria-hidden style={{ width: 20, height: 1, background: "rgb(var(--divider) / 0.13)" }} />
            <span
              className="tnum"
              style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--ink-3)" }}
            >
              {es ? "EL PRODUCTO EN VIVO" : "THE PRODUCT LIVE"}
            </span>
          </div>
          <div className="inline-flex items-center gap-3.5">
            <span
              className="tnum"
              style={{ fontSize: 11, letterSpacing: "0.14em", color: "var(--ink-3)" }}
            >
              WINDOWS 10 · 11 — NATIVE
            </span>
            <span aria-hidden style={{ width: 1, height: 12, background: "rgb(var(--divider) / 0.13)" }} />
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block rounded-full"
                /* Punto de estado sin latido: el color ya dice lo que
                   tiene que decir. */
                style={{ width: 5, height: 5, background: "rgb(var(--pnl-pos))" }}
              />
              {/* Aquí vivía un reloj fijo, "18:04:22", mientras la barra
                  de navegación enseña la hora real en UTC a tres dedos de
                  distancia: dos horas que se contradicen en la misma
                  pantalla, en una página que vende rigor con los datos.
                  Se sustituye por el dato que sí es cierto siempre. */}
              <span
                className="tnum uppercase"
                style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--ink-2)" }}
              >
                {es ? "Datos locales" : "Local data"}
              </span>
            </span>
          </div>
        </div>

        {/* Grid 2 columnas */}
        <div className="relative mt-12 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-11 items-center">
          {/* Esquinas decorativas */}
          <span aria-hidden className="absolute -left-3.5 -top-4 w-3 h-3 border-l border-t" style={{ borderColor: "rgb(var(--divider) / 0.13)" }} />
          <span aria-hidden className="absolute -right-3.5 -top-4 w-3 h-3 border-r border-t" style={{ borderColor: "rgb(var(--divider) / 0.13)" }} />
          <span aria-hidden className="absolute -left-3.5 -bottom-4 w-3 h-3 border-l border-b" style={{ borderColor: "rgb(var(--divider) / 0.13)" }} />
          <span aria-hidden className="absolute -right-3.5 -bottom-4 w-3 h-3 border-r border-b" style={{ borderColor: "rgb(var(--divider) / 0.13)" }} />

          {/* Columna izquierda: copy + CTA */}
          {/* R27-1b — `tj-legible-text` on the left column: even with
              `bg-veil` occluding the eye, the section's own right-side
              accent halo (radial at top:-160, opacity 0.28, blurred
              64px) and the right column's mockup halo (radial at
              62% 32%, opacity 0.42, blurred 44px) both bleed into the
              left column's text area at certain scroll positions
              (the halos are absolute, so they don't track the column).
              The theme-aware text-shadow halo (white halo in light
              theme, dark halo in dark) lifts the heading + body copy
              + trust badges above any localised brightening. The
              right column's mockup is unaffected (WindowFrame has its
              own opaque surface) — the class is scoped to the left
              column only. */}
          <div className="tj-legible-text">
            <h2
              data-entra
              className="font-serif m-0"
              style={{
                // R21-3a — mobile min dropped 2.4rem -> 2rem so the
                // forced first line "Todo tu día de trading," (≈22 chars)
                // fits inside the 327px mobile content box without
                // clipping. The vw scale (3.3vw) is preserved so the
                // type still grows to 3.9rem on wide viewports.
                fontSize: "clamp(2rem, 3.3vw, 3.9rem)",
                lineHeight: 1,
                letterSpacing: "-0.02em",
                color: "var(--ink)",
                textWrap: "balance",
              }}
            >
              {es ? (
                <>
                  Todo tu día de trading,
                  <br />
                  <span style={{ fontStyle: "italic", position: "relative" }}>
                    en una pantalla
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        // R26-2c — `0.08em` → `-0.12em`: at the prior
                        // `0.08em` the bar sat inside the descender zone
                        // (between baseline and the "p" tip in "pantalla")
                        // and visually crossed the descender stroke —
                        // reading as a strikethrough on the "p" rather
                        // than an underline. `-0.12em` pushes the bar's
                        // top edge ~2px below the descender tips at the
                        // mobile min (32px) and ~5.5px at the desktop
                        // max (62.4px), so the accent stroke reads as a
                        // clean marker rule under the italic phrase at
                        // every breakpoint.
                        bottom: "-0.12em",
                        height: 2,
                        background: "rgb(var(--accent-base))",
                        opacity: 0.8,
                      }}
                    />
                  </span>
                  <span style={{ color: "var(--ink-3)" }}>.</span>
                </>
              ) : (
                <>
                  Your whole trading day,
                  <br />
                  <span style={{ fontStyle: "italic", position: "relative" }}>
                    on one screen
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: "-0.12em",
                        height: 2,
                        background: "rgb(var(--accent-base))",
                        opacity: 0.8,
                      }}
                    />
                  </span>
                  <span style={{ color: "var(--ink-3)" }}>.</span>
                </>
              )}
            </h2>
            <p
              className="mt-7 mb-0 break-words"
              style={{
                maxWidth: "33em",
                fontSize: "clamp(1.02rem, 1.35vw, 1.16rem)",
                lineHeight: 1.64,
                color: "var(--ink-2)",
              }}
            >
              {es
                ? "Una sola pantalla con el estado real de la cuenta: resultado del periodo, curva de capital, riesgo abierto y qué operación toca revisar. Sin abrir informes ni cruzar hojas de cálculo."
                : "One screen with the account's real state: period result, equity curve, open risk, and which trade needs reviewing. No reports to open, no spreadsheets to cross-check."}
            </p>
            {/* CTAs — calcados del hero tras el rediseño institucional:
                rectángulos de 4 px, sin sheen, sin sombra de acento, sin
                elevación al pasar por encima. El realce es un cambio de
                color, declarado igual para ratón y teclado. */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/beta"
                className="inline-flex h-[50px] w-full items-center justify-center gap-2.5 rounded-[2px] px-7 text-[15px] font-semibold outline-none transition-colors duration-150 hover:bg-[rgb(var(--accent-hover))] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] sm:w-auto"
                style={{ background: "rgb(var(--accent-base))", color: "rgb(var(--accent-ink))" }}
              >
                {es ? "Solicitar acceso anticipado" : "Request early access"}
                <ArrowRight size={16} aria-hidden />
              </Link>
              <Link
                href="/demo"
                className="inline-flex h-[50px] w-full items-center justify-center gap-2.5 rounded-[2px] border px-7 text-[15px] font-semibold text-[var(--ink)] outline-none transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--ink)_6%,transparent)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] sm:w-auto"
                style={{ borderColor: "rgb(var(--divider) / 0.20)" }}
              >
                <Play size={14} fill="currentColor" aria-hidden />
                {es ? "Ver la demo" : "See the demo"}
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-x-3.5 gap-y-2">
              {[
                "100% LOCAL",
                es ? "DEMO PÚBLICA" : "PUBLIC DEMO",
                "ES · EN",
                es ? "SIN TARJETA" : "NO CARD",
              ].map((label, i) => (
                <span key={label} className="flex items-center gap-3.5">
                  {i > 0 && (
                    <span
                      aria-hidden
                      className="hidden sm:inline-block"
                      style={{ width: 1, height: 11, background: "rgb(var(--divider) / 0.13)" }}
                    />
                  )}
                  <span
                    className="tnum"
                    style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--ink-3)" }}
                  >
                    {label}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Columna derecha: mockup de app */}
          <div className="relative">
            {/* Halo detrás del mockup */}
            <div
              aria-hidden
              className="pointer-events-none absolute"
              style={{
                inset: "-30px -20px",
                background:
                  "radial-gradient(60% 60% at 62% 32%, color-mix(in oklab, rgb(var(--accent-base)) 12%, transparent), transparent 74%)",
                filter: "blur(44px)",
                opacity: 0.42,
                zIndex: 0,
              }}
            />
            {/* Float-card P&L */}
            <div
              // R26-2c — `hidden md:block` → `hidden lg:block`: the
              // grid is `grid-cols-1 lg:grid-cols-[1.1fr_1fr]`, so at
              // md (768–1023px) the layout is still 1-col and the
              // float-card's `left: -64` was pushing it off-screen to
              // the left of the single column. Showing the cards only
              // at lg+ (where the 2-col grid is active and the right
              // column has room for them) keeps them on-canvas.
              className="absolute z-10 hidden lg:block"
              style={{
                // Antes `left: -64`: la ficha se salía 64 px del mockup y
                // aterrizaba encima del párrafo de la columna izquierda,
                // tapando media línea de texto. 24 px basta para que
                // "flote" sobre el borde sin invadir la columna vecina.
                left: -24,
                top: 150,
                border: "1px solid rgb(var(--divider) / 0.13)",
                borderRadius: 3,
                background: "color-mix(in oklab, var(--surface) 94%, transparent)",
                backdropFilter: "blur(8px)",
                boxShadow: "var(--shadow, 0 1px 2px rgb(0 0 0 / 0.5), 0 44px 84px -30px rgb(0 0 0 / 0.78))",
                padding: "12px 14px",
                minWidth: 148,
                /* Sin `tj-float`: estas fichas muestran DATOS (P&L,
                   estado del guardián). Un dato que flota arriba y abajo
                   en bucle se lee como decoración y resta credibilidad
                   justo a lo que debería darla. Quedan quietas. */
              }}
            >
              <div
                className="tnum"
                style={{ fontSize: 8.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-3)" }}
              >
                {es ? "P&L total · 6M" : "Total P&L · 6M"}
              </div>
              <div
                className="tnum"
                style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.1, color: kpis.pnl.color }}
              >
                {kpis.pnl.v}
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="tnum" style={{ fontSize: 10, color: kpis.pnl.deltaColor }}>
                  {kpis.pnl.delta}
                </span>
                <svg width={46} height={14} viewBox="0 0 46 14" preserveAspectRatio="none" aria-hidden>
                  <path
                    d="M0,11 L9,9 L18,10 L27,5 L36,6 L46,2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.4}
                    strokeLinejoin="round"
                    style={{ color: kpis.pnl.color }}
                  />
                </svg>
              </div>
            </div>
            {/* Float-card Guardián activo */}
            <div
              className="absolute z-10 hidden lg:flex items-center gap-2.5"
              style={{
                left: -56,
                bottom: 40,
                border: "1px solid rgb(var(--divider) / 0.13)",
                borderRadius: 3,
                background: "color-mix(in oklab, var(--surface) 94%, transparent)",
                backdropFilter: "blur(8px)",
                boxShadow: "var(--shadow, 0 1px 2px rgb(0 0 0 / 0.5), 0 44px 84px -30px rgb(0 0 0 / 0.78))",
                padding: "11px 13px",
                /* Sin `tj-float`, mismo motivo que la ficha de arriba. */
              }}
            >
              <span
                className="inline-grid place-items-center"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 3,
                  flex: "none",
                  background: "color-mix(in oklab, rgb(var(--accent-base)) 16%, transparent)",
                  color: "rgb(var(--accent-base))",
                  // Inset accent ring + top specular highlight turn the
                  // flat tinted square into a machined shield badge —
                  // reads as "protected" rather than just "greenish
                  // square". Both layers are theme-agnostic (the ring
                  // is accent-tinted, the highlight is white-at-8%).
                  boxShadow:
                    "inset 0 0 0 1px rgb(var(--accent-base) / 0.30), inset 0 1px 0 rgb(255 255 255 / 0.08)",
                }}
              >
                <ShieldCheck size={15} aria-hidden />
              </span>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink)", lineHeight: 1.1 }}>
                  {es ? "Guardián activo" : "Guardian active"}
                </div>
                <div
                  className="tnum"
                  style={{ fontSize: 9.5, color: "var(--ink-3)", marginTop: 2 }}
                >
                  {es ? "Riesgo 1 % / operación" : "Risk 1% / trade"}
                </div>
              </div>
            </div>

            {/* Mockup de la ventana de la app — USA LA CAPTURA REAL
                (app-resumen.webp) dentro de un WindowFrame, en vez de
                un mockup hecho a mano que no coincidía con la app real. */}
            {/* R26-2c — `duration-300 ease-out hover:-translate-y-1` added:
                the wrapper already declared `transition-transform` +
                `willChange: transform` (a hover transform was obviously
                intended) but no transform was ever applied, so the
                declarations were inert. A 1px lift on hover gives the
                premium "the screenshot responds to my cursor" feel
                without competing with the float-cards' own `tj-float`
                animation (different transform axis + slower 300ms ease). */}
            <div className="relative z-[2] transition-transform duration-300 ease-out hover:-translate-y-1" style={{ willChange: "transform" }}>
              <WindowFrame caption="CountPips — Resumen">
                {/* Las dos capturas de la misma pantalla, una por tema. La
                    clase la resuelve `globals.css` contra `data-theme` del
                    `:root`. Antes se servía siempre la clara: en modo
                    oscuro, el marco enseñaba una pantalla blanca de una
                    aplicación que también tiene modo oscuro. */}
                {([
                  { clase: "tj-captura--oscura", archivo: "app-resumen-oscuro.webp" },
                  { clase: "tj-captura--clara", archivo: "app-resumen.webp" },
                ] as const).map(({ clase, archivo }) => (
                  <FeatureImage
                    key={clase}
                    src={asset(`/img/${archivo}`)}
                    alt={es
                      ? "Pantalla de Resumen de CountPips: curva de rendimiento, KPIs y calendario P&L"
                      : "CountPips Overview screen: performance curve, KPIs and P&L calendar"}
                    fit="contain"
                    className={`${clase} absolute inset-0 h-full w-full`}
                    overlay={0}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                ))}
              </WindowFrame>
              <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-1.5">
                <span className="tnum" style={{ fontSize: 10, color: "var(--ink-3)" }}>
                  {es ? "Vista Resumen · la app real" : "Summary view · the real app"}
                </span>
                <a href={asset(withLocale("/demo", lang))} style={{ fontSize: 11, color: "rgb(var(--accent-base))" }}>
                  {es ? "Explorar la demo →" : "Explore the demo →"}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* Aquí quedaban `Kpi` y `parseInlineStyle`, más las llamadas a `getPerf()`
   y `getCal()` cuyo resultado no leía nadie. Son el sedimento de cuando
   este componente montaba las cifras a partir de cadenas de CSS generadas
   en `fixtures.ts`; hoy los KPI se maquetan en el propio JSX y los estilos
   se escriben como objetos. `parseInlineStyle` además decía en su
   documentación que "solo se usa para los strings generados por
   fixtures.ts" — una frase en presente sobre algo que ya no ocurría. */
