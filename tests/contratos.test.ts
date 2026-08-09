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
