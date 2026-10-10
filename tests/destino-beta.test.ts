import { afterEach, describe, expect, it, vi } from "vitest";

// El formulario de /beta envía al Worker (BETA_API_URL) o, sin él, al Apps
// Script de la hoja (WAITLIST_URL). Cada caso recorre el camino de una
// compilación real: next.config.ts recibe el entorno y decide qué valores se
// incrustan; forms.ts los lee. Ahí se rompió: el config convierte la variable
// que falta en "", y `??` no salta con "", así que la web publicada sin Worker
// no tenía destino y toda solicitud acababa en error.

const APPS_SCRIPT = "https://script.google.com/macros/s/HOJA/exec";
const WORKER = "https://beta-api.ejemplo.workers.dev/v1/applications";

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
async function compilarCon(entorno: { beta?: string; waitlist?: string }) {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.stubEnv("NEXT_PUBLIC_BETA_API_URL", entorno.beta);
  vi.stubEnv("NEXT_PUBLIC_WAITLIST_URL", entorno.waitlist);

  const { default: config } = await import("../next.config");
  const incrustado = config.env ?? {};
  vi.stubEnv("NEXT_PUBLIC_BETA_API_URL", incrustado.NEXT_PUBLIC_BETA_API_URL);
  vi.stubEnv("NEXT_PUBLIC_WAITLIST_URL", incrustado.NEXT_PUBLIC_WAITLIST_URL);

  vi.resetModules();
  return import("@/lib/forms");
}

/** Envía una solicitud y devuelve a qué dirección fue, o `null` si no salió. */
async function destinoDelEnvio(forms: Awaited<ReturnType<typeof compilarCon>>) {
  const fetch = vi.fn(async () => new Response(JSON.stringify({ ok: true, duplicate: false })));
  vi.stubGlobal("fetch", fetch);
  const resultado = await forms.joinBetaApplication({ ...SOLICITUD });
  const llamada = fetch.mock.calls[0] as unknown[] | undefined;
  return { resultado, url: llamada ? String(llamada[0]) : null };
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
    const forms = await compilarCon({ beta: WORKER, waitlist: APPS_SCRIPT });
    expect((await destinoDelEnvio(forms)).url).toBe(WORKER);
  });

  it("sin ninguno, avisa del fallo y no envía nada", async () => {
    const forms = await compilarCon({ beta: "", waitlist: "" });
    expect(forms.betaConfigured).toBe(false);
    const { resultado, url } = await destinoDelEnvio(forms);
    expect(url).toBeNull();
    expect(resultado).toEqual({ ok: false, reason: "unconfigured" });
  });
});
