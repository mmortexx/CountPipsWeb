/**
 * Corrige el atributo `lang` de las páginas en inglés del sitio exportado.
 *
 * ── EL PROBLEMA ───────────────────────────────────────────────────────
 * Las 154 páginas se servían con `<html lang="es">`, incluidas las 77 que
 * están escritas en inglés. Lo corregía un script en línea que se ejecuta
 * en el navegador (`src/app/layout.tsx`), así que el HTML que sale del
 * servidor sigue diciendo "esto está en español" mientras el `hreflang`
 * del mismo documento dice que está en inglés. Se contradicen.
 *
 * A quién le importa: a los rastreadores que no ejecutan JavaScript, a
 * las previsualizaciones de enlaces, a los traductores automáticos y a un
 * lector de pantalla que procese el documento antes de que corra el
 * script — que lo pronuncia con fonética española.
 *
 * ── POR QUÉ SE ARREGLA AQUÍ Y NO EN EL LAYOUT ─────────────────────────
 * En el App Router de Next SÓLO el layout raíz renderiza `<html>`, y un
 * layout raíz no sabe qué ruta está sirviendo: no recibe la ruta, y con
 * `output: "export"` tampoco hay cabeceras que consultar. La vía que
 * ofrece el framework es tener DOS layouts raíz con grupos de rutas
 * —`app/(es)/` y `app/(en)/`—, lo que obliga a mover los 42 ficheros de
 * página a otra carpeta y a partir en dos un layout de 390 líneas.
 *
 * Eso es mucho riesgo sobre 154 rutas ya indexadas para cambiar dos
 * letras del HTML. Esto hace exactamente el mismo trabajo, es
 * determinista, y ROMPE LA COMPILACIÓN si alguna página inglesa se queda
 * sin corregir — que es la garantía que importa. Si algún día el sitio se
 * reorganiza por otro motivo, este paso desaparece solo.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT = "out";
/** Prefijo de las rutas en inglés dentro del export. */
const EN_DIR = join(OUT, "en");

/** Devuelve todos los .html bajo un directorio, recursivamente. */
async function htmlFiles(dir) {
  let entradas;
  try {
    entradas = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out = [];
  for (const e of entradas) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await htmlFiles(p)));
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

const ficheros = await htmlFiles(EN_DIR);

if (ficheros.length === 0) {
  console.error(
    `[postbuild-lang] No se ha encontrado ni un HTML bajo ${EN_DIR}. ` +
      `O el export no se ha generado, o las rutas en inglés han cambiado de sitio.`
  );
  process.exit(1);
}

let corregidos = 0;
const sinTocar = [];

for (const f of ficheros) {
  const html = await readFile(f, "utf8");
  // Sólo el `lang` de la etiqueta <html> de apertura, no cualquier
  // aparición de la cadena en el documento.
  const nuevo = html.replace(/(<html\b[^>]*?)\blang="es"/i, '$1lang="en"');
  if (nuevo !== html) {
    await writeFile(f, nuevo, "utf8");
    corregidos += 1;
  } else if (!/<html\b[^>]*?\blang="en"/i.test(html)) {
    // Ni estaba en español ni ha quedado en inglés: algo ha cambiado.
    sinTocar.push(f);
  }
}

if (sinTocar.length > 0) {
  console.error(
    `[postbuild-lang] ${sinTocar.length} página(s) en inglés sin un lang reconocible:\n  ` +
      sinTocar.join("\n  ")
  );
  process.exit(1);
}

console.log(
  `[postbuild-lang] lang="en" aplicado a ${corregidos} de ${ficheros.length} páginas inglesas.`
);
