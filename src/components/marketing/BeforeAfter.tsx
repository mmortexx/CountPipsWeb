"use client";

import { useLang } from "@/lib/i18n";
import { Reveal } from "@/components/tj/Reveal";
import { SectionHeader } from "@/components/layout/SectionHeader";

/**
 * BeforeAfter — la sección «Antes vs Después».
 *
 * Dos láminas de papel en paralelo en escritorio, apiladas en móvil,
 * separadas por una flecha (→ en escritorio, ↓ en móvil) rotulada «La
 * transformación».
 *
 * Conservan superficie y no pasan a retícula: lo que hay dentro son dos
 * listas de frases contrapuestas —narrativa, no dato—, y la comparación
 * se sostiene en que se lean como dos hojas enfrentadas.
 *
 * Izquierda (Antes): iconos ✗ rojos, filete y lavado rojos, y el texto en
 *   terciario. El apagado lo da el color, NO la opacidad del contenedor:
 *   reposaba en `opacity: 0.7` y eso dejaba su texto en 3,68:1, por
 *   debajo del mínimo exigible.
 * Derecha (Después): iconos ✓ verdes y filete de acento. Ninguna de las
 *   dos se levanta al pasar el ratón — no son botones, y levantar sólo
 *   una desnivelaba la comparación.
 */
