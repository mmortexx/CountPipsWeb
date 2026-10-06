import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

const RAIZ = join(import.meta.dirname, "..");

function fuentes(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const ruta = join(dir, e);
    if (statSync(ruta).isDirectory()) fuentes(ruta, out);
    else if (/\.(ts|tsx)$/.test(e)) out.push(ruta);
  }
  return out;
}

// El recuento sale de `fmtOperaciones`: escrito a mano daría «1 operaciones».
describe("ningún recuento de operaciones se escribe a mano", () => {
  it("«${n} operaciones» y «${n} trades» pasan por fmtOperaciones", () => {
    const patron = /\$\{(?:fmtInt\([^}]*\)|[\w.!]+)\} (?:operaciones|trades)\b|"operaciones"\s*:\s*"trades"/g;
    const sueltos: string[] = [];
    for (const f of fuentes(join(RAIZ, "src"))) {
      const lineas = readFileSync(f, "utf8").split(/\r?\n/);
      lineas.forEach((l, i) => {
        for (const m of l.matchAll(patron)) sueltos.push(`${relative(RAIZ, f).split(sep).join("/")}:${i + 1}  ${m[0]}`);
      });
    }
    expect(sueltos).toEqual([]);
  });
});
