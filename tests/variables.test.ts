import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Toda variable CSS que se lee debe estar declarada: una `var(--nombre)` sin
 * declarar no falla, la propiedad cae a su valor inicial (un fondo queda
 * transparente) y ni el compilador ni el build lo ven.
 *
 * Declarada: `--nombre:` en una hoja, o clave `"--nombre"` en un objeto de
 * estilo o `setProperty`. `var(--nombre, algo)` es legítima. Se quitan los
 * comentarios antes: explicar una variable no la declara.
 */

const RAIZ = join(import.meta.dirname, "..");

function ficheros(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) ficheros(p, out);
    else if (/\.(tsx?|css)$/.test(n)) out.push(p);
  }
  return out;
}

const sinComentarios = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1");

const fuentes = ficheros(join(RAIZ, "src")).map((f) => ({
  f: f.slice(RAIZ.length + 1).replace(/\\/g, "/"),
  s: sinComentarios(readFileSync(f, "utf8")),
}));

const declaradas = new Set<string>();
for (const { s } of fuentes) {
  for (const m of s.matchAll(/(--[a-z0-9-]+)\s*:/gi)) declaradas.add(m[1]);
  for (const m of s.matchAll(/["'`](--[a-z0-9-]+)["'`]/gi)) declaradas.add(m[1]);
}

describe("variables CSS", () => {
  it("encuentra declaraciones: si no, la prueba no protege nada", () => {
    expect(declaradas.has("--ficha-fondo")).toBe(true);
    expect(declaradas.size).toBeGreaterThan(100);
  });

  it("ninguna var(--…) sin valor de reserva lee una variable que no existe", () => {
    const huerfanas: string[] = [];
    for (const { f, s } of fuentes) {
      for (const m of s.matchAll(/var\(\s*(--[a-z0-9-]+)\s*([,)])/gi)) {
        if (m[2] === "," || declaradas.has(m[1]) || /^--(tw|radix)-/.test(m[1])) continue;
        huerfanas.push(`${f}: ${m[1]}`);
      }
    }
    expect([...new Set(huerfanas)]).toEqual([]);
  });
});
