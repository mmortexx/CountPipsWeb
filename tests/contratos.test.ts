import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { STR } from "@/lib/i18n";
import { LOCALIZED_PATHS } from "@/lib/locale";

/**
 * Contratos que atraviesan varios ficheros y que ninguna comprobación de
 * tipos puede vigilar: la paridad entre los dos idiomas, la
 * correspondencia entre las rutas declaradas y las que existen de verdad,
 * y el nombre de un campo que un lado escribe y el otro lee.
 *
 * El último parece trivial hasta que pasa: el formulario de acceso
 * anticipado enviaba su campo trampa como `botcheck` y el Worker leía
 * `payload.honeypot`. La comprobación antibot no se disparó ni una sola
 * vez desde el día que se escribió, y figuraba en la política de
 * privacidad como una medida que existía.
 */

const RAIZ = join(import.meta.dirname, "..");
const leer = (rel: string) => readFileSync(join(RAIZ, rel), "utf8");

/**
 * Devuelve el fichero SIN comentarios.
 *
 * Hace falta de verdad: estas pruebas afirman cosas como "el Worker ya no
 * lee `payload.honeypot`", y el propio código lleva un comentario largo
 * explicando que antes lo leía. Sin quitar los comentarios, la prueba se
 * dispara con la explicación del arreglo en vez de con el arreglo, que es
 * exactamente el falso positivo que la haría inútil.
 */
function sinComentarios(fuente: string): string {
  return fuente
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}
const leerCodigo = (rel: string) => sinComentarios(leer(rel));

describe("paridad español / inglés", () => {
  it("toda clave de texto tiene las dos versiones, y ninguna vacía", () => {
    const huecos: string[] = [];
    for (const [clave, valor] of Object.entries(STR)) {
      const v = valor as Record<string, unknown>;
      for (const idioma of ["es", "en"] as const) {
        const t = v[idioma];
        if (t === undefined || t === null) huecos.push(`${clave}.${idioma} falta`);
        else if (typeof t === "string" && t.trim() === "") huecos.push(`${clave}.${idioma} vacía`);
      }
    }
    expect(huecos).toEqual([]);
  });

  it("ninguna traducción inglesa es una copia literal de la española", () => {
    // Salvo las que legítimamente coinciden: nombres propios, siglas y
    // términos que en trading no se traducen.
    const IGUALES_A_PROPOSITO = new Set([
      "appName",
      "navDemo",
      "navFaq",
      "core",
      "pro",
    ]);
    const sospechosas: string[] = [];
    for (const [clave, valor] of Object.entries(STR)) {
      if (IGUALES_A_PROPOSITO.has(clave)) continue;
      const v = valor as Record<string, unknown>;
      if (typeof v.es !== "string" || typeof v.en !== "string") continue;
      // Una frase larga idéntica en los dos idiomas es casi siempre una
      // traducción que se dejó a medias. Las palabras sueltas no: "Demo",
      // "Prop firms" o "Sharpe" se escriben igual.
      if (v.es === v.en && v.es.trim().split(/\s+/).length >= 4) {
        sospechosas.push(`${clave}: "${v.es}"`);
      }
    }
    expect(sospechosas).toEqual([]);
  });
});

describe("rutas declaradas frente a rutas reales", () => {
  /** Rutas que Next genera de verdad a partir de `src/app`. */
  function rutasDeApp(): Set<string> {
    const base = join(RAIZ, "src", "app");
    const out = new Set<string>();
    const recorrer = (dir: string, ruta: string) => {
      for (const nombre of readdirSync(dir)) {
        const p = join(dir, nombre);
        if (!statSync(p).isDirectory()) continue;
        // Los segmentos dinámicos no son rutas fijas comparables.
        if (nombre.startsWith("[") || nombre.startsWith("(")) continue;
        const hijo = `${ruta}/${nombre}`;
        try {
          statSync(join(p, "page.tsx"));
          out.add(hijo);
        } catch {
          /* carpeta sin página propia: sólo agrupa */
        }
        recorrer(p, hijo);
      }
    };
    recorrer(base, "");
    out.add("/");
    return out;
  }

  it("toda ruta fija con versión inglesa declarada existe en español", () => {
    const reales = rutasDeApp();
    // Las rutas derivadas de datos (glosario, herramientas) llevan
    // segmento dinámico y no aparecen como carpeta: se filtran.
    const fijas = LOCALIZED_PATHS.filter(
      (p) => !p.startsWith("/glosario/") && !p.startsWith("/herramientas/")
    );
    const ausentes = fijas.filter((p) => !reales.has(p === "/" ? "/" : p));
    expect(ausentes).toEqual([]);
  });

  it("toda ruta fija declarada tiene su carpeta bajo /en", () => {
    const reales = rutasDeApp();
    const fijas = LOCALIZED_PATHS.filter(
      (p) => !p.startsWith("/glosario/") && !p.startsWith("/herramientas/")
    );
    const ausentes = fijas
      .map((p) => (p === "/" ? "/en" : `/en${p}`))
      .filter((p) => !reales.has(p));
    expect(ausentes).toEqual([]);
  });
});

