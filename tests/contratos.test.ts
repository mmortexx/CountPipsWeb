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
