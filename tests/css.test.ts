import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { transform } from "lightningcss";

/**
 * LA HOJA DE ESTILOS SE ANALIZA COMO LA ANALIZA EL NAVEGADOR.
 *
 * `globals.css` son ~5.200 líneas y la mitad son comentarios largos que
 * explican por qué está cada decisión. Ese estilo es deliberado y no se
 * toca, pero trae un riesgo concreto: CSS no tiene comentarios anidados
 * ni forma de escapar nada. La primera secuencia de cierre que aparece
 * dentro de un comentario lo CIERRA, sin importar si iba entre acentos
 * graves, entre comillas o en mitad de una frase.
 *
 * Cuando eso pasa, el resto de la prosa queda suelta en la hoja. El
 * analizador la descarta y en la recuperación se lleva por delante
 * reglas reales — le pasó al bloque `.tj-paper` entero, que desapareció
 * del tema oscuro sin un solo aviso: `bun run build` compilaba en verde
 * y sólo `bun run dev` daba «Invalid empty selector». El síntoma que
 * llegaba era «la web se ve un poco sosa».
 *
 * Y volvió a pasar con el comentario escrito para documentarlo, que
 * citaba la secuencia literalmente. Por eso esto no es una prueba de
 * estilo: es la barrera contra un fallo que ya ha ocurrido dos veces,
 * que compila en verde y que nadie ve hasta que abre el navegador.
 *
 * ── POR QUÉ SE ANALIZA DE VERDAD Y NO SE BUSCAN INDICIOS ──────────────
 * La primera versión de esta prueba buscaba PROSA fuera de comentario:
 * tildes, eñes, guiones largos, filetes de arte ASCII. Cazaba el defecto
 * histórico —señalaba la línea 4103 exacta— y aun así tenía un agujero
 * comprobado: un cierre de comentario al FINAL de una línea, con una
 * frase en ASCII puro detrás, pasaba las tres heurísticas en verde
 * mientras el analizador real fallaba con «Expected identifier in class
 * selector». Una barrera que sólo detecta los fallos que llevan tilde no
 * es una barrera.
 *
 * Y además daba falsos positivos: `.a{}` seguido de un comentario y de
 * `.b{}` EN LA MISMA LÍNEA es CSS legítimo, y la heurística lo marcaba.
 * Habría roto el despliegue por el motivo equivocado.
 *
 * `lightningcss` es el analizador que ya usa Tailwind 4 en este
 * proyecto, así que no añade dependencia. Con `errorRecovery: false`
 * lanza ante CUALQUIER error de análisis, no ante el subconjunto que a
 * uno se le ocurrió enumerar.
 */

const RUTA = join(process.cwd(), "src", "app", "globals.css");
const CSS = readFileSync(RUTA, "utf8");

/** Analiza como lo haría el navegador y devuelve el error, o null. */
function analizar(css: string): string | null {
  try {
    transform({
      filename: "globals.css",
      code: Buffer.from(css),
      // Sin recuperación: lo que el navegador descartaría en silencio,
      // aquí tiene que doler.
      errorRecovery: false,
    });
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

describe("globals.css se analiza como CSS, no como prosa", () => {
  /**
   * Comprobada contra el fallo en las dos formas que ya han ocurrido:
   *
   *  · el defecto histórico — devolver la secuencia de cierre al titular
   *    «UN … DE MÁS DEJÓ AL PAPEL SIN MATERIAL» (línea 4103);
   *  · el agujero de la versión heurística — un cierre al final de línea
   *    con prosa ASCII detrás.
   *
   * Las dos lanzan aquí. Ninguna de las dos lanzaba en la versión que
   * buscaba tildes.
   */
  it("se analiza sin un solo error", () => {
    expect(analizar(CSS), `El analizador rechaza src/app/globals.css`).toBeNull();
  });

  /**
   * La prueba de arriba sólo vale si PUEDE fallar. Aquí se rompe la hoja
   * a propósito, con el defecto exacto que ya ocurrió dos veces, y se
   * exige que el analizador proteste. Si alguien cambia la versión de
   * `lightningcss`, relaja `errorRecovery` o rompe la ruta del fichero,
   * esto se pone rojo en vez de dejar la barrera desarmada en silencio.
   */
  it("el analizador detecta una hoja rota (la prueba puede fallar)", () => {
    const roto = CSS.replace(
      "── UN CIERRE DE COMENTARIO DE MÁS DEJÓ AL PAPEL SIN MATERIAL ─────",
      "── UN `*" + "/` DE MÁS DEJÓ AL PAPEL SIN MATERIAL ────────────────",
    );
    expect(
      roto,
      "El texto que esta prueba rompe a propósito ya no está en globals.css: " +
        "sin él, la comprobación de arriba no está demostrando nada.",
    ).not.toEqual(CSS);
    expect(
      analizar(roto),
      "Con la secuencia de cierre metida en mitad de un comentario, el " +
        "analizador debería rechazar la hoja. Si no lo hace, la prueba de " +
        "arriba no protege nada.",
    ).not.toBeNull();
  });
});

describe("la contención de scroll no vuelve a tragarse la rueda", () => {
  /* Sin comentarios: la prosa de esta hoja CITA los selectores que
     vigila, y con comentarios dentro un regex casaría con la
     explicación en vez de con la regla. */
  const hoja = CSS.replace(/\/\*[\s\S]*?\*\//g, "");

  it("las capas flotantes contienen el scroll (diálogos, menús, cajón, paletas)", () => {
    expect(hoja).toMatch(
      /dialog,\s*\[role="dialog"\],\s*\[role="menu"\]\s*\{\s*overscroll-behavior:\s*contain;\s*\}/
    );
  });

  it("las cajas de scroll horizontal contienen SOLO el eje X", () => {
    expect(hoja).toMatch(
      /\[class\*="overflow-x-auto"\]\s*\{\s*overscroll-behavior-x:\s*contain;\s*\}/
    );
  });

  it("ninguna caja con overflow general vuelve a contener ambos ejes", () => {
    /* La regla que esto prohíbe es la que atrapaba la rueda: toda caja
       con scroll propio «contenía», y en Chromium una tabla con
       overflow-x recibía la rueda vertical, no podía desplazarse en
       ese eje y el gesto moría ahí — medido: 0 px de página por cada
       600 px de rueda sobre la tabla de /pricing. La contención
       pertenece a las capas FLOTANTES; los paneles incorporados a la
       página encadenan el gesto al llegar a su límite. */
    expect(hoja).not.toMatch(
      /\[class\*="overflow-(?:y-auto|auto)"\][^{}]*\{[^}]*overscroll-behavior:\s*contain/
    );
  });
});
