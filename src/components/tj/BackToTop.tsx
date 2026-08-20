"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { irArriba } from "@/lib/scroll";
import { CONSENT_VISIBILITY_EVENT } from "@/lib/consent";

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
 * - Al pulsarlo sube a la cabecera con `irArriba()` (src/lib/scroll.ts):
 *   salta hasta un palmo del destino y anima sólo ese tramo, en vez de
 *   recorrer las diez pantallas que puede haber de por medio.
 * - Al pasar por encima se levanta 2 px y gana un halo del acento. Todo
 *   en CSS (`.tj-subir`), y anulado bajo `prefers-reduced-motion`.
 * - rAF-throttled scroll listener for smooth ring updates without jank.
 *   A resize listener is also attached so the cookie-avoidance lift
 *   recomputes when the banner reflows (e.g. orientation change).
 *
 * POSITION — `right-[calc(env(safe-area-inset-right)+1.5rem)]` and the
 * equivalent for `bottom`. Adds the iOS notch / home-indicator inset on
 * top of the 1.5 rem (24 px) base offset, so the button clears the home
 * indicator in landscape on iPhones with notches. El contenedor exterior
 * lleva el anclaje `fixed` y el levantamiento; el botón, su propia
 * entrada. Van separados porque son dos transformaciones sobre el mismo
 * eje y, en un solo elemento, la última escrita pisa a la anterior.
 * `pointer-events-none` en el contenedor evita que sus 44 px intercepten
 * clics cuando el botón está oculto; el botón los reactiva con
 * `pointer-events-auto`.
 *
 * ── Sin framer-motion ─────────────────────────────────────────────────
 * Este componente usaba `AnimatePresence`, `motion.button` y
 * `MotionConfig`, y con ellos arrastraba la biblioteca entera al paquete
 * común de las 155 páginas. Ahora el botón está SIEMPRE montado y su
 * visibilidad es un atributo (`.tj-emerge`, en globals.css): entrar y
 * salir es una transición CSS que resuelve el compositor. Un botón de
 * 44 px en el árbol no cuesta nada; la biblioteca costaba 344 KB.
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

  /* LOS DOS ARRANCAN EN `false`, SIN MIRAR `window`.
     Aquí ponía `typeof window !== "undefined" ? window.scrollY > SHOW_AFTER
     : false`, y ese inicializador NO se ejecuta sólo «en el cliente»: se
     ejecuta durante la hidratación. Al recargar con la página ya desplazada
     —o al volver con la posición restaurada, que es lo normal— el servidor
     había mandado el árbol sin botón y el cliente lo montaba con botón:
     «Hydration failed because the server rendered HTML didn't match». React
     tira ese subárbol y lo rehace.
     El efecto de abajo llama a `update()` nada más montar, así que el botón
     aparece igual de rápido; lo que ya no hace es contradecir al HTML. */
  const [visible, setVisible] = useState(false);
  /* El botón no entra en el árbol hasta que el visitante baja lo
     suficiente para que tenga sentido, y entonces se queda. Montado
     desde el principio, su anillo de progreso en SVG viajaba en el HTML
     de las 155 páginas para alguien que a lo mejor no baja nunca —
     mismo patrón, y mismo motivo, que el cajón de navegación. */
  const [montado, setMontado] = useState(false);
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
      const debeVerse = scrollTop > SHOW_AFTER;
      if (debeVerse) setMontado(true);
      setVisible(debeVerse);
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
    /* El aviso de cookies aparece por su cuenta —al primer scroll o a los
       5 s— y desaparece al elegir, y ninguno de esos momentos dispara un
       scroll ni un resize. Este botón tiene que enterarse para apartarse y
       no quedar debajo.

       Aquí eso se resolvía con un `MutationObserver` sobre `document.body`
       con `subtree: true`, o sea vigilando el documento ENTERO en las 155
       páginas del sitio: cualquier cambio del DOM —cualquiera— programaba
       una comprobación que lee el alto del documento, busca un selector y
       mide un rectángulo. Medido en una página sin figura: 245 lecturas de
       `scrollHeight` y 243 rectángulos en cinco segundos de scroll.

       Ahora el aviso avisa. Un evento, cero vigilancia. */
    window.addEventListener(CONSENT_VISIBILITY_EVENT, onResize);
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener(CONSENT_VISIBILITY_EVENT, onResize);
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

  if (!montado) return null;

  return (
    <>
      {/* Anclaje y desplazamiento. El contenedor exterior lleva el
          `fixed` y el levantamiento; el botón, su propia entrada. Van
          separados porque son dos transformaciones distintas sobre el
          mismo eje: mezclarlas en un elemento hace que la última escrita
          pise a la anterior. */}
      <div
        className="fixed right-[calc(env(safe-area-inset-right)+1.5rem)] bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] z-40 pointer-events-none transition-transform duration-200 ease-out motion-reduce:transition-none"
        style={{ transform: `translateY(-${totalLift}px)` }}
      >
        {/* Montado siempre y visible por atributo, en vez de montado y
            desmontado por `AnimatePresence`. Un botón de 44 px en el
            árbol no cuesta nada; la biblioteca que lo animaba costaba
            344 KB en las 155 páginas del sitio. `.tj-emerge` está en
            globals.css.

            `tabIndex={-1}` mientras está oculto: a opacidad cero seguía
            siendo alcanzable con el tabulador, y quien navega con
            teclado se paraba en un botón invisible. */}
        <button
          type="button"
          onClick={scrollToTop}
          aria-label={es ? "Volver arriba" : "Back to top"}
          data-visible={visible ? "true" : "false"}
          tabIndex={visible ? 0 : -1}
          className="tj-emerge tj-subir pointer-events-auto relative w-11 h-11 rounded-[2px] tj-paper tj-paper-dense flex items-center justify-center text-primary hover:shadow-[0_8px_28px_rgb(var(--accent-base)/0.40)]"
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
        </button>
      </div>
    </>
  );
}
