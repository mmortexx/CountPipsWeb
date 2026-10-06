import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { STR } from "@/lib/i18n";
import { LOCALIZED_PATHS } from "@/lib/rutas-en";
import { tieneVersionEn, withLocale } from "@/lib/locale";

/**
 * Contratos que atraviesan varios ficheros y que los tipos no vigilan: paridad
 * entre idiomas, rutas declaradas frente a reales y campos que un lado escribe
 * y el otro lee (el campo trampa del formulario de acceso anticipado se enviaba
 * como `botcheck` y el Worker leía `payload.honeypot`).
 */

const RAIZ = join(import.meta.dirname, "..");
const leer = (rel: string) => readFileSync(join(RAIZ, rel), "utf8");

/**
 * Devuelve el fichero sin comentarios: estas pruebas afirman ausencias (por
 * ejemplo, que el Worker ya no lee `payload.honeypot`) y no deben dispararse
 * con el comentario que explica el arreglo.
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
          /* carpeta sin página propia: solo agrupa */
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

  it("el enlace inglés reconoce toda ruta de la lista completa, y nada más", () => {
    expect(LOCALIZED_PATHS.filter((p) => !tieneVersionEn(p))).toEqual([]);
    expect(tieneVersionEn("/glosario/drawdown/extra")).toBe(false);
    expect(tieneVersionEn("/traders/no-existe")).toBe(false);
  });

  // La lista se escribe sin barra final: un enlace con barra no puede quedarse en español.
  it("la barra final no decide el idioma", () => {
    for (const ruta of ["/faq", "/glosario", "/herramientas", "/pricing", "/beta"]) {
      expect(tieneVersionEn(ruta), ruta).toBe(true);
      expect(tieneVersionEn(`${ruta}/`), `${ruta}/`).toBe(true);
    }
    expect(withLocale("/faq/", "en")).toBe("/en/faq/");
    expect(withLocale("/faq", "en")).toBe("/en/faq");
    // La raíz no se ve afectada por la normalización.
    expect(withLocale("/", "en")).toBe("/en");
    // Y una ruta sin versión inglesa sigue sin prefijarse, lleve barra o no.
    expect(withLocale("/traders/no-existe/", "en")).toBe("/traders/no-existe/");
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
    // Sin el binding KV no debe devolver `true` (puerta abierta): solo se salta
    // si el despliegue lo pide, y el rechazo dice «mal configurado».
    expect(worker).toMatch(/RATE_LIMIT_OPTIONAL/);
    expect(worker).not.toMatch(/if \(!env\.RATE_LIMIT\) return true;/);
    expect(worker).toMatch(/service_misconfigured/);
  });

  it("consulta la cuota antes de Turnstile, pero la descuenta después", () => {
    // Consultar antes evita una llamada a Cloudflare por quien ya superó el
    // límite; descontar después evita que un fallo anti-bot queme el intento.
    // `await nombre(` solo aparece en las llamadas, no en las definiciones.
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

  it("no se activa la grabación de sesión, que la política no declara", () => {
    expect(posthog).toMatch(/disable_session_recording:\s*true/);
  });

  it("PostHog guarda en localStorage y no en cookies", () => {
    // Sin `persistence` explícito, PostHog usa "localStorage+cookie" y escribe cookies.
    expect(posthog).toMatch(/persistence:\s*"(localStorage|memory|sessionStorage)"/);
  });

  it("la clave de consentimiento no está repetida a mano por ahí", () => {
    // Con copias, retirar el consentimiento en un sitio dejaba a los otros leyendo el valor viejo.
    const copias = ["src/components/analytics/PostHog.tsx", "src/lib/analytics.ts"]
      .filter((f) => leerCodigo(f).includes('"tj-cookie-consent"'));
    expect(copias).toEqual([]);
  });
});

