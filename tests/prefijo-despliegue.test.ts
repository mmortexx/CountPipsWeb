import { afterEach, describe, expect, it, vi } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * El prefijo de despliegue (`basePath`), probado con valor: en local va vacío
 * y duplicarlo pasa en verde, pero en producción daba 404 en cada enlace.
 *
 * Llevan el prefijo: `location.pathname`, el `.href` de un `<a>`, el `href`
 * que Next escribe en el HTML y los recursos a mano (`asset()`). No lo llevan
 * `usePathname()`, `router.push()` ni `<Link href>`: Next lo pone.
 */

const PREFIJO = "/CountPipsWeb";

/** Recarga el módulo con la variable puesta: `BASE` se lee al importar. */
async function conPrefijo() {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_BASE_PATH", PREFIJO);
  return import("../src/lib/asset");
}

async function sinPrefijo() {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "");
  return import("../src/lib/asset");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("rutaDeRouter — lo que se le pasa a router.push()", () => {
  it("quita el prefijo de una ruta salida del navegador", async () => {
    const { rutaDeRouter } = await conPrefijo();

    // El `.href` de <a href="/CountPipsWeb/demo/"> que rompió el sitio.
    expect(rutaDeRouter("/CountPipsWeb/demo/")).toBe("/demo/");
    expect(rutaDeRouter("/CountPipsWeb/traders/prop-firms/")).toBe("/traders/prop-firms/");
    expect(rutaDeRouter("/CountPipsWeb/en/pricing/")).toBe("/en/pricing/");
  });

  it("la raíz del sitio es la raíz del router, no una cadena vacía", async () => {
    const { rutaDeRouter } = await conPrefijo();

    // Con cadena vacía la portada llamaría a router.push("") y no navegaría.
    expect(rutaDeRouter("/CountPipsWeb")).toBe("/");
    expect(rutaDeRouter("/CountPipsWeb/")).toBe("/");
  });

  it("no muerde una ruta que solo EMPIEZA igual", async () => {
    const { rutaDeRouter } = await conPrefijo();

    // Se compara contra `${BASE}/`, no con startsWith(BASE) a secas.
    expect(rutaDeRouter("/CountPipsWebFoo/demo/")).toBe("/CountPipsWebFoo/demo/");
  });

  it("es inofensiva cuando la ruta ya viene limpia", async () => {
    const { rutaDeRouter } = await conPrefijo();
    expect(rutaDeRouter("/demo/")).toBe("/demo/");
  });

  it("no toca nada cuando no hay prefijo (local y previsualizaciones)", async () => {
    const { rutaDeRouter } = await sinPrefijo();
    expect(rutaDeRouter("/demo/")).toBe("/demo/");
    expect(rutaDeRouter("/")).toBe("/");
  });
});

describe("asset y rutaDeRouter son la ida y la vuelta", () => {
  it("volver de una y otra deja la ruta como estaba", async () => {
    const { asset, rutaDeRouter } = await conPrefijo();

    for (const ruta of ["/demo/", "/traders/manual/", "/img/app-resumen.webp", "/"]) {
      expect(rutaDeRouter(asset(ruta)), `ida y vuelta de ${ruta}`).toBe(ruta);
    }
  });

  it("asset no vuelve a prefijar lo ya prefijado", async () => {
    const { asset } = await conPrefijo();
    expect(asset("/CountPipsWeb/img/logo.png")).toBe("/CountPipsWeb/img/logo.png");
  });
});

/**
 * Lo anterior solo protege al código que usa las dos funciones. Esto mira el
 * HTML publicado y exige que toda ruta interna lleve el prefijo, venga de
 * donde venga (un `<a href="/beta">` a pelo daba 404 en producción).
 *
 * Se salta si no hay `out/`: las pruebas deben poder correr sin compilar.
 */
const SALIDA = join(process.cwd(), "out");

function htmlsDelExport(dir: string, acc: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) {
      if (n === "_next") continue; // recursos, no páginas
      htmlsDelExport(p, acc);
    } else if (n.endsWith(".html")) acc.push(p);
  }
  return acc;
}

// El prefijo se lee del propio HTML (en local se compila sin él).
// Se calcula dentro de cada prueba: `describe.skipIf` ejecuta igualmente el
// cuerpo, y leer `out/` ahí revienta la suite en CI, donde las pruebas van
// antes que el build.
function leerExport() {
  const paginas = htmlsDelExport(SALIDA);
  const indice = readFileSync(join(SALIDA, "index.html"), "utf8");
  const m = indice.match(/href="(\/[^/"]+)\/_next\//);
  return { paginas, prefijo: m ? m[1] : "" };
}

describe.skipIf(!existsSync(SALIDA))(
  "el HTML publicado: ninguna ruta interna se queda sin prefijo",
  () => {
    it("hay páginas que revisar", () => {
      expect(leerExport().paginas.length, "El export está vacío").toBeGreaterThan(50);
    });

    it("todo href y todo src interno arranca por el prefijo", (ctx) => {
        const { paginas, prefijo: PREFIJO_REAL } = leerExport();
        // Sin prefijo —compilación local— no hay nada que exigir.
        if (!PREFIJO_REAL) return ctx.skip();
        const fallos: string[] = [];
        for (const ruta of paginas) {
          const html = readFileSync(ruta, "utf8");
          for (const att of ["href", "src"]) {
            const re = new RegExp(`${att}="(/[^"]*)"`, "g");
            for (const hit of html.matchAll(re)) {
              const valor = hit[1];
              if (valor.startsWith("//")) continue; // protocolo relativo
              if (valor.startsWith(`${PREFIJO_REAL}/`) || valor === PREFIJO_REAL) continue;
              fallos.push(`${relative(SALIDA, ruta)} → ${att}="${valor}"`);
            }
          }
        }
        expect(
          [...new Set(fallos)].slice(0, 20),
          `Estas rutas se escriben desde la raíz del dominio y en ` +
            `${PREFIJO_REAL} dan 404. Suele ser un \`<a href>\` o un \`<img src>\` ` +
            `crudo: usa el \`Link\` de \`@/components/tj/LocaleLink\` para ` +
            `navegar y \`asset()\` para recursos.`,
        ).toEqual([]);
      },
    );

    it("y ninguna lo lleva dos veces", (ctx) => {
      const { paginas, prefijo: PREFIJO_REAL } = leerExport();
      if (!PREFIJO_REAL) return ctx.skip();
      const fallos: string[] = [];
      for (const ruta of paginas) {
        const html = readFileSync(ruta, "utf8");
        if (html.includes(`${PREFIJO_REAL}${PREFIJO_REAL}/`)) {
          fallos.push(relative(SALIDA, ruta));
        }
      }
      expect(
        fallos.slice(0, 10),
        "El prefijo aparece duplicado: alguien se lo ha añadido a una ruta " +
          "que ya lo llevaba. Es lo que dejó el sitio entero sin navegar el 11/08.",
      ).toEqual([]);
    });
  },
);
