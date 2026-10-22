import { createHash, createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import worker from "../services/beta-api/src/worker.js";

/**
 * El Worker de `services/beta-api` ejecutado de verdad: `Request` reales y un
 * `env` con D1 y KV en memoria. Solo se simula la red de Turnstile.
 */

const ORIGEN = "https://countpips.com";
const IP = "203.0.113.7";
const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const SECRETO_IP = "sal-de-prueba";
const hmac = (secreto: string, valor: string) => createHmac("sha256", secreto).update(valor).digest("hex");
const sha256 = (valor: string) => createHash("sha256").update(valor).digest("hex");

type Fila = Record<string, unknown>;

/** D1 que entiende solo las consultas del alta; cualquier otra falla a la vista. */
function d1Falso() {
  const filas: Fila[] = [];
  const estado = { fallo: null as Error | null, carrera: false };

  function ejecutar(sql: string, binds: unknown[]) {
    if (estado.fallo) throw estado.fallo;
    if (/^SELECT id FROM applications WHERE email_hash = \?1 LIMIT 1$/.test(sql)) {
      const fila = estado.carrera ? undefined : filas.find((f) => f.email_hash === binds[0]);
      return { primera: fila ? { id: fila.id } : null };
    }
    const insercion = sql.match(/^INSERT INTO applications \((.+?)\) VALUES \((.+)\)$/);
    if (insercion) {
      const columnas = insercion[1].split(",").map((c) => c.trim());
      let siguiente = 0;
      const valores = insercion[2].split(",").map((v) => {
        const t = v.trim();
        if (t === "?") return binds[siguiente++];
        if (t === "NULL") return null;
        const literal = t.match(/^'(.*)'$/);
        if (literal) return literal[1];
        throw new Error(`D1 falso: valor no previsto ${t}`);
      });
      expect(siguiente, "parámetros enlazados de más o de menos").toBe(binds.length);
      const fila = Object.fromEntries(columnas.map((c, i) => [c, valores[i]]));
      if (filas.some((f) => f.email_hash === fila.email_hash || f.id === fila.id)) {
        throw new Error("D1_ERROR: UNIQUE constraint failed: applications.email_hash: SQLITE_CONSTRAINT");
      }
      filas.push(fila);
      return { cambios: 1 };
    }
    throw new Error(`D1 falso: consulta no prevista: ${sql}`);
  }

  const sentencia = (sql: string, binds: unknown[]) => ({
    bind: (...nuevos: unknown[]) => sentencia(sql, nuevos),
    first: async () => ejecutar(sql, binds).primera ?? null,
    run: async () => ({ success: true, meta: { changes: ejecutar(sql, binds).cambios ?? 0 } }),
    all: async () => {
      throw new Error(`D1 falso: all() no previsto: ${sql}`);
    },
  });

  return {
    filas,
    estado,
    prepare: (sql: string) => sentencia(sql.replace(/\s+/g, " ").trim(), []),
  };
}

/** KV con caducidad por `expirationTtl`, medida con el reloj (falso) de la prueba. */
function kvFalso() {
  const datos = new Map<string, { valor: string; caduca: number | null }>();
  return {
    datos,
    async get(clave: string) {
      const entrada = datos.get(clave);
      if (!entrada) return null;
      if (entrada.caduca !== null && Date.now() >= entrada.caduca) {
        datos.delete(clave);
        return null;
      }
      return entrada.valor;
    },
    async put(clave: string, valor: string, opciones?: { expirationTtl?: number }) {
      const ttl = opciones?.expirationTtl;
      datos.set(clave, { valor: String(valor), caduca: ttl ? Date.now() + ttl * 1000 : null });
    },
  };
}

function entorno(extra: Record<string, unknown> = {}) {
  return {
    ALLOWED_ORIGINS: "https://mmortexx.github.io, https://countpips.com/",
    TURNSTILE_SECRET: "secreto-turnstile",
    ADMIN_TOKEN: "token-admin",
    RATE_LIMIT_SECONDS: "60",
    RATE_LIMIT_DAILY: "20",
    IP_HASH_SECRET: SECRETO_IP,
    DB: d1Falso(),
    RATE_LIMIT: kvFalso(),
    ...extra,
  };
}

const SOLICITUD = {
  email: "  Ana@Ejemplo.COM ",
  profile: "manual",
  experience: "1-3",
  markets: "forex",
  workflow: "excel",
  goal: "disciplina",
  notes: "",
  lang: "es",
  privacyConsent: true,
  marketingConsent: true,
  botcheck: "",
  turnstileToken: "token-valido",
  source: "/es/beta",
  utm_source: "boletin",
};

function alta(cuerpo: unknown, { ip = IP as string | null, origen = ORIGEN as string | null } = {}) {
  const cabeceras: Record<string, string> = { "Content-Type": "text/plain;charset=utf-8" };
  if (origen) cabeceras.Origin = origen;
  if (ip) cabeceras["CF-Connecting-IP"] = ip;
  return new Request("https://beta.ejemplo.dev/v1/applications", {
    method: "POST",
    headers: cabeceras,
    body: typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo),
  });
}