/**
 * El patrón «{término}: qué es y por qué importa — CountPips» ya cuesta 41
 * caracteres; un término con la expansión dentro, como «MAE (Maximum Adverse
 * Excursion)», hace que Google corte el título. El humo no recorre el
 * glosario, así que se comprueban aquí todas las páginas generadas.
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
    // El recorte no puede llevarse la intención: sin «qué es» el buscador deja de encontrarlos.
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
   * Las cifras van escritas dentro de frases en muchos archivos (interpolarlas
   * deja los textos ilegibles), así que se ata la coherencia: toda cifra de
   * tres dígitos precedida de `$` en el código fuente debe ser uno de los dos
   * precios declarados. Si cambia solo `precios.ts`, falla con ruta y línea.
   */
  it("no hay ninguna cifra en dólares que no sea un precio declarado", async () => {
    const { PRECIO_CORE, PRECIO_PRO } = await import("@/lib/precios");
    const permitidos = new Set([String(PRECIO_CORE), String(PRECIO_PRO)]);

    // Entran también los `.ts` de datos: `herramientas.ts` y `legal/documentos.ts` citan el precio.
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
      // Sin comentarios: las notas pueden citar precios antiguos.
      const lineas = sinComentarios(leer(rel)).split("\n");
      lineas.forEach((linea, i) => {
        // «$154,820» es una cifra con miles, no un precio de tres dígitos.
        for (const m of linea.matchAll(/\$(\d{3})\b(?![,.]\d)/g)) {
          if (!permitidos.has(m[1])) sueltas.push(`${rel}:${i + 1} → $${m[1]}`);
        }
        // En español el símbolo va detrás: «149 $».
        for (const m of linea.matchAll(/(?<![\d.,])(\d{3})(?:\s|\\u00a0)\$(?![{/])/g)) {
          if (!permitidos.has(m[1])) sueltas.push(`${rel}:${i + 1} → ${m[1]} $`);
        }
      });
    }
    expect(
      sueltas,
      `cifras en dólares que no son ${PRECIO_CORE} ni ${PRECIO_PRO}`,
    ).toEqual([]);
  });

  it("las dos cifras siguen apareciendo en la tabla de precios", async () => {
    // La prueba anterior pasa sola si nadie menciona un precio: esta exige que la tabla lo diga.
    const { PRECIO_CORE, PRECIO_PRO } = await import("@/lib/precios");
    const tabla = leerCodigo("src/components/marketing/Pricing.tsx");
    expect(tabla).toContain("PRECIO_CORE");
    expect(tabla).toContain("PRECIO_PRO");
    expect(PRECIO_PRO).toBeGreaterThan(PRECIO_CORE);
  });
});