describe("contrato del formulario de acceso anticipado", () => {
  const worker = leerCodigo("services/beta-api/src/worker.js");
  const forms = leerCodigo("src/lib/forms.ts");
  const formulario = leerCodigo("src/components/beta/BetaApplication.tsx");

  it("EL FALLO QUE HUBO: el Worker lee el mismo campo trampa que envía el cliente", () => {
    // El cliente lo llama `botcheck` en los tres sitios donde aparece.
    expect(forms).toMatch(/\bbotcheck\b/);
    expect(formulario).toMatch(/\bbotcheck\b/);
    // Y el Worker tiene que leer ESE, no otro.
    expect(worker).toMatch(/payload\.botcheck\b/);
    expect(worker).not.toMatch(/payload\.honeypot\b/);
  });

  it("el límite de peticiones no se desactiva solo si falta su almacén", () => {
    // Devolvía `true` —puerta abierta— cuando el binding KV no estaba
    // configurado, y hoy no lo está. Ahora sólo se salta si el propio
    // despliegue lo pide a propósito, y el rechazo lleva un código que
    // dice «mal configurado», no «demasiadas peticiones».
    expect(worker).toMatch(/RATE_LIMIT_OPTIONAL/);
    expect(worker).not.toMatch(/if \(!env\.RATE_LIMIT\) return true;/);
    expect(worker).toMatch(/service_misconfigured/);
  });

  it("consulta la cuota antes de Turnstile, pero la descuenta después", () => {
    /* Las dos mitades importan y por motivos distintos:
       — consultar antes evita gastar una llamada de red a Cloudflare en
         quien ya ha superado su límite;
       — descontar después evita que un fallo anti-bot queme el intento y
         deje al solicitante con un «demasiadas peticiones» que no
         describe lo que pasó.
       Estuvieron juntas en una sola función y el segundo efecto era un
       callejón sin salida. `await nombre(` sólo aparece en las LLAMADAS:
       las definiciones son `async function nombre(`. */
    const iConsulta = worker.indexOf("await rateLimitDisponible(");
    const iTurnstile = worker.indexOf("await verifyTurnstile(");
    const iConsumo = worker.indexOf("await consumirCuota(");
    expect(iConsulta).toBeGreaterThan(-1);
    expect(iTurnstile).toBeGreaterThan(-1);
    expect(iConsumo).toBeGreaterThan(-1);
    expect(iConsulta).toBeLessThan(iTurnstile);
    expect(iTurnstile).toBeLessThan(iConsumo);
  });
});

describe("analítica y consentimiento", () => {
  const posthog = leerCodigo("src/components/analytics/PostHog.tsx");
  const legal = leer("src/lib/legal/documentos.ts");

  it("no se activa la grabación de sesión, que la política no declara", () => {
    expect(posthog).toMatch(/disable_session_recording:\s*true/);
  });

  it("no se escriben cookies: la política afirma que no hay ninguna", () => {
    // `documentos.ts` dice literalmente que ninguna de las claves
    // guardadas es una cookie. Si alguien devuelve la persistencia a
    // "localStorage+cookie", esa afirmación pasa a ser falsa.
    expect(posthog).not.toMatch(/persistence:\s*"[^"]*cookie/);
    expect(legal).toMatch(/NINGUNA es una cookie|ninguna es una cookie/i);
  });

  it("la clave de consentimiento no está repetida a mano por ahí", () => {
    // Vivía escrita como literal en tres módulos. Con copias, retirar el
    // consentimiento en un sitio dejaba los otros leyendo el valor viejo.
    const copias = ["src/components/analytics/PostHog.tsx", "src/lib/analytics.ts"]
      .filter((f) => leerCodigo(f).includes('"tj-cookie-consent"'));
    expect(copias).toEqual([]);
  });
});