export function BeforeAfter() {
  const { lang } = useLang();
  const es = lang === "es";

  const before = es
    ? [
        "Operas por instinto",
        "No recuerdas por qué entraste",
        "Repites los mismos errores",
        "No sabes tu win rate real",
        "Pierdes dinero y no sabes por qué",
      ]
    : [
        "You trade on instinct",
        "You don't remember why you entered",
        "You repeat the same mistakes",
        "You don't know your real win rate",
        "You lose money and don't know why",
      ];

  const after = es
    ? [
        "Cada operación tiene un plan",
        "Sabes exactamente qué funcionó y qué no",
        "Tu disciplina se mide en dinero",
        "Conoces tu expectancy por setup",
        "Mejoras cada semana, medido",
      ]
    : [
        "Every trade has a plan",
        "You know exactly what worked and what didn't",
        "Your discipline is measured in money",
        "You know your expectancy per setup",
        "You improve every week, measured",
      ];

  return (
    <section className="section bg-veil relative overflow-clip">
      <div className="relative z-10 tj-container">
        <SectionHeader
          composicion="centrada"
          etiqueta={es ? "La transformación" : "The transformation"}
          titulo={es ? (
              <>
                El mismo trader.{" "}
                <span className="text-gradient">Dos resultados.</span>
              </>
            ) : (
              <>
                The same trader.{" "}
                <span className="text-gradient">Two outcomes.</span>
              </>
            )}
          entradilla={es
              ? "No te prometemos magia. Te prometemos un espejo: lo que haces hoy, sin maquillaje, y lo que podrías hacer si cada operación tuviera un plan."
              : "We don't promise magic. We promise a mirror: what you do today, without makeup, and what you could do if every trade had a plan."}
        />

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-stretch">
          {/* ───────── BEFORE — muted, desaturated, red ✗ ───────── */}
          <Reveal className="h-full flex flex-col">
            {/* Tinted header pill */}
            <div className="mb-3 self-start inline-flex items-center gap-2 px-3 py-1.5 rounded-[2px] bg-pnl-neg/10 border border-pnl-neg/25">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pnl-neg/15 text-pnl-neg">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              <span className="t-label text-pnl-neg">
                {es ? "Antes del diario" : "Before the journal"}
              </span>
            </div>
            {/* ── La tarjeta «antes», apagada sin bajar la opacidad ──────
                Reposaba en `opacity: 0.7` con un `saturate(0.85)` encima,
                y eso NO era un recurso de estilo: dejaba su texto —14 px,
                `text-secondary`— en 3,68:1 sobre la chapa clara, por
                debajo del 4,5:1 que exige un texto normal. Apagar un
                bloque bajándole la opacidad apaga también su legibilidad,
                y con el material translúcido del papel el efecto sería
                aún peor.

                El apagado ahora lo da el COLOR del contenido (el texto
                baja a terciario, 4,53:1, que sí cumple) y el lavado rojo
                del fondo. La opacidad vuelve a 1.

                Fuera también el `saturate(0.85)`: lo único con color aquí
                es el rojo de resultado, y desaturar precisamente eso va
                en contra de la regla de la página — el color significa
                dinero y nada más lo usa. */}
            <div
              data-entra
              className="tj-paper relative flex-1 min-w-0 rounded-[2px] overflow-hidden border border-pnl-neg/30"
            >
              {/* Soft red wash */}
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(120% 80% at 50% 0%, rgb(var(--pnl-neg) / 0.10), transparent 60%)",
                }}
              />
              <ul className="relative p-6 md:p-7 space-y-4">
                {before.map((line, i) => (
                  <li
                    data-entra="ciclo"
                    key={i}
                    className="flex items-start gap-3"
                  >
                    {/* R20-3b: ✗ icon container — added ring-1 ring-pnl-neg/35
                        so the disc reads as a stamped seal against the
                        desaturated Before card (the bg-pnl-neg/15 fill alone
                        was barely distinguishable from the red wash behind it). */}
                    <span className="inline-flex shrink-0 w-5 h-5 rounded-full bg-pnl-neg/15 ring-1 ring-pnl-neg/35 items-center justify-center mt-0.5">
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path d="M3 3l6 6M9 3l-6 6" stroke="rgb(var(--pnl-neg))" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </span>
                    {/* Terciario, no secundario: es aquí donde vive ahora
                        el «apagado» de esta columna, en vez de en la
                        opacidad del contenedor. 4,53:1 sobre la chapa. */}
                    <span className="text-[14px] text-tertiary">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* ───────── DIVIDER — arrow → (desktop) / ↓ (mobile) ───────── */}
          <Reveal
            delay={0.1}
            className="flex lg:flex-col items-center justify-center gap-3 lg:py-6"
          >
            <span className="text-[10px] uppercase tracking-[0.14em] text-tertiary font-semibold whitespace-nowrap">
              {es ? "La transformación" : "The transformation"}
            </span>
            <span
              data-entra="sello"
              className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-[rgb(var(--divider)/0.08)] text-primary ring-1 ring-[rgb(var(--divider)/0.25)]"
              aria-hidden="true"
            >
              {/* ↓ arrow — mobile */}
              <svg className="relative block lg:hidden" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 3v9M4 8l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {/* → arrow — desktop */}
              <svg className="relative hidden lg:block" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h9M8 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Reveal>

          {/* ───────── AFTER — vibrant, accent glow, ✓, slightly larger ───────── */}
          <Reveal delay={0.2} className="h-full flex flex-col">
            {/* Tinted header pill */}
            <div className="mb-3 self-start inline-flex items-center gap-2 px-3 py-1.5 rounded-[2px] bg-[rgb(var(--accent-base)/0.1)] border border-[rgb(var(--accent-base)/0.3)]">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[rgb(var(--accent-base)/0.15)] text-[rgb(var(--accent-base))]">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2 6.5l2.5 2.5L10 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="t-label text-[rgb(var(--accent-base))]">
                {es ? "Con CountPips" : "With CountPips"}
              </span>
            </div>
            {/* La tarjeta «después», en el mismo papel que su pareja. El
                borde de acento es lo único que las distingue, y con eso
                basta: son dos estados del mismo trader, no dos productos.

                Fuera el salto de 4 px al pasar el ratón. Estas dos
                tarjetas no se pulsan ni llevan a ningún sitio, y levantar
                sólo una de las dos rompía además la comparación, que se
                sostiene precisamente en que estén al mismo nivel. */}
            <div
              data-entra="4"
              className="tj-paper relative flex-1 min-w-0 rounded-[2px] overflow-hidden border border-[rgb(var(--accent-base)/0.28)]"
            >
              {/* Accent wash */}
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(120% 80% at 50% 0%, rgb(var(--accent-base) / 0.12), transparent 60%)",
                }}
              />
              {/* Static accent top-line */}
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px opacity-70"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgb(var(--accent-base)), transparent)",
                }}
              />
              <ul className="relative p-7 md:p-8 space-y-4">
                {after.map((line, i) => (
                  <li
                    data-entra="ciclo"
                    key={i}
                    className="flex items-start gap-3"
                  >
                    {/* R20-3b: ✓ icon container — ring-1 ring-pnl-pos/40 for
                        parity with the ✗ container polish above; the disc
                        reads as a confirmed-state badge rather than a flat tint. */}
                    <span className="inline-flex shrink-0 w-5 h-5 rounded-full bg-pnl-pos/15 ring-1 ring-pnl-pos/40 items-center justify-center mt-0.5">
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path d="M2 6.5l2.5 2.5L10 3.5" stroke="rgb(var(--pnl-pos))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="text-[14px] text-primary font-medium">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        {/* Footnote */}
        <Reveal delay={0.18} className="mt-8">
          <p className="text-xs text-tertiary text-center max-w-2xl mx-auto">
            {es
              ? "Sin promesas de rentabilidad. Solo la disciplina de mirarte — y la herramienta para hacerlo en serio."
              : "No profitability promises. Only the discipline of looking at yourself — and the tool to do it seriously."}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
