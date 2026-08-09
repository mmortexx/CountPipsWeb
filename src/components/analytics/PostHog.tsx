"use client";

import { useEffect } from "react";
import { CONSENT_CHANGE_EVENT, analyticsAllowed } from "@/lib/consent";

const POSTHOG_KEY = (process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "").trim();

export function PostHog() {
  useEffect(() => {
    if (!POSTHOG_KEY) return;

    const stop = () => {
      const posthog = (window as Window & { posthog?: { opt_out_capturing?: () => void } }).posthog;
      posthog?.opt_out_capturing?.();
    };

    const load = () => {
      if (!analyticsAllowed()) {
        stop();
        return;
      }
      if (window.posthog || document.querySelector("script[data-countpips-posthog]")) return;

      const script = document.createElement("script");
      script.async = true;
      script.dataset.countpipsPosthog = "true";
      script.src = "https://eu-assets.i.posthog.com/static/array.js";
      script.onload = () => {
        const posthog = (window as Window & { posthog?: { init?: (key: string, options: Record<string, unknown>) => void } }).posthog;
        /* ── LA CONFIGURACIÓN TIENE QUE CABER EN LO QUE PROMETE LA WEB ──
           Dos ajustes contradecían por escrito a la política de
           privacidad, y en un producto cuyo argumento entero es "tus
           datos no salen de tu equipo" eso vale más que la métrica que
           se pierde:

             · `disable_session_recording: false` encendía la GRABACIÓN
               DE SESIÓN: PostHog reproduce el DOM y la interacción
               completas. La política ofrece "eventos de embudo",
               "eventos técnicos" y "uso agregado", y el botón del aviso
               dice "Aceptar analítica". Nada de eso describe una
               grabación. Se apaga.

             · `persistence: "localStorage+cookie"` plantaba la cookie
               `ph_<clave>_posthog`. La política afirma, con una tabla
               titulada "Todo lo que se guarda, sin excepción", que de
               las siete claves guardadas NINGUNA es una cookie, y hay
               un comentario en `CookieConsent.tsx` explicando que decir
               "cookies técnicas" era "cómodo pero falso". Pasa a
               `localStorage` a secas y la afirmación vuelve a ser cierta.

           Se ajusta el CÓDIGO a la promesa y no al revés, a propósito:
           `autocapture: false` ya demostraba que la intención era
           medición mínima. Lo que se mide —páginas vistas y salidas—
           sigue igual. Si algún día se quiere grabación de sesión, hay
           que declararla antes en la política, no después. */
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
    // Cualquier valor que no sea "accepted" —incluida la retirada, que
    // emite `null`— corta la captura en el acto.
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
