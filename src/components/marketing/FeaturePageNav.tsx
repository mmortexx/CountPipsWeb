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
 *  - Un índice "Sigue explorando" con los tres ejes, marcado el actual.
 *
 * The component is fully theme-aware (uses --divider, --surface, text-primary/
 * secondary/tertiary tokens) and matches the site's tj-paper material
 * language.
 */

type Axis = "metricas" | "disciplina" | "seguridad";

const AXES: Record<
  Axis,
  { href: string; labelEs: string; labelEn: string; descEs: string; descEn: string }
> = {
  metricas: {
    href: "/features/metricas",
    labelEs: "Métricas",
    labelEn: "Metrics",
    descEs: "40+ ratios institucionales y calculadora de riesgo",
    descEn: "40+ institutional ratios and risk calculator",
  },
  disciplina: {
    href: "/features/disciplina",
    labelEs: "Disciplina",
    labelEn: "Discipline",
    descEs: "El Guardián frena antes del error",
    descEn: "The Guardian brakes before the error",
  },
  seguridad: {
    href: "/features/seguridad",
    labelEs: "Seguridad",
    labelEn: "Security",
    descEs: "Local-first, sin nube ni cuentas",
    descEn: "Local-first, no cloud, no accounts",
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
    <section className="section-tight bg-veil relative overflow-clip border-t border-[rgb(var(--divider)/0.06)]">
      <div className="relative tj-container">
        {/* Share button — top-right */}
        <Reveal className="flex justify-center mb-10">
          <button
            onClick={handleShare}
            // T2h: bumped h-10 → min-h-[44px] (h-11 = 44px) so the
            // share control meets the ≥44px touch-target spec on mobile.
            className="inline-flex items-center gap-2 min-h-[44px] bg-[rgb(var(--divider)/0.04)] px-5 rounded-[2px] text-sm font-medium text-primary border border-[rgb(var(--divider)/0.15)] hover:bg-[rgb(var(--divider)/0.06)] transition-colors duration-200"
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
                <span className="grid place-items-center w-11 h-11 rounded-[2px] bg-[rgb(var(--divider)/0.06)] text-tertiary group-hover:text-[rgb(var(--accent-base))] group-hover:bg-[rgb(var(--accent-base)/0.12)] transition-[background-color,color] duration-300 flex-none">
                  <ArrowLeft size={18} />
                </span>
                <span className="min-w-0">
                  {/* R24-1c: kbd hint now wears a hairline accent border +
                      accent dot before so the keyboard shortcut reads as a
                      real key rather than floating tertiary text. */}
                  <span className="block text-[10px] uppercase tracking-[0.14em] text-tertiary font-semibold mb-1">
                    <span aria-hidden className="inline-block w-1 h-1 rounded-[1px] mr-1.5 align-middle" style={{ background: "rgb(var(--accent-base))" }} />
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
                <span className="grid place-items-center w-11 h-11 rounded-[2px] bg-[rgb(var(--divider)/0.06)] text-tertiary group-hover:text-[rgb(var(--accent-base))] group-hover:bg-[rgb(var(--accent-base)/0.12)] transition-[background-color,color] duration-300 flex-none">
                  <ArrowRight size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] uppercase tracking-[0.14em] text-tertiary font-semibold mb-1">
                    <span aria-hidden className="inline-block w-1 h-1 rounded-[1px] mr-1.5 align-middle" style={{ background: "rgb(var(--accent-base))" }} />
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

        <Reveal delay={0.1}>
          <div className="text-center mb-6">
            <span className="eyebrow inline-flex items-center gap-2 justify-center text-tertiary">
              <span className="w-6 h-px bg-[rgb(var(--divider))] opacity-60" />
              {es ? "Sigue explorando" : "Keep exploring"}
              <span className="w-6 h-px bg-[rgb(var(--divider))] opacity-60" />
            </span>
          </div>
        </Reveal>
        {/* `clip` y no `hidden`, por lo mismo que el resto de listas
            recortadas del sitio: `hidden` abriría contenedor de
            desplazamiento y anularía en silencio la entrada de las
            piezas que se le añadan aquí dentro. */}
        <ol className="m-0 overflow-clip rounded-[2px] border border-[rgb(var(--divider)/0.13)] p-0">
          {ORDER.map((axis, i) => {
            const isActive = axis === current;
            const a = AXES[axis];
            return (
              <li
                key={axis}
                className="border-b border-[rgb(var(--divider)/0.08)] last:border-b-0"
              >
                <Link
                  href={a.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`group grid min-h-[64px] grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgb(var(--accent-base)/0.6)] ${
                    isActive
                      ? "bg-[color-mix(in_srgb,var(--ink)_4%,transparent)]"
                      : "hover:bg-[color-mix(in_srgb,var(--ink)_4%,transparent)]"
                  }`}
                >
                  <span
                    className="tnum text-[11px] font-semibold"
                    style={{ color: "rgb(var(--accent-base))" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-primary">
                      {es ? a.labelEs : a.labelEn}
                    </span>
                    <span className="mt-0.5 block text-xs text-secondary leading-snug">
                      {es ? a.descEs : a.descEn}
                    </span>
                  </span>
                  {isActive ? (
                    <span className="tnum shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-[rgb(var(--accent-base))]">
                      {es ? "Aquí" : "Here"}
                    </span>
                  ) : (
                    <ArrowRight
                      size={14}
                      className="shrink-0 text-tertiary transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                      aria-hidden
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
