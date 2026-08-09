"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { useLang } from "@/lib/i18n";
import { irArriba } from "@/lib/scroll";

/**
 * BackToTop — circular floating button with a scroll-progress ring.
 *
 * - Hidden until the user scrolls more than 400 px down. (Lowered from the
 *   original 600 px threshold so the affordance appears earlier on the
 *   common ~8 vh hero-scroll case on mobile, where 600 px is already
 *   mid-MetricsShowcase.)
 * - When the user is within ~140 px of the bottom of the page, the button
 *   is shifted UP by 5.5 rem (88 px) via a CSS `transform: translateY()` on
 *   the outer container. This lifts it clear of the footer's bottom-bar
 *   cluster (copyright + status + locale) so the floating button never
 *   sits on top of that text — the overlap VLM flagged on mobile. The
 *   transform is GPU-accelerated and transitions over 200 ms so the lift
 *   reads as a deliberate reposition, not a jump.
 *   (The bar used to also carry an inline "v1.4.2 · Privacidad ·
 *   Términos" — a fabricated version number and a duplicate of the
 *   footer's own legal column — since retired; the 88 px clearance still
 *   applies to whatever text remains in that row.)
 * - COOKIE-BANNER AVOIDANCE — additionally lifts above the CookieConsent
 *   banner (`[data-cookie-consent="visible"]`) when both are mounted. The
 *   banner is anchored bottom-left and the button bottom-right; they
 *   don't horizontally overlap (cookie right edge < button left edge by
 *   28 px), but they DO share a vertical band on narrow viewports and
 *   visually crowd each other. Lifting the button above the banner's top
 *   edge (with an 8 px gap) gives the two their own vertical zone — the
 *   VLM read the previous "crowded but not overlapping" state as overlap.
 *   The lift is `vh - cookieTop - 8` so the button's bottom edge sits
 *   exactly 8 px above the banner's top edge. The final transform takes
 *   `max(footerShift, cookieShift)` so whichever constraint is binding
 *   wins; if neither applies the button sits at its natural position
 *   (env + 1.5 rem from the bottom).
 * - An SVG ring around the arrow fills clockwise as the user scrolls
 *   down, reaching 100% at the bottom of the page. The ring is
 *   `rgb(var(--accent-base))` so it reads as a quiet brand-colored
 *   progress cue layered on top of the liquid-glass button.
 * - Smooth-scrolls to top on click via `window.scrollTo({ behavior:
 *   "smooth" })`. Respects `prefers-reduced-motion` — falls back to
 *   instant scroll so users with vestibular sensitivities don't get the
 *   animated scroll.
 * - Hover: lifts (-2 px) and gains an accent-tinted glow. Disabled under
 *   reduced-motion (via `MotionConfig reducedMotion="user"`).
 * - rAF-throttled scroll listener for smooth ring updates without jank.
 *   A resize listener is also attached so the cookie-avoidance lift
 *   recomputes when the banner reflows (e.g. orientation change).
 *
 * POSITION — `right-[calc(env(safe-area-inset-right)+1.5rem)]` and the
 * equivalent for `bottom`. Adds the iOS notch / home-indicator inset on
 * top of the 1.5 rem (24 px) base offset, so the button clears the home
 * indicator in landscape on iPhones with notches. The outer container
 * holds the `fixed` anchor and the `transform` shift; the inner
 * motion.button holds the framer-motion animations. Splitting them avoids
 * a framer-motion + `position: fixed` interaction where AnimatePresence
 * reassigns `position: relative` during exit transitions and the button
 * briefly jumps into document flow (see the historical comment in git
 * history). `pointer-events-none` on the container prevents its 44 px
 * footprint from intercepting clicks when the button is hidden; the
 * button re-enables them with `pointer-events-auto`.
 *
 * State strategy: `visible` uses a lazy initializer so a back/forward
 * navigation that restores scroll > 400 px shows the button immediately
 * without a setState-in-effect. Subsequent updates come from the scroll
 * listener (event-handler semantics). `progress`, `shifted`, and
 * `cookieLift` are separate states updated via rAF.
 */
const SHOW_AFTER = 400;
/** Distance (px) from the bottom of the scrollable region at which the
 *  button lifts to clear the footer bottom-bar. 180 px ≈ footer
 *  bottom-bar height (~72 px) + footer py-12/py-16 padding (48-64 px) +
 *  40-60 px buffer so the lift starts BEFORE the overlap begins and the
 *  transition has time to settle before the bar reaches the button. */
