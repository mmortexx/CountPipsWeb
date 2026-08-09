"use client";

import { Link } from "@/components/tj/LocaleLink";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Share2, Check, Link2 } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Reveal } from "@/components/tj/Reveal";

/**
 * FeaturePageNav — cross-navigation section for feature subpages.
 * Sits between the page content and FinalCTANew. Provides:
 *  - A "Compartir" (Share) button using the Web Share API with a
 *    clipboard-copy fallback (graceful on desktop browsers without
 *    Web Share).
 *  - Prev / Next links to the other feature subpages so visitors can
 *    browse the three deep-dive axes (Métricas → Disciplina → Seguridad)
 *    without going back to the /features overview.
 *  - A "Sigue explorando" card grid linking to all three subpages,
 *    highlighting the current one.
 *
 * The component is fully theme-aware (uses --divider, --surface, text-primary/
 * secondary/tertiary tokens) and matches the site's tj-paper material
 * language.
 */

type Axis = "metricas" | "disciplina" | "seguridad";

const AXES: Record<
  Axis,
  { href: string; labelEs: string; labelEn: string; descEs: string; descEn: string; icon: string }
> = {
  metricas: {
    href: "/features/metricas",
    labelEs: "Métricas",
    labelEn: "Metrics",
    descEs: "40+ ratios institucionales y calculadora de riesgo",
    descEn: "40+ institutional ratios and risk calculator",
    icon: "M2 13V7M6 13V3M10 13V9M14 13V5",
  },
  disciplina: {
    href: "/features/disciplina",
    labelEs: "Disciplina",
    labelEn: "Discipline",
    descEs: "El Guardián frena antes del error",
    descEn: "The Guardian brakes before the error",
    icon: "M8 1.6 2.9 3.8v3.5c0 3.1 2.2 5.5 5.1 6.5 2.9-1 5.1-3.4 5.1-6.5V3.8L8 1.6Z",
  },
  seguridad: {
    href: "/features/seguridad",
    labelEs: "Seguridad",
    labelEn: "Security",
    descEs: "Local-first, sin nube ni cuentas",
    descEn: "Local-first, no cloud, no accounts",
    icon: "M5 7V5a3 3 0 016 0v2M4 7h8v7H4V7z",
  },
};

const ORDER: Axis[] = ["metricas", "disciplina", "seguridad"];

interface FeaturePageNavProps {
  current: Axis;
}

