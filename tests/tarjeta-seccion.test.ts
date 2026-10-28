import { beforeAll, describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Una ficha del glosario o una calculadora se comparte con la tarjeta de su
// sección, no con la general: `postbuild.mjs` sube de carpeta en carpeta hasta
// encontrar una. pt, fr, de e it no tienen la suya y llevan la inglesa.

const OUT = join(process.cwd(), "out");
const CASOS: [string, string][] = [
  ["glosario/drawdown", "/glosario/opengraph-image.png"],
  ["herramientas/monte-carlo", "/herramientas/opengraph-image.png"],
  ["en/glosario/drawdown", "/en/glosario/opengraph-image.png"],
  ["en/herramientas/monte-carlo", "/en/herramientas/opengraph-image.png"],
  ["pt", "/en/opengraph-image.png"],
  ["traders/manual", "/opengraph-image.png"],
];

/** og:image y twitter:image sin la raíz del sitio, que sale del canónico de la página. */
const imagenes = (html: string, ruta: string) => {
  const canonico = html.match(/<link rel="canonical" href="([^"]+)"/)![1];
  const raiz = canonico.slice(0, canonico.length - `/${ruta}/`.length);
  return [...html.matchAll(/<meta (?:property="og:image"|name="twitter:image") content="([^"]+)"/g)].map((m) =>
    m[1].split("?")[0].replace(raiz, ""),
  );
};

// `skipIf` ejecuta el cuerpo del `describe`: `out/` se lee en `beforeAll`.
describe.skipIf(!existsSync(join(OUT, "index.html")) && process.env.COMPROBAR_OUT !== "1")(
  "cada página comparte la tarjeta de su sección",
  () => {
    const leidas = new Map<string, string[]>();
    beforeAll(() => {
      for (const [ruta] of CASOS) leidas.set(ruta, imagenes(readFileSync(join(OUT, ruta, "index.html"), "utf8"), ruta));
    });

    it.each(CASOS)("%s → %s", (ruta, tarjeta) => {
      const encontradas = leidas.get(ruta)!;
      expect(encontradas).toEqual([tarjeta, tarjeta]);
    });

    // La tarjeta heredada lleva el texto alternativo de la página que la genera.
    it.each(CASOS)("%s lleva el texto alternativo de %s", (ruta, tarjeta) => {
      const alts = (html: string) =>
        [...html.matchAll(/<meta (?:property="og:image:alt"|name="twitter:image:alt") content="([^"]*)"/g)].map((m) => m[1]);
      const duena = readFileSync(join(OUT, tarjeta.replace(/^\//, "").replace(/opengraph-image\.png$/, "index.html")), "utf8");
      const [alt] = alts(duena);
      expect(alt).toBeTruthy();
      expect(alts(readFileSync(join(OUT, ruta, "index.html"), "utf8"))).toEqual([alt, alt]);
    });
  },
);
