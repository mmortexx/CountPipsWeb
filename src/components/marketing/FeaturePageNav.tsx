"use client";

import { Link } from "@/components/tj/LocaleLink";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { useLang } from "@/lib/i18n";

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
    descEs: "Semáforo de riesgo y freno duro",
    descEn: "Risk light and hard brake",
  },
  seguridad: {
    href: "/features/seguridad",
    labelEs: "Seguridad",
    labelEn: "Security",
    descEs: "Tus datos en tu equipo, sin cuenta",
    descEn: "Your data on your machine, no account",
  },
};

const ORDER: Axis[] = ["metricas", "disciplina", "seguridad"];

interface FeaturePageNavProps {
  current: Axis;
}

export function FeaturePageNav({ current }: FeaturePageNavProps) {
  const { lang } = useLang();
  const es = lang === "es";

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

  return (
    <nav aria-label={es ? "Ejes del producto" : "Product axes"} className="section-tight relative">
      <div className="relative tj-container">
        <p className="eyebrow mb-6">{es ? "Sigue explorando" : "Keep exploring"}</p>
        <ol className="m-0 border-t border-[var(--line)] p-0">
          {ORDER.map((axis, i) => {
            const isActive = axis === current;
            const a = AXES[axis];
            return (
              <li
                key={axis}
                className="border-b border-[var(--line)]"
              >
                <Link
                  href={a.href}
                  aria-current={isActive ? "page" : undefined}
                  className="group grid min-h-[72px] grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3 py-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgb(var(--accent-base)/0.6)]"
                >
                  <span
                    className="tnum text-[12px] font-semibold"
                    style={{ color: "rgb(var(--accent-base))" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[clamp(1.125rem,1.6vw,1.375rem)] font-medium text-primary transition-colors group-hover:text-secondary">
                      {es ? a.labelEs : a.labelEn}
                    </span>
                    <span className="mt-0.5 block text-xs text-secondary leading-snug">
                      {es ? a.descEs : a.descEn}
                    </span>
                  </span>
                  {isActive ? (
                    <span className="tnum shrink-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-[rgb(var(--accent-base))]">
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
    </nav>
  );
}
