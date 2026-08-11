import { afterEach, describe, expect, it, vi } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * El prefijo de despliegue (`basePath`), probado CON valor.
 *
 * ── Por qué existe este fichero ───────────────────────────────────────
 * El 11/08/2026 la web publicada no navegaba: pulsar cualquier enlace del
 * menú, del pie o de las tarjetas llevaba a la página 404. La causa era de
 * una sola línea, en el interceptor de clics que anima el cambio de página
 * (`TransicionPagina`): pasaba a `router.push()` una ruta que YA llevaba el
 * prefijo `/CountPipsWeb`, y Next se lo añadía otra vez, publicando
 * `/CountPipsWeb/CountPipsWeb/demo`.
 *
 * Y la suite entera no podía verlo, por escrito: `tests/atlas.test.ts` deja
 * anotado que «el subdirectorio de despliegue NO se prueba aquí a
 * propósito» porque en local la variable va vacía. Con la variable vacía,
 * duplicar el prefijo es duplicar la cadena vacía: todo pasa en verde y en
 * producción no funciona nada.
 *
 * Así que la regla que fija este fichero no es una función concreta: es que
 * al menos UNA prueba corra con el prefijo REAL puesto. Cualquier código
 * que mezcle las dos convenciones cae aquí.
 *
 * ── Las dos convenciones, que es lo que hay que tener claro ───────────
 * LLEVAN el prefijo: `location.pathname`, el `.href` resuelto de un `<a>`,
 * el `href` que Next escribe en el HTML, y las rutas de recursos que se
 * arman a mano (para eso está `asset()`).
 * NO lo llevan: `usePathname()`, `router.push()` y `<Link href>` — Next lo
 * pone él.
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

    // El caso exacto que rompió el sitio: el `.href` de <a href="/CountPipsWeb/demo/">.
    expect(rutaDeRouter("/CountPipsWeb/demo/")).toBe("/demo/");
    expect(rutaDeRouter("/CountPipsWeb/traders/prop-firms/")).toBe("/traders/prop-firms/");
    expect(rutaDeRouter("/CountPipsWeb/en/pricing/")).toBe("/en/pricing/");
  });

  it("la raíz del sitio es la raíz del router, no una cadena vacía", async () => {
    const { rutaDeRouter } = await conPrefijo();

    // Sin este caso, la portada llamaría a router.push("") y no navegaría.
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
 * ── Y AHORA SOBRE EL HTML QUE DE VERDAD SE PUBLICA ────────────────────
 * Todo lo de arriba prueba las dos funciones que traducen entre
 * convenciones, y eso sólo protege al código que se acuerda de usarlas.
 * El fallo siguiente no pasó por ninguna de las dos: `MagneticButton`
 * pintaba un `<a href="/beta">` a pelo, así que el botón «Solicitar
 * acceso anticipado» de los dos planes de la página de precios —el
 * último clic del embudo, el que pulsa quien ya ha decidido— apuntaba a
 * la raíz del dominio y daba 404 en el sitio publicado. Comprobado en
 * producción, en español y en inglés.
 *
 * Ninguna prueba de esta suite podía verlo, porque el defecto no está en
 * `asset()` ni en `rutaDeRouter()`: está en un componente que no las
 * llama. Así que esto no mira código — mira el resultado. Recorre el
 * export y exige que TODA ruta interna escrita en el HTML lleve el
 * prefijo, venga de donde venga.
 *
 * Se salta si no hay `out/`: las pruebas tienen que poder correr sin
 * compilar. Cuando lo hay —y en integración continua siempre lo hay,
 * porque el build va antes— la barrera es total.
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

/* El export se compila con el prefijo real en integración continua y sin
   él en local. Se lee del propio HTML en vez de suponerlo: si la
   compilación no llevaba prefijo, no hay nada que exigir.

   TODO ESTO SE CALCULA DENTRO DE CADA PRUEBA, no en el cuerpo del
   `describe`. `describe.skipIf` marca las pruebas como saltadas pero
   EJECUTA igualmente el cuerpo para recolectarlas, así que leer `out/`
   ahí revienta la suite entera en cualquier máquina que aún no haya
   compilado — que en integración continua es siempre, porque las pruebas
   van antes que el build. Costó un despliegue en rojo. */
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
