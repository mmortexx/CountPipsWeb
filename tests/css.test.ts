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
   * exige que el resultado no sea el mismo. Si alguien rompe la ruta del
   * fichero o retira el comentario que se usa de conejillo, esto se pone
   * rojo en vez de dejar la barrera desarmada en silencio.
   *
   * ── POR QUÉ YA NO EXIGE UN ERROR DE ANÁLISIS ────────────────────────
   * Exigía que `analizar(roto)` devolviera error, y durante un tiempo lo
   * devolvió: «Invalid empty selector». Pero ese error NO lo producía el
   * comentario cerrado en falso — lo producía el desfase que la prosa
   * suelta provocaba en las reglas de MÁS ABAJO, hasta topar por
   * casualidad con una llave donde tocaba un selector. O sea que la
   * garantía dependía de cuántas reglas hubiera detrás y de en qué orden,
   * no del defecto. Al retirar de la hoja unas reglas que no usaba nadie,
   * el desfase pasó a cuadrar y el analizador dejó de protestar: la
   * barrera se desarmó sola sin que cambiara nada de lo que vigila.
   *
   * Lo que SÍ es siempre cierto del defecto —y es exactamente el daño
   * que causó— es que la hoja que llega al navegador YA NO ES LA MISMA.
   * Así que se comprueba eso, que no depende de la suerte: se analiza
   * con recuperación de errores —el modo del compilador de producción,
   * que es quien pasaba en verde— y se exige que lo emitido cambie.
   *
   * Se compara el texto y no su longitud: medido, la hoja rota sale MÁS
   * LARGA (68.643 frente a 66.932), porque la prosa suelta no se pierde
   * sino que se emite como un selector enorme. Un "pesa menos" habría
   * sido una corazonada bonita y falsa.
   */
  it("una hoja con un comentario cerrado en falso no es la misma hoja", () => {
    const roto = CSS.replace(
      "── UN CIERRE DE COMENTARIO DE MÁS DEJÓ AL PAPEL SIN MATERIAL ─────",
      "── UN `*" + "/` DE MÁS DEJÓ AL PAPEL SIN MATERIAL ────────────────",
    );
    expect(
      roto,
      "El texto que esta prueba rompe a propósito ya no está en globals.css: " +
        "sin él, la comprobación de arriba no está demostrando nada.",
    ).not.toEqual(CSS);

    const emitir = (css: string) =>
      transform({
        filename: "globals.css",
        code: Buffer.from(css),
        // Con recuperación: es el modo del compilador de producción, el
        // que dejaba pasar el defecto en verde.
        errorRecovery: true,
      }).code.toString();

    expect(
      emitir(roto),
      "Cerrar un comentario a medias debería cambiar lo que recibe el " +
        "navegador. Si lo emitido es idéntico, este comentario ya no vela " +
        "nada y la prueba de arriba no está demostrando lo que dice.",
    ).not.toEqual(emitir(CSS));
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

/**
 * `:last-of-type` no es «el último hijo».
 *
 * Es «el último de CADA tipo de etiqueta», así que en un contenedor con
 * hijos de tipos distintos casa una vez por tipo. La cinta de acceso a
 * las herramientas —un <span> de etiqueta y ocho <a>— reservaba con esa
 * pseudoclase el hueco del desvanecido del canto derecho, y se lo
 * colgaba también al <span>: 48 px de margen detrás de «Herramientas:»
 * en las ocho páginas, con un hueco de 56 px donde el normal es 8.
 *
 * En esta hoja no hay ningún caso legítimo de `-of-type`: los
 * contenedores del sistema de diseño mezclan tipos de etiqueta a
 * propósito. Si algún día lo hay, esta prueba es el sitio donde
 * justificarlo por escrito antes de añadir la excepción.
 */
describe("nada de :last-of-type donde se quiere decir :last-child", () => {
  it("globals.css no usa pseudoclases -of-type", () => {
    /* Sin los comentarios: el que documenta este mismo arreglo nombra la
       pseudoclase, y una prueba que se dispara con la explicación del
       arreglo en vez de con el arreglo es un falso positivo permanente. */
    const sinComentarios = CSS.replace(/\/\*[\s\S]*?\*\//g, "");
    const usos = [
      ...sinComentarios.matchAll(/:(?:first|last|only|nth)[\w-]*-of-type\b/g),
    ].map((m) => m[0]);
    expect(usos, "casan una vez por tipo de etiqueta, no una sola vez").toEqual(
      [],
    );
  });
});
