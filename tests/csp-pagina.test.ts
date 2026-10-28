import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * GitHub Pages no deja poner cabeceras: la política de contenido de cada página
 * viaja en una `<meta http-equiv>` que escribe `postbuild.mjs`, con la huella
 * (sha256) de cada script en línea de ESA página y sin `'unsafe-inline'`. En el
 * dominio propio se suma a la de `_headers` y manda la más estricta. Se calcula
 * aquí la huella por separado para no fiarse del mismo código que la escribe.
 */
const OUT = join(process.cwd(), "out");

const paginas = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? (e.name === "_next" ? [] : paginas(join(dir, e.name))) : e.name.endsWith(".html") ? [join(dir, e.name)] : [],
  );

const metaCsp = (html: string) =>
  [...html.matchAll(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]*)"\s*\/?>/gi)].map((m) => m[1]);
const directiva = (csp: string, nombre: string) =>
  csp.split(";").map((d) => d.trim().split(/\s+/)).find((d) => d[0] === nombre)?.slice(1) ?? null;
/** Scripts en línea que el navegador ejecuta (los `application/ld+json` son datos y no cuentan). */
const enLinea = (html: string) =>
  [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(([, attrs]) => !/\bsrc=/i.test(attrs))
    .filter(([, attrs]) => {
      const tipo = attrs.match(/\btype="([^"]*)"/i)?.[1]?.toLowerCase();
      return !tipo || tipo === "module" || /^(text|application)\/(java|ecma)script$/.test(tipo);
    })
    .map(([, , cuerpo]) => cuerpo);
const huella = (s: string) => `'sha256-${createHash("sha256").update(s, "utf8").digest("base64")}'`;

// Sin `out/` se salta, salvo con `COMPROBAR_OUT=1` (los flujos de GitHub, tras compilar).
describe.skipIf(!existsSync(OUT) && process.env.COMPROBAR_OUT !== "1")("política de contenido en cada página", () => {
  let html: [string, string][] = [];
  beforeAll(() => {
    html = paginas(OUT).map((f) => [f.slice(OUT.length + 1).replace(/\\/g, "/"), readFileSync(f, "utf8")]);
  });

  it("hay páginas que mirar", () => {
    expect(html.length).toBeGreaterThan(50);
  });

  it("cada página lleva una sola, antes de cualquier script, hoja o estilo", () => {
    const mal = html.flatMap(([ruta, h]) => {
      const n = metaCsp(h).length;
      if (n !== 1) return [`${ruta}: ${n} metas de CSP`];
      const meta = h.search(/<meta\s+http-equiv="Content-Security-Policy"/i);
      const primero = h.search(/<(script|link|style)\b/i);
      return primero >= 0 && primero < meta ? [`${ruta}: la CSP llega tarde`] : [];
    });
    expect(mal).toEqual([]);
  });

  it("los scripts solo corren con su huella: sin 'unsafe-inline' ni 'unsafe-eval'", () => {
    const mal = html.flatMap(([ruta, h]) => {
      const csp = metaCsp(h)[0] ?? "";
      const scripts = directiva(csp, "script-src") ?? [];
      const problemas: string[] = [];
      for (const prohibido of ["'unsafe-inline'", "'unsafe-eval'", "'unsafe-hashes'", "*", "data:", "blob:", "http:", "https:"]) {
        if (scripts.includes(prohibido)) problemas.push(`script-src admite ${prohibido}`);
      }
      const sinHuella = enLinea(h).filter((s) => !scripts.includes(huella(s)));
      if (sinHuella.length) problemas.push(`${sinHuella.length} script(s) en línea sin su huella`);
      const sobran = scripts.filter((s) => s.startsWith("'sha256-")).length - new Set(enLinea(h).map(huella)).size;
      if (sobran > 0) problemas.push(`${sobran} huella(s) de scripts que la página no tiene`);
      return problemas.map((p) => `${ruta}: ${p}`);
    });
    expect(mal).toEqual([]);
  });

  it("cierra lo que no se usa: plugins, <base>, formularios ajenos y todo lo no declarado", () => {
    const mal = html.flatMap(([ruta, h]) => {
      const csp = metaCsp(h)[0] ?? "";
      const esperado: [string, string[]][] = [
        ["default-src", ["'self'"]],
        ["object-src", ["'none'"]],
        ["base-uri", ["'none'"]],
        ["form-action", ["'self'"]],
      ];
      return esperado
        .filter(([d, v]) => JSON.stringify(directiva(csp, d)) !== JSON.stringify(v))
        .map(([d, v]) => `${ruta}: ${d} debería ser ${v.join(" ")} y es ${directiva(csp, d)?.join(" ") ?? "(falta)"}`);
    });
    expect(mal).toEqual([]);
  });

  it("no lleva lo que una meta no puede aplicar (el navegador lo ignora y avisa en consola)", () => {
    const mal = html.filter(([, h]) => /frame-ancestors|report-uri|sandbox/.test(metaCsp(h)[0] ?? "")).map(([r]) => r);
    expect(mal).toEqual([]);
  });

  it("ningún manejador en atributo (onclick=…): la política lo bloquearía", () => {
    const mal = html.filter(([, h]) => /<[a-z][^>]*\son[a-z]+\s*=/i.test(h.replace(/<script\b[\s\S]*?<\/script>/gi, ""))).map(([r]) => r);
    expect(mal).toEqual([]);
  });

  it("al salir hacia otro sitio solo viaja el origen, nunca la ruta", () => {
    const mal = html
      .filter(([, h]) => !/<meta\s+name="referrer"\s+content="strict-origin-when-cross-origin"\s*\/?>/i.test(h))
      .map(([r]) => r);
    expect(mal).toEqual([]);
  });
});
