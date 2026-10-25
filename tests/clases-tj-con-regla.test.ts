import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

/* Una clase `tj-*` usada en el código y sin regla en globals.css no hace nada
   y no avisa (`tj-shimmer` llevaba así el barrido que prometía). Cada clase
   que aparece en un componente tiene su selector en la hoja. */
const SRC = join(__dirname, "..", "src");
const EXCEPCIONES: string[] = [];

function ficheros(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const ruta = join(dir, e.name);
    if (e.isDirectory()) return ficheros(ruta);
    return /\.tsx?$/.test(e.name) ? [ruta] : [];
  });
}

/* Solo cuentan los `className=…`: el prefijo `tj-` también lo llevan claves de
   localStorage, ids y eventos (`tj-theme`, `tj-atajos-g1`), que no son clases. */
function valoresClassName(src: string): string[] {
  const valores: string[] = [];
  for (const m of src.matchAll(/className=(["{])/g)) {
    const ini = (m.index ?? 0) + m[0].length;
    if (m[1] === '"') {
      valores.push(src.slice(ini, src.indexOf('"', ini)));
      continue;
    }
    let llaves = 1;
    let i = ini;
    for (; i < src.length && llaves > 0; i++) llaves += src[i] === "{" ? 1 : src[i] === "}" ? -1 : 0;
    valores.push(src.slice(ini, i));
  }
  return valores;
}

function clasesUsadas(src: string): string[] {
  return valoresClassName(src).flatMap((v) => [...v.matchAll(/(?<![\w.-])tj-[a-z0-9]+(?:-[a-z0-9]+)*(?![\w-])/g)].map((m) => m[0]));
}

function clasesConRegla(css: string): Set<string> {
  return new Set([...css.matchAll(/\.(tj-[a-z0-9]+(?:-[a-z0-9]+)*)/g)].map((m) => m[1]));
}

describe("toda clase tj-* usada tiene regla en globals.css", () => {
  it("src/", () => {
    const conRegla = clasesConRegla(readFileSync(join(SRC, "app", "globals.css"), "utf8"));
    const sinRegla = new Map<string, string>();
    for (const f of ficheros(SRC)) {
      for (const c of clasesUsadas(readFileSync(f, "utf8"))) {
        if (!conRegla.has(c) && !EXCEPCIONES.includes(c)) sinRegla.set(c, relative(SRC, f).replace(/\\/g, "/"));
      }
    }
    expect([...sinRegla].map(([c, f]) => `${c} (${f})`)).toEqual([]);
  });

  it("la guarda separa clases usadas de selectores", () => {
    expect(clasesUsadas('<div className="a tj-uno tj-dos-tres"> <i className={`x ${y ? "tj-si" : ""} tj-din-${z}`} /> {"tj-clave"}')).toEqual(["tj-uno", "tj-dos-tres", "tj-si"]);
    expect([...clasesConRegla(".tj-uno { } .x .tj-dos-tres::after { }")]).toEqual(["tj-uno", "tj-dos-tres"]);
  });
});
