/**
 * forms.ts — envío real de formularios desde un sitio estático.
 *
 * El sitio se publica con `output: "export"` en GitHub Pages, así que no hay
 * servidor propio donde recibir un POST. Los envíos van a Web3Forms, que
 * reenvía cada formulario al buzón asociado a la access key.
 *
 * Sobre la access key: en Web3Forms es pública por diseño — identifica el
 * buzón de destino, no autoriza a leer nada. Aun así se lee de
 * `NEXT_PUBLIC_WEB3FORMS_KEY` (inlineada en build) en vez de estar escrita
 * en el código, para poder rotarla sin tocar componentes.
 *
 * Regla de oro de este módulo: nunca devolver `ok: true` si el mensaje no
 * salió de verdad. Si no hay key, si la red falla o si Web3Forms rechaza el
 * envío, el llamante recibe un fallo y debe decírselo al usuario. Antes los
 * dos formularios animaban un "✓ enviado" sin mandar nada.
 */

const ENDPOINT = "https://api.web3forms.com/submit";

/** Cortamos a los 15 s: más allá, el usuario ya ha asumido que no va. */
const TIMEOUT_MS = 15_000;

/**
 * Debe escribirse como acceso literal completo a `process.env.X` para que
 * Next lo sustituya por el valor en build. Destructurarlo rompe el inlining.
 */
const ACCESS_KEY = (process.env.NEXT_PUBLIC_WEB3FORMS_KEY ?? "").trim();

/**
 * `false` cuando no se ha configurado la key (p. ej. en local sin
 * `.env.local`). Los formularios lo usan para avisar en desarrollo en vez de
 * fingir un envío correcto.
 */
export const formsConfigured = ACCESS_KEY.length > 0;

/**
 * URL del script de Google que guarda las altas en la hoja de cálculo
 * (la que devuelve Apps Script al implementar; termina en /exec). El
 * script vive en docs/waitlist-apps-script.js, con sus instrucciones.
 *
 * Es pública por el mismo motivo que la clave de Web3Forms: viaja en el
 * cliente porque el navegador tiene que llamarla. Solo permite añadir
 * filas, nunca leer la hoja.
 */
const WAITLIST_URL = (process.env.NEXT_PUBLIC_WAITLIST_URL ?? "").trim();

/** Endpoint opcional para la aplicación cualificada de beta. Si no se
 * configura, reutiliza el Apps Script de la lista con el mismo contrato. */
const BETA_API_URL = (process.env.NEXT_PUBLIC_BETA_API_URL ?? WAITLIST_URL).trim();

export const betaConfigured = BETA_API_URL.length > 0;

/**
 * Buzón de soporte. ÚNICO sitio del proyecto donde se escribe.
 *
 * No es solo el respaldo cuando falla un envío: es la dirección que sale
 * en la tarjeta de contacto, al pie de la FAQ y en la llamada de "¿no
 * encuentras tu respuesta?". Esas tres la llevaban copiada a mano
 * mientras el formulario y la lista de espera sí importaban esta
 * constante — media web centralizada y media duplicada, que es como
 * empiezan estas cosas.
 *
 * Hoy no hay buzón: la web enseñaba una dirección que no existía y los
 * correos se perdían en silencio. Mientras sea `null`, el único canal es
 * el formulario (que sí llega) y ninguna pantalla muestra una dirección.
 * Cuando exista el buzón, se escribe AQUÍ y vuelve a aparecer solo.
 */
export const SUPPORT_EMAIL: string | null = null;

export type SubmitFailure =
  /** No hay access key en el build: es un fallo de configuración, no del usuario. */
  | "unconfigured"
  /** Sin conexión, DNS caído, CORS, bloqueador de anuncios, timeout… */
  | "network"
  /** Web3Forms respondió, pero rechazó el envío (key inválida, cuota, spam). */
  | "rejected";

export type SubmitResult = { ok: true } | { ok: false; reason: SubmitFailure };

export type FormFields = {
  /** Asunto del email que llega al buzón. */
  subject: string;
  /** Email de quien escribe; Web3Forms lo pone como reply-to. */
  email: string;
  /** Nombre de quien escribe, si el formulario lo pide. */
  name?: string;
  /** Cuerpo del mensaje, si el formulario lo pide. */
  message?: string;
  /**
   * Honeypot. Web3Forms descarta el envío si llega con contenido; los
   * humanos no lo ven, los bots lo rellenan.
   */
  botcheck?: string;
};