function peticion(ruta: string, metodo = "GET", cabeceras: Record<string, string> = { Origin: ORIGEN }) {
  return new Request(`https://beta.ejemplo.dev${ruta}`, { method: metodo, headers: cabeceras });
}

function conCors(res: Response) {
  expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ORIGEN);
  expect(res.headers.get("Access-Control-Allow-Methods")).toContain("POST");
  expect(res.headers.get("Vary")).toContain("Origin");
}

/** Sustituye `fetch` solo para la verificación de Turnstile. */
function turnstile(resultado: "ok" | "rechazo" | "caida" | "red") {
  const espia = vi.fn(async (entrada: RequestInfo | URL, init?: RequestInit) => {
    const url = entrada instanceof Request ? entrada.url : String(entrada);
    if (url !== SITEVERIFY) throw new Error(`fetch inesperado: ${url}`);
    expect(init?.method).toBe("POST");
    if (resultado === "red") throw new TypeError("fetch failed");
    if (resultado === "caida") return new Response("", { status: 503 });
    return Response.json({ success: resultado === "ok" });
  });
  vi.stubGlobal("fetch", espia);
  return espia;
}

const avanza = (segundos: number) => vi.setSystemTime(Date.now() + segundos * 1000);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-22T10:00:00Z"));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("CORS y rutas", () => {
  it("el preflight de un origen permitido da 204 con sus cabeceras", async () => {
    const res = await worker.fetch(peticion("/v1/applications", "OPTIONS", { Origin: `${ORIGEN}/` }), entorno());
    expect(res.status).toBe(204);
    conCors(res);
    expect(res.headers.get("Access-Control-Allow-Headers")).toContain("Content-Type");
  });

  it("el preflight de otro origen da 403 sin permitir nada", async () => {
    const res = await worker.fetch(peticion("/v1/applications", "OPTIONS", { Origin: "https://otro.example" }), entorno());
    expect(res.status).toBe(403);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
    expect(await res.json()).toEqual({ ok: false, error: "origin_not_allowed" });
  });

  it("un alta desde otro origen, o sin origen, se rechaza antes de tocar nada", async () => {
    const espia = turnstile("ok");
    const env = entorno();
    for (const origen of ["https://otro.example", null]) {
      const res = await worker.fetch(alta(SOLICITUD, { origen }), env);
      expect(res.status).toBe(403);
      expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
      expect(await res.json()).toEqual({ ok: false, error: "origin_not_allowed" });
    }
    expect(espia).not.toHaveBeenCalled();
    expect(env.DB.filas).toHaveLength(0);
    expect(env.RATE_LIMIT.datos.size).toBe(0);
  });

  it("ruta o método desconocidos dan 404 JSON con CORS", async () => {
    for (const [ruta, metodo] of [["/v1/nada", "GET"], ["/v1/applications", "PUT"], ["/v1/applications", "DELETE"], ["/health", "POST"]]) {
      const res = await worker.fetch(peticion(ruta, metodo), entorno());
      expect(res.status, `${metodo} ${ruta}`).toBe(404);
      conCors(res);
      expect(await res.json()).toEqual({ ok: false, error: "not_found" });
    }
  });

  it("/health responde sin datos y el listado exige token", async () => {
    const salud = await worker.fetch(peticion("/health"), entorno());
    expect(salud.status).toBe(200);
    expect(await salud.json()).toEqual({ ok: true, service: "countpips-beta-api" });

    const listado = await worker.fetch(peticion("/v1/applications"), entorno());
    expect(listado.status).toBe(401);
    expect(listado.headers.get("Cache-Control")).toBe("no-store");
  });
});

