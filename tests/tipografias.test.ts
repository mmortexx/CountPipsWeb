import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Compilar no puede depender de que Google conteste: `next/font/google`
 * descarga la fuente durante el build, y un 404 de `fonts.gstatic.com` tumba
 * el despliegue sin que cambie nada del repositorio. Las cuatro caras viven en
 * `src/app/fonts/` y se cargan con `next/font/local`; reponer un import de
 * Google compila en verde casi siempre, de ahí esta barrera.
 */

const RAIZ = process.cwd();
const DIR_FUENTES = join(RAIZ, "src", "app", "fonts");

/** Las cuatro caras que compone el sitio, y para qué es cada una. */
const CARAS = [
  { fichero: "InstrumentSans.woff2", papel: "sans de texto (--font-sans)" },
  { fichero: "Newsreader.woff2", papel: "serif de titulares (--font-serif)" },
  {
    fichero: "Newsreader-Italic.woff2",
    papel: "cursiva real de la serif, no una inclinación sintética",
  },
  { fichero: "GeistMono.woff2", papel: "cara de datos (--font-geist-mono)" },
];

/** Todos los `.ts`/`.tsx` de `src/`. */
function fuentesDelProyecto(dir: string, acc: string[] = []): string[] {
  for (const entrada of readdirSync(dir)) {
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) fuentesDelProyecto(ruta, acc);
    else if (/\.tsx?$/.test(entrada)) acc.push(ruta);
  }
  return acc;
}

/**
 * Se busca la importación (`from "…"` o `require("…")`), no la mención: un
 * comentario puede nombrar el módulo para explicar por qué ya no se usa.
 */
const IMPORTACION = /(?:from\s*|require\s*\(\s*)["']next\/font\/google["']/;

describe("las tipografías son del repositorio, no de un tercero", () => {
  it("ningún fichero de src/ importa next/font/google", () => {
    const culpables = fuentesDelProyecto(join(RAIZ, "src")).filter((f) =>
      IMPORTACION.test(readFileSync(f, "utf8"))
    );
    expect(
      culpables.map((f) => f.slice(RAIZ.length + 1).replace(/\\/g, "/"))
    ).toEqual([]);
  });

  it.each(CARAS)("$fichero está versionada — $papel", ({ fichero }) => {
    const tam = statSync(join(DIR_FUENTES, fichero)).size;
    // Un woff2 completo no baja de 15 KB: el umbral caza un fichero vacío o un HTML de error renombrado.
    expect(tam).toBeGreaterThan(15_000);
  });

  it("layout.tsx declara las tres variables CSS que lee globals.css", () => {
    const layout = readFileSync(join(RAIZ, "src", "app", "layout.tsx"), "utf8");
    for (const variable of ["--font-sans", "--font-serif", "--font-geist-mono"])
      expect(layout).toContain(`variable: "${variable}"`);
  });
});

/**
 * La escala de cuerpo es la del comentario de `@theme` de `globals.css`
 * (10 a 15 px). Cada excepción es un `{fichero, valor}` y se compara ocurrencia
 * a ocurrencia: un `text-[17px]` de más en un fichero que ya tenía uno rompe la
 * prueba. Las excepciones son cifras protagonistas y rótulos, no bloques de
 * texto; esos los vigila en el DOM `scripts/escala.mjs`.
 */
const ESCALA_CUERPO = [10, 11, 12, 13, 14, 15];

const EXCEPCIONES: Array<{ fichero: string; valor: number }> = [
  { fichero: "components/demo/pages/DashboardPage.tsx", valor: 28 },
  { fichero: "components/demo/pages/DashboardPage.tsx", valor: 22 },
  { fichero: "components/demo/pages/DashboardPage.tsx", valor: 28 },
  { fichero: "components/marketing/FeaturesBento.tsx", valor: 22 },
  { fichero: "components/marketing/FeaturesBento.tsx", valor: 17 },
  { fichero: "components/marketing/GuardianNew.tsx", valor: 17 },
  { fichero: "components/marketing/Navbar.tsx", valor: 17 },
  { fichero: "components/marketing/SessionClock.tsx", valor: 20 },
];

/** Todos los `.tsx` de `src/`. */
function tsxDelProyecto(dir: string, acc: string[] = []): string[] {
  for (const entrada of readdirSync(dir)) {
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) tsxDelProyecto(ruta, acc);
    else if (entrada.endsWith(".tsx")) acc.push(ruta);
  }
  return acc;
}

/** Cada `text-[Npx]` fuera de la escala, como `"Npx en fichero"`, una entrada por ocurrencia. */
function huerfanosDelCuerpo(): string[] {
  const huerfanos: string[] = [];
  for (const fichero of tsxDelProyecto(join(RAIZ, "src"))) {
    const rel = fichero.slice(RAIZ.length + 1).replace(/\\/g, "/").replace(/^src\//, "");
    const contenido = readFileSync(fichero, "utf8");
    for (const m of contenido.matchAll(/text-\[(\d+)px\]/g)) {
      const valor = Number(m[1]);
      if (!ESCALA_CUERPO.includes(valor)) huerfanos.push(`${valor}px en ${rel}`);
    }
  }
  return huerfanos.sort();
}

describe("la escala de cuerpo no gana escalones por sorpresa", () => {
  it("todo text-[Npx] fuera de 10·11·12·13·14·15 está en la lista de excepciones conocida", () => {
    const esperados = EXCEPCIONES.map((e) => `${e.valor}px en ${e.fichero}`).sort();
    expect(
      huerfanosDelCuerpo(),
      "Escala de cuerpo documentada en el comentario de @theme de globals.css " +
        "(10·11·12·13·14·15 px). Un valor nuevo aquí es un tamaño inventado sin " +
        "decidirlo: añádelo a la escala a propósito o corrígelo al escalón más cercano."
    ).toEqual(esperados);
  });
});
