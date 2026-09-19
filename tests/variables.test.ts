import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * TODA VARIABLE CSS QUE SE LEE TIENE QUE ESTAR DECLARADA EN ALGÚN SITIO.
 *
 * Una `var(--nombre)` sin declarar no falla: el navegador la trata como
 * «inválida en tiempo de cálculo» y la propiedad cae a su valor inicial.
 * Para un fondo eso es TRANSPARENTE. Así estuvo la ventana de comparar
 * operaciones de la demo, con `bg-[var(--surface-1)]`: el panel dejaba ver
 * la página de detrás, y la leyenda del gráfico de velas igual. Ni el
 * compilador, ni los tipos, ni el build lo ven.
 *
 * Declarada cuenta si aparece como `--nombre:` en una hoja, o como clave
 * `"--nombre"` en un objeto de estilo o en `setProperty`. Una lectura con
 * valor de reserva, `var(--nombre, algo)`, es legítima sin declaración.
 * Los comentarios se quitan antes: explicar una variable no la declara.
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
