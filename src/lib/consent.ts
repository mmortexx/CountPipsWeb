/**
 * Consentimiento de analítica — única fuente de verdad.
 *
 * ── POR QUÉ ESTE FICHERO ──────────────────────────────────────────────
 * La clave `tj-cookie-consent` vivía escrita a mano en dos sitios
 * (`CookieConsent.tsx` y `PostHog.tsx`) y el nombre del evento en tres.
 * Con dos copias de un literal, la retirada del consentimiento no podía
 * implementarse sin arriesgarse a que un sitio lo borrara y el otro
 * siguiera leyendo el valor viejo.
 *
 * ── EL AGUJERO QUE VIENE A TAPAR ──────────────────────────────────────
 * La política de privacidad instruye al visitante a "volver a elegir
 * «Solo necesarias»" para retirar el consentimiento. Ese aviso NO volvía
 * a salir nunca: `CookieConsent` se marca como descartado en cuanto la
 * clave existe, y no había ningún control en toda la web para borrarla.
 * La única salida real era abrir las herramientas del navegador y vaciar
 * el almacenamiento del sitio.
 *
 * El RGPD exige que retirar el consentimiento sea tan fácil como darlo.
 * Darlo: un clic. Retirarlo: no se podía. `reopenConsent()` —conectado al
 * control «Preferencias de privacidad» del pie, que sale en las 154
 * páginas— hace que el aviso vuelva a aparecer, y elegir allí «Solo
 * necesarias» escribe `declined` y corta la medición en el acto. Como el
 * texto legal ya prometía esa función, esto no añade una promesa nueva:
 * cumple la que había.
 */

/** Clave de almacenamiento local donde vive la elección. */
export const CONSENT_KEY = "tj-cookie-consent";

/** Se emite cuando la elección cambia. `detail` es el valor nuevo. */
export const CONSENT_CHANGE_EVENT = "tj-consent-change";

/** Se emite para pedirle al aviso que vuelva a aparecer. */
export const CONSENT_REOPEN_EVENT = "tj-consent-reopen";

/**
 * El aviso ha aparecido o se ha ido de la pantalla.
 *
 * Lo emite `CookieConsent` cada vez que cambia su visibilidad, y hoy lo
 * escucha el botón de volver arriba, que tiene que apartarse para no
 * quedar debajo. Antes se enteraba con un `MutationObserver` sobre
 * `document.body` con `subtree: true` —en las 155 páginas del sitio—
 * porque no había forma de saberlo: cualquier cambio del DOM, viniera de
 * donde viniera, disparaba una comprobación que leía el alto del
 * documento y medía rectángulos.
 *
 * Con un evento, el que sabe avisa y nadie vigila.
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
    // Modo privado con almacenamiento bloqueado: se trata como "sin
    // elegir". Nunca como "aceptado" — ante la duda, no se mide.
    return null;
  }
}

/** `true` sólo si el visitante aceptó la analítica de forma explícita. */
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
 * Vuelve a mostrar el aviso para que se pueda cambiar la elección.
 *
 * NO borra nada por su cuenta, a propósito: quien abre las preferencias y
 * no toca nada no debería quedarse sin la elección que ya había hecho. La
 * retirada la ejecuta el propio aviso al pulsar "Solo necesarias", que
 * escribe `declined` y corta la medición en el acto.
 */
export function reopenConsent(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CONSENT_REOPEN_EVENT));
}
