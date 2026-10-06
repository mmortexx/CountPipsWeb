"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n";
import {
  CONSENT_REOPEN_EVENT,
  CONSENT_VISIBILITY_EVENT,
  readConsent,
  writeConsent,
} from "@/lib/consent";

/**
 * Aviso de cookies bilingüe. Aparece en el primer scroll o a los 5 s (lo que
 * ocurra antes) y no antes: un aviso `aria-live` a los 2 s cortaba la lectura
 * inicial de los lectores de pantalla. La elección se guarda en `localStorage`
 * (`accepted` o `declined`, ver `@/lib/consent`).
 *
 * El `style` inline `position: fixed` es necesario: `.tj-paper` fija
 * `position: relative` con la misma especificidad que `.fixed` y va después
 * en globals.css, así que sin el inline el aviso se pintaba en el flujo.
 */
export function CookieConsent() {
  const { lang } = useLang();
  const es = lang === "es";

  // Inicializador perezoso: en el servidor devuelve true (nada que pintar, sin
  // desajuste de hidratación); la visibilidad real la decide el temporizador.
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return readConsent() !== null;
  });
  const [visible, setVisible] = useState(false);

  // Quién tenía el foco cuando el usuario reabrió el aviso desde el pie; null
  // en la revelación automática. Solo en ese caso se mueve y se devuelve el foco.
  const reopenSourceRef = useRef<HTMLElement | null>(null);
  const primerBotonRef = useRef<HTMLButtonElement>(null);

  // Reapertura desde «Preferencias de privacidad» (pie): la política promete
  // poder cambiar la elección. Salta el retardo porque el visitante lo pidió.
  useEffect(() => {
    const reopen = () => {
      // Al dispararse el evento, `document.activeElement` es el enlace del pie.
      reopenSourceRef.current = document.activeElement as HTMLElement | null;
      setDismissed(false);
      setVisible(true);
    };
    window.addEventListener(CONSENT_REOPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_REOPEN_EVENT, reopen);
  }, []);

  // Nunca se roba el foco cuando el aviso aparece solo; solo si lo pidió el usuario.
  useEffect(() => {
    if (!visible || !reopenSourceRef.current) return;
    const id = requestAnimationFrame(() => primerBotonRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [visible]);

  // Primer scroll o 5 s; el cierre `done` hace que el segundo disparo no haga nada.
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
      done = true; // un callback en vuelo no debe actuar tras desmontar
      window.clearTimeout(timeoutId);
      window.removeEventListener("scroll", onScroll);
    };
  }, [dismissed]);

  // Avisa a BackToTop (ver `CONSENT_VISIBILITY_EVENT`). Va en un efecto y no en
  // `choose` para cubrir también la revelación, la reapertura y el desmontaje.
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

  // Su alto como relleno inferior de la página (`--alto-aviso`): así lo último
  // de la página se puede subir por encima del aviso fijo.
  const hoja = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const n = hoja.current;
    if (!visible || !n) return;
    const raiz = document.documentElement;
    const mide = () => raiz.style.setProperty("--alto-aviso", `${Math.ceil(n.getBoundingClientRect().height)}px`);
    mide();
    const ro = new ResizeObserver(mide);
    ro.observe(n);
    return () => {
      ro.disconnect();
      raiz.style.removeProperty("--alto-aviso");
    };
  }, [visible]);

  /** Guarda la elección y oculta el aviso. */
  const choose = useCallback((choice: "accepted" | "declined") => {
    setVisible(false);
    setDismissed(true);
    // Si el almacenamiento está bloqueado, la elección vale para la sesión (src/lib/consent.ts).
    writeConsent(choice);
    // Devuelve el foco al enlace del pie; en la revelación automática no hay adónde.
    const volver = reopenSourceRef.current;
    reopenSourceRef.current = null;
    volver?.focus?.();
  }, []);

  // Escape rechaza (WCAG 2.1.1).
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
      {/* Se monta solo cuando hay que enseñarlo: un `role="dialog"` siempre
          presente lo anuncian algunos lectores aunque esté invisible. Sin
          animación de salida. `data-cookie-consent` solo existe mientras
          está en pantalla; BackToTop lo usa para apartarse. */}
      {visible && !dismissed && (
        <div
          ref={hoja}
          role="dialog"
          aria-modal="false"
          aria-live="polite"
          aria-label={es ? "Consentimiento de cookies" : "Cookie consent"}
          data-cookie-consent="visible"
          style={{ position: "fixed" }}
            // Móvil: hoja a sangre abajo. Desktop (≥768px): tarjeta abajo a la
            // izquierda. z-50 sobre BackToTop (z-40); safe-bottom por iOS.
            className="tj-entra-abajo tj-cristal tj-cristal--denso z-50 safe-bottom left-0 bottom-0 w-full rounded-t-[4px] px-4 pb-3 pt-3.5 md:left-4 md:bottom-4 md:w-[22rem] md:rounded-[var(--radio-panel)] md:p-5"
          >
            <div className="flex items-start gap-2.5 md:gap-3">
              {/* El enlace a la política es obligatorio (no se puede pedir
                  consentimiento sin dónde informarse); va en línea para no
                  añadir otra fila. */}
              <p className="text-[13px] leading-[1.5] text-secondary flex-1 md:text-[14px] md:leading-relaxed">
                {es
                  ? "Guardamos tus preferencias en este navegador; la analítica, solo si la aceptas. "
                  : "We keep your preferences in this browser; analytics only if you accept it. "}
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

            {/* Dos botones de igual ancho, objetivo táctil de 44 px. */}
            <div className="mt-2.5 grid grid-cols-2 gap-2 md:mt-4">
              <button
                ref={primerBotonRef}
                type="button"
                onClick={() => choose("declined")}
                className="min-h-[44px] w-full px-3 py-2 rounded-[4px] text-[14px] font-medium text-secondary bg-[color-mix(in_srgb,var(--ink)_6%,transparent)] hover:bg-[color-mix(in_srgb,var(--ink)_10%,transparent)] hover:text-primary transition-[background,color,transform] duration-150"
              >
                {es ? "Solo necesarias" : "Necessary only"}
              </button>
              <button
                type="button"
                onClick={() => choose("accepted")}
                className="min-h-[44px] w-full px-3 py-2 rounded-[4px] text-[14px] font-medium bg-[rgb(var(--accent-base))] text-[rgb(var(--accent-ink))] hover:brightness-110 transition-[filter,transform] duration-150"
              >
                {es ? "Aceptar analítica" : "Accept analytics"}
              </button>
            </div>
        </div>
      )}
    </>
  );
}
