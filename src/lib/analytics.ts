"use client";

import { analyticsAllowed } from "@/lib/consent";

type EventProps = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    posthog?: { capture: (event: string, properties?: EventProps) => void };
  }
}

export function trackEvent(event: string, properties: EventProps = {}) {
  if (typeof window === "undefined") return;
  // Segunda puerta, además de la de `PostHog.tsx`: aunque el script ya
  // estuviera cargado de una visita anterior, sin consentimiento vigente
  // no se envía nada. La clave la define `src/lib/consent.ts` — estaba
  // repetida a mano aquí, y una tercera copia del literal era la forma
  // más fácil de que la retirada del consentimiento no llegara a este
  // camino.
  if (!analyticsAllowed()) return;
  window.posthog?.capture(event, {
    ...properties,
    locale: window.location.pathname.startsWith("/en") ? "en" : "es",
  });
}
