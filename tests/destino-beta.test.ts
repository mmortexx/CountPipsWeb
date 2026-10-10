import { afterEach, describe, expect, it, vi } from "vitest";

// El formulario de /beta envía al Worker (BETA_API_URL); sin él, al Apps
// Script de la hoja (WAITLIST_URL); y sin ninguno, a Web3Forms con la clave del
// formulario de contacto, que lo reenvía al correo del titular. Cada caso
// recorre el camino de una compilación real: next.config.ts recibe el entorno y
// decide qué valores se incrustan; forms.ts los lee. Ahí se rompió: el config
// convierte la variable que falta en "", y `??` no salta con "", así que la web
// publicada sin Worker no tenía destino y toda solicitud acababa en error.

const APPS_SCRIPT = "https://script.google.com/macros/s/HOJA/exec";
const WORKER = "https://beta-api.ejemplo.workers.dev/v1/applications";
const WEB3FORMS = "https://api.web3forms.com/submit";
const CLAVE = "clave-de-prueba";

const SOLICITUD = {
  email: "persona@ejemplo.com",
  profile: "manual",
  experience: "1-3",
  markets: "Forex",
  workflow: "excel",
  goal: "disciplina",
  privacyConsent: true,
} as const;

/** El entorno con que arranca la compilación; `undefined` = la variable no existe. */
async function compilarCon(entorno: { beta?: string; waitlist?: string; clave?: string }) {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.stubEnv("NEXT_PUBLIC_BETA_API_URL", entorno.beta);
  vi.stubEnv("NEXT_PUBLIC_WAITLIST_URL", entorno.waitlist);
  vi.stubEnv("NEXT_PUBLIC_WEB3FORMS_KEY", entorno.clave);

  const { default: config } = await import("../next.config");
  const incrustado = config.env ?? {};
  for (const nombre of ["NEXT_PUBLIC_BETA_API_URL", "NEXT_PUBLIC_WAITLIST_URL", "NEXT_PUBLIC_WEB3FORMS_KEY"]) {
    vi.stubEnv(nombre, incrustado[nombre]);
  }

  vi.resetModules();
  return import("@/lib/forms");
}

/** Envía una solicitud y devuelve a qué dirección fue, o `null` si no salió. */
async function destinoDelEnvio(
  forms: Awaited<ReturnType<typeof compilarCon>>,
  respuesta: unknown = { ok: true, duplicate: false, success: true },
) {
  const fetch = vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify(respuesta)));
  vi.stubGlobal("fetch", fetch);
  const resultado = await forms.joinBetaApplication({ ...SOLICITUD, notes: "Probando", botcheck: "" });
  const llamada = fetch.mock.calls[0];
  return {
    resultado,
    url: llamada ? String(llamada[0]) : null,
    cuerpo: llamada ? (JSON.parse(String(llamada[1]?.body)) as Record<string, unknown>) : null,
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("a dónde va la solicitud de acceso anticipado", () => {
  it("solo con el Apps Script, la solicitud va al Apps Script", async () => {
    const forms = await compilarCon({ waitlist: APPS_SCRIPT });
    expect(forms.betaConfigured).toBe(true);
    const { resultado, url } = await destinoDelEnvio(forms);
    expect(url).toBe(APPS_SCRIPT);
    expect(resultado).toEqual({ ok: true, duplicate: false });
  });

  it("con el secreto del Worker sin definir en GitHub (llega vacío), va al Apps Script", async () => {
    const forms = await compilarCon({ beta: "", waitlist: APPS_SCRIPT });
    expect((await destinoDelEnvio(forms)).url).toBe(APPS_SCRIPT);
  });

  it("con el Worker en blanco, va al Apps Script", async () => {
    const forms = await compilarCon({ beta: "   ", waitlist: APPS_SCRIPT });
    expect((await destinoDelEnvio(forms)).url).toBe(APPS_SCRIPT);
  });

  it("con los dos, gana el Worker", async () => {
    const forms = await compilarCon({ beta: WORKER, waitlist: APPS_SCRIPT, clave: CLAVE });
    expect((await destinoDelEnvio(forms)).url).toBe(WORKER);
  });

  it("con la hoja y la clave de Web3Forms, gana la hoja", async () => {
    const forms = await compilarCon({ beta: "", waitlist: APPS_SCRIPT, clave: CLAVE });
    expect((await destinoDelEnvio(forms)).url).toBe(APPS_SCRIPT);
  });

  it("sin hoja ni Worker, va a Web3Forms con todos los datos de la solicitud", async () => {
    const forms = await compilarCon({ beta: "", waitlist: "", clave: CLAVE });
    expect(forms.betaConfigured).toBe(true);
    const { resultado, url, cuerpo } = await destinoDelEnvio(forms);
    expect(url).toBe(WEB3FORMS);
    expect(resultado).toEqual({ ok: true, duplicate: false });
    expect(cuerpo).toMatchObject({ access_key: CLAVE, email: SOLICITUD.email, botcheck: "" });
    const texto = JSON.stringify(cuerpo);
    for (const dato of [SOLICITUD.profile, SOLICITUD.experience, SOLICITUD.markets, SOLICITUD.workflow, SOLICITUD.goal, "Probando"]) {
      expect(texto).toContain(dato);
    }
  });

  it("si Web3Forms rechaza la solicitud, no se da por enviada", async () => {
    const forms = await compilarCon({ beta: "", waitlist: "", clave: CLAVE });
    const { resultado } = await destinoDelEnvio(forms, { success: false, message: "Límite alcanzado" });
    expect(resultado).toEqual({ ok: false, reason: "rejected" });
  });

  it("sin ninguno, avisa del fallo y no envía nada", async () => {
    const forms = await compilarCon({ beta: "", waitlist: "", clave: "" });
    expect(forms.betaConfigured).toBe(false);
    const { resultado, url } = await destinoDelEnvio(forms);
    expect(url).toBeNull();
    expect(resultado).toEqual({ ok: false, reason: "unconfigured" });
  });
});