describe("validación", () => {
  it("cuerpo que no es JSON, o demasiado grande, es 400", async () => {
    const env = entorno();
    for (const cuerpo of ["{no es json", JSON.stringify({ ...SOLICITUD, notes: "x".repeat(17 * 1024) })]) {
      const res = await worker.fetch(alta(cuerpo), env);
      expect(res.status).toBe(400);
      conCors(res);
      expect(await res.json()).toEqual({ ok: false, error: "invalid_request" });
    }
  });

  it.each([
    ["invalid_email", { email: "ana@ejemplo" }],
    ["invalid_profile", { profile: "fondo" }],
    ["missing_fields", { goal: "   " }],
    ["missing_fields", { markets: undefined }],
    ["consent_required", { privacyConsent: false }],
  ])("%s → 422 sin llamar a Turnstile ni escribir", async (error, cambio) => {
    const espia = turnstile("ok");
    const env = entorno();
    const res = await worker.fetch(alta({ ...SOLICITUD, ...cambio }), env);
    expect(res.status).toBe(422);
    conCors(res);
    expect(await res.json()).toEqual({ ok: false, error });
    expect(espia).not.toHaveBeenCalled();
    expect(env.DB.filas).toHaveLength(0);
  });

  it("el campo trampa `botcheck` lleno no guarda nada ni gasta Turnstile, y responde como un alta", async () => {
    const espia = turnstile("ok");
    const env = entorno();
    const res = await worker.fetch(alta({ ...SOLICITUD, botcheck: "soy un bot" }), env);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true });
    expect(espia).not.toHaveBeenCalled();
    expect(env.DB.filas).toHaveLength(0);
  });
});

describe("Turnstile", () => {
  it("sin token no se llama a la red y se rechaza", async () => {
    const espia = turnstile("ok");
    const res = await worker.fetch(alta({ ...SOLICITUD, turnstileToken: "" }), entorno());
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: "bot_check_failed" });
    expect(espia).not.toHaveBeenCalled();
  });

  it("sin secreto configurado se rechaza", async () => {
    const espia = turnstile("ok");
    const res = await worker.fetch(alta(SOLICITUD), entorno({ TURNSTILE_SECRET: "" }));
    expect(res.status).toBe(400);
    expect(espia).not.toHaveBeenCalled();
  });

  it.each(["rechazo", "caida", "red"] as const)("verificación fallida (%s) → 400 sin guardar", async (modo) => {
    turnstile(modo);
    const env = entorno();
    const res = await worker.fetch(alta(SOLICITUD), env);
    expect(res.status).toBe(400);
    conCors(res);
    expect(await res.json()).toEqual({ ok: false, error: "bot_check_failed" });
    expect(env.DB.filas).toHaveLength(0);
  });

  it("envía secreto, token e IP a siteverify", async () => {
    const espia = turnstile("ok");
    await worker.fetch(alta(SOLICITUD), entorno());
    const form = espia.mock.calls[0][1]?.body as FormData;
    expect(form.get("secret")).toBe("secreto-turnstile");
    expect(form.get("response")).toBe("token-valido");
    expect(form.get("remoteip")).toBe(IP);
  });

  it("un token fallido no gasta la cuota: el reintento inmediato pasa", async () => {
    const env = entorno();
    turnstile("rechazo");
    expect((await worker.fetch(alta(SOLICITUD), env)).status).toBe(400);
    turnstile("ok");
    expect((await worker.fetch(alta(SOLICITUD), env)).status).toBe(201);
  });
});