/**
 * El ancho del título en el buscador.
 *
 * El patrón «{término}: qué es y por qué importa — CountPips» cuesta 41
 * caracteres fijos. Con 51 voces en dos idiomas, basta una cuyo nombre
 * traiga la expansión dentro —«MAE (Maximum Adverse Excursion)»— para que
 * el título salga de 76 caracteres y Google lo corte a mitad de la
 * promesa. Eran cuatro de las 155 páginas del sitio, y las únicas cuatro
 * que se pasaban.
 *
 * Esto no lo puede vigilar el humo, que sólo recorre doce rutas y ninguna
 * del glosario: hay que mirar las 102 páginas generadas, y eso se hace
 * aquí, sin navegador.
 */
describe("los títulos del glosario caben en el buscador", () => {
  it("ninguna de las 102 páginas pasa de 60 caracteres", async () => {
    const { TERMINOS, tituloDeTermino, LARGO_MAXIMO_TITULO } = await import("@/lib/glosario");
    const largos: string[] = [];
    for (const t of TERMINOS) {
      for (const lang of ["es", "en"] as const) {
        const completo = `${tituloDeTermino(t.term, lang)} — CountPips`;
        if (completo.length > LARGO_MAXIMO_TITULO) {
          largos.push(`[${lang}] ${completo} (${completo.length})`);
        }
      }
    }
    expect(largos, "hay títulos que el buscador va a cortar").toEqual([]);
  });

  it("el título sigue diciendo «qué es», que es como se busca", async () => {
    const { TERMINOS, tituloDeTermino } = await import("@/lib/glosario");
    /* El recorte no puede llevarse por delante la intención: si un día el
       ajuste automático deja los 51 títulos en el término pelado, el
       buscador deja de encontrarlos por la pregunta que la gente teclea. */
    const conPregunta = TERMINOS.filter((t) => tituloDeTermino(t.term, "es").includes("qué es"));
    expect(conPregunta.length / TERMINOS.length).toBeGreaterThan(0.95);
  });

  it("cuando recorta, conserva la sigla y no la expansión", async () => {
    const { tituloDeTermino } = await import("@/lib/glosario");
    const mae = tituloDeTermino("MAE (Maximum Adverse Excursion)", "en");
    expect(mae.startsWith("MAE")).toBe(true);
    expect(mae).not.toContain("Maximum Adverse Excursion");
  });
});

