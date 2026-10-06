"use client";

import { useEffect } from "react";
import { CONSENT_CHANGE_EVENT, analyticsAllowed } from "@/lib/consent";

const POSTHOG_KEY = (process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "").trim();

export function PostHog() {
  useEffect(() => {
    if (!POSTHOG_KEY) return;

    type PostHogApi = {
      opt_out_capturing?: () => void;
      opt_in_capturing?: () => void;
    };
    const api = () => (window as Window & { posthog?: PostHogApi }).posthog;

    const stop = () => {
      api()?.opt_out_capturing?.();
    };

    const load = () => {
      if (!analyticsAllowed()) {
        stop();
        return;
      }
      // Volver a aceptar en la misma sesión debe volver a medir: con el script
      // ya cargado hay que deshacer el `opt_out_capturing()` de la retirada.
      if (window.posthog) {
        api()?.opt_in_capturing?.();
        return;
      }
      if (document.querySelector("script[data-countpips-posthog]")) return;

      const script = document.createElement("script");
      script.async = true;
      script.dataset.countpipsPosthog = "true";
      script.src = "https://eu-assets.i.posthog.com/static/array.js";
      script.onload = () => {
        const posthog = (window as Window & { posthog?: { init?: (key: string, options: Record<string, unknown>) => void } }).posthog;
        // La configuración debe caber en lo que promete la política de privacidad:
        // sin grabación de sesión (solo eventos de embudo, técnicos y uso
        // agregado) y con `localStorage` a secas, porque la política afirma que
        // no se guarda ninguna cookie. Antes de activar cualquiera de las dos,
        // hay que declararla en la política.
        posthog?.init?.(POSTHOG_KEY, {
          api_host: "https://eu.i.posthog.com",
          autocapture: false,
          capture_pageview: true,
          capture_pageleave: true,
          disable_session_recording: true,
          mask_all_text: true,
          mask_all_element_attributes: true,
          persistence: "localStorage",
        });
      };
      document.head.appendChild(script);
    };

    load();
    window.addEventListener(CONSENT_CHANGE_EVENT, load);
    // Cualquier valor que no sea "accepted" (incluida la retirada, `null`) corta la captura.
    const onConsentChange = (event: Event) => {
      if ((event as CustomEvent<string | null>).detail !== "accepted") stop();
    };
    window.addEventListener(CONSENT_CHANGE_EVENT, onConsentChange);
    return () => {
      window.removeEventListener(CONSENT_CHANGE_EVENT, load);
      window.removeEventListener(CONSENT_CHANGE_EVENT, onConsentChange);
    };
  }, []);

  return null;
}
