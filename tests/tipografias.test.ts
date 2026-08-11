import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * COMPILAR NO PUEDE DEPENDER DE QUE GOOGLE CONTESTE.
 *
 * `next/font/google` no deja una etiqueta apuntando a un CDN: Next se
 * descarga el binario DURANTE LA COMPILACIÓN y luego lo sirve desde el
 * propio dominio. Eso es bueno para quien visita la web y malo para quien
 * la publica — si `fonts.gstatic.com` devuelve un 404, `bun run build`
 * falla, y el fallo no depende de nada que esté en este repositorio. Ya
 * ocurrió una vez y tumbó un despliegue.
 *
 * Las cuatro caras viven ahora en `src/app/fonts/` y se cargan con
 * `next/font/local`. Esta barrera existe porque el defecto que evita es
 * INVISIBLE mientras el tercero funcione: volver a escribir un
 * `next/font/google` compila en verde en local y en el 99 % de los
 * despliegues, y sólo revienta el día que no toca.
 *
 * Se rompió a propósito para comprobar que salta, en las dos direcciones:
 * reponiendo el `import { Newsreader } from "next/font/google"` en
 * `layout.tsx` (falla la primera prueba) y renombrando
 * `fonts/Newsreader.woff2` (falla la segunda).
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

/** Todos los `.ts`/`.tsx` de `src/`, recorridos a mano para no depender
 *  de ninguna utilidad de globbing. */
function fuentesDelProyecto(dir: string, acc: string[] = []): string[] {
  for (const entrada of readdirSync(dir)) {
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) fuentesDelProyecto(ruta, acc);
    else if (/\.tsx?$/.test(entrada)) acc.push(ruta);
  }
  return acc;
}

/**
 * Se busca la IMPORTACIÓN, no la mención. La primera versión de esta
 * prueba buscaba la subcadena suelta y señalaba a `layout.tsx`, cuyo
 * comentario nombra el módulo justo para explicar por qué ya no se usa:
 * una barrera que prohíbe hablar del defecto obliga a borrar la
 * explicación para pasar en verde, que es lo contrario de lo que quiere
 * este proyecto. Cubre las dos formas con las que un módulo puede
 * entrar de verdad — `from "…"` y `require("…")`.
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
    // Un woff2 de una familia completa no baja de 15 KB. El umbral no
    // busca el tamaño exacto: busca que nadie deje en su sitio un fichero
    // vacío o un HTML de error renombrado y se quede tan tranquilo.
    expect(tam).toBeGreaterThan(15_000);
  });

  it("layout.tsx declara las tres variables CSS que lee globals.css", () => {
    const layout = readFileSync(join(RAIZ, "src", "app", "layout.tsx"), "utf8");
    for (const variable of ["--font-sans", "--font-serif", "--font-geist-mono"])
      expect(layout).toContain(`variable: "${variable}"`);
  });
});
