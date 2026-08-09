/**
 * Retoques sobre el sitio ya exportado. Dos trabajos, los dos con la
 * misma regla: si algo no sale bien, ROMPER la compilación en vez de
 * publicar el fallo.
 *
 *   1. El atributo `lang` de las páginas en inglés.
 *   2. Los ficheros de precarga que el navegador pide y el export no
 *      deja donde los busca.
 *
 * Se ejecuta desde el script `build` del package.json.
 */
import { readdir, readFile, writeFile, copyFile, stat } from "node:fs/promises";
import { join } from "node:path";

const OUT = "out";

/* ════════════════════════════════════════════════════════════════════
   1 · EL IDIOMA DE LAS PÁGINAS EN INGLÉS
   ════════════════════════════════════════════════════════════════════
   Las 154 páginas se servían con `<html lang="es">`, incluidas las 76
   escritas en inglés. Lo corregía un script que corre en el navegador,
   así que el HTML que sale del servidor seguía diciendo "esto está en
   español" mientras el `hreflang` del mismo documento decía lo
   contrario. Importa a los rastreadores que no ejecutan JavaScript, a
   las previsualizaciones de enlaces, a los traductores y a un lector de
   pantalla que procese el documento antes de que corra el script — que
   lo pronuncia con fonética española.

   Se arregla aquí y no en el layout porque en el App Router de Next
   SÓLO el layout raíz renderiza `<html>`, y no sabe qué ruta sirve: no
   recibe la ruta y, con `output: "export"`, tampoco hay cabeceras que
   consultar. La vía del framework serían dos layouts raíz con grupos de
   rutas, lo que obliga a mover 42 ficheros de página y partir en dos un
   layout de 390 líneas. Mucho riesgo sobre 154 rutas indexadas para
   cambiar dos letras. */
const EN_DIR = join(OUT, "en");

async function ficheros(dir, filtro) {
  let entradas;
  try {
    entradas = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out = [];
  for (const e of entradas) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await ficheros(p, filtro)));
    else if (filtro(e.name)) out.push(p);
  }
  return out;
}

const paginasEn = await ficheros(EN_DIR, (n) => n.endsWith(".html"));

if (paginasEn.length === 0) {
  console.error(
    `[postbuild] No hay ni un HTML bajo ${EN_DIR}. O el export no se ha generado, o las rutas en inglés han cambiado de sitio.`
  );
  process.exit(1);
}

let idiomaCorregido = 0;
const idiomaSinTocar = [];
for (const f of paginasEn) {
  const html = await readFile(f, "utf8");
  const nuevo = html.replace(/(<html\b[^>]*?)\blang="es"/i, '$1lang="en"');
  if (nuevo !== html) {
    await writeFile(f, nuevo, "utf8");
    idiomaCorregido += 1;
  } else if (!/<html\b[^>]*?\blang="en"/i.test(html)) {
    idiomaSinTocar.push(f);
  }
}
if (idiomaSinTocar.length > 0) {
  console.error(
    `[postbuild] ${idiomaSinTocar.length} página(s) en inglés sin un lang reconocible:\n  ` +
      idiomaSinTocar.join("\n  ")
  );
  process.exit(1);
}
console.log(
  `[postbuild] lang="en" aplicado a ${idiomaCorregido} de ${paginasEn.length} páginas inglesas.`
);

/* ════════════════════════════════════════════════════════════════════
   2 · LOS FICHEROS DE PRECARGA, DONDE EL NAVEGADOR LOS BUSCA
   ════════════════════════════════════════════════════════════════════
   Next precarga la ruta de cada enlace al pasar el ratón por encima,
   pidiendo su carga útil como un `.txt`. En este export las deja en
   CARPETAS anidadas:

       out/pricing/__next.pricing/__PAGE__.txt

   y el navegador las pide con el nombre APLANADO, con puntos en vez de
   barras:

       /pricing/__next.pricing.__PAGE__.txt

   En un alojamiento estático —que es exactamente lo que son Cloudflare
   Pages y GitHub Pages— ese fichero no existe, así que CADA enlace que
   se sobrevuela lanza un 404. No rompe la navegación (Next se cae con
   elegancia a la carga completa), pero significa que la precarga no ha
   funcionado nunca en producción: se paga la petición y no se cobra el
   beneficio, y la consola de cualquier visitante se llena de errores.

   Lo detectó `scripts/humo.mjs` al pasar la comprobación contra el
   sitio construido en vez de contra el servidor de desarrollo — hasta
   entonces era invisible.

   Aquí se escribe, junto a cada carpeta `__next.*`, una copia con el
   nombre aplanado que el cliente pide de verdad. Es aditivo: si algún
   día Next cambia de convención, sobran unos ficheros de texto de un
   par de kilobytes y no se rompe nada. */
async function aplanarPrecargas(dir) {
  let entradas;
  try {
    entradas = await readdir(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  let copias = 0;
  for (const e of entradas) {
    const p = join(dir, e.name);
    if (!e.isDirectory()) continue;
    if (e.name.startsWith("__next.")) {
      // Todo lo que cuelgue de esta carpeta se copia al nivel de arriba
      // con las barras convertidas en puntos.
      const dentro = await ficheros(p, () => true);
      for (const f of dentro) {
        const relativo = f.slice(p.length + 1).split(/[\\/]/).join(".");
        const destino = join(dir, `${e.name}.${relativo}`);
        try {
          await stat(destino);
        } catch {
          await copyFile(f, destino);
          copias += 1;
        }
      }
    }
    copias += await aplanarPrecargas(p);
  }
  return copias;
}

const copias = await aplanarPrecargas(OUT);
console.log(`[postbuild] ${copias} fichero(s) de precarga copiados con el nombre que pide el navegador.`);
