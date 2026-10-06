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
  // Segunda puerta, además de la de `PostHog.tsx`: sin consentimiento vigente
  // no se envía nada, aunque el script siga cargado de una visita anterior.
  if (!analyticsAllowed()) return;
  window.posthog?.capture(event, {
    ...properties,
    locale: window.location.pathname.startsWith("/en") ? "en" : "es",
  });
}