describe("el precio es el mismo en todas partes", () => {
  /**
   * ── Por qué esta prueba y no interpolar la cifra en cada texto ────────
   * Las dos cifras aparecen en trece archivos, y en la mayoría van
   * DENTRO de una frase: «Core $149 y Pro $249 son precios de
   * lanzamiento previstos», la respuesta de una FAQ, la descripción de
   * una calculadora, un metadato para el buscador. Sustituirlas por
   * `${PRECIO_CORE}` deja los textos ilegibles en el código y, con
   * ellos, la revisión de copy — que es humana y se hace leyendo.
   *
   * El riesgo, en cambio, es real y es el peor de su clase: el precio es
   * el número más comprobable del sitio, porque cualquiera puede abrir
   * dos páginas y compararlas. Trece copias es la clase de cosa que se
   * desincroniza el día que se retoca una y se olvidan doce.
   *
   * Así que el texto se queda como está y lo que se ata es la
   * COHERENCIA: cualquier cifra de tres dígitos precedida de `$` en el
   * código fuente tiene que ser uno de los dos precios declarados. Si
   * mañana Core pasa a 179 y alguien cambia sólo `precios.ts`, las doce
   * frases que sigan diciendo 149 hacen fallar esto con su ruta y su
   * línea delante.
   */
  it("no hay ninguna cifra en dólares que no sea un precio declarado", async () => {
    const { PRECIO_CORE, PRECIO_PRO } = await import("@/lib/precios");
    const permitidos = new Set([String(PRECIO_CORE), String(PRECIO_PRO)]);

    /* Se recorren los mismos archivos que compila el sitio. Los `.ts` de
       datos entran igual que los componentes: `herramientas.ts` y
       `legal/documentos.ts` también citan el precio. */
    const fuentes: string[] = [];
    const recorrer = (dir: string) => {
      for (const entrada of readdirSync(join(RAIZ, dir))) {
        const rel = `${dir}/${entrada}`;
        if (statSync(join(RAIZ, rel)).isDirectory()) recorrer(rel);
        else if (/\.(ts|tsx)$/.test(entrada)) fuentes.push(rel);
      }
    };
    recorrer("src");

    const sueltas: string[] = [];
    for (const rel of fuentes) {
      if (rel.endsWith("/precios.ts")) continue;
      // Sin comentarios: las notas explican de dónde VENÍA un precio, y
      // una prueba que confunde la nota con el dato obliga a borrar la
      // explicación para ponerse en verde.
      const lineas = sinComentarios(leer(rel)).split("\n");
      lineas.forEach((linea, i) => {
        for (const m of linea.matchAll(/\$(\d{3})\b/g)) {
          if (!permitidos.has(m[1])) sueltas.push(`${rel}:${i + 1} → $${m[1]}`);
        }
      });
    }
    expect(
      sueltas,
      `cifras en dólares que no son ${PRECIO_CORE} ni ${PRECIO_PRO}`,
    ).toEqual([]);
  });

  it("las dos cifras siguen apareciendo en la tabla de precios", async () => {
    /* La comprobación de arriba pasa sola si un día NADIE menciona un
       precio: cero cifras sueltas es cero fallos. Esto exige que la
       página que existe para decir el precio siga diciéndolo. */
    const { PRECIO_CORE, PRECIO_PRO } = await import("@/lib/precios");
    const tabla = leerCodigo("src/components/marketing/Pricing.tsx");
    expect(tabla).toContain("PRECIO_CORE");
    expect(tabla).toContain("PRECIO_PRO");
    expect(PRECIO_PRO).toBeGreaterThan(PRECIO_CORE);
  });
});

