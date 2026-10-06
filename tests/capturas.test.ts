import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { LAMINAS_PRODUCTO, ORDEN_LAMINAS } from "@/lib/laminas";

/**
 * El marco de ventana debe medir lo que mide la captura. Si
 * `scripts/capturas.py` cambia el recorte, la imagen sale con franjas vacías
 * y nada avisa; por eso se lee la cabecera binaria de los WEBP servidos y se
 * compara con lo que declara `laminas.ts`, que además cataloga las capturas
 * con su texto alternativo (un fichero renombrado deja una entrada que apunta
 * a un 404).
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
    // `ProductPlate` las pone en el `width`/`height` del `img`: si mienten, la página salta al cargar la imagen.
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
    // Se intercambian con un único `width`/`height`: si la oscura fuera más alta, cambiar de tema movería la página.
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

  it("cada recorte móvil declara las medidas que tiene, en los dos temas", () => {
    // `ProductPlate` las pone en el `<source>` del móvil, cuyo recorte tiene otra
    // proporción que el de escritorio: sin ellas la página salta al llegar la imagen.
    for (const [clave, lamina] of Object.entries(LAMINAS_PRODUCTO)) {
      for (const sufijo of ["-movil", "-oscuro-movil"]) {
        const nombre = lamina.archivo.replace(/\.webp$/, `${sufijo}.webp`);
        const { w, h } = medirWebp(join(DIR, nombre));
        expect(
          `${lamina.anchoMovil}x${lamina.altoMovil}`,
          `«${clave}» declara ${lamina.anchoMovil}×${lamina.altoMovil} para el ` +
            `móvil y ${nombre} mide ${w}×${h}. Actualiza \`anchoMovil\` y ` +
            `\`altoMovil\` en \`laminas.ts\`.`,
        ).toBe(`${w}x${h}`);
      }
    }
  });

  it("cada lámina del catálogo apunta a ficheros que existen, y también su recorte móvil", () => {
    const presentes = new Set(readdirSync(DIR));
    for (const [clave, lamina] of Object.entries(LAMINAS_PRODUCTO)) {
      // El catálogo no declara los derivados: `ProductPlate` los deduce del
      // nombre del de escritorio y, si faltan, no hay error en ninguna parte.
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