describe("límite por IP", () => {
  it("la misma IP antes de la ventana corta da 429 sin llamar a Turnstile; pasada la ventana, entra", async () => {
    const env = entorno();
    turnstile("ok");
    expect((await worker.fetch(alta(SOLICITUD), env)).status).toBe(201);

    const espia = turnstile("ok");
    const repetida = await worker.fetch(alta({ ...SOLICITUD, email: "otra@ejemplo.com" }), env);
    expect(repetida.status).toBe(429);
    conCors(repetida);
    expect(await repetida.json()).toEqual({ ok: false, error: "rate_limited" });
    expect(espia).not.toHaveBeenCalled();

    const otraIp = await worker.fetch(alta({ ...SOLICITUD, email: "otra@ejemplo.com" }, { ip: "198.51.100.9" }), env);
    expect(otraIp.status).toBe(201);

    avanza(61);
    expect((await worker.fetch(alta({ ...SOLICITUD, email: "tercera@ejemplo.com" }), env)).status).toBe(201);
  });

  it("la cuota diaria corta lo que la ventana corta no ve y se renueva al día siguiente", async () => {
    turnstile("ok");
    const env = entorno({ RATE_LIMIT_SECONDS: "10", RATE_LIMIT_DAILY: "2" });
    const enviar = (n: number) => worker.fetch(alta({ ...SOLICITUD, email: `p${n}@ejemplo.com` }), env);
    expect((await enviar(1)).status).toBe(201);
    avanza(11);
    expect((await enviar(2)).status).toBe(201);
    avanza(11);
    expect((await enviar(3)).status).toBe(429);
    vi.setSystemTime(new Date("2026-10-23T00:00:05Z"));
    expect((await enviar(4)).status).toBe(201);
  });

  it("sin KV se falla cerrado con 503, salvo RATE_LIMIT_OPTIONAL=1", async () => {
    turnstile("ok");
    vi.spyOn(console, "error").mockImplementation(() => {});
    const sinKv = await worker.fetch(alta(SOLICITUD), entorno({ RATE_LIMIT: undefined }));
    expect(sinKv.status).toBe(503);
    expect(await sinKv.json()).toEqual({ ok: false, error: "service_misconfigured" });

    const local = await worker.fetch(alta(SOLICITUD), entorno({ RATE_LIMIT: undefined, RATE_LIMIT_OPTIONAL: "1" }));
    expect(local.status).toBe(201);
  });
});