export function FeaturePageNav({ current }: FeaturePageNavProps) {
  const { lang } = useLang();
  const es = lang === "es";
  const [copied, setCopied] = useState(false);

  const currentIdx = ORDER.indexOf(current);
  const prev = currentIdx > 0 ? ORDER[currentIdx - 1] : null;
  const next = currentIdx < ORDER.length - 1 ? ORDER[currentIdx + 1] : null;
  const router = useRouter();

  // Keyboard navigation: Alt + ArrowLeft/ArrowRight to browse between
  // feature subpages without scrolling to the bottom nav. Respects
  // reduced-motion users (no smooth scroll, just route change). Skips
  // when the user is typing in an input/textarea/contenteditable.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const dest = e.key === "ArrowLeft" ? prev : next;
      if (!dest) return;
      e.preventDefault();
      router.push(AXES[dest].href);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, router]);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = document.title;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled — no-op.
      }
    } else {
      // Fallback: copy to clipboard.
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Clipboard API unavailable — no-op.
      }
    }
  };

  return (
    <section className="section-tight bg-veil relative overflow-hidden border-t border-[rgb(var(--divider)/0.06)]">
      <div className="relative tj-container">
        {/* Share button — top-right */}
        <Reveal className="flex justify-center mb-10">
          <button
            onClick={handleShare}
            // T2h: bumped h-10 → min-h-[44px] (h-11 = 44px) so the
            // share control meets the ≥44px touch-target spec on mobile.
            className="inline-flex items-center gap-2 min-h-[44px] bg-[rgb(var(--divider)/0.04)] px-5 rounded-[2px] text-sm font-medium text-primary border border-[rgb(var(--divider)/0.15)] hover:bg-[rgb(var(--divider)/0.06)] hover:-translate-y-0.5 transition-[background-color,transform] duration-200"
            aria-label={es ? "Compartir esta página" : "Share this page"}
          >
            {copied ? (
              <>
                <Check size={15} className="text-pnl-pos" />
                {es ? "¡Enlace copiado!" : "Link copied!"}
              </>
            ) : (
              <>
                <Share2 size={15} className="text-tertiary" />
                {es ? "Compartir" : "Share"}
                <Link2 size={13} className="text-tertiary opacity-60" />
              </>
            )}
          </button>
        </Reveal>

        {/* Prev / Next navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {prev ? (
            <Reveal>
              <Link
                href={AXES[prev].href}
                // T2h: min-h-[44px] guarantees the prev/next cards meet
                // the ≥44px touch target on mobile regardless of label
                // height. Icon container bumped w-10 h-10 → w-11 h-11 (44px)
                // so the circular tap zone is comfortably tappable too.
                className="group tj-paper rounded-[2px] border border-[rgb(var(--divider)/0.13)] p-5 min-h-[44px] flex items-center gap-4 transition-[background-color,border-color,box-shadow,transform] duration-300 hover:border-[rgb(var(--accent-base)/0.30)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.6)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                {/* R24-1c: arrow icon container shifts on hover from neutral
                    divider bg + tertiary text to accent-tinted bg + accent
                    text, so the icon reads as the tap target rather than a
                    decorative bullet. */}
                <span className="grid place-items-center w-11 h-11 rounded-full bg-[rgb(var(--divider)/0.06)] text-tertiary group-hover:text-[rgb(var(--accent-base))] group-hover:bg-[rgb(var(--accent-base)/0.12)] transition-[background-color,color] duration-300 flex-none">
                  <ArrowLeft size={18} />
                </span>
                <span className="min-w-0">
                  {/* R24-1c: kbd hint now wears a hairline accent border +
                      accent dot before so the keyboard shortcut reads as a
                      real key rather than floating tertiary text. */}
                  <span className="block text-[10px] uppercase tracking-[0.14em] text-tertiary font-semibold mb-1">
                    <span aria-hidden className="inline-block w-1 h-1 rounded-full mr-1.5 align-middle" style={{ background: "rgb(var(--accent-base))" }} />
                    {es ? "Anterior" : "Previous"}
                    <kbd className="kbd ml-1.5" style={{ borderColor: "rgb(var(--accent-base) / 0.30)" }}>Alt ←</kbd>
                  </span>
                  <span className="block text-sm font-medium text-primary truncate">
                    {es ? AXES[prev].labelEs : AXES[prev].labelEn}
                  </span>
                </span>
              </Link>
            </Reveal>
          ) : (
            <div className="hidden md:block" aria-hidden />
          )}
          {next ? (
            <Reveal delay={0.06}>
              <Link
                href={AXES[next].href}
                className="group tj-paper rounded-[2px] border border-[rgb(var(--divider)/0.13)] p-5 min-h-[44px] flex items-center gap-4 transition-[background-color,border-color,box-shadow,transform] duration-300 hover:border-[rgb(var(--accent-base)/0.30)] md:flex-row-reverse md:text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.6)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                {/* R24-1c: mirror of the prev card’s icon-container polish. */}
                <span className="grid place-items-center w-11 h-11 rounded-full bg-[rgb(var(--divider)/0.06)] text-tertiary group-hover:text-[rgb(var(--accent-base))] group-hover:bg-[rgb(var(--accent-base)/0.12)] transition-[background-color,color] duration-300 flex-none">
                  <ArrowRight size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] uppercase tracking-[0.14em] text-tertiary font-semibold mb-1">
                    <span aria-hidden className="inline-block w-1 h-1 rounded-full mr-1.5 align-middle" style={{ background: "rgb(var(--accent-base))" }} />
                    {es ? "Siguiente" : "Next"}
                    <kbd className="kbd ml-1.5" style={{ borderColor: "rgb(var(--accent-base) / 0.30)" }}>Alt →</kbd>
                  </span>
                  <span className="block text-sm font-medium text-primary truncate">
                    {es ? AXES[next].labelEs : AXES[next].labelEn}
                  </span>
                </span>
              </Link>
            </Reveal>
          ) : (
            <div className="hidden md:block" aria-hidden />
          )}
        </div>

        {/* "Sigue explorando" — all three axes.
            T2h: mobile horizontal scroll rail (overflow-x-auto + snap-x)
            per the brief — the 3 axis cards become a swipeable carousel
            on touch (min-w-[260px] each, ~1.4 visible at 390px so the
            "peek" signals scrollability), and snap to grid-cols-3 on
            md+. The rail also gets a mobile-only right-edge gradient
            fade + a "Desliza →" hint, same vocabulary as the
            Comparison table. */}
        <Reveal delay={0.1}>
          <div className="text-center mb-6">
            <span className="eyebrow inline-flex items-center gap-2 justify-center text-tertiary">
              <span className="w-6 h-px bg-[rgb(var(--divider))] opacity-60" />
              {es ? "Sigue explorando" : "Keep exploring"}
              <span className="w-6 h-px bg-[rgb(var(--divider))] opacity-60" />
            </span>
          </div>
        </Reveal>
        {/* P6 — `-mx-5` → `-mx-[clamp(1.25rem,4vw,2.25rem)]`: the rail's
            negative margin now matches tj-container's fluid padding exactly
            (clamp tracks 4vw between 20–36px). Previously the fixed -20px
            left a 4–8px gutter on each side at 480–768px viewports where
            the container's 4vw padding exceeds 20px — the rail's left edge
            was visibly inset from the section above/below it. Inner px
            matches the same clamp so the cards inside re-establish the
            container's content edge. */}
        <div className="relative md:block -mx-[clamp(1.25rem,4vw,2.25rem)] md:mx-0">
          {/* Mobile-only right-edge gradient fade — signals "swipe for more".
              pointer-events-none keeps taps flowing to the underlying cards. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 md:hidden z-10"
            style={{
              background: "linear-gradient(to left, rgb(var(--bg) / 0.92), transparent)",
            }}
          />
          <div
            className="flex md:grid md:grid-cols-3 gap-3 md:gap-4 overflow-x-auto md:overflow-visible
 snap-x snap-mandatory md:snap-none px-[clamp(1.25rem,4vw,2.25rem)] md:px-0 pb-2 md:pb-0
                       [scrollbar-width:thin] [scrollbar-color:rgb(var(--accent-base)/0.4)_transparent]"
            style={{ scrollbarWidth: "thin" }}
          >
          {ORDER.map((axis, i) => {
            const isActive = axis === current;
            const a = AXES[axis];
            return (
              <Reveal key={axis} delay={i * 0.06} className="shrink-0 md:shrink min-w-[260px] md:min-w-0 snap-start md:snap-none">
                <Link
                  href={a.href}
                  aria-current={isActive ? "page" : undefined}
                  // Ninguna de las dos se levanta al pasar el ratón. La
                  // inactiva subía 4 px y la activa se quedaba quieta, y ese
                  // desnivel hacía que la tarjeta de la página actual pareciera
                  // deshabilitada en vez de actual. Ahora las dos se quedan en
                  // el plano y la diferencia la lleva el filete: la activa lo
                  // tiene marcado en acento de forma permanente, la inactiva lo
                  // marca al apuntarla.
                  // T2h: `min-h-[44px]` en el propio enlace para que toda la
                  //   tarjeta llegue al mínimo táctil aunque el texto sea corto.
                  className={`group relative tj-paper rounded-[2px] border p-5 block min-h-[44px] transition-[background-color,border-color] duration-300 ease-[var(--ease-suave)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.6)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
                    isActive
                      ? "border-[rgb(var(--accent-base)/0.4)]"
                      : "border-[rgb(var(--divider)/0.13)] hover:border-[rgb(var(--accent-base)/0.28)]"
                  }`
                  }
                >
                  {/* R20-3b: hover-only accent inner ring (inactive cards) —
                      sits behind content, fades in on hover to read as a
                      “this card is the target” affordance. Skipped on the
                      active card (it already has the static accent border). */}
                  {!isActive && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 rounded-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ boxShadow: "inset 0 0 0 1px rgb(var(--accent-base) / 0.30)" }}
                    />
                  )}
                  {isActive && (
                    // R20-3b: "Aqui" / "Here" badge - a stamped accent
                    //   badge (bg accent/12 + border accent/35) so the
                    //   "you are here" state reads as deliberate.
                    <span
                      aria-hidden
                      className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-[rgb(var(--accent-base)/0.12)] border border-[rgb(var(--accent-base)/0.35)] text-[10px] uppercase tracking-[0.12em] font-semibold text-[rgb(var(--accent-base))]"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--accent-base))]" />
                      {es ? "Aquí" : "Here"}
                    </span>
                  )}
                  <span
                    className="relative grid place-items-center w-9 h-9 rounded-lg mb-3 transition-[background-color,color,box-shadow] duration-300"
                    style={{
                      background: isActive
                        ? "rgb(var(--accent-base) / 0.14)"
                        : "rgb(var(--divider) / 0.06)",
                      color: isActive ? "rgb(var(--accent-base))" : "var(--ink-2)",
                      // Active card's icon container wears a hairline accent
                      // inset ring so the icon reads as selected rather
                      // than just a tinted square.
                      boxShadow: isActive
                        ? "inset 0 0 0 1px rgb(var(--accent-base) / 0.30)"
                        : undefined,
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                      <path d={a.icon} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="relative block text-sm font-semibold text-primary mb-1">
                    {es ? a.labelEs : a.labelEn}
                  </span>
                  <span className="relative block text-xs text-tertiary leading-relaxed">
                    {es ? a.descEs : a.descEn}
                  </span>
                </Link>
              </Reveal>
            );
          })}
          </div>
          {/* Mobile-only scroll hint — bidirectional arrows + label.
              Same vocabulary as the Comparison table's mobile hint. */}
          <div className="md:hidden mt-3 flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.14em] text-tertiary font-semibold">
            <span aria-hidden="true">←</span>
            <span>{es ? "Desliza para explorar" : "Swipe to explore"}</span>
            <span aria-hidden="true">→</span>
          </div>
        </div>
      </div>
    </section>
  );
}
