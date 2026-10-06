import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Reglas de estilo del registro grabado que ni el compilador ni el lint
 * pueden cazar, así que se comprueban leyendo el fuente:
 *
 *   · cero degradados de pintura (salvo los velos y máscaras justificados);
 *   · papel, no cristal: `.tj-paper` (barra y cajón móvil) no difumina;
 *   · un valor, un sitio: nada de `.bg-veil` con declaraciones repetidas;
 *   · nada de Instrument Serif.
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
 * Vacía los comentarios conservando los saltos de línea: las notas que
 * documentan lo retirado nombran lo retirado y dispararían la prueba. Cada
 * carácter pasa a espacio para que los números de línea sigan siendo los del
 * fichero.
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

describe("cero degradados", () => {
  // Una máscara recorta, no colorea; y el relleno de `input[type=range]` tiene
  // dos paradas en el mismo punto (tinta plana con un corte, no transición).
  const ESMASCARA = /mask|--tw-|@supports/;

  /* Degradados que se quedan a propósito (no son infracción):
       · `.page-header-scrim` y `.hero-side-scrim`: velos de legibilidad; un
         corte duro se vería como costura.
       · `.bg-veil`: el desvanecido evita un canto seco contra el papel.
       · `.tj-range`: dos paradas en el mismo punto (ver globals.css).
       · `.glass` / `.liquid-glass`: la paleta `clasico` los anula.
       · `.demo-card` y `#tj-loader`: viven en la ventana de la demo, que
         replica la aplicación de escritorio. */

  it("no reaparece ningún degradado de acento, halo o aurora", () => {
    const css = cssAplicado();
    // Colores de `.aurora-bg` que no salen de ninguna paleta declarada.
    expect(css, "vuelve un color que no existe en ninguna paleta").not.toMatch(
      /rgb\(\s*(62 124 177|125 107 176)\s*\//,
    );
  });

  it("no crece el censo de degradados en los componentes", () => {
    const tsx = ficheros([".tsx", ".ts"]);
    const hallados = lineasQueCasan(tsx, /(linear|radial|conic)-gradient\(/).filter(
      (sitio) => !ESMASCARA.test(sitio),
    );
    // Tope numérico: casi todos viven en la ventana de la demo. Impide que
    // la cifra suba sin decidirlo; si baja, se baja el tope.
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

describe("fondo limpio", () => {
  it("no vuelven el atlas de fondo, las pausas de lámina ni los velos que lo compensaban", () => {
    const css = cssAplicado();
    for (const clase of ["tj-engraved-atlas", "tj-interlude", "tj-margin-rules", "tj-luz", "bg-veil {"]) {
      expect(css, `vuelve \`.${clase}\` a globals.css`).not.toContain(`.${clase}`);
    }
    expect(css, "vuelve el grano sobre el body").not.toMatch(/body::before\s*\{/);
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
    // Efectos retirados por no llevarlos ningún elemento: si vuelven, que sea con algo que los use.
    const sitios = lineasQueCasan(todos, /tj-spot|tj-cta-sheen|aurora-bg/);
    expect(sitios, "ha vuelto un efecto que nadie aplica").toEqual([]);
  });
});

describe("las láminas del producto", () => {
  // Solo se describe lo que se ha abierto y mirado (eso no lo comprueba una
  // prueba); sí se cazan una captura sin describir y una entrada a medias.
  it("toda captura de public/img tiene su entrada, y al revés", async () => {
    const { LAMINAS_PRODUCTO } = await import("@/lib/laminas");
    const dir = join(import.meta.dirname, "..", "public", "img");
    // Cada lámina son cuatro ficheros (pantalla y detalle, claro y oscuro); el
    // catálogo nombra el de escritorio claro, así que se quitan los sufijos.
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
      // Un alt que repite el título nombra la imagen pero no la describe.
      if (l.altEs.length < 80) huecos.push(`${clave}.altEs es demasiado corto para describir nada`);
    }
    expect(huecos).toEqual([]);
  });

  it("las capturas ya no llevan el cromo de la ventana recortado por CSS", () => {
    const css = cssAplicado();
    // El recorte vive en el fichero (`scripts/capturas.py`); el recorte por CSS dejaba el JSON-LD con la captura entera.
    const regla = /\.tj-lamina-ventana\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
    expect(regla, "vuelve el recorte por CSS").not.toMatch(/overflow:\s*hidden/);
  });
});

describe("una sola forma de decir «todavía no»", () => {
  // «Todavía no» se dice con un solo componente, `SelloPrevisto`.

  it("el sello se usa en los tres sitios donde el estado importa", async () => {
    const usan = ["marketing/Pricing.tsx", "marketing/Changelog.tsx", "beta/BetaStatus.tsx"];
    for (const rel of usan) {
      const src = readFileSync(join(RAIZ, "components", rel), "utf8");
      expect(src, `${rel} ya no usa SelloPrevisto`).toContain("<SelloPrevisto");
    }
  });

  it("lo previsto no se anuncia con color de aviso", () => {
    // `Chip variant="warn"` es ámbar, el único color de alarma del sitio: una entrega planificada no es una advertencia.
    const src = readFileSync(join(RAIZ, "components", "marketing", "Changelog.tsx"), "utf8");
    expect(soloCodigo(src)).not.toMatch(/variant=["']warn["']/);
  });

  it("el sello tiene tinta propia y no atenúa lo que envuelve", () => {
    // El sello es texto, no una placa: se distingue por su tinta, no por un marco.
    const css = cssAplicado();
    const regla = /\.sello-previsto\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
    expect(regla, "el sello ha perdido su tinta").toMatch(/color:/);
    /* Lo previsto no está deshabilitado. */
    expect(regla).not.toMatch(/opacity:\s*0?\.\d/);
  });
});
