import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

/* aria-label y aria-labelledby están prohibidos en un elemento genérico (div,
   span) sin rol: el lector no los anuncia y axe los marca. Si un bloque debe
   llevar nombre, lleva también role (group, region, switch…). */
const RAIZ = join(__dirname, "..", "src", "components");
const EXCEPCIONES: string[] = [
  "demo/StatusBar.tsx",
  "demo/WindowChrome.tsx",
  "marketing/SessionClock.tsx",
  "marketing/DisciplineScore.tsx",
];

function ficheros(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const ruta = join(dir, e.name);
    if (e.isDirectory()) return ficheros(ruta);
    return e.name.endsWith(".tsx") ? [ruta] : [];
  });
}

/* Fin de la etiqueta de apertura que empieza en `ini`: el primer `>` fuera de
   llaves y de cadenas (un `=>` o un `>` dentro de `{…}` no la cierra). */
function finDeEtiqueta(src: string, ini: number): number {
  let llaves = 0;
  let comilla = "";
  for (let i = ini; i < src.length; i++) {
    const c = src[i];
    if (comilla) {
      if (c === "\\") i++;
      else if (c === comilla) comilla = "";
      continue;
    }
    if (c === '"' || c === "'" || c === "`") comilla = c;
    else if (c === "{") llaves++;
    else if (c === "}") llaves--;
    else if (c === ">" && llaves === 0) return i;
  }
  return src.length;
}

function sinRol(src: string): { linea: number; etiqueta: string }[] {
  const malos: { linea: number; etiqueta: string }[] = [];
  for (const m of src.matchAll(/<(div|span)(?=[\s/>])/g)) {
    const ini = m.index ?? 0;
    const etiqueta = src.slice(ini, finDeEtiqueta(src, ini) + 1);
    if (!/\saria-label(ledby)?=/.test(etiqueta)) continue;
    if (/\srole=/.test(etiqueta)) continue;
    malos.push({ linea: src.slice(0, ini).split("\n").length, etiqueta: etiqueta.replace(/\s+/g, " ").slice(0, 90) });
  }
  return malos;
}

describe("ningún div ni span lleva nombre accesible sin rol", () => {
  it("en src/components", () => {
    const malos = ficheros(RAIZ).flatMap((f) =>
      sinRol(readFileSync(f, "utf8")).map((x) => `${relative(RAIZ, f).replace(/\\/g, "/")}:${x.linea} ${x.etiqueta}`),
    );
    expect(malos.filter((m) => !EXCEPCIONES.some((e) => m.startsWith(e)))).toEqual([]);
  });

  it("la guarda reconoce la etiqueta multilínea y respeta el rol", () => {
    expect(sinRol('<div\n  ref={r}\n  aria-label={x ? "a" : "b"}\n/>')).toHaveLength(1);
    expect(sinRol('<span onClick={() => f()} aria-labelledby="t">x</span>')).toHaveLength(1);
    expect(sinRol('<div aria-label="a" role="group" />')).toEqual([]);
    expect(sinRol('<div className="a">aria-label</div>')).toEqual([]);
  });
});
