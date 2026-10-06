import { siteUrl } from "@/lib/site";

/** Un bloque del informe: rótulo opcional y sus líneas, cada una con viñeta. */
export type Apartado = { rotulo?: string; lineas: (string | false | null | undefined)[] };

/**
 * El texto que se lleva quien pulsa «Copiar» en una herramienta, con el mismo
 * formato en todas: «CountPips · Título», bloques separados por una línea en
 * blanco y, al pie, la dirección de la herramienta en el idioma copiado.
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