describe("lo que se le dice al buscador es lo que dice la página", () => {
  /**
   * El fallo que trajo estas pruebas: las trece preguntas frecuentes
   * estaban escritas dos veces —una en el acordeón que se ve, otra a mano
   * en el `FAQPage` de datos estructurados— y habían divergido. A «¿Qué
   * métodos de pago aceptáis?» la página respondía lo cierto (la compra
   * se abrirá más adelante, el acceso anticipado no es una preventa)
   * mientras el marcado le declaraba a Google «Tarjeta de crédito/débito
   * y PayPal. Emitimos factura con IVA si procede.».
   *
   * Es la peor forma del fallo: mirando la página no se ve, porque la
   * afirmación falsa sólo existe en el canal que la publica en los
   * resultados de búsqueda. Doce de las trece respuestas declaradas no
   * existían en la página.
   */
  const PAGINAS_FAQ = [
    "src/app/faq/page.tsx",
    "src/app/en/faq/page.tsx",
    "src/app/pricing/page.tsx",
    "src/app/en/pricing/page.tsx",
  ];

  it("ninguna respuesta del buscador se escribe a mano en la página", () => {
    /* `acceptedAnswer` a mano en estos cuatro ficheros es exactamente la
       forma que tenía el fallo: una segunda copia que nadie compara con
       la primera. Deben construirlo con `jsonLdFaq()` a partir de la
       misma lista que pinta el acordeón. */
    const aMano = PAGINAS_FAQ.filter((rel) =>
      leerCodigo(rel).includes("acceptedAnswer"),
    );
    expect(aMano, "vuelven a declarar respuestas por su cuenta").toEqual([]);

    for (const rel of PAGINAS_FAQ) {
      expect(leerCodigo(rel), `${rel} no genera su FAQPage`).toContain(
        "jsonLdFaq(",
      );
    }
  });

  it("las preguntas que se publican son las que se pintan", async () => {
    /* Comprobar que el generador existe no basta: podría llamarse con una
       lista distinta. Se exige que cada página cite la MISMA constante que
       importa el componente del acordeón. */
    const acordeon = leerCodigo("src/components/marketing/FAQ.tsx");
    const acordeonPrecios = leerCodigo(
      "src/components/marketing/PricingFAQ.tsx",
    );
    const pares: [string, string, string][] = [
      ["src/app/faq/page.tsx", "FAQ_ES", acordeon],
      ["src/app/en/faq/page.tsx", "FAQ_EN", acordeon],
      ["src/app/pricing/page.tsx", "PRICING_FAQ_ES", acordeonPrecios],
      ["src/app/en/pricing/page.tsx", "PRICING_FAQ_EN", acordeonPrecios],
    ];
    for (const [rel, constante, componente] of pares) {
      expect(leerCodigo(rel), `${rel} publica otra lista`).toContain(
        `jsonLdFaq(${constante})`,
      );
      expect(componente, `el acordeón ya no pinta ${constante}`).toContain(
        constante,
      );
    }
  });

  it("no se anuncia una forma de pago que no existe", async () => {
    /* El invariante del producto: /demo es pública sin registro, el acceso
       anticipado es privado por invitación y 149/249 son precios
       PREVISTOS — no hay compra posible ni pasarela integrada. Nombrar una
       marca de pago concreta en el código sólo puede significar dos cosas:
       o se ha integrado de verdad (y entonces esta prueba obliga a
       revisar a conciencia lo que promete la web), o se está prometiendo
       algo que no se puede cumplir, que es lo que pasó. */
    const MARCAS = /\b(paypal|stripe|braintree|checkout\.com)\b/i;
    const fuentes: string[] = [];
    const recorrer = (dir: string) => {
      for (const entrada of readdirSync(join(RAIZ, dir))) {
        const rel = `${dir}/${entrada}`;
        if (statSync(join(RAIZ, rel)).isDirectory()) recorrer(rel);
        else if (/\.(ts|tsx)$/.test(entrada)) fuentes.push(rel);
      }
    };
    recorrer("src");

    const nombran: string[] = [];
    for (const rel of fuentes) {
      sinComentarios(leer(rel))
        .split("\n")
        .forEach((linea, i) => {
          const m = linea.match(MARCAS);
          if (m) nombran.push(`${rel}:${i + 1} → ${m[0]}`);
        });
    }
    expect(nombran, "pasarelas de pago nombradas sin que exista compra").toEqual(
      [],
    );
  });
});

/**
 * La marca vive en cinco ficheros y sólo uno la calcula.
 *
 * `scripts/generate-brand.py` extrae el motivo de la imagen de
 * referencia y de ahí salen `logo.png`, `apple-icon.png`, `favicon.ico`,
 * `src/app/icon.svg` y las constantes incrustadas en
 * `src/components/tj/BrandGlyph.tsx`. Las tres últimas son texto plano
 * que alguien puede tocar a mano sin que falle ni el compilador ni el
 * linter, y entonces la web enseñaría un logotipo y la pestaña otro.
 *
 * Esta prueba no repite la geometría: la RECALCULA leyendo del propio
 * script su mapa de puntos y sus constantes, así que si allí se cambia
 * el radio o el motivo, aquí se recalcula solo y lo único que puede
 * fallar es que los derivados se hayan quedado atrás.
 */
