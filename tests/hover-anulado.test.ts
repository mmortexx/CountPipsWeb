import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

const RAIZ = join(import.meta.dirname, "..");

function fuentes(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const ruta = join(dir, e);
    if (statSync(ruta).isDirectory()) fuentes(ruta, out);
    else if (e.endsWith(".tsx")) out.push(ruta);
  }
  return out;
}

/* Un `style={{ background }}` gana a `hover:bg-…` de la misma etiqueta: el
   estilo en línea pesa más que cualquier clase, así que el botón no reacciona
   al pasar y nada falla. Así se quedaron mudos «Ver la demo» de la barra y las
   respuestas del test de disciplina. Lo mismo, sin estilo en línea, pasar de
   `text-primary` a `--accent-base`: con la paleta en blanco y negro son la
   misma tinta. */
const CHOQUES: Array<[string, string]> = [
  ["hover:bg-", "background"],
  ["hover:text-", "color"],
  ["hover:border-", "border"],
  ["hover:shadow-", "boxShadow"],
  ["hover:opacity-", "opacity"],
];

function etiquetas(codigo: string): Array<{ texto: string; linea: number }> {
  const out: Array<{ texto: string; linea: number }> = [];
  for (const m of codigo.matchAll(/<[A-Za-z][\w.]*\b/g)) {
    let j = m.index! + m[0].length;
    let llaves = 0;
    for (; j < codigo.length; j++) {
      const c = codigo[j];
      if (c === "{") llaves++;
      else if (c === "}") llaves--;
      else if (c === ">" && llaves === 0) break;
    }
    out.push({ texto: codigo.slice(m.index!, j), linea: codigo.slice(0, m.index!).split("\n").length });
  }
  return out;
}

function hoversAnulados(codigo: string): string[] {
  const hallados: string[] = [];
  for (const { texto, linea } of etiquetas(codigo)) {
    if (/[\s"'`]text-primary\b/.test(texto) && /[\s"'`](group-)?hover:text-\[rgb\(var\(--accent-base\)\)\]/.test(texto)) {
      hallados.push(`${linea}: hover a --accent-base sobre text-primary`);
    }
    const estilo = /style=\{\{([\s\S]*?)\}\}/.exec(texto)?.[1];
    if (!estilo) continue;
    for (const [clase, prop] of CHOQUES) {
      if (texto.includes(clase) && new RegExp(`(^|[\\s,{])${prop}\\w*\\s*:`).test(estilo)) {
        hallados.push(`${linea}: ${clase} frente a style.${prop}`);
      }
    }
  }
  return hallados;
}

describe("ningún estilo en línea anula su propio hover", () => {
  it("el detector caza el caso que tapaba el botón de la barra", () => {
    const muestra = `<Link className="rounded hover:bg-[rgb(var(--accent-hover))]" style={{ height: 38, background: "rgb(var(--accent-base))" }}>x</Link>`;
    expect(hoversAnulados(muestra)).toEqual(["1: hover:bg- frente a style.background"]);
    expect(hoversAnulados(`<a className="hover:bg-x" style={{ height: 3 }}>x</a>`)).toEqual([]);
    expect(hoversAnulados(`<button className="text-primary hover:text-[rgb(var(--accent-base))]">x</button>`)).toEqual([
      "1: hover a --accent-base sobre text-primary",
    ]);
  });

  it("ninguna etiqueta de src/ lo hace", () => {
    const fallos = fuentes(join(RAIZ, "src")).flatMap((f) =>
      hoversAnulados(readFileSync(f, "utf8")).map((h) => `${relative(RAIZ, f).split(sep).join("/")}:${h}`),
    );
    expect(fallos).toEqual([]);
  });
});
