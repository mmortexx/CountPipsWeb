import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Las reglas del estilo, escritas donde una máquina las puede comprobar.
 *
 * «El registro grabado» tiene cuatro reglas duras que ninguna prueba
 * vigilaba, y las cuatro se habían roto sin que nada avisara:
 *
 *   · CERO DEGRADADOS. Había 45 en globals.css y 67 más en componentes,
 *     incluidos tres radiales de un azul y un violeta que no existen en
 *     ninguna paleta del sitio.
 *   · PAPEL, NO CRISTAL. La decisión se aplicó a `.glass` y a
 *     `.liquid-glass` pero se saltó `.tj-paper`, que es la superficie que
 *     llevan la barra de navegación y el cajón móvil — o sea, la más
 *     visible de las tres.
 *   · UN VALOR, UN SITIO. `.bg-veil` acabó con siete declaraciones y
 *     cuatro valores distintos, dos de ellos muertos, y el resultado neto
 *     era el CONTRARIO del que buscaba el último que las escribió.
 *   · NADA DE INSTRUMENT SERIF, que es una de las tres caras que la
 *     crítica de diseño ficha como delatoras de web hecha en masa.
 *
 * Ninguna de las cuatro la puede cazar el compilador ni el lint: son
 * reglas de estilo, no de sintaxis. Así que se comprueban leyendo el
 * fuente, que es feo pero es lo único que funciona.
 */

const RAIZ = join(import.meta.dirname, "..", "src");
const GLOBALS = join(RAIZ, "app", "globals.css");

/** Todos los ficheros de `src/` con alguna de estas extensiones. */
function ficheros(exts: string[], dir = RAIZ): string[] {
  const salida: string[] = [];
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) salida.push(...ficheros(exts, ruta));
    else if (exts.some((e) => nombre.endsWith(e))) salida.push(ruta);
  }
  return salida;
}

/**
 * Vacía los comentarios conservando los saltos de línea.
 *
 * Sin esto la prueba se dispara con sus propias notas: este proyecto
 * documenta lo que RETIRA tanto como lo que pone —media docena de bloques
 * empiezan por "aquí estaba X y se fue porque…"— y una prueba que confunde
 * la nota necrológica con el difunto obliga a borrar la explicación para
 * ponerse en verde, que es exactamente al revés de lo que interesa.
 *
 * Se sustituye cada carácter del comentario por un espacio en vez de
 * borrarlo, así los números de línea que se reportan siguen siendo los del
 * fichero de verdad.
 */
function soloCodigo(texto: string): string {
  const blancos = (s: string) => s.replace(/[^\n]/g, " ");
  return texto
    .replace(/\/\*[\s\S]*?\*\//g, blancos)
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, antes) => antes + blancos(m.slice(antes.length)));
}

/** `fichero:línea` de cada línea de CÓDIGO que casa, para que el fallo diga DÓNDE. */
function lineasQueCasan(rutas: string[], patron: RegExp): string[] {
  const encontradas: string[] = [];
  for (const ruta of rutas) {
    const rel = ruta.slice(RAIZ.length + 1).replace(/\\/g, "/");
    soloCodigo(readFileSync(ruta, "utf8")).split("\n").forEach((linea, i) => {
      if (patron.test(linea)) encontradas.push(`${rel}:${i + 1}`);
    });
  }
  return encontradas;
}

/** El CSS global sin comentarios: lo que el navegador acaba aplicando. */
function cssAplicado(): string {
  return soloCodigo(readFileSync(GLOBALS, "utf8"));
}