describe("el logotipo y su generador dibujan lo mismo", () => {
  const script = leer("scripts/generate-brand.py");

  const num = (nombre: string) => {
    const m = script.match(new RegExp(`^${nombre} = ([0-9.]+)`, "m"));
    if (!m) throw new Error(`no se encuentra ${nombre} en generate-brand.py`);
    return Number(m[1]);
  };

  /** El mapa de puntos tal cual lo declara el script. */
  const filas = (() => {
    const m = script.match(/^MOTIVO = """\\\r?\n([\s\S]*?)^"""/m);
    if (!m) throw new Error("no se encuentra el mapa MOTIVO");
    return m[1].replace(/\r/g, "").replace(/\n$/, "").split("\n");
  })();

  const N = filas.length;
  const PASO = 512 / (N + 1);
  const RADIO = Math.round(PASO * num("RADIO_REL") * 100) / 100;
  const RADIO_PLACA = Math.round(RADIO * num("RADIO_PLACA_REL") * 100) / 100;

  /* Mismo recorrido que `trazo()` en el script: fila a fila, columna a
     columna, y cada punto como un subtrazo de longitud cero. */
  const trazo = (encendida: (r: number, c: number) => boolean) => {
    let d = "";
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!encendida(r, c)) continue;
        const x = (PASO * (c + 1)).toFixed(1);
        const y = (PASO * (r + 1)).toFixed(1);
        d += `M${x} ${y}h0`;
      }
    }
    return d;
  };

  const esMotivo = (r: number, c: number) => filas[r][c] === "#";
  const enPlaca = (r: number, c: number) => {
    const c0 = (N - 1) / 2;
    const dentro =
      Math.abs((c - c0) / c0) ** 4 + Math.abs((r - c0) / c0) ** 4 <= 1;
    return dentro && !esMotivo(r, c);
  };

  const dMotivo = trazo(esMotivo);
  const dPlaca = trazo(enPlaca);

  const constante = (fuente: string, nombre: string) => {
    const m = fuente.match(new RegExp(`const ${nombre} = "([^"]*)"`));
    if (!m) throw new Error(`no se encuentra la constante ${nombre}`);
    return m[1];
  };

  it("el componente lleva la retícula que calcula el script", () => {
    const glifo = leer("src/components/tj/BrandGlyph.tsx");
    expect(constante(glifo, "MOTIVO"), "MOTIVO desincronizado").toBe(dMotivo);
    expect(constante(glifo, "PLACA"), "PLACA desincronizada").toBe(dPlaca);
    expect(Number(glifo.match(/const GROSOR = ([\d.]+)/)![1])).toBeCloseTo(
      RADIO * 2,
      4,
    );
    expect(Number(glifo.match(/const GROSOR_PLACA = ([\d.]+)/)![1])).toBeCloseTo(
      RADIO_PLACA * 2,
      4,
    );
  });

  it("el favicon vectorial lleva el mismo motivo", () => {
    const svg = leer("src/app/icon.svg");
    const m = svg.match(/<path d="([^"]+)"/);
    expect(m, "icon.svg no trae el trazo del motivo").not.toBeNull();
    expect(m![1], "icon.svg desincronizado").toBe(dMotivo);
  });

  it("el glifo pinta con el acento del tema y no con un color fijo", () => {
    const glifo = sinComentarios(leer("src/components/tj/BrandGlyph.tsx"));
    expect(glifo).toContain("rgb(var(--accent-base))");
    expect(
      glifo.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [],
      "color fijo en el logotipo de la web: no seguiría al tema",
    ).toEqual([]);
  });
});

/**
 * Toda sección de contenido se apoya en una superficie.
 *
 * El fondo del sitio es un atlas grabado a pantalla completa: un canvas
 * `position: absolute; inset: 0` dentro de un contenedor `fixed`, SIN
 * media query. Se dibuja detrás de todo, en todas las anchuras. Lo que
 * separa el texto de esa trama de puntos no es el ancho de la ventana:
 * es que cada sección traiga su propia superficie —`bg-veil`,
 * `tj-paper` o `liquid-glass`—.
 *
 * Ocho secciones se habían quedado sin ninguna, y entre ellas estaban
 * las plantillas de las que salen 136 rutas generadas. Su texto caía
 * directamente sobre el grabado. No lo vio ninguna comprobación porque
 * ninguna miraba esto, y la hoja de estilos tenía escrito un reparto a
 * dos columnas —«resuelto por encima de 1.280 px»— que nunca se llegó a
 * implementar y que hacía parecer el asunto cerrado.
 *
 * Se mira la PRIMERA `<section>` de cada fichero, que es la que envuelve
 * al resto: las anidadas heredan la superficie de su madre. Quien
 * necesite una sección desnuda la añade abajo CON su motivo escrito, que
 * es el trámite que convierte un descuido en una decisión.
 */
