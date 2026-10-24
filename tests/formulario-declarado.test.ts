import { beforeAll, describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { FAQ_EN, FAQ_ES } from "@/lib/faq";
import { SUBTITULO_PRIVACIDAD, documentoPorSlug } from "@/lib/legal/documentos";

// La FAQ y la política de privacidad dicen qué pide el formulario de acceso
// anticipado. Se cuentan los campos del HTML compilado (lo que el visitante
// rellena) y se comparan con las dos listas.

const BETA = join(process.cwd(), "out", "beta", "index.html");

function camposDelFormulario(html: string): number {
  const form = html.match(/<form[\s\S]*?<\/form>/)?.[0] ?? "";
  const controles = form.match(/<(input|select|textarea)\b[^>]*>/g) ?? [];
  const radios = new Set<string>();
  let n = 0;
  for (const c of controles) {
    if (/type="(checkbox|hidden|submit)"/.test(c) || /beta-botcheck/.test(c)) continue;
    const radio = /type="radio"/.test(c) && c.match(/name="([^"]+)"/)?.[1];
    if (radio) {
      if (radios.has(radio)) continue;
      radios.add(radio);
    }
    n++;
  }
  return n;
}

/** «a, b, c y d» → 4. */
function elementos(lista: string, y: RegExp): number {
  return lista.split(/,\s*/).flatMap((p) => p.split(y)).filter((p) => p.trim()).length;
}

// Sin endpoint de admisión, forms.ts manda la solicitud por Web3Forms al correo
// del titular: la privacidad tiene que nombrar ese destino en la fila del formulario.
describe("a dónde va la solicitud de acceso anticipado", () => {
  const forms = readFileSync(join(process.cwd(), "src", "lib", "forms.ts"), "utf8");
  const fila = documentoPorSlug("privacidad")!
    .secciones.flatMap((s) => s.bloques)
    .flatMap((b) => (b.tipo === "tabla" ? b.filas : []))
    .find((f) => f.es[0] === "Solicitud de acceso anticipado")!;

  it("forms.ts tiene el camino por correo", () => {
    expect(forms).toMatch(/if \(!BETA_API_URL\) return solicitudPorCorreo\(/);
  });

  it("la privacidad nombra los dos destinos", () => {
    for (const destino of [fila.es[2], fila.en[2]]) {
      expect(destino).toMatch(/endpoint/);
      expect(destino).toMatch(/Web3Forms/);
    }
  });
});

// La solicitud de acceso manda, además de lo escrito, el idioma y la página o
// campaña de origen (`procedencia()` en forms.ts). El subtítulo de /privacidad
// decía «…y nada más» encima de una entrada que sí lo cuenta.
describe("el subtítulo de privacidad dice lo mismo que su entrada", () => {
  const doc = documentoPorSlug("privacidad")!;
  const forms = readFileSync(join(process.cwd(), "src", "lib", "forms.ts"), "utf8");

  it("forms.ts manda el idioma y la página y campaña de origen", () => {
    expect(forms).toMatch(/lang\?: string/);
    expect(forms).toMatch(/source: enNavegador \? window\.location\.pathname/);
    expect(forms).toMatch(/utmCampaign: params\.get\("utm_campaign"\)/);
  });

  it.each([
    ["es", SUBTITULO_PRIVACIDAD.es, doc.entradaEs, /idioma/, /p[aá]gina o campa[ñn]a/],
    ["en", SUBTITULO_PRIVACIDAD.en, doc.entradaEn, /language/, /page or campaign/],
  ])("%s: los dos nombran el idioma y la página o campaña", (_, subtitulo, entrada, idioma, origen) => {
    for (const texto of [subtitulo, entrada]) {
      expect(texto, texto).toMatch(idioma);
      expect(texto, texto).toMatch(origen);
    }
  });
});

// `skipIf` salta las pruebas pero ejecuta el cuerpo del `describe`: leer `out/`
// aquí rompe el CI, que pasa las pruebas antes de compilar. Con
// `COMPROBAR_OUT=1` (los flujos de GitHub, tras compilar) no se salta nunca.
describe.skipIf(!existsSync(BETA) && process.env.COMPROBAR_OUT !== "1")("lo que se dice que pide el formulario es lo que pide", () => {
  let n = 0;
  beforeAll(() => {
    n = camposDelFormulario(readFileSync(BETA, "utf8"));
  });

  it("el formulario compilado tiene campos que contar", () => {
    expect(n).toBeGreaterThan(3);
  });

  it("la FAQ nombra tantos campos como tiene", () => {
    const es = FAQ_ES.find((q) => q.q === "¿Qué datos pide esta web?")!.a;
    const en = FAQ_EN.find((q) => q.q === "What data does this website ask for?")!.a;
    expect(elementos(es.match(/el de acceso anticipado, ([^—]+)—/)![1], / y /)).toBe(n);
    expect(elementos(en.match(/the early-access form, ([^—]+)—/)![1], / and /)).toBe(n);
  });

  it("la política de privacidad también", () => {
    const texto = JSON.stringify(documentoPorSlug("privacidad"));
    expect(elementos(texto.match(/seleccionar un piloto: ([^.]+)\./)![1], / y /)).toBe(n);
    expect(elementos(texto.match(/select a pilot: ([^.]+)\./)![1], / and /)).toBe(n);
  });
});
