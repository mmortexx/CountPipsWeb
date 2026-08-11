import { afterEach, describe, expect, it, vi } from "vitest";

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
