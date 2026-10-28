import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { cabecerasConPolitica, conPoliticaEnMeta, huellasDeScripts, politica } from "@/lib/csp";

const HEADERS = readFileSync(join(import.meta.dirname, "..", "public", "_headers"), "utf8");

/** Cabeceras del bloque `/*`, como las lee `scripts/cabeceras.mjs`. */
function generales(texto: string): Record<string, string> {
  const r: Record<string, string> = {};
  let enBloque = false;
  for (const linea of texto.split("\n")) {
    if (/^\S/.test(linea) && !linea.startsWith("#")) {
      enBloque = linea.trim() === "/*";
      continue;
    }
    const m = enBloque && linea.match(/^\s+([A-Za-z-]+):\s*(.+?)\s*$/);
    if (m) r[m[1]] = m[2];
  }
  return r;
}
const directiva = (csp: string, nombre: string) =>
  csp.split(";").map((d) => d.trim().split(/\s+/)).find((d) => d[0] === nombre)?.slice(1) ?? null;
const cabecera = (e: Parameters<typeof politica>[0]) =>
  generales(cabecerasConPolitica(HEADERS, e))["Content-Security-Policy"];

const WORKER = "https://countpips-beta-api.mi-cuenta.workers.dev/v1/applications";
const HOJA = "https://script.google.com/macros/s/abc/exec";

describe("política de contenido según lo que usa la compilación", () => {
  it("sin nada configurado solo conecta con Web3Forms y no admite frames ni Turnstile", () => {
    const csp = cabecera({});
    expect(directiva(csp, "connect-src")).toEqual(["'self'", "https://api.web3forms.com"]);
    expect(directiva(csp, "frame-src")).toEqual(["'none'"]);
    expect(csp).not.toMatch(/challenges\.cloudflare|google|workers\.dev/);
  });

  it("con Worker añade su origen exacto y no abre la hoja aunque esté", () => {
    const connect = directiva(cabecera({ betaApiUrl: WORKER, waitlistUrl: HOJA }), "connect-src");
    expect(connect).toEqual(["'self'", "https://api.web3forms.com", "https://countpips-beta-api.mi-cuenta.workers.dev"]);
  });

  it("con la hoja abre Apps Script y su redirección, nada más", () => {
    expect(directiva(cabecera({ waitlistUrl: HOJA }), "connect-src")).toEqual([
      "'self'",
      "https://api.web3forms.com",
      "https://script.google.com",
      "https://script.googleusercontent.com",
    ]);
  });

  it("con clave de Turnstile lo admite como script, frame y conexión", () => {
    const csp = cabecera({ turnstileSiteKey: "1x00000000000000000000AA" });
    for (const d of ["script-src", "frame-src", "connect-src"]) {
      expect(directiva(csp, d)).toContain("https://challenges.cloudflare.com");
    }
  });

  it("un destino sin https rompe la compilación en vez de mandar datos en claro", () => {
    expect(() => politica({ betaApiUrl: "http://api.ejemplo.com/v1" }, [])).toThrow(/https/);
  });

  it("la cabecera añade lo que una meta no puede y la meta no lleva 'unsafe-inline'", () => {
    expect(directiva(cabecera({}), "frame-ancestors")).toEqual(["'none'"]);
    const meta = politica({}, ["'sha256-x'"]);
    expect(directiva(meta, "frame-ancestors")).toBeNull();
    expect(directiva(meta, "script-src")).toEqual(["'self'", "'sha256-x'"]);
  });

  it("_headers tiene una sola línea de política, que se sustituye entera", () => {
    expect(HEADERS.match(/^\s+Content-Security-Policy:/gm)).toHaveLength(1);
    expect(cabecerasConPolitica(HEADERS, {})).not.toMatch(/postbuild\.mjs\)/);
    expect(() => cabecerasConPolitica("/*\n  X-Frame-Options: DENY\n", {})).toThrow();
  });

  it("aísla la ventana y los recursos de otros orígenes (COOP y CORP)", () => {
    const c = generales(HEADERS);
    expect(c["Cross-Origin-Opener-Policy"]).toBe("same-origin");
    expect(c["Cross-Origin-Resource-Policy"]).toBe("same-origin");
  });
});

describe("política en la página", () => {
  const PAGINA =
    '<html><head><meta charSet="utf-8"/><script>uno()</script><script type="application/ld+json">{"a":1}</script>' +
    '<script src="/x.js"></script></head><body><script>dos()</script></body></html>';

  it("huella solo los scripts que se ejecutan", () => {
    expect(huellasDeScripts(PAGINA)).toHaveLength(2);
  });

  it("va justo tras el charset, antes de cualquier script", () => {
    const html = conPoliticaEnMeta(PAGINA, {});
    expect(html.indexOf("Content-Security-Policy")).toBeLessThan(html.indexOf("<script"));
    expect(html).toContain('<meta name="referrer" content="strict-origin-when-cross-origin"/>');
  });

  it("sin charset, o con política ya puesta, rompe en vez de dejar la página sin proteger", () => {
    expect(() => conPoliticaEnMeta("<html><head></head></html>", {})).toThrow();
    expect(() => conPoliticaEnMeta(conPoliticaEnMeta(PAGINA, {}), {})).toThrow();
  });
});
