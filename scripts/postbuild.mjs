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

/* ══════════════════════════════════════════════════════════════════════
   3. LAS TARJETAS PARA COMPARTIR — que existan, y que se sirvan como PNG
   ══════════════════════════════════════════════════════════════════════
   Dos fallos distintos que se sumaban hasta dejar el sitio sin UNA sola
   tarjeta social funcionando. Los dos se arreglan aquí, sobre el export,
   y hay que explicar por qué aquí y no en el origen.

   ── EL TIPO DE CONTENIDO ──────────────────────────────────────────────
   Next genera estas imágenes sin extensión: el fichero se llama
   `opengraph-image`, no `opengraph-image.png`. Un alojamiento estático
   deduce el tipo por la extensión, así que sin ella lo sirve como
   `application/octet-stream`, y Facebook, WhatsApp, LinkedIn y X
   descartan la miniatura.

   `public/_headers` ya lo corregía con un `Content-Type: image/png`… para
   Cloudflare Pages o Netlify. El despliegue real es GitHub Pages, que
   IGNORA ese fichero por completo. Comprobado contra el sitio publicado:
   la portada devuelve `content-type: application/octet-stream` sobre un
   PNG de 1200×630 perfectamente generado. Existía el mecanismo de
   control y no lo invocaba nadie.

   Como no hay cabeceras que dar, la única defensa es el nombre: se copia
   cada imagen a `<nombre>.png` y se reescriben las referencias del HTML
   —y de los datos estructurados, que llevan la misma URL—.

   ── LA IMAGEN QUE NO ESTABA ───────────────────────────────────────────
   De las 152 páginas de contenido, 142 no emitían `og:image` y las 76
   inglesas no emitían ninguna de las dos, mientras las 155 declaraban
   `twitter:card="summary_large_image"`: una tarjeta grande, sin imagen.
   La convención de fichero `opengraph-image.tsx` sólo existe en diez
   segmentos españoles, y una página que declara su propio bloque
   `openGraph` sin `images` no hereda nada.

   Se podría arreglar ruta por ruta en más de veinte ficheros de
   metadatos. Se hace aquí porque aquí es el único sitio donde se puede
   afirmar TODAS: se barren las 155 páginas construidas y la que no lleve
   imagen recibe la del sitio. Mismo criterio que el `lang` de las
   páginas inglesas, unas líneas más arriba.
   ══════════════════════════════════════════════════════════════════════ */

/** `/CountPipsWeb` en producción, vacío en local. */
const PREFIJO = process.env.NEXT_PUBLIC_BASE_PATH || "";

/* El origen se saca del canonical de la propia página y no de una
   constante: Open Graph exige URL ABSOLUTA —las redes no resuelven rutas
   relativas, simplemente descartan la imagen—, y el canonical ya es
   absoluto y ya es correcto en las 152 páginas. Sacarlo de ahí hace que
   esto siga funcionando el día que el sitio cambie de dominio. */
const origenDe = (html) => {
  const m = html.match(/<link rel="canonical" href="(https?:\/\/[^/]+)/);
  return m ? m[1] : "";
};

async function renombrarTarjetas(dir) {
  let renombradas = 0;
  const entradas = await readdir(dir, { withFileTypes: true });
  for (const e of entradas) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      renombradas += await renombrarTarjetas(p);
      continue;
    }
    if (e.name === "opengraph-image" || e.name === "twitter-image") {
      await copyFile(p, `${p}.png`);
      renombradas += 1;
    }
  }
  return renombradas;
}

const tarjetas = await renombrarTarjetas(OUT);

/* La imagen del sitio, que es la que hereda quien no tiene la suya. */
const RUTA_IMAGEN_SITIO = `${PREFIJO}/opengraph-image.png`;

const htmls = await ficheros(OUT, (n) => n.endsWith(".html"));
let conExtension = 0;
let conImagenAnadida = 0;

for (const ruta of htmls) {
  let html = await readFile(ruta, "utf8");
  const antes = html;

  /* 1. Las referencias existentes, a `.png`. El `(?!\.png)` evita
        volver a añadir la extensión si esto se ejecuta dos veces. */
  html = html.replace(/(opengraph-image|twitter-image)(?!\.png)/g, "$1.png");

  /* 2. La página que no declare imagen recibe la del sitio. Se inserta
        justo antes de `</head>`, que es donde viven las demás. */
  const faltaOg = !/property="og:image"/.test(html);
  const faltaTw = !/name="twitter:image"/.test(html);
  if (faltaOg || faltaTw) {
    const imagen = `${origenDe(html)}${RUTA_IMAGEN_SITIO}`;
    const etiquetas =
      (faltaOg
        ? `<meta property="og:image" content="${imagen}"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/>`
        : "") + (faltaTw ? `<meta name="twitter:image" content="${imagen}"/>` : "");
    html = html.replace("</head>", `${etiquetas}</head>`);
    conImagenAnadida += 1;
  }

  if (html !== antes) {
    await writeFile(ruta, html, "utf8");
    conExtension += 1;
  }
}

/* El guardián: si después de todo esto queda una sola página sin imagen
   social, o una referencia sin extensión, el despliegue se para. Es la
   diferencia entre arreglarlo hoy y que siga arreglado. */
const sinImagen = [];
for (const ruta of htmls) {
  const html = await readFile(ruta, "utf8");
  if (/\/(opengraph|twitter)-image(?!\.png)["'?]/.test(html)) {
    sinImagen.push(`${ruta} — referencia sin extensión`);
  } else if (!/property="og:image"/.test(html) || !/name="twitter:image"/.test(html)) {
    sinImagen.push(`${ruta} — sin og:image o sin twitter:image`);
  } else if (/(og:image|twitter:image)" content="\//.test(html)) {
    /* Relativa: las redes no la resuelven, la descartan. */
    sinImagen.push(`${ruta} — imagen social con URL relativa`);
  }
}
if (sinImagen.length) {
  console.error(`[postbuild] ${sinImagen.length} página(s) sin tarjeta social utilizable:`);
  for (const s of sinImagen.slice(0, 5)) console.error(`  ✗ ${s}`);
  process.exit(1);
}

console.log(
  `[postbuild] tarjetas sociales: ${tarjetas} imagen(es) servidas también como .png, ` +
    `${conExtension} página(s) reescritas, ${conImagenAnadida} que no tenían imagen ya la tienen.`
);
