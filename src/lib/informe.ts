import { siteUrl } from "@/lib/site";

/** Un bloque del informe: rótulo opcional y sus líneas, cada una con viñeta. */
export type Apartado = { rotulo?: string; lineas: (string | false | null | undefined)[] };

/**
 * El texto que se lleva quien pulsa «Copiar» en una herramienta.
 *
 * Siete herramientas lo escribían cada una a su manera: un título en
 * mayúsculas con marco de «═», otro en mayúsculas iniciales a la inglesa,
 * viñetas «•», «·» o ninguna, y la dirección de la herramienta solo en
 * dos. Aquí se compone igual en todas: «CountPips · Título», los bloques
 * separados por una línea en blanco y, al pie, la dirección de la
 * herramienta en el idioma en que se copió, para que el texto pegado en
 * otro sitio diga de dónde sale.
 */
export function componerInforme(titulo: string, apartados: Apartado[], ruta: string): string {
  const bloques = apartados
    .map(({ rotulo, lineas }) => {
      const cuerpo = lineas.filter((l): l is string => typeof l === "string" && l.trim() !== "").map((l) => `• ${l}`);
      if (!cuerpo.length) return "";
      return [rotulo ? `${rotulo}:` : null, ...cuerpo].filter(Boolean).join("\n");
    })
    .filter(Boolean);
  return [`CountPips · ${titulo}`, ...bloques, siteUrl(ruta)].join("\n\n");
}
