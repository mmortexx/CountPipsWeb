"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";
import { fmtNum } from "@/lib/trading/format";

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  tone?: "pos" | "neg" | "neutral";
}

/** Cuenta animada que arranca al entrar en pantalla, con `easeOutExpo`. Con
 *  `prefers-reduced-motion` pinta el valor final al montar. Cifras `tnum` para
 *  que no baile el ancho mientras cuenta. */
export function CountUp({
  to,
  from = 0,
  duration = 1.4,
  decimals = 0,
  suffix = "",
  prefix = "",
  className = "",
  tone = "neutral",
}: CountUpProps) {
  const { lang } = useLang();
  const ref = useRef<HTMLSpanElement>(null);
  // Con «reducir movimiento» se pinta el valor final y no arranca nada; no
  // basta con marcar `started`, que lanzaría la animación (`scripts/movimiento.mjs`).
  const [reduced] = useState(
    () => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [val, setVal] = useState(reduced ? to : from);
  const [started, setStarted] = useState(reduced);

  useEffect(() => {
    if (started) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started) {
          setStarted(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started || reduced) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / (duration * 1000));
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      setVal(from + (to - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, reduced, to, from, duration]);

  const toneClass =
    tone === "pos"
      ? "text-pnl-pos"
      : tone === "neg"
      ? "text-pnl-neg"
      : "";

  return (
    <span ref={ref} data-cuenta="" className={`tnum ${toneClass} ${className}`}>
      {/* La cifra que corre es para la vista; el lector lee la final, una vez
          (un `aria-live` que cambia por fotograma encola todas las intermedias). */}
      <span aria-hidden="true">
        {prefix}
        {fmtNum(reduced ? to : val, lang, decimals)}
        {suffix}
      </span>
      <span className="sr-only">{`${prefix}${fmtNum(to, lang, decimals)}${suffix}`}</span>
    </span>
  );
}
