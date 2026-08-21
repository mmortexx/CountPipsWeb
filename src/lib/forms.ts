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
 * cliente porque el navegador tiene que llamarla. Sólo permite añadir
 * filas, nunca leer la hoja.
 */
const WAITLIST_URL = (process.env.NEXT_PUBLIC_WAITLIST_URL ?? "").trim();

/** Endpoint opcional para la aplicación cualificada de beta. Si no se
 * configura, reutiliza el Apps Script de la lista con el mismo contrato. */
const BETA_API_URL = (process.env.NEXT_PUBLIC_BETA_API_URL ?? WAITLIST_URL).trim();

/** `false` mientras no se haya configurado la URL de la lista. */
export const waitlistConfigured = WAITLIST_URL.length > 0;
export const betaConfigured = BETA_API_URL.length > 0;

/**
 * Buzón de soporte. ÚNICO sitio del proyecto donde se escribe.
 *
 * No es sólo el respaldo cuando falla un envío: es la dirección que sale
 * en la tarjeta de contacto, al pie de la FAQ y en la llamada de "¿no
 * encuentras tu respuesta?". Esas tres la llevaban copiada a mano
 * mientras el formulario y la lista de espera sí importaban esta
 * constante — media web centralizada y media duplicada, que es como
 * empiezan estas cosas.
 *
 * OJO, sigue con el dominio ANTERIOR al renombrado. Es deliberado, por el
 * mismo motivo que la dirección canónica del sitio: `countpips.com` aún no
 * está comprado, y un buzón que no existe pierde los correos en silencio,
 * que es peor que uno con el nombre viejo. Cuando el dominio esté
 * registrado y con buzón, se cambia AQUÍ y queda cambiado en las cinco
 * pantallas donde aparece.
 */
export const SUPPORT_EMAIL = "soporte@tradingjournal.app";

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

export type WaitlistResult =
  | { ok: true; priority: number | null; duplicate: boolean; count: number | null }
  | { ok: false; reason: SubmitFailure };

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

/**
 * Da de alta un email en la lista de espera y devuelve su puesto en la cola.
 *
 * `priority` es el número de fila en la hoja. Puede volver `null` si la
 * respuesta no lo trae: en ese caso el alta ES válida y la interfaz
 * simplemente no enseña el puesto, en vez de inventarse uno.
 *
 * `duplicate` indica que ese email ya estaba apuntado. No es un error —
 * el resultado deseado (estar en la lista) se cumple igual —, pero
 * permite darle un mensaje distinto a quien se apunta dos veces.
 *
 * Misma regla que `submitForm`: nunca `ok: true` si el alta no se registró.
 */
export async function joinWaitlist(
  email: string,
  opts: { lang?: string; botcheck?: string } = {}
): Promise<WaitlistResult> {
  if (!waitlistConfigured) {
    return { ok: false, reason: "unconfigured" };
  }

  const res = await postJson(
    WAITLIST_URL,
    {
      email: email.trim(),
      lang: opts.lang ?? "",
      botcheck: opts.botcheck ?? "",
      // Desde qué página se apuntó, para saber qué sección convierte.
      source: typeof window === "undefined" ? "" : window.location.pathname,
    },
    "text/plain;charset=utf-8"
  );

  if (!res) return { ok: false, reason: "network" };
  if (!res.ok) return { ok: false, reason: "rejected" };

  // El script responde `{ ok, position, duplicate, count }`. Un `ok: false`
  // ahí significa que llegó pero no guardó (email inválido, error de la hoja).
  const data = res.data as {
    ok?: boolean;
    position?: number;
    duplicate?: boolean;
    count?: number;
  } | null;
  if (!data?.ok) return { ok: false, reason: "rejected" };

  return {
    ok: true,
    priority: asCount(data.position),
    duplicate: data.duplicate === true,
    count: asCount(data.count),
  };
}

/* ============================================================
   CONTADOR DE LA LISTA DE ESPERA
   ============================================================ */

/**
 * Normaliza un valor que llega de la red a un entero >= 0, o `null`.
 *
 * Todo lo que venga de fuera se trata como sospechoso: un `"12"`, un
 * `NaN`, un `-3` o un `1.5` no pueden acabar pintados en pantalla como
 * si fueran un recuento. Preferimos `null` (no se enseña nada) antes que
 * un número que no signifique lo que dice.
 */
function asCount(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}

/** Corte para el contador: es una cifra decorativa, no bloquea nada. */
const COUNT_TIMEOUT_MS = 8_000;

/**
 * Lee cuánta gente hay apuntada. Devuelve `null` si no se puede saber —
 * nunca un número inventado ni un cero de relleno.
 *
 * Dos vías, en este orden:
 *
 *  1. `fetch` normal. Apps Script sirve la respuesta del GET con
 *     `Access-Control-Allow-Origin: *`, así que en un navegador sano
 *     esto basta y no ejecuta código de terceros.
 *
 *  2. JSONP (una etiqueta `<script>`) sólo si la primera falla. Hay dos
 *     escenarios reales en los que falla: extensiones de privacidad que
 *     cortan la petición entre dominios, y navegadores que se atragantan
 *     con la redirección de `script.google.com` a
 *     `script.googleusercontent.com`. La etiqueta no está sujeta a CORS,
 *     así que atraviesa ambos casos.
 *
 * El JSONP ejecuta lo que responda el endpoint, de modo que sólo se usa
 * contra la URL configurada en build — nunca contra una que venga del
 * usuario o de la barra de direcciones.
 */
export async function fetchWaitlistCount(): Promise<number | null> {
  if (!waitlistConfigured) return null;
  const viaFetch = await countViaFetch();
  if (viaFetch !== null) return viaFetch;
  return countViaJsonp();
}

async function countViaFetch(): Promise<number | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), COUNT_TIMEOUT_MS);
  try {
    const res = await fetch(WAITLIST_URL, {
      method: "GET",
      signal: controller.signal,
      // El contador puede quedarse 30 s atrás sin que se note; evitar el
      // viaje completo en cada montaje es mejor que la exactitud al
      // segundo, y protege la cuota diaria de Apps Script.
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json().catch(() => null)) as
      | { ok?: boolean; count?: number }
      | null;
    if (!data?.ok) return null;
    return asCount(data.count);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Contador incremental: evita colisiones si hay dos lecturas en vuelo. */
let jsonpSeq = 0;

function countViaJsonp(): Promise<number | null> {
  if (typeof document === "undefined") return Promise.resolve(null);

  return new Promise((resolve) => {
    const name = `__tjWaitlistCount${++jsonpSeq}`;
    const script = document.createElement("script");
    let settled = false;

    const cleanup = () => {
      clearTimeout(timer);
      delete (window as unknown as Record<string, unknown>)[name];
      script.remove();
    };
    const finish = (value: number | null) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(value);
    };

    const timer = setTimeout(() => finish(null), COUNT_TIMEOUT_MS);

    (window as unknown as Record<string, unknown>)[name] = (payload: unknown) => {
      const data = payload as { ok?: boolean; count?: number } | null;
      finish(data?.ok ? asCount(data.count) : null);
    };

    script.src = `${WAITLIST_URL}${WAITLIST_URL.includes("?") ? "&" : "?"}callback=${name}`;
    script.async = true;
    script.onerror = () => finish(null);
    document.head.appendChild(script);
  });
}
