/**
 * Envío de formularios desde un sitio estático (`output: "export"`, sin
 * servidor propio): van a Web3Forms, que los reenvía al buzón de la access key.
 * La key es pública por diseño (identifica el buzón, no autoriza a leer) y se
 * lee de `NEXT_PUBLIC_WEB3FORMS_KEY` para poder rotarla sin tocar componentes.
 *
 * Nunca se devuelve `ok: true` si el mensaje no salió de verdad: sin key, con
 * la red caída o con un rechazo, el llamante recibe el fallo y debe decirlo.
 */

import { DIARIOS, EXPERIENCIAS, OBJETIVOS, PERFILES, etiquetaEs } from "@/lib/beta-opciones";

const ENDPOINT = "https://api.web3forms.com/submit";

/** Cortamos a los 15 s: más allá, el usuario ya ha asumido que no va. */
const TIMEOUT_MS = 15_000;

// Acceso literal a `process.env.X`: Next solo lo sustituye en build así; destructurarlo rompe el inlining.
const ACCESS_KEY = (process.env.NEXT_PUBLIC_WEB3FORMS_KEY ?? "").trim();

/** `false` sin key (p. ej. en local sin `.env.local`): los formularios avisan en vez de fingir un envío. */
export const formsConfigured = ACCESS_KEY.length > 0;

/**
 * URL del Apps Script que guarda las altas en la hoja (termina en /exec; el
 * script vive en docs/waitlist-apps-script.js). Es pública como la key de
 * Web3Forms: solo permite añadir filas, nunca leer la hoja.
 */
const WAITLIST_URL = (process.env.NEXT_PUBLIC_WAITLIST_URL ?? "").trim();

/**
 * Worker opcional de la solicitud de beta; sin él, el Apps Script; sin
 * ninguno, Web3Forms (ver `joinBetaApplication`). `||` y no `??`: la variable
 * que falta llega como "" (next.config.ts la incrusta así y GitHub pasa vacío
 * un secreto sin definir).
 */
const BETA_API_URL = (process.env.NEXT_PUBLIC_BETA_API_URL ?? "").trim() || WAITLIST_URL;

export const betaConfigured = BETA_API_URL.length > 0 || formsConfigured;

/**
 * Buzón de soporte: único sitio donde se escribe (contacto, FAQ y formularios
 * lo importan). Mientras sea `null` no hay buzón: el único canal es el
 * formulario y ninguna pantalla muestra una dirección.
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
 * POST de JSON con timeout, compartido por los dos envíos. Devuelve `null` si
 * la petición no llegó a completarse (red, CORS, timeout); si hubo respuesta,
 * status y cuerpo parseado para que cada servicio aplique su criterio de éxito.
 */
async function postJson(
  url: string,
  payload: unknown,
  /**
   * `text/plain` hace la petición "simple": sin OPTIONS previo y con
   * respuesta legible. Obligatorio para Apps Script; el cuerpo sigue siendo JSON.
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

  // Web3Forms devuelve 200 con `success: false` en algunos rechazos.
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

/** De qué página y campaña llega la solicitud. */
function procedencia() {
  const enNavegador = typeof window !== "undefined";
  const params = new URLSearchParams(enNavegador ? window.location.search : "");
  return {
    source: enNavegador ? window.location.pathname : "",
    utmSource: params.get("utm_source") ?? "",
    utmMedium: params.get("utm_medium") ?? "",
    utmCampaign: params.get("utm_campaign") ?? "",
    origin: enNavegador ? window.location.origin : "",
  };
}

/**
 * Sin Worker ni hoja, la solicitud llega al correo del titular como un mensaje
 * de Web3Forms, con un dato por línea. No hay deduplicación ni Turnstile; el
 * filtro antibot es el campo trampa.
 */
async function solicitudPorCorreo(application: BetaApplicationData): Promise<BetaApplicationResult> {
  const { source, utmSource, utmMedium, utmCampaign } = procedencia();
  const lineas = [
    ["Perfil", etiquetaEs(PERFILES, application.profile)],
    ["Experiencia", etiquetaEs(EXPERIENCIAS, application.experience)],
    ["Mercados", application.markets],
    ["Cómo lleva hoy su diario", etiquetaEs(DIARIOS, application.workflow)],
    ["Objetivo", etiquetaEs(OBJETIVOS, application.goal)],
    ["Comentario", application.notes ?? ""],
    ["Idioma", application.lang ?? ""],
    ["Acepta comunicaciones", application.marketingConsent ? "sí" : "no"],
    ["Página", source],
    ["UTM", [utmSource, utmMedium, utmCampaign].filter(Boolean).join(" / ")],
  ];
  const result = await submitForm({
    subject: `Solicitud de acceso anticipado · ${etiquetaEs(PERFILES, application.profile)}`,
    email: application.email,
    message: lineas.map(([etiqueta, valor]) => `${etiqueta}: ${valor || "—"}`).join("\n"),
    botcheck: application.botcheck,
  });
  return result.ok ? { ok: true, duplicate: false } : result;
}

/** Envía una solicitud de beta, sin datos financieros ni valores de calculadoras. */
export async function joinBetaApplication(
  application: BetaApplicationData,
): Promise<BetaApplicationResult> {
  if (!BETA_API_URL) return solicitudPorCorreo(application);

  const { botcheck = "", ...rest } = application;
  const res = await postJson(
    BETA_API_URL,
    { ...rest, email: application.email.trim(), botcheck, ...procedencia() },
    "text/plain;charset=utf-8",
  );

  if (!res) return { ok: false, reason: "network" };
  if (!res.ok) return { ok: false, reason: "rejected" };
  const data = res.data as { ok?: boolean; duplicate?: boolean } | null;
  if (!data?.ok) return { ok: false, reason: "rejected" };
  return { ok: true, duplicate: data.duplicate === true };
}
