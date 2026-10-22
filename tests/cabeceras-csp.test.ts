import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { cabecerasConWorker } from "@/lib/csp";

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

describe("cabeceras del dominio propio (_headers tal como se publica)", () => {
  it("sin Worker configurado, la CSP no deja conectar con ningún Worker ni con dominios que no existen", () => {
    const csp = generales(cabecerasConWorker(HEADERS, ""))["Content-Security-Policy"];
    const connect = directiva(csp, "connect-src")!;
    expect(connect).toContain("https://api.web3forms.com");
    expect(connect.filter((o) => /workers\.dev|countpips\.com/.test(o))).toEqual([]);
    expect(directiva(csp, "worker-src")).toBeNull();
  });

  it("con Worker configurado, añade su origen exacto a connect-src y nada más", () => {
    const url = "https://countpips-beta-api.mi-cuenta.workers.dev/v1/applications";
    const sin = generales(cabecerasConWorker(HEADERS, ""))["Content-Security-Policy"];
    const con = generales(cabecerasConWorker(HEADERS, url))["Content-Security-Policy"];
    expect(directiva(con, "connect-src")).toEqual([...directiva(sin, "connect-src")!, "https://countpips-beta-api.mi-cuenta.workers.dev"]);
    expect(con.replace(" https://countpips-beta-api.mi-cuenta.workers.dev", "")).toBe(sin);
  });

  it("aísla la ventana y los recursos de otros orígenes (COOP y CORP)", () => {
    const c = generales(cabecerasConWorker(HEADERS, ""));
    expect(c["Cross-Origin-Opener-Policy"]).toBe("same-origin");
    expect(c["Cross-Origin-Resource-Policy"]).toBe("same-origin");
  });

  it("el comentario no habla de un boletín que no existe", () => {
    expect(HEADERS).not.toMatch(/newsletter|boletín/i);
  });
});
