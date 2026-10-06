import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * El sitio se llama a sí mismo de una sola manera en cada idioma. Mira el HTML
 * compilado y no el código (los textos van como `es ? "…" : "…"` y leer línea
 * a línea daba falsos positivos). No mira `out/en/**` ni `<script>` / `<style>`
 * (los datos estructurados llevan inglés a propósito). Se salta si no hay `out/`.
 */

const RAIZ = process.cwd();
const SALIDA = join(RAIZ, "out");

/** Palabras que no deben aparecer en el texto español del sitio, y su motivo. */
const PROHIBIDAS: { palabra: RegExp; motivo: string; nombre?: string; porNodo?: boolean }[] = [
  {
    palabra: /\bjournals?\b/i,
    motivo:
      "el producto se llama «diario» en español — así se presenta el sitio y " +
      "así se llama la pantalla en la demo",
  },
  {
    palabra: /\boverrides?\b/i,
    motivo:
      "el Guardián las llama «excepciones» en su propio titular, dos líneas " +
      "más arriba",
  },
  {
    palabra: /\bcommand palette\b/i,
    motivo: "en español es «la paleta de comandos»",
  },
  {
    // Solo con mayúscula inicial (etiqueta de métrica): «tu esperanza
    // matemática» en una frase es correcto, y el lookahead lo excluye.
    palabra: /\bEsperanza\b(?!\s+matem)/,
    nombre: "Esperanza, como etiqueta de métrica",
    motivo:
      "la métrica se llama «Expectancy» también en español — así la nombran " +
      "otras dieciséis páginas y así se titula su ficha del glosario. La " +
      "rejilla de métricas de la portada era el único sitio que la llamaba " +
      "«Esperanza», y quien la leía ahí no la encontraba luego en el glosario",
  },
  {
    palabra: /\bsólo\b/i,
    nombre: "sólo, con tilde",
    motivo:
      "el sitio escribe «solo» sin tilde, como pide la RAE desde 2010; convivían " +
      "las dos formas, a veces en la misma respuesta de la FAQ",
  },
  {
    // « — » con espacios es la raya inglesa; en español el inciso va pegado.
    // Se mira por nodo y sin `<title>`: el separador «Página — CountPips» y el
    // «—» de una cifra pendiente no son incisos.
    palabra: /\S[^\S\n]—[^\S\n]\S/,
    nombre: "raya con espacio a los dos lados",
    porNodo: true,
    motivo:
      "en español la raya de inciso va pegada al texto que abre y cierra; había " +
      "nueve en /about, /features, /test, /privacidad y la significancia",
  },
  {
    palabra: /\bPnL\b/,
    nombre: "PnL",
    motivo: "el sitio escribe «P&L» en el calendario, la demo y las fichas",
  },
  {
    palabra: /\bcurva de equity\b/i,
    nombre: "curva de equity",
    motivo:
      "la portada, la demo y el proyector la llaman «curva de capital»; precios " +
      "y características decían «curva de equity» para la misma gráfica",
  },
  {
    palabra: /~\s?\d/,
    nombre: "~ delante de una cifra",
    porNodo: true,
    motivo:
      "el sitio escribe «≈ 1,5 años»; la virgulilla es abreviatura de foro y " +
      "quedaba en «Peor racha: ~13 pérdidas» y en la racha teórica del Monte Carlo",
  },
  {
    palabra: /\bdesviación típica\b/i,
    nombre: "desviación típica",
    motivo:
      "las fórmulas del glosario y las calculadoras dicen «desviación estándar»; " +
      "la definición del SQN decía «típica» para lo mismo",
  },
  {
    // «Curva de capital», «capital invertido» o «aporta capital» son otra cosa y se quedan.
    palabra: /\btu capital\b|\bcapital inicial\b|\bcon el capital\b|\bsaldo\b|\bCapital(?: final|:| y frecuencia)/,
    nombre: "capital o saldo para el dinero de la cuenta",
    motivo:
      "el dinero de la cuenta se llama «balance», como en los campos de las " +
      "calculadoras; «Dime tu capital» iba encima de un campo rotulado " +
      "«Balance de cuenta», y el proyector decía «Balance inicial» y «4,2× el " +
      "capital inicial» en la misma tarjeta",
  },
  {
    palabra: /[−+-]?\$\s?\d/,
    nombre: "$ delante de la cifra",
    porNodo: true,
    motivo:
      "en español la moneda va detrás y separada, «1,24 $»; delante es la forma " +
      "inglesa, que conservan las páginas de /en",
  },
];

// No se prohíbe «Drawdown máx.»: la calculadora de capital lo usa para el
// drawdown estimado a 99 %, que es otra métrica.

function paginasEspanolas(dir: string, acc: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) {
      const rel = relative(SALIDA, p).replace(/\\/g, "/");
      if (rel === "_next" || rel === "en") continue;
      paginasEspanolas(p, acc);
    } else if (n.endsWith(".html")) acc.push(p);
  }
  return acc;
}

/** El texto que de verdad se lee: sin marcado, sin scripts, sin estilos. */
function textoVisible(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;|&#\d+;/gi, " ")
    .replace(/\s+/g, " ");
}

/** Lo mismo, pero cada nodo de texto en su línea y sin el `<title>`. */
function textoPorNodos(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, "\n")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "\n")
    .replace(/<title\b[\s\S]*?<\/title>/gi, "\n")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&[a-z]+;|&#\d+;/gi, " ")
    .replace(/[^\S\n]+/g, " ");
}

describe.skipIf(!existsSync(SALIDA))(
  "el texto español del sitio usa un solo nombre para cada cosa",
  () => {
    it("hay páginas españolas que revisar", () => {
      expect(
        paginasEspanolas(SALIDA).length,
        "No hay páginas españolas en out/",
      ).toBeGreaterThan(50);
    });

    for (const { palabra, motivo, nombre: puesto, porNodo } of PROHIBIDAS) {
      // `nombre` propio en la entrada: derivarlo de un patrón con lookahead da un título ilegible.
      const nombre = puesto ?? palabra.source.replace(/\\b|\?/g, "");
      it(`ninguna página en español dice «${nombre}» — ${motivo}`, () => {
        const encontrados: string[] = [];
        for (const ruta of paginasEspanolas(SALIDA)) {
          const html = readFileSync(ruta, "utf8");
          const texto = porNodo ? textoPorNodos(html) : textoVisible(html);
          const hit = texto.match(palabra);
          if (!hit) continue;
          const i = texto.indexOf(hit[0]);
          encontrados.push(
            `${relative(SALIDA, ruta)}  …${texto.slice(Math.max(0, i - 45), i + 45).trim()}…`,
          );
        }
        expect(
          encontrados.slice(0, 12),
          `Texto que el visitante lee en español con una palabra que el sitio ` +
            `ya nombra de otra manera: ${motivo}. Si de verdad hiciera falta el ` +
            `término inglés en un caso concreto, la excepción se razona en esta ` +
            `lista y no se cuela en el texto.`,
        ).toEqual([]);
      });
    }
  },
);
