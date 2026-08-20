"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n";
import {
  CONSENT_REOPEN_EVENT,
  CONSENT_VISIBILITY_EVENT,
  readConsent,
  writeConsent,
} from "@/lib/consent";

/**
 * CookieConsent — small, bottom-left bilingual banner.
 *
 * - Reveals on FIRST scroll OR 5 s after mount — whichever comes first
 *   (only if the user hasn't previously dismissed it). The 2 s auto-reveal
 *   was replaced because it interrupted screen-reader page-load narration
 *   (a blind user landing on the page is read the hero copy first; an
 *   `aria-live="polite"` banner inserted at 2 s would cut that narration
 *   mid-sentence). The new policy waits for either an explicit scroll signal
 *   (user is actively navigating) or a 5 s fallback so screen-reader users
 *   who don't scroll still eventually get the consent prompt.
 * - Dismissal is persisted in `localStorage` under `tj-cookie-consent`,
 *   with the value `"accepted"` or `"declined"` so future logic (analytics,
 *   preference cookies) can branch on the user's choice. For now both
 *   outcomes are functionally identical — the site uses only strictly-
 *   necessary technical cookies — but presenting both buttons respects the
 *   user's agency and matches the GDPR-style consent affordance the rest
 *   of the chrome (footer, navbar) implies.
 * - Reveal/dismiss: pure opacity fade in/out, no slide. Minimal, clean.
 * - `MotionConfig reducedMotion="user"` makes framer-motion respect
 *   `prefers-reduced-motion: reduce` automatically — transforms and layout
 *   animations are disabled, the opacity fade is preserved (it's not a
 *   motion-sickness trigger).
 *
 * Width: clamped to `min(22rem, 100vw - 7rem)` via inline style. The 7 rem
 * right gutter (112 px) clears the global BackToTop button (44 px wide +
 * 24 px right margin = 68 px) with a comfortable 28 px buffer on 390 px
 * viewports, so the two never overlap when both are visible. BackToTop
 * additionally lifts itself above the banner via `data-cookie-consent`
 * detection (see BackToTop.tsx) so the two never share a vertical band
 * either — belt and suspenders.
 *
 * Action row: a 2-column grid (Decline | Accept). Both buttons fill their
 * grid cell (`w-full`) so they share the banner width equally regardless
 * of label length, and both meet the WCAG 2.5.5 44 px tap target. The
 * previous "Más info" link was dropped because the FAQ it pointed at is
 * already linked from the footer's Resources column; duplicating it here
 * forced `flex-wrap` on narrow viewports and bloated the banner to 250+
 * px (3 stacked button rows). The 2-col grid keeps the action region to a
 * single 44 px row.
 *
 * POSITION OVERRIDE — `style={{ position: "fixed" }}`. The `.tj-paper`
 * material class sets `position: relative` (so its `::before` rim and
 * `::after` inset highlights can absolute-position against the host). That
 * rule has the same specificity as Tailwind's `.fixed` utility but is
 * defined later in `globals.css`, so it wins — the banner was rendering
 * in normal document flow at the bottom of the page, not pinned to the
 * viewport. Inline `position: fixed` has higher specificity than any class
 * selector and reliably overrides the `.tj-paper` rule. (We can't edit
 * globals.css from this subagent — see T2a ownership.)
 *
 * State strategy follows the project rule: no setState inside effect bodies.
 * The "dismissed" flag uses a lazy initializer (SSR-safe — returns true so the
 * banner renders nothing on the server, then on the client it re-evaluates to
 * the real value before paint). The scroll/5 s reveal fires from a `setTimeout`
 * callback OR a `scroll` event handler (both are event-handler semantics, not
 * synchronous setState-in-effect). A `done` latch ensures whichever fires
 * first wins and the loser is a no-op.
 */
