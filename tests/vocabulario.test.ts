import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * EL SITIO SE LLAMA A SÍ MISMO DE UNA SOLA MANERA EN CADA IDIOMA.
 *
 * ── El fallo que cierra ───────────────────────────────────────────────
 * La web se presenta como «el diario de trading profesional» y el menú de
 * la demo llama Diario a esa pantalla. Y a la vez, en español, decía «no
 * es otro journal», «antes del journal», «journals en la nube»,
 * «migración desde otros journals», «cómo llevas el journal hoy»,
 * «Journal completo + 40+ métricas», «el núcleo del journal». Once
 * sitios, dos nombres para el mismo producto, uno de ellos sin traducir
 * en mitad de una frase en español.
 *
 * No es purismo. El vocabulario de una web es la señalización de quien la
 * recorre: si la cosa que va a comprar se llama de dos maneras, tiene que
 * pararse a decidir si son la misma.
 *
 * ── Por qué mira el HTML y no el código ───────────────────────────────
 * Se intentó primero sobre las fuentes, y no se sostiene. La mitad del
 * sitio escribe sus textos como `es ? "…" : "…"`, muchas veces repartido
 * en varias líneas, y lo único que distingue la rama española de la
 * inglesa es el ORDEN. Leyendo línea a línea, la rama inglesa se acusa
 * sola: doce falsos positivos en el primer intento, todos ellos texto
 * inglés perfectamente correcto. Y una barrera que da falsos positivos se
 * desactiva a la semana.
 *
 * El HTML compilado no tiene esa ambigüedad: en `out/` las páginas
 * españolas contienen texto español y nada más. Se mira eso, que además
 * es exactamente lo que el visitante lee.
 *
 * ── Lo que NO mira ────────────────────────────────────────────────────
 * · `out/en/**` — el sitio en inglés.
 * · `<script>` y `<style>` — ahí viven los datos estructurados, cuyas
 *   palabras clave para buscadores SÍ van en inglés a propósito, y el
 *   JavaScript de la página, que no es texto que se lea.
 * · Se salta entera si no hay `out/`: las pruebas tienen que poder correr
 *   sin compilar.
 */

const RAIZ = process.cwd();
const SALIDA = join(RAIZ, "out");

/** Palabras que en el texto español del sitio no deben aparecer, y su porqué. */
const PROHIBIDAS: { palabra: RegExp; motivo: string }[] = [
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
];

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

describe.skipIf(!existsSync(SALIDA))(
  "el texto español del sitio usa un solo nombre para cada cosa",
  () => {
    it("hay páginas españolas que revisar", () => {
      expect(
        paginasEspanolas(SALIDA).length,
        "No hay páginas españolas en out/",
      ).toBeGreaterThan(50);
    });

    for (const { palabra, motivo } of PROHIBIDAS) {
      const nombre = palabra.source.replace(/\\b|\?/g, "");
      it(`ninguna página en español dice «${nombre}» — ${motivo}`, () => {
        const encontrados: string[] = [];
        for (const ruta of paginasEspanolas(SALIDA)) {
          const texto = textoVisible(readFileSync(ruta, "utf8"));
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