const SHIFT_THRESHOLD = 180;
/** How far (rem) the button lifts when shifted. 6.5 rem (104 px) clears
 *  the mobile bottom-bar (72 px tall, sitting 48 px above viewport
 *  bottom via footer `py-12`) with an 8 px buffer. Desktop doesn't
 *  actually need the lift (the bottom-bar cluster is centered, the
 *  button is at the right edge — they don't horizontally overlap), but
 *  applying the same lift keeps the behaviour consistent across
 *  breakpoints and the button simply reads as "floating a bit higher
 *  near the end of the page". */
const SHIFT_LIFT_REM = 6.5;
const SHIFT_LIFT_PX = SHIFT_LIFT_REM * 16;
/** Gap (px) between the lifted button's bottom edge and the cookie
 *  banner's top edge when the cookie-avoidance lift is active. 8 px is
 *  enough to read as "above" rather than "touching" without leaving a
 *  large dead band. */
const COOKIE_GAP_PX = 8;
const RING_RADIUS = 18; // px — matches the 44px button with 4px padding
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function BackToTop() {
  const { lang } = useLang();
  const es = lang === "es";

  const [visible, setVisible] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.scrollY > SHOW_AFTER : false
  );
  const [progress, setProgress] = useState(0);
  const [shifted, setShifted] = useState(false);
  const [cookieLift, setCookieLift] = useState(0);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      const scrollTop = window.scrollY;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      /* Redondeado a entero A PROPÓSITO. Con decimales, el porcentaje
         cambia en cada fotograma de scroll y cada cambio vuelve a
         renderizar este componente: a 165 Hz son 165 renders por segundo
         para mover un anillo de progreso una centésima de grado, que no
         se ve. Al entero, React sólo trabaja cuando el número cambia de
         verdad — unas cien veces en todo el recorrido de la página en vez
         de en cada fotograma— y el anillo se dibuja idéntico. */
      const pct = scrollable > 0 ? Math.min(100, Math.max(0, (scrollTop / scrollable) * 100)) : 0;
      setProgress(Math.round(pct));
      setVisible(scrollTop > SHOW_AFTER);
      // Lift the button when within SHIFT_THRESHOLD px of the bottom so it
      // never overlaps the footer bottom-bar cluster. `scrollable - scrollTop`
      // is the remaining scrollable distance (px) — when it drops below the
      // threshold, the footer's last 80 px is entering the viewport.
      setShifted(scrollable - scrollTop < SHIFT_THRESHOLD);
      // CookieConsent-avoidance lift. The banner is anchored bottom-left and
      // the button bottom-right; they don't horizontally overlap, but they
      // share a vertical band on narrow viewports. Lifting the button above
      // the banner's top edge (with COOKIE_GAP_PX gap) gives them separate
      // vertical zones. The banner carries `data-cookie-consent="visible"`
      // and is removed from the DOM when dismissed (AnimatePresence), so the
      // selector cleanly reflects "banner currently mounted".
      let cLift = 0;
      const cookieEl = document.querySelector<HTMLElement>("[data-cookie-consent='visible']");
      if (cookieEl) {
        const rect = cookieEl.getBoundingClientRect();
        // Banner is considered on-screen only if any part of it is in the
        // viewport (rect.bottom > 0 && rect.top < vh). When the banner is
        // animating out (opacity 0) it's still in the DOM for ~240 ms — we
        // don't want to keep lifting during that window, so we also check
        // that rect.top is within a sane band (≥0 means banner fully in
        // view at the bottom of the screen).
        if (rect.bottom > 0 && rect.top < window.innerHeight && rect.top >= 0) {
          // We want button.bottom = rect.top - COOKIE_GAP_PX.
          // Natural button.bottom = vh - 24 (env+1.5rem, ignoring safe-area
          // which only adds to the offset).
          // Lift = (vh - 24) - (rect.top - COOKIE_GAP_PX) = vh - rect.top - 24 + COOKIE_GAP_PX
          cLift = Math.max(0, window.innerHeight - rect.top - 24 + COOKIE_GAP_PX);
        }
      }
      /* Mismo motivo que el porcentaje: al píxel, no a la fracción. */
      setCookieLift(Math.round(cLift));
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };
    // Resize also recomputes — the cookie banner's height changes when the
    // viewport reflows (e.g. orientation change, browser-chrome show/hide
    // on mobile), and the lift should track that.
    const onResize = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    // CookieConsent mounts/unmounts its banner via AnimatePresence in
    // response to its own internal state (scroll/5 s reveal, Accept/
    // Decline click). Those transitions don't fire a window scroll/resize
    // event, so BackToTop's lift wouldn't otherwise know to recompute.
    // A MutationObserver on document.body catches the banner's mount and
    // unmount and triggers update() — closing the race where the user
    // scrolls to the bottom BEFORE the banner mounts (BackToTop's scroll
    // handler ran first, found no banner, lifted only for the footer;
    // the banner then mounted over the button). The observer also catches
    // the banner's exit so the button drops back to its natural position
    // once the banner is dismissed.
    const observer = new MutationObserver(() => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      observer.disconnect();
    };
  }, []);

  /* Este botón sólo aparece a partir de 400 px, así que su salto es
     LARGO por definición — es el caso que peor se veía con el scroll
     suave del navegador: desde el pie de la portada recorría el sitio
     entero hacia atrás. `irArriba` salta y anima nada más el último
     tramo; el `prefers-reduced-motion` que aquí se miraba a mano lo
     mira ella. */
  const scrollToTop = () => irArriba();

  // Ring dash: the filled portion = progress% of the circumference.
  const dashOffset = RING_CIRCUMFERENCE * (1 - progress / 100);

  // Combined lift: max of footer-shift and cookie-avoidance. Whichever is
  // binding wins; if neither applies, lift = 0 and the button sits at its
  // natural position (env + 1.5 rem from the bottom).
  const totalLift = Math.max(shifted ? SHIFT_LIFT_PX : 0, cookieLift);

  return (
    <MotionConfig reducedMotion="user">
      {/* Anchor + shift container. framer-motion touches only the inner
          motion.button; the outer div holds `fixed` + the lift transform.
          `transition-transform` makes the lift smooth on scroll-into-
          footer and on cookie-banner mount/unmount; `pointer-events-none`
          lets clicks fall through to the page when the button isn't
          rendered. */}
      <div
        className="fixed right-[calc(env(safe-area-inset-right)+1.5rem)] bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] z-40 pointer-events-none transition-transform duration-200 ease-out motion-reduce:transition-none"
        style={{ transform: `translateY(-${totalLift}px)` }}
      >
        <AnimatePresence>
          {visible && (
            <motion.button
              type="button"
              onClick={scrollToTop}
              aria-label={es ? "Volver arriba" : "Back to top"}
              className="pointer-events-auto relative w-11 h-11 rounded-full tj-paper tj-paper-dense flex items-center justify-center text-primary transition-[box-shadow] duration-200 hover:shadow-[0_8px_28px_rgb(var(--accent-base)/0.40)]"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              /* El realce al pasar por encima se hace con framer-motion, no
                 con `hover:-translate-y-0.5` de Tailwind: motion escribe
                 `transform` en el estilo en línea para animar la escala, así
                 que la clase de Tailwind quedaba pisada y el botón nunca
                 llegaba a levantarse. */
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Scroll-progress ring — SVG circle with a dash that fills
                  clockwise as the user scrolls. Rotated -90deg so 0% starts
                  at 12 o'clock. Sits behind the arrow. */}
              <svg
                className="absolute inset-0 -rotate-90"
                width="44"
                height="44"
                viewBox="0 0 44 44"
                fill="none"
                aria-hidden="true"
              >
                {/* Track — faint full circle */}
                <circle
                  cx="22"
                  cy="22"
                  r={RING_RADIUS}
                  stroke="rgb(var(--divider) / 0.15)"
                  strokeWidth="1.5"
                  fill="none"
                />
                {/* Progress — accent, dashoffset = (1 - pct) * circumference.
                    A subtle drop-shadow glow on the progress arc makes it
                    read as "active" against the liquid-glass button surface.
                    The glow intensifies on hover via the parent button's
                    group-hover. */}
                <circle
                  cx="22"
                  cy="22"
                  r={RING_RADIUS}
                  stroke="rgb(var(--accent-base))"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={dashOffset}
                  style={{
                    transition: "stroke-dashoffset 0.1s linear",
                  }}
                />
              </svg>
              {/* Arrow icon — sits above the ring */}
              <svg
                className="relative"
                width="16"
                height="16"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 14V4M4 8l5-5 5 5" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
