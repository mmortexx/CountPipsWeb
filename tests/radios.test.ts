import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * EL COMENTARIO QUE EXPLICA LOS RADIOS TIENE QUE DECIR LOS RADIOS QUE HAY.
 *
 * La escala de radios está escrita DOS veces: la base en `@theme` y la de
 * `:root[data-palette="clasico"]`, que la redefine entera. El sitio fuerza
 * siempre esa paleta, así que la segunda es la que se ve en pantalla y la
 * primera no la ve nadie.
 *
 * El comentario de cabecera de `@theme` avisaba de ese doble sitio y daba
 * el valor efectivo — y durante meses dijo «2 px» cuando lo que mandaba
 * eran 3/4/6/6/8. Un comentario sobre un token es documentación normativa:
 * quien lo lee no vuelve a medir. Esta prueba lo ata al código.
 *
 * QUÉ LA HACE FALLAR (se ha visto fallar por los tres motivos):
 *  · cambiar un radio del bloque de la paleta sin tocar el comentario;
 *  · cambiar el comentario sin tocar los radios;
 *  · borrar el bloque de la paleta o el renglón del comentario.
 *
 * Por qué no lee el navegador: esto no comprueba que el navegador calcule
 * bien —eso ya lo hace—, sino que la documentación y la fuente digan lo
 * mismo. Es una comprobación de texto sobre texto, y por eso vale leerlos.
 */

const CSS = readFileSync(join(import.meta.dirname, "..", "src", "app", "globals.css"), "utf8");

/** Los cinco radios declarados dentro de `:root[data-palette="clasico"]`. */
function radiosDeLaPaleta(): Record<string, string> {
  const bloques = [...CSS.matchAll(/:root\[data-palette="clasico"\]\s*\{([^}]*)\}/g)];
  const encontrados: Record<string, string> = {};
  for (const b of bloques) {
    for (const m of b[1].matchAll(/--radius-(sm|md|lg|xl|2xl)\s*:\s*([0-9]+)px/g)) {
      encontrados[m[1]] = m[2];
    }
  }
  return encontrados;
}

/** El renglón del comentario: «sm 3px · md 4px · lg 6px · xl 6px · 2xl 8px». */
function radiosDelComentario(): Record<string, string> {
  const m = CSS.match(/sm\s+(\d+)px\s*·\s*md\s+(\d+)px\s*·\s*lg\s+(\d+)px\s*·\s*xl\s+(\d+)px\s*·\s*2xl\s+(\d+)px/);
  if (!m) return {};
  return { sm: m[1], md: m[2], lg: m[3], xl: m[4], "2xl": m[5] };
}

describe("escala de radios", () => {
  it("la paleta clásica declara los cinco radios", () => {
    const r = radiosDeLaPaleta();
    expect(Object.keys(r).sort()).toEqual(["2xl", "lg", "md", "sm", "xl"]);
  });

  it("el comentario de @theme trae el renglón con los cinco valores", () => {
    expect(Object.keys(radiosDelComentario())).toHaveLength(5);
  });

  it("el comentario dice exactamente lo que declara la paleta", () => {
    expect(radiosDelComentario()).toEqual(radiosDeLaPaleta());
  });

  it("ningún radio pasa de 8px: el canto afilado es la dirección del sitio", () => {
    for (const [clave, valor] of Object.entries(radiosDeLaPaleta())) {
      expect(Number(valor), `--radius-${clave}`).toBeLessThanOrEqual(8);
    }
  });
});
