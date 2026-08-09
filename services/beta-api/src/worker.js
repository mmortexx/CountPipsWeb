const APPLICATION_STATUSES = new Set([
  "nuevo",
  "revisando",
  "invitado",
  "aceptado",
  "espera",
  "descartado",
]);

const MAX_BODY_BYTES = 16 * 1024;
const MAX_NOTES_LENGTH = 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(data, status, request, env, options = {}) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": options.private ? "no-store" : "no-cache",
    "X-Content-Type-Options": "nosniff",
  });
  const origin = getAllowedOrigin(request, env);
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    headers.set("Access-Control-Max-Age", "600");
    headers.append("Vary", "Origin");
  }
  return new Response(JSON.stringify(data), { status, headers });
}

function text(content, status = 200, headers = {}) {
  return new Response(content, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; form-action 'self'; base-uri 'none'",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}

function getAllowedOrigins(env) {
  return new Set(
    String(env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((origin) => origin.trim().replace(/\/$/, ""))
      .filter(Boolean),
  );
}

function getAllowedOrigin(request, env) {
  const origin = request.headers.get("Origin")?.trim().replace(/\/$/, "") || "";
  return origin && getAllowedOrigins(env).has(origin) ? origin : null;
}

function errorResponse(message, status, request, env, options = {}) {
  return json({ ok: false, error: message }, status, request, env, options);
}

function requestHasAllowedOrigin(request, env) {
  const origin = request.headers.get("Origin")?.trim().replace(/\/$/, "") || "";
  return Boolean(origin && getAllowedOrigins(env).has(origin));
}

async function readJson(request, maxBytes = MAX_BODY_BYTES) {
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > maxBytes) return null;
  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > maxBytes) return null;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function boundedString(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeEmail(value) {
  return boundedString(value, 254).toLowerCase();
}

function asBoolean(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function validateApplication(payload) {
  const application = {
    email: normalizeEmail(payload?.email),
    profile: boundedString(payload?.profile, 20),
    experience: boundedString(payload?.experience, 80),
    markets: boundedString(payload?.markets, 160),
    workflow: boundedString(payload?.workflow, 160),
    goal: boundedString(payload?.goal, 300),
    notes: boundedString(payload?.notes, MAX_NOTES_LENGTH),
    language: boundedString(payload?.lang, 2) === "en" ? "en" : "es",
    marketingConsent: asBoolean(payload?.marketingConsent),
    sourcePath: boundedString(payload?.source, 160),
    landingOrigin: boundedString(payload?.origin, 160),
    utmSource: boundedString(payload?.utmSource ?? payload?.utm_source, 120),
    utmMedium: boundedString(payload?.utmMedium ?? payload?.utm_medium, 120),
    utmCampaign: boundedString(payload?.utmCampaign ?? payload?.utm_campaign, 120),
  };

  if (!EMAIL_PATTERN.test(application.email)) return { error: "invalid_email" };
  if (!["manual", "prop"].includes(application.profile)) return { error: "invalid_profile" };
  if (!application.experience || !application.markets || !application.workflow || !application.goal) {
    return { error: "missing_fields" };
  }
  if (!asBoolean(payload?.privacyConsent)) return { error: "consent_required" };
  return { application };
}

async function digest(value) {
  const bytes = new TextEncoder().encode(value);
  return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
}

async function sha256Hex(value) {
  const bytes = await digest(value);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function constantTimeEqual(left, right) {
  const [leftDigest, rightDigest] = await Promise.all([digest(left), digest(right)]);
  let difference = 0;
  for (let index = 0; index < leftDigest.length; index += 1) {
    difference |= leftDigest[index] ^ rightDigest[index];
  }
  return difference === 0;
}

async function isAdmin(request, env) {
  const expected = String(env.ADMIN_TOKEN || "");
  const authorization = request.headers.get("Authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  return Boolean(expected && token && (await constantTimeEqual(token, expected)));
}

function parseBasicAuth(request) {
  const header = request.headers.get("Authorization") || "";
  if (!header.startsWith("Basic ")) return null;
  try {
    const decoded = atob(header.slice(6).trim());
    const separator = decoded.indexOf(":");
    if (separator === -1) return null;
    return { user: decoded.slice(0, separator), pass: decoded.slice(separator + 1) };
  } catch {
    return null;
  }
}

async function isAdminPanelAuthorized(request, env) {
  const expected = String(env.ADMIN_TOKEN || "");
  if (!expected) return false;
  const credentials = parseBasicAuth(request);
  return Boolean(credentials && (await constantTimeEqual(credentials.pass, expected)));
}

async function verifyTurnstile(request, payload, env) {
  const secret = String(env.TURNSTILE_SECRET || "");
  const token = boundedString(payload?.turnstileToken, 2048);
  if (!secret || !token) return false;

  const form = new FormData();
  form.set("secret", secret);
  form.set("response", token);
  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) form.set("remoteip", ip);

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
    });
    if (!response.ok) return false;
    const result = await response.json();
    return result?.success === true;
  } catch {
    return false;
  }
}

/* ── LÍMITE DE PETICIONES ──────────────────────────────────────────────
   Dos ventanas por IP, no una:

     · la CORTA (60 s por defecto) frena el envío repetido;
     · la DIARIA frena lo que la corta no puede — mil peticiones espaciadas
       61 segundos son mil peticiones, y con la ventana sola cada una
       parecía la primera.

   `RATE_LIMIT` es el almacén de claves de Cloudflare. Si no está
   configurado —y hoy no lo está: `wrangler.jsonc` sigue con el
   marcador `REPLACE_WITH_KV_NAMESPACE_ID`— esto devolvía `true`, es
   decir, ABRÍA la puerta del todo y sin dejar rastro. Un control que
   desaparece en silencio justo cuando falta su dependencia es el que
   nunca vas a echar en falta hasta que te ha costado dinero.

   Ahora falla CERRADO en producción y sólo se salta cuando el propio
   despliegue lo declara a propósito (`RATE_LIMIT_OPTIONAL: "1"`, útil en
   local con `wrangler dev` sin KV). El caso de "no configurado por
   descuido" ya no pasa desapercibido: se registra y se rechaza. */
const RATE_LIMIT_DAILY_MAX = 20;

async function enforceRateLimit(request, env) {
  if (!env.RATE_LIMIT) {
    if (String(env.RATE_LIMIT_OPTIONAL ?? "") === "1") return true;
    console.error(
      "[beta-api] RATE_LIMIT (KV) no está enlazado: se rechaza la solicitud. " +
        "Crea el namespace y ponlo en wrangler.jsonc, o declara RATE_LIMIT_OPTIONAL=1 si es un entorno local."
    );
    return false;
  }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const huella = await sha256Hex(ip);
  const seconds = Math.max(10, Math.min(3600, Number(env.RATE_LIMIT_SECONDS) || 60));

  // Ventana corta.
  const cortaKey = `beta-application:${huella}`;
  if (await env.RATE_LIMIT.get(cortaKey)) return false;

  // Cuota diaria. La fecha va en la clave, así que el contador se
  // renueva solo al cambiar el día y no hace falta purgarlo.
  const dia = new Date().toISOString().slice(0, 10);
  const diaKey = `beta-application-dia:${dia}:${huella}`;
  const usadas = Number((await env.RATE_LIMIT.get(diaKey)) || 0);
  const tope = Math.max(1, Number(env.RATE_LIMIT_DAILY) || RATE_LIMIT_DAILY_MAX);
  if (usadas >= tope) return false;

  await env.RATE_LIMIT.put(cortaKey, "1", { expirationTtl: seconds });
  // 48 h de vida: cubre el día en curso con holgura para cualquier huso.
  await env.RATE_LIMIT.put(diaKey, String(usadas + 1), { expirationTtl: 172800 });
  return true;
}

async function createApplication(request, env) {
  if (!requestHasAllowedOrigin(request, env)) return errorResponse("origin_not_allowed", 403, request, env);
  const payload = await readJson(request);
  if (!payload) return errorResponse("invalid_request", 400, request, env);
  // El campo trampa se llama `botcheck` EN TODAS PARTES: lo declara
  // `src/lib/forms.ts`, lo renderiza `BetaApplication.tsx` con
  // `id="beta-botcheck"` y lo lee el Apps Script de respaldo
  // (`docs/waitlist-apps-script.js`). Aquí se leía `payload.honeypot`,
  // que nadie envía nunca: la comprobación no se disparó jamás. Un
  // anzuelo que no cuelga de la caña es peor que ninguno, porque figura
  // en la política de privacidad como una medida que existe.
  if (boundedString(payload.botcheck, 120)) return json({ ok: true, duplicate: false }, 200, request, env);

  const validation = validateApplication(payload);
  if (validation.error) return errorResponse(validation.error, 422, request, env);
  // El límite de peticiones va ANTES de Turnstile: verificar el token
  // cuesta una llamada de red a Cloudflare, y no tiene sentido gastarla
  // en quien ya ha superado su cuota. Estaba después, así que cada
  // intento abusivo consumía una verificación completa.
  if (!(await enforceRateLimit(request, env))) return errorResponse("rate_limited", 429, request, env);
  if (!(await verifyTurnstile(request, payload, env))) return errorResponse("bot_check_failed", 400, request, env);

  const { application } = validation;
  const emailHash = await sha256Hex(application.email);
  const existing = await env.DB.prepare("SELECT id FROM applications WHERE email_hash = ?1 LIMIT 1")
    .bind(emailHash)
    .first();
  if (existing) return json({ ok: true, duplicate: true }, 200, request, env);

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const ip = request.headers.get("CF-Connecting-IP") || "";
  const ipHash = ip ? await sha256Hex(ip) : null;
  try {
    await env.DB.prepare(
      `INSERT INTO applications (
        id, email, email_hash, profile, experience, markets, workflow, goal, notes,
        language, marketing_consent, status, cohort, source_path, landing_origin,
        utm_source, utm_medium, utm_campaign, ip_hash, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'nuevo', NULL, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        application.email,
        emailHash,
        application.profile,
        application.experience,
        application.markets,
        application.workflow,
        application.goal,
        application.notes || null,
        application.language,
        application.marketingConsent ? 1 : 0,
        application.sourcePath || null,
        application.landingOrigin || null,
        application.utmSource || null,
        application.utmMedium || null,
        application.utmCampaign || null,
        ipHash,
        now,
        now,
      )
      .run();
  } catch (error) {
    if (String(error?.message || "").toLowerCase().includes("unique")) {
      return json({ ok: true, duplicate: true }, 200, request, env);
    }
    return errorResponse("storage_unavailable", 503, request, env);
  }

  return json({ ok: true, duplicate: false }, 201, request, env);
}

function adminQuery(request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "";
  const cohort = url.searchParams.get("cohort") || "";
  const limit = Math.max(1, Math.min(200, Number(url.searchParams.get("limit")) || 100));
  return { status, cohort, limit };
}

async function listApplications(request, env) {
  if (!(await isAdmin(request, env))) return errorResponse("unauthorized", 401, request, env, { private: true });
  const { status, cohort, limit } = adminQuery(request);
  if (status && !APPLICATION_STATUSES.has(status)) return errorResponse("invalid_status", 422, request, env, { private: true });
  const conditions = [];
  const values = [];
  if (status) {
    conditions.push("status = ?");
    values.push(status);
  }
  if (cohort) {
    conditions.push("cohort = ?");
    values.push(cohort);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const statement = env.DB.prepare(
    `SELECT id, email, profile, experience, markets, workflow, goal, notes, language,
      marketing_consent AS marketingConsent, status, cohort, source_path AS sourcePath,
      landing_origin AS landingOrigin, utm_source AS utmSource, utm_medium AS utmMedium,
      utm_campaign AS utmCampaign, created_at AS createdAt, updated_at AS updatedAt
     FROM applications ${where} ORDER BY created_at DESC LIMIT ?`,
  ).bind(...values, limit);
  try {
    const result = await statement.all();
    return json({ ok: true, applications: result.results || [] }, 200, request, env, { private: true });
  } catch {
    return errorResponse("storage_unavailable", 503, request, env, { private: true });
  }
}

async function updateApplication(request, env, id) {
  if (!(await isAdmin(request, env))) return errorResponse("unauthorized", 401, request, env, { private: true });
  const payload = await readJson(request, 4096);
  if (!payload) return errorResponse("invalid_request", 400, request, env, { private: true });
  const status = boundedString(payload.status, 20);
  if (!APPLICATION_STATUSES.has(status)) return errorResponse("invalid_status", 422, request, env, { private: true });

  /* ── ACTUALIZACIÓN PARCIAL ────────────────────────────────────────────
     Antes esto escribía `cohort` SIEMPRE, viniera o no en la petición:
     un `PATCH {"status":"invitado"}` ejecutaba `SET cohort = NULL` y
     borraba la cohorte asignada sin decir nada. El panel manda los dos
     campos, así que no se veía; cualquier script de operaciones que
     tocara sólo el estado destruía el dato.

     Ahora se distingue "no lo mandes" (la clave no viene: no se toca) de
     "vacíalo" (viene como cadena vacía o null: se pone a NULL). Es la
     diferencia entre omitir y borrar, y en una tabla de personas
     invitadas no es una sutileza. */
  const tocaCohorte = Object.prototype.hasOwnProperty.call(payload, "cohort");
  const cohort = tocaCohorte ? boundedString(payload.cohort, 80) : null;

  const now = new Date().toISOString();
  const sets = ["status = ?1", "updated_at = ?2"];
  const binds = [status, now];
  if (tocaCohorte) {
    sets.push(`cohort = ?${binds.length + 1}`);
    binds.push(cohort || null);
  }
  binds.push(id);

  try {
    const result = await env.DB.prepare(
      `UPDATE applications SET ${sets.join(", ")} WHERE id = ?${binds.length}`
    )
      .bind(...binds)
      .run();
    if (!result.meta?.changes) return errorResponse("not_found", 404, request, env, { private: true });
    const fila = await env.DB.prepare("SELECT cohort FROM applications WHERE id = ?1").bind(id).first();
    return json(
      { ok: true, id, status, cohort: fila?.cohort ?? null, updatedAt: now },
      200,
      request,
      env,
      { private: true }
    );
  } catch {
    return errorResponse("storage_unavailable", 503, request, env, { private: true });
  }
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return requestHasAllowedOrigin(request, env)
        ? new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": getAllowedOrigin(request, env), "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Max-Age": "600", Vary: "Origin" } })
        : errorResponse("origin_not_allowed", 403, request, env);
    }
    if (url.pathname === "/health" && request.method === "GET") {
      return json({ ok: true, service: "countpips-beta-api" }, 200, request, env);
    }
    if (url.pathname === "/admin" && request.method === "GET") {
      if (!(await isAdminPanelAuthorized(request, env))) {
        return new Response("Authentication required.", {
          status: 401,
          headers: {
            "WWW-Authenticate": 'Basic realm="CountPips admin", charset="UTF-8"',
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store",
            "X-Robots-Tag": "noindex, nofollow",
          },
        });
      }
      return text(ADMIN_HTML, 200, { "X-Robots-Tag": "noindex, nofollow" });
    }
    if (url.pathname === "/v1/applications" && request.method === "POST") return createApplication(request, env);
    if (url.pathname === "/v1/applications" && request.method === "GET") return listApplications(request, env);
    const match = url.pathname.match(/^\/v1\/applications\/([^/]+)$/);
    if (match && request.method === "PATCH") return updateApplication(request, env, decodeURIComponent(match[1]));
    return errorResponse("not_found", 404, request, env);
  },
};

export default worker;

const ADMIN_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CountPips · Beta operations</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; background: #08111f; color: #e6edf7; }
    * { box-sizing: border-box; } body { margin: 0; min-height: 100vh; background: radial-gradient(circle at top right, #152b46, #08111f 48%); }
    main { width: min(1440px, calc(100% - 40px)); margin: 0 auto; padding: 36px 0 56px; }
    header { display: flex; align-items: end; justify-content: space-between; gap: 24px; margin-bottom: 28px; }
    .eyebrow { color: #7ed9bd; letter-spacing: .14em; font-size: 11px; text-transform: uppercase; font-weight: 700; }
    h1 { margin: 8px 0 0; font-size: clamp(28px, 4vw, 46px); letter-spacing: -.04em; }
    .panel { background: rgba(13, 27, 47, .86); border: 1px solid rgba(145, 173, 208, .2); border-radius: 18px; padding: 18px; box-shadow: 0 24px 80px rgba(0,0,0,.24); }
    .controls { display: grid; grid-template-columns: minmax(260px, 1fr) 180px 180px auto; gap: 10px; align-items: end; margin-bottom: 18px; }
    label { display: grid; gap: 7px; color: #9bb0c9; font-size: 12px; font-weight: 700; }
    input, select, button { min-height: 42px; border-radius: 10px; border: 1px solid #324e70; background: #0a1729; color: #e6edf7; padding: 0 12px; font: inherit; }
    button { background: #76d4b7; color: #062319; border-color: transparent; font-weight: 800; cursor: pointer; }
    button.secondary { background: #122642; color: #dce9f8; border-color: #37557a; }
    button.small { min-height: 34px; padding: 0 10px; font-size: 12px; }
    .status { min-height: 20px; margin: 10px 0 0; color: #9bb0c9; font-size: 13px; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; min-width: 1120px; border-collapse: collapse; font-size: 13px; }
    th { color: #8ca5c0; font-size: 11px; text-align: left; letter-spacing: .08em; text-transform: uppercase; padding: 12px 10px; border-bottom: 1px solid #29405d; }
    td { padding: 14px 10px; vertical-align: top; border-bottom: 1px solid rgba(58, 85, 116, .48); }
    td strong { display: block; color: #f3f7fb; } td span { color: #9bb0c9; display: block; margin-top: 4px; line-height: 1.35; }
    .row-actions { display: flex; gap: 7px; align-items: center; }
    .row-actions select, .row-actions input { min-height: 34px; font-size: 12px; width: 125px; }
    .empty { color: #9bb0c9; padding: 34px 10px; text-align: center; }
    @media (max-width: 760px) { main { width: min(100% - 24px, 1440px); padding-top: 24px; } header { display: block; } .controls { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main>
    <header><div><div class="eyebrow">CountPips · private beta</div><h1>Beta operations</h1></div><div class="eyebrow">Internal access only</div></header>
    <section class="panel">
      <div class="controls">
        <label>Admin token<input id="token" type="password" autocomplete="off" placeholder="Bearer token" /></label>
        <label>Status<select id="status"><option value="">All statuses</option><option>nuevo</option><option>revisando</option><option>invitado</option><option>aceptado</option><option>espera</option><option>descartado</option></select></label>
        <label>Cohort<input id="cohort" placeholder="Optional filter" /></label>
        <button id="load">Load applications</button>
      </div>
      <div id="statusMessage" class="status" role="status"></div>
      <div class="table-wrap"><table><thead><tr><th>Applicant</th><th>Profile</th><th>Context</th><th>Goal</th><th>Source</th><th>Operations</th></tr></thead><tbody id="rows"><tr><td class="empty" colspan="6">Authenticate to load applications.</td></tr></tbody></table></div>
    </section>
  </main>
  <script>
    const statuses = ["nuevo", "revisando", "invitado", "aceptado", "espera", "descartado"];
    const tokenInput = document.querySelector("#token");
    const statusInput = document.querySelector("#status");
    const cohortInput = document.querySelector("#cohort");
    const rows = document.querySelector("#rows");
    const message = document.querySelector("#statusMessage");
    tokenInput.value = sessionStorage.getItem("countpips-admin-token") || "";
    const text = (value) => String(value ?? "");
    const date = (value) => value ? new Date(value).toLocaleString() : "—";
    const optionMarkup = (current) => statuses.map((value) => "<option " + (value === current ? "selected" : "") + ">" + value + "</option>").join("");
    function render(applications) {
      rows.replaceChildren();
      if (!applications.length) { const row = document.createElement("tr"); row.innerHTML = '<td class="empty" colspan="6">No applications match these filters.</td>'; rows.append(row); return; }
      applications.forEach((application) => {
        const row = document.createElement("tr");
        row.innerHTML = '<td><strong></strong><span class="created"></span></td><td><strong class="profile"></strong><span class="language"></span></td><td><strong class="experience"></strong><span class="markets"></span><span class="workflow"></span></td><td><strong class="goal"></strong><span class="notes"></span></td><td><strong class="source"></strong><span class="campaign"></span></td><td><div class="row-actions"><select aria-label="Status">' + optionMarkup(application.status) + '</select><input aria-label="Cohort" placeholder="Cohort" value="' + text(application.cohort).replace(/&/g, "&amp;").replace(/"/g, "&quot;") + '"/><button class="small">Save</button></div></td>';
        row.querySelector("td strong").textContent = text(application.email);
        row.querySelector(".created").textContent = date(application.createdAt);
        row.querySelector(".profile").textContent = text(application.profile);
        row.querySelector(".language").textContent = text(application.language).toUpperCase();
        row.querySelector(".experience").textContent = text(application.experience);
        row.querySelector(".markets").textContent = text(application.markets);
        row.querySelector(".workflow").textContent = text(application.workflow);
        row.querySelector(".goal").textContent = text(application.goal);
        row.querySelector(".notes").textContent = application.notes ? "Note: " + text(application.notes) : "";
        row.querySelector(".source").textContent = text(application.sourcePath) || "Direct";
        row.querySelector(".campaign").textContent = [application.utmSource, application.utmMedium, application.utmCampaign].filter(Boolean).join(" / ") || "No UTM";
        row.querySelector("button").addEventListener("click", () => update(application.id, row));
        rows.append(row);
      });
    }
    async function load() {
      const token = tokenInput.value.trim();
      if (!token) { message.textContent = "Enter the admin token."; return; }
      sessionStorage.setItem("countpips-admin-token", token);
      message.textContent = "Loading…";
      const params = new URLSearchParams({ limit: "200" });
      if (statusInput.value) params.set("status", statusInput.value);
      if (cohortInput.value.trim()) params.set("cohort", cohortInput.value.trim());
      try {
        const response = await fetch("/v1/applications?" + params, { headers: { Authorization: "Bearer " + token } });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.error || "Request failed");
        render(data.applications || []); message.textContent = (data.applications || []).length + " application(s) loaded.";
      } catch (error) { message.textContent = "Could not load applications: " + error.message; }
    }
    async function update(id, row) {
      const token = tokenInput.value.trim(); const status = row.querySelector("select").value; const cohort = row.querySelector("input").value.trim();
      try {
        const response = await fetch("/v1/applications/" + encodeURIComponent(id), { method: "PATCH", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify({ status, cohort }) });
        const data = await response.json(); if (!response.ok || !data.ok) throw new Error(data.error || "Request failed");
        message.textContent = "Application updated.";
      } catch (error) { message.textContent = "Could not update application: " + error.message; }
    }
    document.querySelector("#load").addEventListener("click", load);
  </script>
</body>
</html>`;