describe("alta", () => {
  it("guarda la solicitud normalizada y responde 201 { ok: true } con CORS", async () => {
    turnstile("ok");
    const env = entorno();
    const res = await worker.fetch(alta(SOLICITUD), env);
    expect(res.status).toBe(201);
    conCors(res);
    expect(res.headers.get("Content-Type")).toContain("application/json");
    expect(await res.json()).toEqual({ ok: true });

    expect(env.DB.filas).toHaveLength(1);
    const fila = env.DB.filas[0];
    expect(fila).toMatchObject({
      email: "ana@ejemplo.com",
      profile: "manual",
      experience: "1-3",
      goal: "disciplina",
      notes: null,
      language: "es",
      marketing_consent: 1,
      privacy_consent_at: "2026-10-22T10:00:00.000Z",
      status: "nuevo",
      cohort: null,
      source_path: "/es/beta",
      utm_source: "boletin",
      utm_medium: null,
      created_at: "2026-10-22T10:00:00.000Z",
    });
    expect(fila.email_hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("un correo repetido no crea otra fila y responde igual que uno nuevo: no deja saber quién está apuntado", async () => {
    turnstile("ok");
    const env = entorno();
    const nuevo = await worker.fetch(alta(SOLICITUD), env);
    const repetido = await worker.fetch(alta({ ...SOLICITUD, email: "ANA@ejemplo.com" }, { ip: "198.51.100.9" }), env);
    expect(env.DB.filas).toHaveLength(1);
    conCors(repetido);
    expect(repetido.status).toBe(nuevo.status);
    expect(await repetido.text()).toBe(await nuevo.text());
  });

  it("si otra petición inserta el mismo correo entre la búsqueda y el alta, la respuesta es la misma", async () => {
    turnstile("ok");
    const env = entorno();
    await worker.fetch(alta(SOLICITUD), env);
    env.DB.estado.carrera = true;
    const res = await worker.fetch(alta(SOLICITUD, { ip: "198.51.100.9" }), env);
    expect(env.DB.filas).toHaveLength(1);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("un fallo de D1 al insertar que no es de unicidad da 503 storage_unavailable", async () => {
    turnstile("ok");
    const env = entorno();
    const prepare = env.DB.prepare;
    env.DB.prepare = (sql: string) => {
      if (sql.includes("INSERT")) throw new Error("D1_ERROR: disk I/O error");
      return prepare(sql);
    };
    const res = await worker.fetch(alta(SOLICITUD), env);
    expect(res.status).toBe(503);
    conCors(res);
    expect(await res.json()).toEqual({ ok: false, error: "storage_unavailable" });
  });
});

describe("huella de la IP", () => {
  // Hay unos 4.300 millones de IPv4: un sha256 sin sal se deshace probándolas todas.
  it("en D1 se guarda HMAC-SHA-256 con IP_HASH_SECRET, no el sha256 de la IP", async () => {
    turnstile("ok");
    const env = entorno();
    await worker.fetch(alta(SOLICITUD), env);
    const guardada = env.DB.filas[0].ip_hash;
    expect(guardada).toBe(hmac(SECRETO_IP, IP));
    expect(guardada).not.toBe(sha256(IP));

    const otroSecreto = entorno({ IP_HASH_SECRET: "otra-sal" });
    await worker.fetch(alta(SOLICITUD), otroSecreto);
    expect(otroSecreto.DB.filas[0].ip_hash).toBe(hmac("otra-sal", IP));
  });

  it("las claves del límite en KV tampoco llevan la IP ni su sha256", async () => {
    turnstile("ok");
    const env = entorno();
    await worker.fetch(alta(SOLICITUD), env);
    const claves = [...env.RATE_LIMIT.datos.keys()];
    expect(claves).toHaveLength(2);
    for (const clave of claves) {
      expect(clave).toContain(hmac(SECRETO_IP, IP));
      expect(clave).not.toContain(sha256(IP));
      expect(clave).not.toContain(IP);
    }
  });

  it("sin IP_HASH_SECRET no se guarda nada de la IP", async () => {
    turnstile("ok");
    const env = entorno({ IP_HASH_SECRET: undefined, RATE_LIMIT: undefined, RATE_LIMIT_OPTIONAL: "1" });
    const res = await worker.fetch(alta(SOLICITUD), env);
    expect(res.status).toBe(201);
    expect(env.DB.filas[0].ip_hash).toBeNull();
  });

  it("sin IP_HASH_SECRET y con KV el límite no puede identificar la IP: falla cerrado con 503", async () => {
    const espia = turnstile("ok");
    const registro = vi.spyOn(console, "error").mockImplementation(() => {});
    const env = entorno({ IP_HASH_SECRET: "" });
    const res = await worker.fetch(alta(SOLICITUD), env);
    expect(res.status).toBe(503);
    conCors(res);
    expect(await res.json()).toEqual({ ok: false, error: "service_misconfigured" });
    expect(registro).toHaveBeenCalled();
    expect(espia).not.toHaveBeenCalled();
    expect(env.DB.filas).toHaveLength(0);
    expect(env.RATE_LIMIT.datos.size).toBe(0);
  });
});

describe("errores no previstos", () => {
  it("una excepción (D1 que lanza al buscar el correo) da 500 JSON con CORS, no la página de error de Cloudflare", async () => {
    turnstile("ok");
    const registro = vi.spyOn(console, "error").mockImplementation(() => {});
    const env = entorno();
    env.DB.estado.fallo = new Error("D1_ERROR: Network connection lost.");
    const res = await worker.fetch(alta(SOLICITUD), env);
    expect(res.status).toBe(500);
    conCors(res);
    expect(res.headers.get("Content-Type")).toContain("application/json");
    expect(await res.json()).toEqual({ ok: false, error: "internal_error" });
    expect(registro).toHaveBeenCalled();
  });
});
