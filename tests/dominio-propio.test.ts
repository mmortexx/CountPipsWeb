import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { SITE_URL } from "@/lib/site";

/**
 * La dirección oficial del sitio compilado es la que pide el entorno, en todas
 * partes a la vez: canónico, `hreflang`, tarjeta social, datos estructurados,
 * mapa del sitio y `robots.txt`. El día del dominio propio basta un enlace que
 * siga en la dirección vieja para que el buscador reparta la página entre dos.
 *
 * Lee `out/`, así que solo corre tras compilar y con `COMPROBAR_OUT=1`, como en
 * los flujos de GitHub. Sin `out/` y con la variable puesta, falla.
 */
const RAIZ = join(import.meta.dirname, "..");
const OUT = join(RAIZ, "out");
const COMPROBAR = process.env.COMPROBAR_OUT === "1";
const PREFIJO = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Las dos casas que ha tenido o tendrá el sitio. Cualquier enlace absoluto a
// una de ellas tiene que ser a la dirección oficial de esta compilación.
const CASAS = /https?:\/\/(?:www\.)?countpips\.com[^\s"'<>)\\]*|https?:\/\/mmortexx\.github\.io\/CountPipsWeb[^\s"'<>)\\]*/g;
const TEXTO = /\.(html|xml|txt|webmanifest|json)$/;

function ficheros(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    return statSync(ruta).isDirectory() ? ficheros(ruta) : [ruta];
  });
}

describe.runIf(COMPROBAR)("la dirección oficial del sitio compilado", () => {
  it("existe el sitio compilado", () => {
    expect(existsSync(OUT), "falta compilar: `bun run build`").toBe(true);
  });

  const todos = existsSync(OUT) ? ficheros(OUT) : [];
  const leer = (ruta: string) => readFileSync(ruta, "utf8");
  const paginas = todos.filter((f) => f.endsWith("index.html"));

  it("ningún enlace absoluto al sitio apunta a otra dirección", () => {
    const ajenos = todos
      .filter((f) => TEXTO.test(f))
      .flatMap((f) =>
        (leer(f).match(CASAS) ?? [])
          .filter((url) => url !== SITE_URL && !url.startsWith(`${SITE_URL}/`))
          .map((url) => `${relative(OUT, f)}: ${url}`),
      );
    expect(ajenos.slice(0, 20)).toEqual([]);
  });

  it("cada página indexable declara un canónico en la dirección oficial", () => {
    expect(paginas.length).toBeGreaterThan(100);
    const mal = paginas.flatMap((f) => {
      const html = leer(f);
      if (/<meta name="robots" content="[^"]*noindex/.test(html)) return [];
      const canonico = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
      return canonico?.startsWith(`${SITE_URL}/`) ? [] : [`${relative(OUT, f)}: ${canonico}`];
    });
    expect(mal).toEqual([]);
  });

  it("el mapa del sitio y robots.txt señalan la dirección oficial", () => {
    const mapa = leer(join(OUT, "sitemap.xml"));
    const locs = [...mapa.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs.length).toBeGreaterThan(100);
    expect(locs.filter((l) => !l.startsWith(`${SITE_URL}/`))).toEqual([]);
    expect(leer(join(OUT, "robots.txt"))).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
  });

  it.runIf(PREFIJO === "")("compilado para la raíz, ninguna ruta lleva el prefijo de GitHub Pages", () => {
    const conPrefijo = paginas.filter((f) => /(?:href|src)="\/CountPipsWeb\//.test(leer(f)));
    expect(conPrefijo.map((f) => relative(OUT, f))).toEqual([]);
  });
});