/**
 * POST de JSON con timeout, compartido por los dos envíos.
 *
 * Devuelve `null` cuando la petición ni siquiera llegó a completarse (red
 * caída, CORS, timeout); en ese caso el llamante reporta "network". Si hubo
 * respuesta, entrega el status y el cuerpo ya parseado para que cada
 * servicio aplique su propio criterio de éxito.
 */
async function postJson(
  url: string,
  payload: unknown,
  /**
   * `text/plain` convierte la petición en "simple" para el navegador: no
   * hay comprobación previa (OPTIONS) y la respuesta se puede leer. Es
   * obligatorio para Google Apps Script, que no sabe responder a esa
   * comprobación. El cuerpo sigue siendo JSON en ambos casos.
   */
  contentType: "application/json" | "text/plain;charset=utf-8" = "application/json"
): Promise<{ status: number; ok: boolean; data: unknown } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": contentType, Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, ok: res.ok, data };
  } catch {
    // AbortError, TypeError de red, CORS bloqueado por una extensión…
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Envía un formulario y responde si salió o no.
 *
 * No lanza excepciones: cualquier fallo vuelve como `{ ok: false, reason }`
 * para que el componente decida qué copy enseñar en cada idioma.
 */
export async function submitForm(fields: FormFields): Promise<SubmitResult> {
  if (!formsConfigured) {
    return { ok: false, reason: "unconfigured" };
  }

  // Límites de longitud y saneamiento previo
  const email = (fields.email ?? "").trim().slice(0, 254);
  const subject = (fields.subject ?? "").trim().slice(0, 160);
  const name = fields.name ? fields.name.trim().slice(0, 100) : undefined;
  const message = fields.message ? fields.message.trim().slice(0, 3000) : undefined;
  const botcheck = (fields.botcheck ?? "").slice(0, 100);

  if (!email || !email.includes("@")) {
    return { ok: false, reason: "rejected" };
  }

  const res = await postJson(ENDPOINT, {
    access_key: ACCESS_KEY,
    botcheck,
    subject,
    email,
    name,
    message,
    from_name: name || "CountPips Web",
  });

  if (!res) return { ok: false, reason: "network" };

  // Web3Forms devuelve 200 con `success: false` en algunos rechazos, así
  // que no basta con mirar el status HTTP.
  const data = res.data as { success?: boolean } | null;
  if (!res.ok || !data?.success) return { ok: false, reason: "rejected" };

  return { ok: true };
}

export type BetaApplicationData = {
  email: string;
  profile: "manual" | "prop";
  experience: string;
  markets: string;
  workflow: string;
  goal: string;
  privacyConsent: boolean;
  notes?: string;
  marketingConsent?: boolean;
  botcheck?: string;
  turnstileToken?: string;
  lang?: string;
};

export type BetaApplicationResult =
  | { ok: true; duplicate: boolean }
  | { ok: false; reason: SubmitFailure };

/** Envía una solicitud cualificada sin enviar datos financieros ni valores
 * de calculadoras. El endpoint definitivo puede ser un Worker; el fallback
 * al Apps Script permite probar el flujo antes de migrar la infraestructura. */
export async function joinBetaApplication(
  application: BetaApplicationData,
): Promise<BetaApplicationResult> {
  if (!betaConfigured) return { ok: false, reason: "unconfigured" };

  const { botcheck = "", ...rest } = application;
  const params = typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);
  const res = await postJson(
    BETA_API_URL,
    {
      ...rest,
      email: application.email.trim(),
      botcheck,
      source: typeof window === "undefined" ? "" : window.location.pathname,
      utmSource: params.get("utm_source") ?? "",
      utmMedium: params.get("utm_medium") ?? "",
      utmCampaign: params.get("utm_campaign") ?? "",
      origin: typeof window === "undefined" ? "" : window.location.origin,
    },
    "text/plain;charset=utf-8",
  );

  if (!res) return { ok: false, reason: "network" };
  if (!res.ok) return { ok: false, reason: "rejected" };
  const data = res.data as { ok?: boolean; duplicate?: boolean } | null;
  if (!data?.ok) return { ok: false, reason: "rejected" };
  return { ok: true, duplicate: data.duplicate === true };
}
