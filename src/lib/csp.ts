import { createHash } from "node:crypto";

/**
 * La política de contenido (CSP) del sitio, escrita en un solo sitio para los
 * dos destinos:
 *
 *  · GitHub Pages no deja poner cabeceras: cada página lleva la suya en una
 *    `<meta http-equiv>` con la huella sha256 de cada script en línea de ESA
 *    página, sin `'unsafe-inline'` (`conPoliticaEnMeta`).
 *  · El dominio propio (Cloudflare) la recibe además como cabecera desde
 *    `_headers` (`cabecerasConPolitica`). Una cabecera no puede llevar las
 *    huellas de cada página (Cloudflare corta los valores a 2 000 caracteres),
 *    así que ahí los scripts van con `'unsafe-inline'`; el navegador aplica las
 *    dos políticas a la vez y manda la más estricta, la de la meta. La cabecera
 *    aporta lo que una meta no puede: `frame-ancestors`.
 *
 * Solo se abre a un tercero si la compilación lo usa: el Worker o la hoja de
 * acceso anticipado según `forms.ts` (el Worker gana si están los dos) y
 * Turnstile si hay clave. Web3Forms siempre, que es el formulario de contacto.
 */
export type Entorno = {
  betaApiUrl?: string;
  waitlistUrl?: string;
  turnstileSiteKey?: string;
};

const TURNSTILE = "https://challenges.cloudflare.com";
const WEB3FORMS = "https://api.web3forms.com";
/* El Apps Script responde redirigiendo a script.googleusercontent.com. */
const APPS_SCRIPT = ["https://script.google.com", "https://script.googleusercontent.com"];

export function entornoDeCompilacion(env: Record<string, string | undefined>): Entorno {
  return {
    betaApiUrl: env.NEXT_PUBLIC_BETA_API_URL,
    waitlistUrl: env.NEXT_PUBLIC_WAITLIST_URL,
    turnstileSiteKey: env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  };
}

/** Origen https de una dirección configurada; lanza si no lo es (un destino en http filtraría los datos del formulario). */
function origenSeguro(url: string, nombre: string): string {
  const u = new URL(url);
  if (u.protocol !== "https:") throw new Error(`[csp] ${nombre} debe ser https: ${u.origin}`);
  return u.origin;
}

function conexiones(e: Entorno): string[] {
  const worker = (e.betaApiUrl ?? "").trim();
  const hoja = (e.waitlistUrl ?? "").trim();
  const destinos = [WEB3FORMS];
  if (worker) destinos.push(origenSeguro(worker, "NEXT_PUBLIC_BETA_API_URL"));
  else if (hoja) destinos.push(origenSeguro(hoja, "NEXT_PUBLIC_WAITLIST_URL"), ...APPS_SCRIPT);
  if ((e.turnstileSiteKey ?? "").trim()) destinos.push(TURNSTILE);
  return [...new Set(destinos)];
}

/**
 * La política. `scripts` son las huellas de la página (meta) o `"en-linea"`
 * (cabecera). Los estilos llevan `'unsafe-inline'`: React pinta atributos
 * `style` en el HTML y Radix inserta `<style>` con medidas calculadas al abrir
 * un diálogo; un estilo no ejecuta nada.
 */
export function politica(e: Entorno, scripts: readonly string[] | "en-linea"): string {
  const turnstile = (e.turnstileSiteKey ?? "").trim() ? [TURNSTILE] : [];
  const directivas: [string, ...string[]][] = [
    ["default-src", "'self'"],
    ["script-src", "'self'", ...(scripts === "en-linea" ? ["'unsafe-inline'"] : scripts), ...turnstile],
    ["style-src", "'self'", "'unsafe-inline'"],
    ["img-src", "'self'", "data:"],
    ["font-src", "'self'"],
    ["connect-src", "'self'", ...conexiones(e)],
    ["frame-src", ...(turnstile.length ? turnstile : ["'none'"])],
    ["worker-src", "'none'"],
    ["object-src", "'none'"],
    ["base-uri", "'none'"],
    ["form-action", "'self'"],
  ];
  if (scripts === "en-linea") directivas.push(["frame-ancestors", "'none'"]);
  return directivas.map((d) => d.join(" ")).join("; ");
}

const huella = (s: string) => `'sha256-${createHash("sha256").update(s, "utf8").digest("base64")}'`;

/* Los `type` con los que el navegador ejecuta un script (HTML, «JavaScript MIME type»). */
const TIPOS_JS =
  /^(module|(application|text)\/(x-)?(java|ecma)script|text\/javascript1\.[0-5]|text\/(jscript|livescript))$/;

/** Huellas de los scripts en línea que el navegador ejecuta (los `ld+json` son datos). */
export function huellasDeScripts(html: string): string[] {
  const huellas: string[] = [];
  for (const [, attrs, cuerpo] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    if (/(^|\s)src\s*=/i.test(attrs)) continue;
    const tipo = attrs.match(/(?:^|\s)type\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const valor = (tipo?.[1] ?? tipo?.[2] ?? tipo?.[3] ?? "").trim().toLowerCase();
    if (valor && !TIPOS_JS.test(valor)) continue;
    huellas.push(huella(cuerpo));
  }
  return [...new Set(huellas)];
}

/**
 * Mete la política y la de referencia justo tras `<meta charset>`, antes de
 * cualquier script: una meta solo protege lo que viene detrás. Lanza si la
 * página no tiene `<meta charset>` o ya lleva política.
 */
export function conPoliticaEnMeta(html: string, e: Entorno): string {
  if (/http-equiv="Content-Security-Policy"/i.test(html)) throw new Error("[csp] la página ya lleva política");
  let cambios = 0;
  const csp = politica(e, huellasDeScripts(html));
  const resultado = html.replace(/<meta charSet="utf-8"\/>/i, (m) => {
    cambios++;
    return `${m}<meta http-equiv="Content-Security-Policy" content="${csp}"/><meta name="referrer" content="strict-origin-when-cross-origin"/>`;
  });
  if (cambios !== 1) throw new Error("[csp] la página no tiene <meta charSet>");
  return resultado;
}

/** `_headers` con la política de cabecera en la línea que la espera. Lanza si no la encuentra. */
export function cabecerasConPolitica(texto: string, e: Entorno): string {
  let cambios = 0;
  const resultado = texto.replace(/^([ \t]+Content-Security-Policy:)[^\r\n]*/gm, (_, nombre: string) => {
    cambios++;
    return `${nombre} ${politica(e, "en-linea")}`;
  });
  if (cambios !== 1) throw new Error("[csp] _headers no tiene una línea Content-Security-Policy");
  return resultado;
}
