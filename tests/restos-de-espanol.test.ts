import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Las cadenas `pt:` se escribieron a mano y ningún nativo las ha revisado: una
 * palabra española suelta sale tal cual en la portada portuguesa. Recorre todo
 * `src/` y, en cada clave `pt:`, mira su valor: las citas y el texto JSX que
 * hay hasta la siguiente clave hermana.
 *
 * Punto ciego: los valores que apuntan a una variable o a un dato (`titlePt`,
 * `labelPt`, `PESTANAS_PT`) no son una clave `pt:` y no entran.
 */

const RAIZ = join(import.meta.dirname, "..");
const SRC = join(RAIZ, "src");

// «está» no va: existe en portugués. «las» tampoco: en «cumpri-las» es el
// pronombre portugués, y el detector la marcó en una frase correcta.
const MARCAS_ESPANOL = new Set(["es", "y", "el", "los", "una", "pero", "con", "también"]);
const TERMINACIONES_ESPANOL = ["ción", "ciones"];

// Fragmentos que se extraen hoy de `src/`: 297. Si el extractor se queda ciego
// (una regex que deja de encajar), baja de aquí y la prueba lo dice.
const FRAGMENTOS_MEDIDOS = 297;
const FRAGMENTOS_MINIMOS = Math.floor(FRAGMENTOS_MEDIDOS * 0.9);

// El suelo global lo cumpliría aunque el JSX entero dejara de leerse (16 de 297).
const JSX_MEDIDOS = 16;
const JSX_MINIMOS = Math.floor(JSX_MEDIDOS * 0.9);

type Fragmento = { ruta: string; linea: number; tipo: "cita" | "jsx"; texto: string };

const CLAVE_PT = /(?<![\w$.])["']?pt["']?\s*:/g;
const CLAVE_HERMANA = /,\s*(?:es|en|pt|fr|de|it)\s*:/;
const CITA = /"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g;
const TEXTO_JSX = /(?<=[>}])([^<>{}]+)(?=[<{])/g;

function fragmentosPt(texto: string, ruta: string): Fragmento[] {
  const lineas = texto.split("\n");
  const inicios: number[] = [];
  let acc = 0;
  for (const l of lineas) {
    inicios.push(acc);
    acc += l.length + 1;
  }
  const lineaDe = (pos: number) => {
    let n = 0;
    while (n + 1 < inicios.length && inicios[n + 1] <= pos) n++;
    return n + 1;
  };
  const sangriaDe = (l: string) => l.length - l.trimStart().length;

  const fragmentos: Fragmento[] = [];
  for (const clave of texto.matchAll(CLAVE_PT)) {
    const ini = clave.index + clave[0].length;
    const n = lineaDe(clave.index) - 1;
    // El valor sigue mientras las líneas vayan más hondas que la clave.
    const sangria = sangriaDe(lineas[n]);
    let fin = inicios[n] + lineas[n].length;
    for (let k = n + 1; k < lineas.length; k++) {
      if (lineas[k].trim() === "") continue;
      if (sangriaDe(lineas[k]) <= sangria) break;
      fin = inicios[k] + lineas[k].length;
    }
    let valor = texto.slice(ini, fin);
    const corte = valor.search(CLAVE_HERMANA);
    if (corte >= 0) valor = valor.slice(0, corte);

    // Las citas se sustituyen por espacios antes de leer el JSX, para no leer
    // dos veces una plantilla con texto suelto entre sus `${…}`.
    let sinCitas = valor;
    for (const c of valor.matchAll(CITA)) {
      const cuerpo = c[1] ?? c[2] ?? c[3] ?? "";
      const sinHuecos = c[3] !== undefined ? cuerpo.replace(/\$\{[^}]*\}/g, " ") : cuerpo;
      fragmentos.push({ ruta, linea: lineaDe(ini + c.index), tipo: "cita", texto: sinHuecos });
      sinCitas = sinCitas.slice(0, c.index) + " ".repeat(c[0].length) + sinCitas.slice(c.index + c[0].length);
    }
    for (const t of sinCitas.matchAll(TEXTO_JSX)) {
      if (!/\p{L}/u.test(t[1])) continue;
      fragmentos.push({ ruta, linea: lineaDe(ini + t.index), tipo: "jsx", texto: t[1].trim() });
    }
  }
  return fragmentos;
}

function marcasEspanol(texto: string): string[] {
  const halladas = texto
    .split(/[^\p{L}\p{M}]+/u)
    .filter((p) => MARCAS_ESPANOL.has(p) || TERMINACIONES_ESPANOL.some((t) => p.endsWith(t)));
  return [...new Set(halladas)];
}

function ficherosFuente(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const ruta = join(dir, e.name);
    if (e.isDirectory()) return ficherosFuente(ruta);
    return /\.tsx?$/.test(e.name) ? [ruta] : [];
  });
}

const FRAGMENTOS = ficherosFuente(SRC).flatMap((ruta) =>
  fragmentosPt(readFileSync(ruta, "utf8"), relative(RAIZ, ruta)),
);

describe("las cadenas pt: no llevan restos de español", () => {
  it("el extractor ve al menos el 90 % del texto pt de hoy", () => {
    expect(FRAGMENTOS.length, "fragmentos pt extraídos").toBeGreaterThanOrEqual(FRAGMENTOS_MINIMOS);
    expect(FRAGMENTOS.filter((f) => f.tipo === "jsx").length, "fragmentos JSX pt").toBeGreaterThanOrEqual(JSX_MINIMOS);
  });

  it("ninguna cadena pt: lleva una marca de español", () => {
    const fallos = FRAGMENTOS.flatMap((f) =>
      marcasEspanol(f.texto).map(
        (m) => `${f.ruta}:${f.linea} marca «${m}» en «${f.texto.slice(0, 120)}»`,
      ),
    );
    expect(fallos).toEqual([]);
  });
});
