import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

const RAIZ = join(import.meta.dirname, "..");

function fuentes(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const ruta = join(dir, e);
    if (statSync(ruta).isDirectory()) fuentes(ruta, out);
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(e)) out.push(ruta);
  }
  return out;
}

/* La demo era lo único que cargaba framer-motion (120 KB, 40 KB
   comprimidos, un tercio de lo que bajaba /demo) y todo lo que hacía lo
   hacen ya el CSS (`.tj-dm-*`) y `src/hooks/use-viaje.ts`. Volver a importarla devolvería
   ese peso sin que nada se viera distinto. */
describe("sin framer-motion", () => {
  it("ningún fichero de src/ la importa", () => {
    const importan = fuentes(join(RAIZ, "src"))
      .filter((f) => /from\s+["'](?:framer-motion|motion(?:\/[\w-]+)?)["']|import\(\s*["']framer-motion["']\)/.test(readFileSync(f, "utf8")))
      .map((f) => relative(RAIZ, f).split(sep).join("/"));
    expect(importan).toEqual([]);
  });
  it("no está entre las dependencias", () => {
    const pkg = JSON.parse(readFileSync(join(RAIZ, "package.json"), "utf8"));
    const todas = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(Object.keys(todas).filter((d) => d === "framer-motion" || d === "motion")).toEqual([]);
  });
});