export function CookieConsent() {
  const { lang } = useLang();
  const es = lang === "es";

  // Lazy initializer — reads localStorage once on client mount. On SSR returns
  // true so the banner is hidden server-side and there is no hydration mismatch
  // (the visible state is driven separately by the scroll/5 s timer below).
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return readConsent() !== null;
  });
  const [visible, setVisible] = useState(false);

  /* Reapertura desde el control «Preferencias de privacidad», que vive en
     el pie y por tanto sale en las 154 páginas. Sin esto, el aviso no
     volvía a salir jamás una vez elegido, y la política prometía por
     escrito que sí: la vía real para cambiar de idea era abrir las
     herramientas del navegador y vaciar el almacenamiento del sitio.
     Aquí se salta el retardo de scroll/5 s a propósito — el visitante
     acaba de pedirlo, así que la respuesta es inmediata. */
  useEffect(() => {
    const reopen = () => {
      setDismissed(false);
      setVisible(true);
    };
    window.addEventListener(CONSENT_REOPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_REOPEN_EVENT, reopen);
  }, []);

  // Reveal on first scroll OR 5 s after mount — whichever fires first.
  // Rationale: the old 2 s auto-reveal interrupted screen-reader page-load
  // narration (a polite `aria-live` banner inserted at 2 s cuts the hero copy
  // narration mid-sentence). Waiting for an explicit scroll signal means the
  // user is already navigating past the hero; the 5 s fallback covers non-
  // scrolling screen-reader users. The `done` latch ensures the loser is a
  // no-op (no double `setVisible` call, no double cleanup).
  useEffect(() => {
    if (dismissed) return;

    let done = false;
    const reveal = () => {
      if (done) return;
      done = true;
      setVisible(true);
      window.removeEventListener("scroll", onScroll);
    };
    const onScroll = () => reveal();
    window.addEventListener("scroll", onScroll, { passive: true });

    const timeoutId = window.setTimeout(reveal, 5000);

    return () => {
      done = true; // prevent any in-flight callback from firing post-unmount
      window.clearTimeout(timeoutId);
      window.removeEventListener("scroll", onScroll);
    };
  }, [dismissed]);

  /* Avisa de que el aviso ha entrado o salido de la pantalla. Lo escucha
     el botón de volver arriba para apartarse; ver `CONSENT_VISIBILITY_EVENT`.
     Va en un efecto y no dentro de `choose` para cubrir TODAS las formas de
     aparecer y desaparecer: la revelación por scroll, la de los 5 s, la
     reapertura desde el pie y el desmontaje al cambiar de página. */
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(CONSENT_VISIBILITY_EVENT, { detail: { visible } })
    );
    return () => {
      window.dispatchEvent(
        new CustomEvent(CONSENT_VISIBILITY_EVENT, { detail: { visible: false } })
      );
    };
  }, [visible]);

  /** Persist the user's choice and hide the banner. Both branches functionally
   *  do the same thing today (no non-essential cookies are loaded), but the
   *  stored value lets future analytics/preference scripts branch on consent
   *  without re-prompting. */
  const choose = useCallback((choice: "accepted" | "declined") => {
    setVisible(false);
    setDismissed(true);
    // `writeConsent` guarda y avisa; si el almacenamiento está bloqueado,
    // la elección vale igual para esta sesión (ver src/lib/consent.ts).
    writeConsent(choice);
  }, []);

  // Dismiss on Escape key for keyboard accessibility (WCAG 2.1.1)
  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        choose("declined");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible, choose]);

  return (
    <>
      {/* El aviso sólo entra en el árbol cuando de verdad hay que
          enseñarlo. A diferencia del botón de volver arriba —que se
          queda montado y oculto—, aquí sí se monta y se desmonta: es un
          diálogo con `role="dialog"`, y un diálogo permanentemente
          presente en el árbol lo anuncian algunos lectores de pantalla
          aunque esté invisible.

          El precio es que no hay animación de SALIDA, que es justo para
          lo que existía `AnimatePresence`. Se acepta a cambio de sacar
          la biblioteca del paquete de las 155 páginas: la salida ocurre
          después de que el visitante ya ha decidido y ha pulsado, que
          es el momento en el que menos importa cómo se va.

          `data-cookie-consent="visible"` sólo existe mientras el aviso
          está en pantalla, y eso importa: `BackToTop` busca ese
          selector para apartarse del banner. Con el nodo siempre
          montado, el botón se habría quedado levantado para siempre. */}
      {visible && !dismissed && (
        <div
          role="dialog"
          aria-live="polite"
          aria-label={es ? "Consentimiento de cookies" : "Cookie consent"}
          data-cookie-consent="visible"
          style={{ position: "fixed" }}
            // ── Estructura mobile-first ──────────────────────────────────
            // En móvil (<768px): bottom sheet a SANGRE — w-full, left-0,
            // bottom-0, esquinas redondeadas solo arriba. Es el patrón
            // móvil nativo (menos "caja flotante", más "panel que sube
            // desde abajo"), ocupa todo el ancho y no deja contenido
            // asomando por los lados. Padding compacto (p-4) + texto más
            // corto para que el sheet no tape más de ~16% de la pantalla.
            //
            // En desktop (≥768px): tarjeta compacta bottom-left
            // (w-[22rem], bottom-4 left-4, rounded-[2px]) — la versión
            // original, menos intrusiva en pantalla grande.
            //
            // z-50 sobre BackToTop (z-40). safe-bottom para el home
            // indicator de iOS en el sheet móvil.
            className="tj-entra-abajo tj-paper tj-paper-dense z-50 safe-bottom left-0 bottom-0 w-full rounded-t-[2px] border-t border-[rgb(var(--divider)/0.14)] p-4 shadow-2xl md:left-4 md:bottom-4 md:w-[22rem] md:rounded-[2px] md:border md:border-[rgb(var(--divider)/0.13)] md:p-5"
          >
            <div className="flex items-start gap-2.5 md:gap-3">
              <CookieIcon />
              {/* El enlace a la política es obligatorio, no cortesía: pedir
                  consentimiento sin ofrecer dónde informarse es justo lo
                  que la norma no permite, y aquí se había quitado a
                  propósito por un problema de ancho del banner.
                  Ahora va DENTRO del párrafo, en línea, así que no añade
                  una tercera fila de botones ni fuerza el ajuste que
                  motivó su retirada.
                  Y de paso corrige el texto: la web no usa cookies, usa
                  almacenamiento local. Decir «cookies técnicas» era
                  cómodo pero falso, y la página que enlazamos explica
                  precisamente la diferencia. */}
              <p className="text-[12.5px] leading-[1.5] text-secondary flex-1 md:text-[13px] md:leading-relaxed">
                {es
                  ? "Usamos almacenamiento local para preferencias. La analítica opcional sólo se activa si la aceptas. "
                  : "We use local storage for preferences. Optional analytics only starts if you accept it. "}
                <Link
                  href="/cookies"
                  className="link-underline-host whitespace-nowrap text-primary transition-colors hover:text-[rgb(var(--accent-base))]"
                >
                  <span className="link-underline">
                    {es ? "Ver qué guarda" : "See what it stores"}
                  </span>
                </Link>
              </p>
            </div>

            {/* Action row — 2-column grid (Decline | Accept). Botones
                full-width en sus celdas, ≥44px tap target. En móvil el
                sheet es full-width así que los botones son cómodos. */}
            <div className="mt-3 grid grid-cols-2 gap-2 md:mt-4">
              <button
                type="button"
                onClick={() => choose("declined")}
                className="min-h-[44px] w-full px-3 py-2 rounded-[2px] text-[13px] font-medium text-secondary border border-[rgb(var(--divider)/0.22)] hover:bg-[rgb(var(--divider)/0.06)] hover:text-primary active:scale-[0.98] transition-[background,color,transform] duration-150"
              >
                {es ? "Solo necesarias" : "Necessary only"}
              </button>
              <button
                type="button"
                onClick={() => choose("accepted")}
                className="min-h-[44px] w-full px-3 py-2 rounded-[2px] text-[13px] font-medium bg-[rgb(var(--accent-base))] text-[rgb(var(--accent-ink))] hover:brightness-110 active:scale-[0.98] transition-[filter,transform] duration-150"
              >
                {es ? "Aceptar analítica" : "Accept analytics"}
              </button>
            </div>
        </div>
      )}
    </>
  );
}

/* ---------- Cookie icon (currentColor, no indigo/blue) ---------- */

function CookieIcon() {
  return (
    <span
      className="shrink-0 mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-[2px] bg-[rgb(var(--divider)/0.05)] text-primary"
      aria-hidden="true"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      >
        <path d="M13.5 8.2A5.3 5.3 0 1 1 7.8 2.5a2.6 2.6 0 0 0 3.2 3.2 2.6 2.6 0 0 0 2.5 2.5z" />
        <circle cx="5.7" cy="6.2" r="0.55" fill="currentColor" stroke="none" />
        <circle cx="9.4" cy="5.4" r="0.55" fill="currentColor" stroke="none" />
        <circle cx="6.4" cy="9.8" r="0.55" fill="currentColor" stroke="none" />
        <circle cx="10.2" cy="9.6" r="0.55" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}