describe("ninguna sección de contenido queda sobre el atlas desnudo", () => {
  /* `page-header-scrim` es el velo propio de las cabeceras de subpágina
     —está documentado en globals.css junto a `.bg-veil`—, así que cuenta
     como superficie igual que los demás. */
  const SUPERFICIES = [
    "bg-veil",
    "tj-paper",
    "liquid-glass",
    "tj-interlude",
    "page-header-scrim",
  ];

  /** Secciones deliberadamente sin superficie, con su motivo. */
  const DESNUDAS_A_PROPOSITO: Record<string, string> = {
    "src/components/tj/PlateInterlude.tsx":
      "es la pausa de lámina: existe justamente para que el atlas se vea " +
      "entero. Su pie sí lleva velo, en `.tj-interlude-caption::before`.",
    "src/components/marketing/Hero.tsx":
      "el hero enseña el grabado a propósito y su texto va sobre las " +
      "superficies de sus propias piezas.",
    "src/components/marketing/Ticker.tsx":
      "la banda de símbolos trae su propio material (`liquid-glass " +
      "glass-band`) en el contenedor, no en la sección.",
    "src/components/marketing/Footer.tsx":
      "el pie tiene superficie propia y cierra el documento.",
    "src/components/marketing/Navbar.tsx":
      "la barra es una capa fija con su propio material.",
    "src/components/herramientas/HerramientasIndice.tsx":
      "su contenido entero vive dentro de un `.tj-paper.tj-paper-dense`, " +
      "que es superficie opaca: el velo de la sección no añadiría nada.",
    "src/components/tj/NotFoundClient.tsx":
      "la 404 es una lámina grabada a pantalla completa; enseñar el " +
      "grabado ES la página, y su texto va sobre su propio bloque.",
    "src/app/error.tsx":
      "misma lámina que la 404, por el mismo motivo.",
    "src/components/demo/pages/DashboardPage.tsx":
      "vive dentro de la ventana simulada de la demo, que trae su propio " +
      "cromo opaco: el atlas no está detrás.",
    "src/components/demo/pages/AnalyticsPage.tsx":
      "igual que el resto de vistas de la demo: dentro de la ventana " +
      "simulada, con su cromo opaco delante del atlas.",
  };

  const ficheros: string[] = [];
  const recorrer = (rel: string) => {
    for (const e of readdirSync(join(RAIZ, rel))) {
      const r = `${rel}/${e}`;
      if (statSync(join(RAIZ, r)).isDirectory()) recorrer(r);
      else if (e.endsWith(".tsx")) ficheros.push(r);
    }
  };
  recorrer("src/components");
  recorrer("src/app");

  it("toda sección exterior declara superficie o justifica no tenerla", () => {
    const desnudas: string[] = [];
    for (const rel of ficheros) {
      const codigo = sinComentarios(leer(rel));
      const i = codigo.indexOf("<section");
      if (i < 0) continue;
      /* Se miran la apertura de la sección Y sus primeras líneas: hay
         superficies que no van en el `className` de la `<section>` sino
         en el hijo que las pinta —`PageHeader` monta su velo como un
         `<div className="page-header-scrim">` justo dentro—. Buscar sólo
         en la etiqueta lo marcaba como desnudo teniéndolo.

         El precio es que una superficie escondida MUY adentro también
         contaría, y no debería. Se asume: esta prueba existe para cazar
         secciones sin NADA, no para auditar dónde se pinta cada velo. */
      const apertura = codigo.slice(i, i + 900);
      if (SUPERFICIES.some((s) => apertura.includes(s))) continue;
      if (DESNUDAS_A_PROPOSITO[rel]) continue;
      desnudas.push(rel);
    }
    expect(
      desnudas,
      "Estas secciones sirven su texto sobre el atlas grabado sin nada " +
        "que lo aísle. Añádeles `bg-veil` (o la superficie que toque), o " +
        "apúntalas en DESNUDAS_A_PROPOSITO con el motivo.",
    ).toEqual([]);
  });

  it("la lista de excepciones no acumula ficheros que ya no existen", () => {
    const fantasmas = Object.keys(DESNUDAS_A_PROPOSITO).filter(
      (rel) => !ficheros.includes(rel),
    );
    expect(fantasmas, "excepciones que ya no apuntan a nada").toEqual([]);
  });
});