/** Cuerpo de la regla de `.bg-veil` bajo la paleta que el sitio fuerza. */
function reglasDelVelo(): string[] {
  return [...cssAplicado().matchAll(/\[data-palette="clasico"\][^{]*\.bg-veil[^{]*\{([^}]*)\}/g)]
    .map(([, cuerpo]) => cuerpo);
}

describe("cero degradados", () => {
  /* Una máscara NO es un degradado de pintura: recorta, no colorea. Y el
     relleno de la pista de un `input[type=range]` tampoco, aunque use la
     misma función: sus dos paradas caen en el mismo punto, así que son dos
     tramos de tinta plana con un corte, no una transición. */
  const ESMASCARA = /mask|--tw-|@supports/;

  /* LO QUE SE QUEDA, Y POR QUÉ, para que la próxima revisión no lo
     vuelva a contar como infracción:

       · `.page-header-scrim` y `.hero-side-scrim` — velos de
         legibilidad. No pintan densidad decorativa: protegen una lectura
         sobre el dibujo del fondo, y un velo que tiene que dejar de
         existir donde empieza la lámina necesita un sitio donde dejar de
         existir; el corte duro se vería como una costura vertical en
         mitad de la página. Mismo criterio que salva a las máscaras.
       · `.bg-veil` — el desvanecido de 96 px por arriba y por abajo es
         lo que impide que la mancha de la página termine en un canto
         seco contra el papel grabado.
       · `.tj-range` — dos paradas en el mismo punto: corte, no
         transición (ver la nota en globals.css).
       · `.glass` / `.liquid-glass` — la paleta `clasico` los anula
         enteros; el código sigue ahí para las paletas que no se usan.
       · `.demo-card` y `#tj-loader` — viven dentro de la ventana de la
         demo, que replica la aplicación de escritorio. La lámina
         enmarca el producto; no le reescribe el idioma. */

  it("no reaparece ningún degradado de acento, halo o aurora", () => {
    const css = cssAplicado();
    /* Los tres colores que se fueron con `.aurora-bg`: un azul y un
       violeta que no salen de ninguna paleta declarada. Que vuelvan a
       aparecer significa que alguien copió el bloque de vuelta. */
    expect(css, "vuelve un color que no existe en ninguna paleta").not.toMatch(
      /rgb\(\s*(62 124 177|125 107 176)\s*\//,
    );
    /* `.text-gradient` es el realce de medio centenar de titulares. Si
       vuelve a llevar un `background: linear-gradient`, el titular vuelve
       a cambiar de densidad a lo largo de la palabra. */
    const realce = /\.text-gradient\s*\{[^}]*linear-gradient/;
    expect(css, "el realce del titular vuelve a ser un degradado").not.toMatch(realce);
  });

  it("no crece el censo de degradados en los componentes", () => {
    const tsx = ficheros([".tsx", ".ts"]);
    const hallados = lineasQueCasan(tsx, /(linear|radial|conic)-gradient\(/).filter(
      (sitio) => !ESMASCARA.test(sitio),
    );
    /* Número, no lista: los que quedan viven casi todos dentro de la
       ventana de la demo, que replica la aplicación de escritorio y tiene
       su propio idioma — la lámina enmarca el producto, no lo reescribe.
       Lo que esta prueba impide es que la cifra suba sin que nadie lo
       decida. Si baja, se baja el tope aquí y queda constancia. */
    expect(hallados.length, `degradados en componentes:\n${hallados.join("\n")}`)
      .toBeLessThanOrEqual(67);
  });
});

describe("papel, no cristal", () => {
  it("`.tj-paper` no difumina lo que tiene detrás", () => {
    const reglas = [...cssAplicado().matchAll(/(^|\n)([^\n{]*\.tj-paper[^\n{]*)\{([^}]*)\}/g)];
    const conBlur = reglas
      .filter(([, , , cuerpo]) => /backdrop-filter:\s*[^;n]/.test(cuerpo))
      .map(([, , selector]) => selector.trim());
    expect(conBlur, "`.tj-paper` vuelve a ser cristal").toEqual([]);
  });

  it("no queda `will-change: backdrop-filter` sin backdrop-filter que animar", () => {
    expect(cssAplicado()).not.toMatch(/will-change:\s*backdrop-filter/);
  });
});

describe("un valor, un sitio", () => {
  it("el velo de la paleta clásica se declara una sola vez", () => {
    /* Se cuentan los BLOQUES que declaran fondo de `.bg-veil` bajo la
       paleta clásica. Fueron cuatro a la vez, con valores en conflicto y
       dos de ellos muertos por especificidad; el que ganaba se sumaba al
       degradado del otro y el atlas acababa tapado al 97 %. */
    const conFondo = reglasDelVelo().filter((c) => /background(-color|-image)?:/.test(c));
    expect(conFondo.length, "el velo vuelve a declararse en varios sitios").toBe(1);
  });

  it("el velo no pinta color plano Y degradado a la vez", () => {
    const [cuerpo = ""] = reglasDelVelo();
    /* Dos capas translúcidas no se promedian: se multiplican. Si alguien
       vuelve a poner un `background-color` con color junto al degradado,
       la opacidad real deja de ser la que dice el comentario — que es
       literalmente lo que pasó, y por eso existe esta prueba.

       Se compara el VALOR, no un lookahead: `\s*(?!transparent)` casa con
       "background-color: transparent" por retroceso del cuantificador, y
       una prueba que da un falso positivo sobre el arreglo que vigila no
       vigila nada. */
    /* Se miran TODAS las declaraciones de color de la regla, no la
       primera: dentro del mismo bloque había una al 88 % que la de abajo
       anulaba, y una declaración muerta a tres líneas de la viva es
       precisamente cómo empezó este lío. */
    const colores = [...cuerpo.matchAll(/background-color:\s*([^;]+)/g)].map((m) => m[1].trim());
    const color = colores.join(" + ");
    const colorPlano = colores.some((c) => c !== "transparent");
    const imagen = /background-image:\s*linear-gradient/.test(cuerpo);
    expect(colorPlano && imagen, `el velo tiene otra vez dos capas de tinta (${color})`).toBe(false);
  });
});

describe("la tipografía que se descartó", () => {
  it("no vuelve Instrument Serif", () => {
    const todos = [...ficheros([".tsx", ".ts", ".css"])];
    const sitios = lineasQueCasan(todos, /Instrument[\s_]Serif/i);
    expect(sitios, "Instrument Serif ha vuelto al fuente").toEqual([]);
  });
});

describe("lo que se retiró por no usarse", () => {
  it("no vuelven el foco que sigue al cursor ni el barrido de luz", () => {
    const todos = [...ficheros([".tsx", ".ts", ".css"])];
    /* Las dos clases existían con su CSS completo y su componente de
       apoyo, y NINGÚN elemento del sitio las llevaba: `DecorFX` escuchaba
       `pointermove` en las 155 páginas para buscar tarjetas `.tj-spot`
       que no existían. Si vuelven, que sea con algo que las use. */
    const sitios = lineasQueCasan(todos, /tj-spot|tj-cta-sheen|aurora-bg/);
    expect(sitios, "ha vuelto un efecto que nadie aplica").toEqual([]);
  });
});

describe("las láminas del producto", () => {
  /* La regla del fichero es que sólo se describe lo que se ha abierto y
     mirado. Eso una prueba no lo puede comprobar. Lo que SÍ puede es cazar
     las dos formas en que esa regla se rompe sin querer: una captura que
     entra en `public/img/` y nadie describe —cuatro de las ocho llevaban
     así desde el principio, sin que ningún componente las enseñara— y una
     entrada a medio rellenar. */
  it("toda captura de public/img tiene su entrada, y al revés", async () => {
    const { LAMINAS_PRODUCTO } = await import("@/lib/laminas");
    const dir = join(import.meta.dirname, "..", "public", "img");
    /* Cada lámina son CUATRO ficheros: pantalla y detalle, en tema claro y
       en tema oscuro. El catálogo nombra sólo el de escritorio claro y los
       otros tres se derivan de él, así que aquí se comparan quitando los
       sufijos — si no, las variantes oscuras contarían como capturas
       huérfanas. */
    const enDisco = readdirSync(dir)
      .filter((f) => /^app-.*\.webp$/.test(f) && !f.includes("-movil") && !f.includes("-oscuro"))
      .sort();
    const descritas = Object.values(LAMINAS_PRODUCTO).map((l) => l.archivo).sort();
    expect(descritas, "hay capturas sin describir o entradas sin fichero").toEqual(enDisco);
  });

  it("cada lámina trae sus cuatro ficheros: los dos temas y sus dos detalles", async () => {
    const { LAMINAS_PRODUCTO } = await import("@/lib/laminas");
    const dir = join(import.meta.dirname, "..", "public", "img");
    const presentes = new Set(readdirSync(dir));
    const faltan = Object.values(LAMINAS_PRODUCTO)
      .flatMap((l) =>
        ["-movil", "-oscuro", "-oscuro-movil"].map((s) =>
          l.archivo.replace(/\.webp$/, `${s}.webp`),
        ),
      )
      .filter((f) => !presentes.has(f));
    expect(
      faltan,
      "sin estos ficheros la página vuelve a enseñar la captura clara en " +
        "modo oscuro, o la pantalla entera a 390 px",
    ).toEqual([]);
  });

  it("ninguna entrada se queda a medias", async () => {
    const { LAMINAS_PRODUCTO } = await import("@/lib/laminas");
    const campos = [
      "archivo", "roman", "tituloEs", "tituloEn", "notaEs", "notaEn",
      "altEs", "altEn", "detalleEs", "detalleEn",
    ] as const;
    const huecos: string[] = [];
    for (const [clave, l] of Object.entries(LAMINAS_PRODUCTO)) {
      for (const c of campos) {
        const v = (l as unknown as Record<string, string>)[c];
        if (!v || !v.trim()) huecos.push(`${clave}.${c}`);
      }
      /* Un alt que repite el título no describe la imagen: la nombra. Quien
         navega con lector de pantalla se queda sin saber qué hay dentro. */
      if (l.altEs.length < 80) huecos.push(`${clave}.altEs es demasiado corto para describir nada`);
    }
    expect(huecos).toEqual([]);
  });

  it("las capturas ya no llevan el cromo de la ventana recortado por CSS", () => {
    const css = cssAplicado();
    /* El recorte vive en el fichero desde `scripts/capturas.py`. Si vuelve
       el `overflow:hidden` con el margen negativo, vuelve también el
       problema que no arreglaba: el JSON-LD sirviendo las capturas enteras
       con el nombre viejo y el sello de desarrollo dentro. */
    const regla = /\.tj-lamina-ventana\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
    expect(regla, "vuelve el recorte por CSS").not.toMatch(/overflow:\s*hidden/);
  });
});

describe("una sola forma de decir «todavía no»", () => {
  /* El sitio decía «esto aún no existe» de cinco maneras distintas —un chip
     ámbar de aviso, un chip con borde discontinuo, un círculo gris vacío, un
     sufijo en gris terciario junto al precio y una barra de tres columnas—
     sin que ninguna supiera de las otras. Cinco dialectos para un concepto
     obligan al visitante a aprenderlos todos, y ninguno se le queda. */

  it("el sello se usa en los tres sitios donde el estado importa", async () => {
    const usan = ["marketing/Pricing.tsx", "marketing/Changelog.tsx", "beta/BetaStatus.tsx"];
    for (const rel of usan) {
      const src = readFileSync(join(RAIZ, "components", rel), "utf8");
      expect(src, `${rel} ya no usa SelloPrevisto`).toContain("<SelloPrevisto");
    }
  });

  it("lo previsto no se anuncia con color de aviso", () => {
    /* `Chip variant="warn"` es ámbar: el color de "cuidado con esto". Una
       entrega planificada no es una advertencia, y usarlo aquí gasta el
       único color de alarma que le queda al sitio para cuando haga falta. */
    const src = readFileSync(join(RAIZ, "components", "marketing", "Changelog.tsx"), "utf8");
    expect(soloCodigo(src)).not.toMatch(/variant=["']warn["']/);
  });

  it("el trazo del sello es discontinuo, que es donde está el significado", () => {
    const css = cssAplicado();
    const regla = /\.sello-previsto\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
    expect(regla, "el sello ha perdido su línea de trazos").toMatch(/border:[^;]*dashed/);
    /* Y no atenúa lo que envuelve: lo previsto no está deshabilitado. */
    expect(regla).not.toMatch(/opacity:\s*0?\.\d/);
  });
});