describe("lo que se le dice al buscador es lo que dice la página", () => {
  /**
   * Las preguntas frecuentes estaban escritas dos veces (el acordeón y el
   * `FAQPage` de datos estructurados) y divergieron: el marcado declaraba a
   * Google respuestas falsas que la página no mostraba.
   */
  const PAGINAS_FAQ = [
    "src/app/faq/page.tsx",
    "src/app/en/faq/page.tsx",
    "src/app/pricing/page.tsx",
    "src/app/en/pricing/page.tsx",
  ];

  it("ninguna respuesta del buscador se escribe a mano en la página", () => {
    // `acceptedAnswer` a mano es una segunda copia: debe salir de `jsonLdFaq()`.
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
    // Cada página debe citar la misma constante que el acordeón, no otra lista.
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
    // No hay compra ni pasarela integrada (los precios son previstos): nombrar
    // una marca de pago obliga a revisar lo que promete la web.
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
 * `scripts/generate-brand.py` genera `logo.png`, `apple-icon.png`,
 * `favicon.ico`, `src/app/icon.svg` y las constantes de `BrandGlyph.tsx`. Las
 * dos últimas son texto plano editable a mano sin que falle nada.
 */
describe("el logotipo y su generador dibujan lo mismo", () => {
  const constante = (fuente: string, nombre: string) => {
    const m = fuente.match(new RegExp(`const ${nombre} = "([^"]*)"`));
    if (!m) throw new Error(`no se encuentra la constante ${nombre}`);
    return m[1];
  };

  it("el componente y el favicon vectorial llevan el mismo trazo", () => {
    const glifo = leer("src/components/tj/BrandGlyph.tsx");
    const svg = leer("src/app/icon.svg");
    const m = svg.match(/<path d="([^"]+)"/);
    expect(m, "icon.svg no trae el trazo de la marca").not.toBeNull();
    expect(constante(glifo, "TRAZO"), "BrandGlyph e icon.svg desincronizados").toBe(m![1]);
  });

  it("el componente enseña la caja entera de la marca", () => {
    const glifo = leer("src/components/tj/BrandGlyph.tsx");
    const caja = constante(glifo, "CAJA").split(" ").map(Number);
    expect(caja, "CAJA no son cuatro números").toHaveLength(4);
    expect(caja.every(Number.isFinite)).toBe(true);
    expect(glifo, "el viewBox no usa CAJA").toMatch(/viewBox=\{CAJA\}/);
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

describe("el menú cuenta lo que hay", () => {
  // El menú es de cliente y no importa los datos (no viajan al navegador): la cifra va escrita y aquí se ata.
  const NUMEROS: Record<string, number> = { siete: 7, ocho: 8, nueve: 9, diez: 10, seven: 7, eight: 8, nine: 9, ten: 10 };
  const navbar = leer("src/components/marketing/Navbar.tsx");
  const cifra = (re: RegExp) =>
    [...navbar.matchAll(re)].map((m) => (/^\d+$/.test(m[1]) ? Number(m[1]) : NUMEROS[m[1].toLowerCase()]));

  it("calculadoras", async () => {
    const { HERRAMIENTAS } = await import("@/lib/herramientas");
    const vistas = cifra(/"(\w+) (?:calculadoras|calculators)\b/g);
    expect(vistas.length).toBe(2);
    for (const n of vistas) expect(n).toBe(HERRAMIENTAS.length);
  });

  // Fuera del menú, la cifra sale de `herramientasEnLetra`.
  it("fuera del menú nadie escribe a mano cuántas herramientas hay", async () => {
    const { herramientasEnLetra, HERRAMIENTAS } = await import("@/lib/herramientas");
    expect(NUMEROS[herramientasEnLetra("es").toLowerCase()]).toBe(HERRAMIENTAS.length);
    expect(NUMEROS[herramientasEnLetra("en").toLowerCase()]).toBe(HERRAMIENTAS.length);
    const fuentes: string[] = [];
    const recorrer = (dir: string) => {
      for (const entrada of readdirSync(join(RAIZ, dir))) {
        const rel = `${dir}/${entrada}`;
        if (statSync(join(RAIZ, rel)).isDirectory()) recorrer(rel);
        else if (/\.(ts|tsx)$/.test(entrada) && !rel.endsWith("/Navbar.tsx")) fuentes.push(rel);
      }
    };
    recorrer("src");
    expect(fuentes.length).toBeGreaterThan(100);
    const CIFRA =
      /\b(?:dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\d+)\s+(?:[\p{L}-]+\s+){0,2}(?:calculadoras|herramientas|calculators|tools)\b/giu;
    const aMano = fuentes.flatMap((rel) => (sinComentarios(leer(rel)).match(CIFRA) ?? []).map((m) => `${rel}: ${m}`));
    expect(aMano).toEqual([]);
  });

  it("términos del glosario", async () => {
    const { TERMINOS } = await import("@/lib/glosario");
    const vistas = cifra(/"(\d+) (?:términos|terms)\b/g);
    expect(vistas.length).toBe(2);
    for (const n of vistas) expect(n).toBe(TERMINOS.length);
  });
});

describe("ningún enlace apunta a un dominio que aún no existe", () => {
  // `countpips.com` aún no existe: la dirección sale de `SITE_URL`.
  it("el dominio propio solo aparece en site.ts", () => {
    const fuentes: string[] = [];
    const recorrer = (dir: string) => {
      for (const entrada of readdirSync(join(RAIZ, dir))) {
        const rel = `${dir}/${entrada}`;
        if (statSync(join(RAIZ, rel)).isDirectory()) recorrer(rel);
        else if (/\.(ts|tsx)$/.test(entrada)) fuentes.push(rel);
      }
    };
    recorrer("src");
    expect(fuentes.length).toBeGreaterThan(100);
    const conDominio = fuentes.filter((rel) => /countpips\.com/i.test(sinComentarios(leer(rel))));
    expect(conDominio).toEqual([]);
  });
});

describe("los escapes de JavaScript no llegan a pantalla", () => {
  // En un atributo JSX entre comillas no se interpretan los escapes: «barra u 00a0» se pinta tal cual.
  it("ningún atributo JSX con comillas lleva un escape unicode", () => {
    const fuentes: string[] = [];
    const recorrer = (dir: string) => {
      for (const entrada of readdirSync(join(RAIZ, dir))) {
        const rel = `${dir}/${entrada}`;
        if (statSync(join(RAIZ, rel)).isDirectory()) recorrer(rel);
        else if (entrada.endsWith(".tsx")) fuentes.push(rel);
      }
    };
    recorrer("src");
    const malos = fuentes.filter((rel) => /[A-Za-z]="[^"]*\\u[0-9a-fA-F]{4}/.test(leer(rel)));
    expect(malos).toEqual([]);
  });
});

describe("lo que el titular del Monte Carlo promete", () => {
  // El número vive en `CAMINOS_MONTE_CARLO` y los textos lo dicen en letra.
  // Si cambia, esta tabla no lo conoce y falla hasta reescribir el titular.
  const EN_LETRA: Record<number, { es: string; en: string }> = {
    300: { es: "trescientas", en: "three hundred" },
  };

  it("titular, subtítulo y descripción dicen los caminos que se juegan", async () => {
    const { HERRAMIENTAS, CAMINOS_MONTE_CARLO } = await import("@/lib/herramientas");
    const mc = HERRAMIENTAS.find((h) => h.slug === "monte-carlo")!;
    const letra = EN_LETRA[CAMINOS_MONTE_CARLO];
    expect(letra, `no hay cómo escribir ${CAMINOS_MONTE_CARLO} en letra: revisa el titular`).toBeDefined();
    for (const t of [mc.h1Es, mc.subtituloEs, mc.descripcionEs]) expect(t.toLowerCase()).toContain(letra.es);
    for (const t of [mc.h1En, mc.subtituloEn, mc.descripcionEn]) expect(t.toLowerCase()).toContain(letra.en);
    for (const t of [mc.h1Es, mc.subtituloEs, mc.descripcionEs, mc.h1En, mc.subtituloEn, mc.descripcionEn]) {
      expect(t).not.toMatch(/\b(mil|miles|thousands?)\b/i);
    }
  });
});

describe("el glosario enlaza herramientas que existen", () => {
  // Un destino que no casa deja la ficha sin enlace en silencio. `/test` es el único que no es calculadora.
  it("cada destino de HERRAMIENTA_DE es una herramienta con ficha o el test", async () => {
    const { HERRAMIENTA_DE } = await import("@/lib/glosario");
    const { herramientaPorSlug } = await import("@/lib/herramientas");
    const destinos = Object.entries(HERRAMIENTA_DE);
    expect(destinos.length).toBeGreaterThan(0);
    const huerfanos = destinos.filter(
      ([, href]) => href !== "/test" && !(href.startsWith("/herramientas/") && herramientaPorSlug(href.slice(14))),
    );
    expect(huerfanos).toEqual([]);
  });
});

describe("los campos de cifra escriben como el idioma de la página", () => {
  // `type="number"` usa el decimal del idioma del navegador, no el de la página: van por `CampoCifra` o `leeCifra`.
  it("ningún componente usa type=\"number\"", () => {
    const tsx: string[] = [];
    const recorrer = (dir: string) => {
      for (const e of readdirSync(dir)) {
        const p = join(dir, e);
        if (statSync(p).isDirectory()) recorrer(p);
        else if (e.endsWith(".tsx")) tsx.push(p);
      }
    };
    recorrer(join(process.cwd(), "src"));
    expect(tsx.length).toBeGreaterThan(50);
    const conNumber = tsx.filter((p) => /<input[^>]*\btype=["{]?["']?number/.test(readFileSync(p, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ")));
    expect(conNumber).toEqual([]);
  });
});
