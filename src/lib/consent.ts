/**
 * Consentimiento de analítica: única fuente de la clave y de los eventos que
 * comparten `CookieConsent.tsx` y `PostHog.tsx`. Retirar el consentimiento
 * debe ser tan fácil como darlo (RGPD): `reopenConsent()`, enlazado desde el
 * pie, vuelve a mostrar el aviso y «Solo necesarias» escribe `declined`.
 */

/** Clave de almacenamiento local donde vive la elección. */
export const CONSENT_KEY = "tj-cookie-consent";

/** Se emite cuando la elección cambia. `detail` es el valor nuevo. */
export const CONSENT_CHANGE_EVENT = "tj-consent-change";

/** Se emite para pedirle al aviso que vuelva a aparecer. */
export const CONSENT_REOPEN_EVENT = "tj-consent-reopen";

/**
 * El aviso ha aparecido o se ha ido. Lo emite `CookieConsent` y lo escucha el
 * botón de volver arriba para apartarse, sin vigilar el DOM.
 */
export const CONSENT_VISIBILITY_EVENT = "tj-consent-visibility";

export type Consent = "accepted" | "declined" | null;

/** Lee la elección guardada. `null` = todavía no ha elegido. */
export function readConsent(): Consent {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === "accepted" || v === "declined" ? v : null;
  } catch {
    // Almacenamiento bloqueado: "sin elegir", nunca "aceptado"; ante la duda no se mide.
    return null;
  }
}

/** `true` solo si el visitante aceptó la analítica de forma explícita. */
export function analyticsAllowed(): boolean {
  return readConsent() === "accepted";
}

/** Guarda la elección y avisa a quien escuche. */
export function writeConsent(choice: Exclude<Consent, null>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    /* Sin almacenamiento: la elección vale para esta sesión y nada más. */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: choice }));
}

/**
 * Vuelve a mostrar el aviso para cambiar la elección. No borra nada: quien
 * abre las preferencias y no toca nada conserva su elección.
 */
export function reopenConsent(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CONSENT_REOPEN_EVENT));
}
