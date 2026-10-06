import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { transform } from "lightningcss";

/**
 * CSS no anida comentarios: la primera secuencia de cierre dentro de uno lo
 * cierra, aunque vaya entre acentos graves o comillas, y al recuperarse el
 * analizador se lleva reglas reales (pasó con `.tj-paper`) con el build en
 * verde. Se analiza con `lightningcss` y `errorRecovery: false` en vez de
 * buscar prosa suelta: esa heurística dejaba pasar casos y daba falsos
 * positivos con `.a{}` y `.b{}` en la misma línea.
 */

const RUTA = join(process.cwd(), "src", "app", "globals.css");
const CSS = readFileSync(RUTA, "utf8");

/** Todos los .tsx/.ts de `src`, para cruzar declaraciones con usos. */
function ficherosTsx(): string[] {
  const salida: string[] = [];
  const recorrer = (dir: string) => {
    for (const e of readdirSync(dir)) {
      const p = join(dir, e);
      if (statSync(p).isDirectory()) recorrer(p);
      else if (e.endsWith(".tsx") || e.endsWith(".ts")) salida.push(p);
    }
  };
  recorrer(join(process.cwd(), "src"));
  return salida;
}


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
  it("se analiza sin un solo error", () => {
    expect(analizar(CSS), `El analizador rechaza src/app/globals.css`).toBeNull();
  });

  /**
   * Prueba que la de arriba puede fallar: rompe la hoja a propósito con un
   * cierre de comentario en falso y exige que algo cambie; si se pierde el
   * texto conejillo, se pone roja. No exige un error concreto (según las reglas
   * de más abajo la prosa suelta puede analizarse sin error) y compara el texto
   * emitido, no su longitud.
   */
  it("una hoja con un comentario cerrado en falso no es la misma hoja", () => {
    const roto = CSS.replace(
      "Con el dedo, 44 px: decide quién apunta",
      "Con el dedo, `*" + "/` 44 px: decide quién apunta",
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
        // Con recuperación: es el modo del compilador de producción.
        errorRecovery: true,
      }).code.toString();

    // Se exige uno de los dos síntomas (error estricto o emisión distinta):
    // cuál aparece depende de dónde caiga el desfase y cambia al tocar la hoja.
    const protesta = analizar(roto);
    const emiteDistinto = emitir(roto) !== emitir(CSS);

    expect(
      protesta !== null || emiteDistinto,
      "Cerrar un comentario a medias debería o hacer protestar al " +
        "analizador estricto o cambiar lo que emite el compilador de " +
        "producción. No hace ninguna de las dos: este comentario ya no " +
        "vela nada y la prueba de arriba no está demostrando lo que dice.",
    ).toBe(true);
  });
});

describe("la contención de scroll no vuelve a tragarse la rueda", () => {
  // Sin comentarios: la prosa de la hoja cita estos selectores y el regex
  // casaría con la explicación en vez de con la regla.
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
    // Contener ambos ejes atrapaba la rueda vertical sobre una tabla con
    // overflow-x. La contención es solo de las capas flotantes.
    expect(hoja).not.toMatch(
      /\[class\*="overflow-(?:y-auto|auto)"\][^{}]*\{[^}]*overscroll-behavior:\s*contain/
    );
  });
});

/**
 * Un `:has()` colgado de la raíz que baja a los descendientes (por ejemplo
 * `html[lang="en"]:has(...) body`) hace que Chrome invalide el estilo del
 * documento entero a cada nodo insertado. `html:has(x)` a secas solo
 * recalcula `<html>`.
 */
const COMPUESTO_RAIZ = /^(?:html|:root)(?:\[[^\]]*\]|\.[\w-]+|:[\w-]+(?:\((?:[^()]|\([^()]*\))*\))?)*/;

function partirComas(lista: string): string[] {
  const partes: string[] = [];
  let hondo = 0;
  let desde = 0;
  for (let i = 0; i < lista.length; i++) {
    const c = lista[i];
    if (c === "(" || c === "[") hondo++;
    else if (c === ")" || c === "]") hondo--;
    else if (c === "," && hondo === 0) {
      partes.push(lista.slice(desde, i).trim());
      desde = i + 1;
    }
  }
  partes.push(lista.slice(desde).trim());
  return partes;
}

