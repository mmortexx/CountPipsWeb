"use client";

import { useEffect, useState, type ReactNode } from "react";

interface FadeInProps {
  children: ReactNode;
  delay?: number; // ms
  duration?: number; // ms
  className?: string;
}

/**
 * FadeIn wrapper — starts at opacity 0, transitions to opacity 1
 * after a configurable delay. Uses inline transitionDuration + Tailwind.
 *
 * Tuning (P5 polish):
 *  - Default `duration = 600ms` (within the 0.5-0.7s spec budget). The
 *    previous 1000ms default read as sluggish next to Reveal (0.55s) and
 *    SectionReveal (0.65s); bringing it into the same duration family
 *    keeps the whole page on one cadence.
 *  - `transition-timing-function` now uses the same `cubic-bezier(0.22, 1,
 *    0.36, 1)` "soft-settle" curve as Reveal/SectionReveal/FeatureImage,
 *    so a delayed fade and a scroll reveal feel like the same hand.
 *  - `transition-property: opacity` only (compositor-only, no layout).
 *
 * `prefers-reduced-motion: reduce`: the wrapper renders at opacity 1 with
 * no transition. The reduced-motion check runs lazily in the initial state
 * (after hydration) so no `setState` fires synchronously inside the effect.
 */
const FADE_EASE = "var(--ease-suave)";

export function FadeIn({
  children,
  delay = 0,
  duration = 600,
  className = "",
}: FadeInProps) {
  // Lazy initial state: if reduced-motion is on at mount, start visible.
  // SSR-safe: `window` is undefined on the server, so initial state is
  // `false` there, and the effect below confirms the value on the client.
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (visible) return; // already at final state (reduced-motion path)
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay, visible]);

  const reduce =
    typeof window !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  const transitionClass = reduce ? "" : "transition-opacity";

  return (
    <div
      className={`${transitionClass} ${visible ? "opacity-100" : "opacity-0"} ${className}`}
      style={
        reduce
          ? undefined
          : {
              transitionDuration: `${duration}ms`,
              transitionTimingFunction: FADE_EASE,
            }
      }
    >
      {children}
    </div>
  );
}
