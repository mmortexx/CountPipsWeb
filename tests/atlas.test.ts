import { describe, expect, it } from "vitest";
import {
  ATLAS_ROUTES,
  RUTAS_SIN_LAMINA,
  platesForRoute,
  normalizeRoute,
  type PlateId,
} from "@/lib/atlas";
import { LOCALIZED_PATHS } from "@/lib/locale";

/**
 * El fondo tiene que decir algo distinto en cada sección.
 *
 * Esto no lo vigilaba nadie, y el resultado fue que el atlas conocía diez
 * rutas de setenta y cuatro: el glosario entero (51 términos), las
 * herramientas, el acceso anticipado, las dos páginas de traders y las
 * cuatro legales caían todas en la ruta por defecto y enseñaban la curva
 * de resultados de la portada. Detrás de la política de privacidad había
 * un gráfico de ganancias.
 *
 * Es la clase de fallo que no rompe ninguna prueba, no aparece en
 * consola y solo se ve mirando la web página por página — que es
 * exactamente para lo que sirve una prueba de contrato.
 */
describe("el atlas del fondo", () => {
  it("no repite la figura de apertura entre secciones", () => {
    /* La PRIMERA lámina es la que le pone tema a la sección. Si dos
       secciones abren con la misma, se leen como la misma página aunque
       las siguientes difieran. */
    const aperturas = new Map<PlateId, string[]>();
    for (const [ruta, laminas] of Object.entries(ATLAS_ROUTES)) {
      const primera = laminas[0];
      aperturas.set(primera, [...(aperturas.get(primera) ?? []), ruta]);
    }
    const repetidas = [...aperturas.entries()].filter(([, rutas]) => rutas.length > 1);
    expect(
      repetidas.map(([id, rutas]) => `${id} abre ${rutas.join(" y ")}`),
      "dos secciones abren con la misma figura",
    ).toEqual([]);
  });

  it("no da a dos secciones exactamente el mismo juego de láminas", () => {
    const vistos = new Map<string, string>();
    for (const [ruta, laminas] of Object.entries(ATLAS_ROUTES)) {
      const clave = laminas.join(">");
      const previa = vistos.get(clave);
      expect(previa, `${ruta} repite el juego completo de ${previa}`).toBeUndefined();
      vistos.set(clave, ruta);
    }
  });

  it("deja las páginas legales sin figura", () => {
    for (const ruta of RUTAS_SIN_LAMINA) {
      expect(platesForRoute(ruta), `${ruta} no debe llevar figura`).toEqual([]);
      expect(platesForRoute(`${ruta}/`), `${ruta} con barra final`).toEqual([]);
    }
  });

  it("no manda ninguna ruta al juego de la portada por descarte", () => {
    /* El fallo original: `normalizeRoute` devolvía "/" para todo lo que no
       reconocía, así que una ruta nueva heredaba la portada en silencio.
       Ahora una ruta desconocida se queda SIN figura, que se nota menos
       que una figura prestada y no promete nada. */
    const inventadas = ["/algo-que-no-existe", "/blog/entrada", "/x/y/z"];
    for (const ruta of inventadas) {
      expect(platesForRoute(ruta), `${ruta} no debe heredar la portada`).toEqual([]);
    }
  });

  it("da una figura a cada término del glosario y a cada herramienta", () => {
    const derivadas = ["/glosario/drawdown", "/herramientas/monte-carlo"];
    for (const ruta of derivadas) {
      const laminas = platesForRoute(ruta);
      expect(laminas.length, `${ruta} debe tener figura`).toBe(1);
    }
  });

  it("da siempre la misma figura a la misma URL", () => {
    /* Determinismo: sin esto la figura cambiaría entre servidor y cliente
       y rompería la hidratación, además de que la página dejaría de ser
       reconocible al volver a ella. */
    const ruta = "/glosario/drawdown";
    const primera = platesForRoute(ruta);
    for (let i = 0; i < 5; i++) {
      expect(platesForRoute(ruta)).toEqual(primera);
    }
  });

  it("reparte los términos del glosario entre varias figuras", () => {
    /* Que cada término tenga figura no basta: si el hash las mandara casi
       todas a la misma, el glosario seguiría pareciendo una sola página
       repetida 51 veces. */
    const terminos = LOCALIZED_PATHS.filter((p) => p.startsWith("/glosario/"));
    if (terminos.length < 10) return; // el reparto no dice nada con pocas
    const usadas = new Set(terminos.map((t) => platesForRoute(t)[0]));
    expect(
      usadas.size,
      `${terminos.length} términos reparten solo ${usadas.size} figuras`,
    ).toBeGreaterThanOrEqual(6);
  });

  it("encuentra la sección aunque la ruta traiga idioma o subdirectorio", () => {
    /* En producción el sitio cuelga de un subdirectorio y el inglés va
       bajo /en. Si el normalizador no los quita, la mitad del sitio se
       queda sin figura sin que nada avise. */
    const equivalentes: Array<[string, string]> = [
      ["/en/features", "/features"],
      ["/CountPipsWeb/features/metricas", "/features/metricas"],
      ["/en/traders/manual/", "/traders/manual"],
      ["/CountPipsWeb/en/glosario/drawdown", "/glosario/drawdown"],
    ];
    for (const [conPrefijo, limpia] of equivalentes) {
      expect(
        platesForRoute(conPrefijo),
        `${conPrefijo} debe resolver como ${limpia}`,
      ).toEqual(platesForRoute(limpia));
    }
  });

  it("normaliza a una ruta que existe o a una sin figura", () => {
    for (const ruta of Object.keys(ATLAS_ROUTES)) {
      expect(normalizeRoute(`${ruta}/`)).toBe(ruta === "/" ? "/" : ruta);
    }
  });
});
