import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DOCUMENTOS_LEGALES, documentoPorSlug, type DocumentoLegal } from "@/lib/legal/documentos";
import { CAMPOS_OBLIGATORIOS, TITULAR } from "@/lib/legal/titular";

// La privacidad (RGPD, art. 13) y el aviso legal (LSSI, art. 10) tienen que
// decir quién es el responsable y cómo contactarle. Los datos salen de
// `titular.ts`; aquí se comprueba que están, que tienen forma de dato real y
// que llegan al texto que se publica, en los dos idiomas.

const NIF_LETRAS = "TRWAGMYFPDXBNJZSQVHLCKE";

/** DNI, NIE o CIF español con su carácter de control correcto. */
function nifValido(bruto: string): boolean {
  const nif = bruto.toUpperCase().replace(/[\s.-]/g, "");
  const dni = nif.match(/^(\d{8})([A-Z])$/);
  if (dni) return NIF_LETRAS[Number(dni[1]) % 23] === dni[2];
  const nie = nif.match(/^([XYZ])(\d{7})([A-Z])$/);
  if (nie) return NIF_LETRAS[Number("XYZ".indexOf(nie[1]) + nie[2]) % 23] === nie[3];
  const cif = nif.match(/^([ABCDEFGHJNPQRSUVW])(\d{7})([0-9A-J])$/);
  if (!cif) return false;
  let suma = 0;
  [...cif[2]].forEach((c, i) => {
    const d = Number(c);
    suma += i % 2 === 0 ? Math.floor((d * 2) / 10) + ((d * 2) % 10) : d;
  });
  const control = (10 - (suma % 10)) % 10;
  return cif[3] === String(control) || cif[3] === "JABCDEFGHI"[control];
}

const CORREO = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
/** Dominios de ejemplo: un correo de prueba olvidado no puede llegar a publicarse. */
const CORREO_DE_EJEMPLO = /@(ejemplo|example|test|prueba)\.|@localhost|\.(invalid|test|example|localhost|local)$/i;

/** Frases del texto provisional, cuando aún no había titular. */
const PROVISIONAL = /más adelante|se publicar[áa]n en el aviso legal|will be published (later|in the legal notice)/i;

const textoDe = (doc: DocumentoLegal, idioma: "es" | "en") =>
  doc.secciones
    .flatMap((s) =>
      s.bloques.flatMap((b) =>
        b.tipo === "parrafo"
          ? [b[idioma]]
          : b.tipo === "lista"
            ? b[idioma]
            : b.filas.flatMap((f) => f[idioma]),
      ),
    )
    .join("\n");

describe("datos del titular", () => {
  it.each(CAMPOS_OBLIGATORIOS)("«%s» está relleno", (campo) => {
    expect(TITULAR[campo].trim(), `falta ${campo} en src/lib/legal/titular.ts`).not.toBe("");
  });

  it("el NIF es un DNI, NIE o CIF con su control correcto", () => {
    expect(nifValido(TITULAR.nif), `NIF «${TITULAR.nif}»`).toBe(true);
  });

  it("el correo es una dirección real, no una de ejemplo", () => {
    expect(TITULAR.correo).toMatch(CORREO);
    expect(TITULAR.correo).not.toMatch(CORREO_DE_EJEMPLO);
  });
});

describe("el validador de NIF distingue uno bueno de uno con errata", () => {
  // Números de muestra de la documentación oficial, no de nadie.
  it.each(["12345678Z", "X1234567L", "A58818501", "Q2826000H", "B-12345674"])("%s vale", (n) => {
    expect(nifValido(n)).toBe(true);
  });
  it.each(["12345678A", "X1234567A", "A58818502", "", "1234"])("%s no vale", (n) => {
    expect(nifValido(n)).toBe(false);
  });
});

describe("las páginas legales identifican al titular", () => {
  const privacidad = documentoPorSlug("privacidad")!;
  const aviso = documentoPorSlug("aviso-legal")!;

  it.each(["es", "en"] as const)("la privacidad (%s) nombra al responsable y su correo", (idioma) => {
    const texto = textoDe(privacidad, idioma);
    for (const campo of CAMPOS_OBLIGATORIOS) expect(texto).toContain(TITULAR[campo].trim() || "∅");
  });

  it.each(["es", "en"] as const)("el aviso legal (%s) da los cuatro datos", (idioma) => {
    const texto = textoDe(aviso, idioma);
    for (const campo of CAMPOS_OBLIGATORIOS) expect(texto).toContain(TITULAR[campo].trim() || "∅");
  });

  it.each(DOCUMENTOS_LEGALES.flatMap((d) => (["es", "en"] as const).map((i) => [d.slug, i, d] as const)))(
    "%s (%s) no conserva el texto provisional",
    (_slug, idioma, doc) => {
      expect(textoDe(doc, idioma)).not.toMatch(PROVISIONAL);
    },
  );
});

// Lo publicado: el HTML compilado. `skipIf` porque las pruebas corren antes de
// compilar; el paso posterior a la compilación de los dos flujos lo vuelve a
// correr ya con `out/`.
const OUT = join(process.cwd(), "out");
const pagina = (ruta: string) => join(OUT, ruta, "index.html");
const RUTAS = ["privacidad", "aviso-legal", "cookies", "terminos"].flatMap((r) => [r, `en/${r}`]);

const sinEntidades = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ");

describe.skipIf(!existsSync(pagina("aviso-legal")))("la web compilada identifica al titular", () => {
  it.each(RUTAS)("/%s existe y no conserva el texto provisional", (ruta) => {
    expect(sinEntidades(readFileSync(pagina(ruta), "utf8"))).not.toMatch(PROVISIONAL);
  });

  it.each(["privacidad", "aviso-legal", "en/privacidad", "en/aviso-legal"])(
    "/%s muestra los cuatro datos",
    (ruta) => {
      const texto = sinEntidades(readFileSync(pagina(ruta), "utf8"));
      for (const campo of CAMPOS_OBLIGATORIOS) {
        const valor = TITULAR[campo].replace(/\s+/g, " ").trim();
        expect(texto).toContain(valor || "∅");
      }
    },
  );
});
