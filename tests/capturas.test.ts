import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { LAMINAS_PRODUCTO, ORDEN_LAMINAS } from "@/lib/laminas";

/**
 * EL MARCO DE VENTANA TIENE QUE MEDIR LO QUE MIDE LA CAPTURA.
 *
 * ── El fallo que cierra ───────────────────────────────────────────────
 * Un componente fijaba la proporción de la captura a mano y su comentario
 * afirmaba que era «el tamaño real». Lo fue, hasta que
 * `scripts/capturas.py` cambió el recorte dentro del propio fichero: la
 * imagen salía con franjas vacías dentro de un marco cuya razón de existir
 * era que se leyera entera. Nada falla, nada avisa, y sólo se ve mirando
 * la página con atención.
 *
 * Un número afirmado en un comentario deja de ser documentación en cuanto
 * lo decide otro fichero. Así que esto no lee comentarios ni componentes:
 * lee la cabecera binaria de los WEBP servidos y la compara con lo que
 * declara el catálogo.
 *
 * ── Y de paso, el catálogo ────────────────────────────────────────────
 * `laminas.ts` cataloga las capturas con su texto alternativo. Un fichero
 * que se renombre o desaparezca deja ahí una entrada que apunta a un 404
 * — y una imagen rota en la página no la ve nadie hasta que la ve un
 * visitante.
 */

const RAIZ = process.cwd();
const DIR = join(RAIZ, "public", "img");

/** Alto y ancho de un WEBP, leídos de su cabecera. */
function medirWebp(ruta: string): { w: number; h: number } {
  const b = readFileSync(ruta);
  if (b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WEBP") {
    throw new Error(`${ruta} no es un WEBP`);
  }
  const formato = b.toString("ascii", 12, 16);
  if (formato === "VP8X") {
    return { w: (b.readUIntLE(24, 3) & 0xffffff) + 1, h: (b.readUIntLE(27, 3) & 0xffffff) + 1 };
  }
  if (formato === "VP8 ") {
    return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  }
  if (formato === "VP8L") {
    const bits = b.readUInt32LE(21);
    return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
  }
  throw new Error(`${ruta}: formato WEBP desconocido (${formato})`);
}

/** Las capturas de escritorio: `app-*.webp` sin el sufijo del recorte móvil. */
const ESCRITORIO = readdirSync(DIR)
  .filter((n) => /^app-.*\.webp$/.test(n) && !n.endsWith("-movil.webp"))
  .sort();

describe("las capturas de la app y el marco que las enseña", () => {
  it("hay capturas que comprobar", () => {
    expect(
      ESCRITORIO.length,
      "No hay ninguna `public/img/app-*.webp`. Sin ficheros, el resto de " +
        "esta suite pasaría en verde sin mirar nada.",
    ).toBeGreaterThan(0);
  });

  it("cada lámina declara las medidas que de verdad tiene su fichero", () => {
    /* `ProductPlate` pone esas dos cifras en el `width`/`height` del `img`.
       Si mienten, el navegador reserva un hueco de un tamaño y luego pinta
       otro: la página da un salto al cargar la imagen, y nada avisa. */
    for (const [clave, lamina] of Object.entries(LAMINAS_PRODUCTO)) {
      const { w, h } = medirWebp(join(DIR, lamina.archivo));
      expect(
        `${lamina.ancho}x${lamina.alto}`,
        `«${clave}» declara ${lamina.ancho}×${lamina.alto} y ` +
          `${lamina.archivo} mide ${w}×${h}. Las medidas salen de ` +
          `\`scripts/capturas.py\`: si el recorte ha cambiado, hay que ` +
          `actualizar la entrada en \`laminas.ts\`.`,
      ).toBe(`${w}x${h}`);
    }
  });

  it("las dos variantes de tema de una lámina miden lo mismo", () => {
    /* Se intercambian en el sitio con un único `width`/`height` declarado.
       Si la oscura fuera más alta, cambiar de tema movería la página. */
    for (const [clave, lamina] of Object.entries(LAMINAS_PRODUCTO)) {
      const claro = medirWebp(join(DIR, lamina.archivo));
      const oscuro = medirWebp(join(DIR, lamina.archivo.replace(/\.webp$/, "-oscuro.webp")));
      expect(
        `${oscuro.w}x${oscuro.h}`,
        `«${clave}»: la captura clara mide ${claro.w}×${claro.h} y la oscura ` +
          `${oscuro.w}×${oscuro.h}. Las dos tienen que capturarse con la ` +
          `misma ventana.`,
      ).toBe(`${claro.w}x${claro.h}`);
    }
  });

  it("cada lámina del catálogo apunta a ficheros que existen, y también su recorte móvil", () => {
    const presentes = new Set(readdirSync(DIR));
    for (const [clave, lamina] of Object.entries(LAMINAS_PRODUCTO)) {
      /* El recorte móvil no está declarado en el catálogo: `ProductPlate`
         lo deriva del nombre del de escritorio. Un derivado que no exista
         no da error en ninguna parte — el navegador se queda con la
         imagen de escritorio o con nada, según el `srcSet`. */
      const derivados = ["-movil", "-oscuro", "-oscuro-movil"].map((s) =>
        lamina.archivo.replace(/\.webp$/, `${s}.webp`),
      );
      for (const nombre of [lamina.archivo, ...derivados]) {
        expect(
          presentes.has(nombre),
          `«${clave}» necesita public/img/${nombre} y no está. Se genera con ` +
            `\`python scripts/capturas.py\` a partir de ` +
            `assets/capturas-originales/.`,
        ).toBe(true);
      }
    }
  });

  it("el orden de las láminas nombra exactamente las que existen", () => {
    expect(
      [...ORDEN_LAMINAS].sort(),
      "`ORDEN_LAMINAS` y `LAMINAS_PRODUCTO` han dejado de coincidir: o hay " +
        "una lámina catalogada que no se enseña en ninguna parte, o el orden " +
        "nombra una que ya no existe.",
    ).toEqual(Object.keys(LAMINAS_PRODUCTO).sort());
  });

  it("ninguna lámina se queda sin texto alternativo en alguno de los dos idiomas", () => {
    for (const [clave, lamina] of Object.entries(LAMINAS_PRODUCTO)) {
      expect(lamina.altEs.trim().length, `«${clave}» sin alt en español`).toBeGreaterThan(20);
      expect(lamina.altEn.trim().length, `«${clave}» sin alt en inglés`).toBeGreaterThan(20);
    }
  });
});