function selectoresDeRaizConHas(css: string): { todos: string[]; bajan: string[] } {
  const plano = transform({ filename: "globals.css", code: Buffer.from(css), minify: true, errorRecovery: true }).code.toString();
  const selectores = [...plano.matchAll(/(?:^|[{};])([^{}@;]+)\{/g)].flatMap((m) => partirComas(m[1]));
  const todos = selectores.filter((s) => COMPUESTO_RAIZ.exec(s)?.[0].includes(":has("));
  const bajan = todos.filter((s) => /^[ >+~]/.test(s.slice(COMPUESTO_RAIZ.exec(s)![0].length)));
  return { todos, bajan };
}

describe("ningún :has() de la raíz obliga a recalcular la página entera", () => {
  it("globals.css no cuelga descendientes de un :has() de html o :root", () => {
    const { todos, bajan } = selectoresDeRaizConHas(CSS);
    expect(todos.length, "no encuentra ni los :has() de raíz legítimos: la prueba no está mirando").toBeGreaterThan(0);
    expect(bajan).toEqual([]);
  });

  it("caza la regla que costaba fotogramas en inglés", () => {
    const { bajan } = selectoresDeRaizConHas(`${CSS}\nhtml[lang="en"]:has([data-tj-404="es"]) body{visibility:hidden}`);
    expect(bajan).toEqual(["html[lang=en]:has([data-tj-404=es]) body"]);
  });
});

/**
 * `:last-of-type` es «el último de cada tipo de etiqueta», no «el último
 * hijo»: en contenedores con tipos mezclados casa una vez por tipo (daba 48 px
 * de margen de más tras «Herramientas:»). No hay ningún caso legítimo de
 * `-of-type` en la hoja; si lo hubiera, se justifica aquí.
 */
describe("nada de :last-of-type donde se quiere decir :last-child", () => {
  it("globals.css no usa pseudoclases -of-type", () => {
    // Sin comentarios: el que documenta el arreglo nombra la pseudoclase.
    const sinComentarios = CSS.replace(/\/\*[\s\S]*?\*\//g, "");
    const usos = [
      ...sinComentarios.matchAll(/:(?:first|last|only|nth)[\w-]*-of-type\b/g),
    ].map((m) => m[0]);
    expect(usos, "casan una vez por tipo de etiqueta, no una sola vez").toEqual(
      [],
    );
  });
});

/**
 * Una clase declarada que no lleva nadie es peso muerto y documentación que
 * miente. Se comprueba contra el código fuente y no contra `out/`, porque en
 * integración continua las pruebas corren antes del build.
 */
describe("no se acumulan clases que no lleva nadie", () => {
  /** Clases declaradas a propósito sin usar todavía, con su motivo. */
  const GANCHOS: Record<string, string> = {
    "tj-no-print":
      "gancho de la hoja de impresión: marca lo que no debe salir en " +
      "papel. Está para poder usarlo desde cualquier componente sin " +
      "tocar el CSS, y su coste es una línea dentro de una lista que ya " +
      "existe.",
  };

  it("toda clase de globals.css aparece en algún componente", () => {
    // Fuera comentarios, cadenas y `url(...)` antes de extraer nombres: un
    // SVG embebido contiene `www.w3.org` y daría las clases `.w3` y `.org`.
    const hoja = CSS.replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/url\([^)]*\)/g, "")
      .replace(/"[^"]*"/g, '""')
      .replace(/'[^']*'/g, "''");
    // Dos formas de declarar una clase: `.nombre` y `@utility nombre` (Tailwind
    // v4), que también emite `.nombre` en el CSS publicado.
    const declaradas = [
      ...new Set([
        ...[...hoja.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]),
        ...[...hoja.matchAll(/@utility\s+([a-zA-Z][\w-]*)/g)].map((m) => m[1]),
      ]),
    ].sort();

    const fuente = ficherosTsx()
      .map((f) => readFileSync(f, "utf8"))
      .join("\n")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/.*$/gm, "$1");

    const muertas = declaradas.filter((c) => {
      if (GANCHOS[c]) return false;
      // Barras dobles: en una plantilla, `\w` simple se evalúa como la letra `w`.
      return !new RegExp(`(?<![\\w-])${c}(?![\\w-])`).test(fuente);
    });

    expect(
      muertas,
      "Clases declaradas que no lleva ningún componente. Quítalas de " +
        "globals.css (con su comentario), o apúntalas en GANCHOS con el " +
        "motivo por el que se quedan.",
    ).toEqual([]);
  });

  it("la lista de ganchos no protege clases que ya no se declaran", () => {
    const hoja = CSS.replace(/\/\*[\s\S]*?\*\//g, "");
    const huerfanos = Object.keys(GANCHOS).filter(
      (c) => !new RegExp(`(\\.|@utility\\s+)${c}(?![\\w-])`).test(hoja),
    );
    expect(huerfanos, "ganchos que ya no apuntan a ninguna regla").toEqual([]);
  });
});
