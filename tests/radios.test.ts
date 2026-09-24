import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

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

  /**
   * EL TOPE TAMBIÉN VALE PARA LO QUE SE ESCRIBE A MANO.
   *
   * Las cuatro pruebas de arriba miran las VARIABLES, y por eso no vieron
   * cinco superficies con `rounded-[12px]` puesto directamente en el JSX
   * —la tarjeta de precio, el megamenú, el aviso de cookies, el panel de
   * conversión y la calculadora de riesgo—: pasaban por encima del tope
   * sin tocar ningún token. Una prueba que solo mira la declaración deja
   * fuera justo el sitio por donde se escapa.
   *
   * Solo se vigila el TOPE, no la escala entera: los cantos de 1 y 2 px
   * de la demo son deliberados —replican la ventana de la app de
   * escritorio— y afilar por debajo del sistema nunca fue el problema.
   */
  it("ningún canto escrito a mano en el JSX pasa de 8px", () => {
    const raizSrc = join(import.meta.dirname, "..", "src");
    const excesos: string[] = [];

    const recorrer = (dir: string) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, e.name);
        if (e.isDirectory()) recorrer(p);
        else if (p.endsWith(".tsx") || p.endsWith(".ts")) {
          const texto = readFileSync(p, "utf8");
          texto.split("\n").forEach((linea, i) => {
            for (const m of linea.matchAll(/rounded(?:-[a-z]+)?-\[([0-9.]+)px\]/g)) {
              if (Number(m[1]) > 8) {
                excesos.push(`${relative(raizSrc, p).split(sep).join("/")}:${i + 1} → ${m[0]}`);
              }
            }
          });
        }
      }
    };
    recorrer(raizSrc);

    expect(
      excesos,
      `El sistema declara 8px como tope. Estos cantos se lo saltan a mano:\n  ${excesos.join("\n  ")}`,
    ).toEqual([]);
  });
});
