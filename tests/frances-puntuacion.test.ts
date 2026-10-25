import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const RAIZ = join(import.meta.dirname, "..");

/* Ficheros de `src/` medidos al escribir la prueba (284). El margen deja borrar
   algunos sin tocar esta cifra; si baja de ahí, el recorrido se ha quedado ciego. */
const FICHEROS_HOY = 284;
const MARGEN = 15;

function fuentes(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const ruta = join(dir, e);
    if (statSync(ruta).isDirectory()) fuentes(ruta, out);
    else if (/\.(ts|tsx)$/.test(e)) out.push(ruta);
  }
  return out;
}

/* Francés sin estar bajo `fr:`: palabras que ni el español ni el inglés escriben. */
const FRANCES_CLARO = /\b(vous|votre|les|sont|avec|pour|dans|cette)\b|aujourd’hui/i;
/* El espacio normal, no el insecable (U+00A0): solo el que va justo antes del signo. */
const ESPACIO_ANTES = / (?=[:;?!])/g;

/* Clave de un `fr: …`, de un `altFr: …` o de un atributo `detalleFr="…"`. */
function claveDe(nodo: ts.Node): string | undefined {
  const nombre = ts.isPropertyAssignment(nodo) || ts.isJsxAttribute(nodo) ? nodo.name : undefined;
  return nombre && (ts.isIdentifier(nombre) || ts.isStringLiteral(nombre)) ? nombre.text : undefined;
}

function esClaveFrancesa(nodo: ts.Node): boolean {
  const clave = claveDe(nodo);
  return clave === "fr" || (clave !== undefined && /Fr$/.test(clave));
}

function esTexto(n: ts.Node): boolean {
  return (
    ts.isStringLiteral(n) ||
    ts.isNoSubstitutionTemplateLiteral(n) ||
    ts.isTemplateHead(n) ||
    ts.isTemplateMiddle(n) ||
    ts.isTemplateTail(n) ||
    ts.isJsxText(n)
  );
}

/* Mira dentro de los literales, no en el código: el `:` de un ternario no cuenta. */
function sitiosFr(nombre: string, texto: string): string[] {
  const sf = ts.createSourceFile(
    nombre,
    texto,
    ts.ScriptTarget.Latest,
    true,
    nombre.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const out: string[] = [];
  const visita = (nodo: ts.Node, bajoFr: boolean) => {
    const enFr = bajoFr || esClaveFrancesa(nodo);
    if (esTexto(nodo)) {
      const raw = nodo.getText(sf);
      if (enFr || FRANCES_CLARO.test(raw)) {
        const inicio = nodo.getStart(sf);
        for (const m of raw.matchAll(ESPACIO_ANTES)) {
          const linea = sf.getLineAndCharacterOfPosition(inicio + m.index).line + 1;
          out.push(`${nombre}:${linea}  …${raw.slice(Math.max(0, m.index - 14), m.index + 8)}…`);
        }
      }
    }
    ts.forEachChild(nodo, (hijo) => visita(hijo, enFr));
  };
  visita(sf, false);
  return out;
}

describe("el detector distingue el francés de lo que no lo es", () => {
  it.each([
    ["x.ts", 'const x = { fr: "Vous notez ; un" };', 1],
    ["x.ts", 'const x = { fr: "Vous notez\\u00a0; un" };', 0],
    ["x.ts", 'const x = { fr: uno ? "opération" : "opérations" };', 0],
    ["x.ts", 'const x = { es: "Hola ; adiós" };', 0],
    ["x.ts", 'const x = { fr: `Agrandir la capture : ${titulo}` };', 1],
    ["x.tsx", "const x = { fr: <>Les opérations ; {y}</> };", 1],
    ["x.tsx", '<Sello detalleFr="défini : x" />', 1],
    ["x.ts", 'const x = "Votre compte ? Oui";', 1],
  ])("%s: «%s» da %i hallazgos", (nombre, codigo, n) => {
    expect(sitiosFr(nombre, codigo)).toHaveLength(n);
  });
});

describe("ningún texto francés de src/ lleva espacio normal antes de : ; ? !", () => {
  const archivos = fuentes(join(RAIZ, "src"));

  it("recorre todo src/, no una lista de rutas", () => {
    expect(archivos.length, `ficheros recorridos: ${archivos.length}`).toBeGreaterThanOrEqual(FICHEROS_HOY - MARGEN);
  });

  it("el francés usa espacio insecable (U+00A0) antes de : ; ? !", () => {
    const sueltos = archivos.flatMap((f) =>
      sitiosFr(relative(RAIZ, f).split(sep).join("/"), readFileSync(f, "utf8")),
    );
    expect(sueltos, sueltos.join("\n")).toEqual([]);
  });
});
