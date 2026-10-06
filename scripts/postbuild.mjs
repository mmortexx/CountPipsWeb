/**
 * Retoques sobre el sitio ya exportado (`out/`), ejecutados desde el script
 * `build`: el `lang` de las páginas inglesas, los ficheros de precarga con el
 * nombre que pide el navegador y las tarjetas sociales. Si algo no sale bien
 * rompe la compilación en vez de publicar el fallo.
 */
import { readdir, readFile, writeFile, copyFile, stat } from "node:fs/promises";
import { join } from "node:path";

const OUT = "out";

/* 1 · El idioma de las páginas en inglés.
   El layout raíz es el único que renderiza `<html>` y no sabe qué ruta sirve
   (con `output: "export"` tampoco hay cabeceras), así que el HTML saldría con
   `lang="es"` en las páginas inglesas aunque un script del navegador lo
   corrija luego. Importa a rastreadores sin JavaScript, previsualizaciones,
   traductores y lectores de pantalla. */
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

/* 2 · Ficheros de precarga.
   Next precarga la carga útil de cada enlace sobrevolado como un `.txt` y el
   export la deja en carpetas anidadas (`out/pricing/__next.pricing/__PAGE__.txt`),
   pero el navegador la pide con el nombre aplanado
   (`/pricing/__next.pricing.__PAGE__.txt`), que en un alojamiento estático da
   404. Se escribe junto a cada carpeta `__next.*` una copia con el nombre
   aplanado. Es aditiva: si Next cambia de convención, solo sobran ficheros pequeños. */
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
      // Lo que cuelga de la carpeta se copia un nivel arriba, con puntos en vez de barras.
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

/* 3 · Tarjetas para compartir: que existan y se sirvan como PNG.
   - Tipo de contenido: Next genera `opengraph-image` sin extensión y un
     alojamiento estático lo serviría como `application/octet-stream`, que
     las redes descartan. GitHub Pages ignora `public/_headers`, así que la
     única defensa es el nombre: se copia cada imagen a `<nombre>.png` y se
     reescriben las referencias del HTML y de los datos estructurados.
   - Imagen ausente: `opengraph-image.tsx` solo existe en algunos segmentos
     españoles y una página con su propio `openGraph` sin `images` no hereda
     nada. Se barren todas las páginas construidas y la que no lleve imagen
     recibe la del sitio. */

/* La raíz sale del canonical de la propia página: Open Graph exige URL
   absoluta y el canonical ya lo es. Es el canonical menos la ruta de la
   página, no solo el dominio, para no perder el prefijo del entorno. */
const raizDe = (html, relativa) => {
  const canonico = html.match(/<link rel="canonical" href="(https?:\/\/[^"]+)"/)?.[1];
  if (!canonico || !relativa.endsWith("index.html")) return null;
  const rutaPagina = `/${relativa.slice(0, -"index.html".length)}`;
  return canonico.endsWith(rutaPagina) ? canonico.slice(0, canonico.length - rutaPagina.length) : null;
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

// La imagen que hereda quien no tiene la suya, una por idioma.
const IMAGEN_POR_IDIOMA = {
  es: "/opengraph-image.png",
  en: "/en/opengraph-image.png",
};

// Si falta una de las dos, el reparto de abajo daría un 404 a decenas de páginas.
for (const [idioma, rutaImagen] of Object.entries(IMAGEN_POR_IDIOMA)) {
  const enDisco = join(OUT, rutaImagen.replace(/^\//, ""));
  try {
    await stat(enDisco);
  } catch {
    console.error(`[postbuild] falta la tarjeta social de «${idioma}»: ${enDisco}`);
    console.error("[postbuild] sin ella, las páginas de ese idioma heredarían un enlace roto");
    process.exit(1);
  }
}

const htmls = await ficheros(OUT, (n) => n.endsWith(".html"));
let conExtension = 0;
let conImagenAnadida = 0;

for (const ruta of htmls) {
  let html = await readFile(ruta, "utf8");
  const antes = html;

  // 1. Referencias existentes a `.png`; `(?!\.png)` evita duplicar la extensión si se ejecuta dos veces.
  html = html.replace(/(opengraph-image|twitter-image)(?!\.png)/g, "$1.png");

  // 2. La página sin imagen recibe la del sitio, justo antes de `</head>`.
  const faltaOg = !/property="og:image"/.test(html);
  const faltaTw = !/name="twitter:image"/.test(html);
  if (faltaOg || faltaTw) {
    // El idioma sale de la ruta del fichero, no del `<html lang>`, para no atar los dos pasos.
    const relativa = ruta.replace(/\\/g, "/").replace(new RegExp(`^${OUT}/`), "");
    const esIngles = relativa === "en/index.html" || relativa.startsWith("en/");
    const raiz = raizDe(html, relativa);
    if (!raiz) {
      console.error(`[postbuild] ${relativa} no trae imagen social ni un canonical del que sacar la raíz del sitio`);
      process.exit(1);
    }
    const imagen = `${raiz}${IMAGEN_POR_IDIOMA[esIngles ? "en" : "es"]}`;
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

// Guarda: una sola página sin imagen social, o una referencia sin extensión, para el despliegue.
const sinImagen = [];
for (const ruta of htmls) {
  const html = await readFile(ruta, "utf8");
  if (/\/(opengraph|twitter)-image(?!\.png)["'?]/.test(html)) {
    sinImagen.push(`${ruta} — referencia sin extensión`);
  } else if (!/property="og:image"/.test(html) || !/name="twitter:image"/.test(html)) {
    sinImagen.push(`${ruta} — sin og:image o sin twitter:image`);
  } else if (/(og:image|twitter:image)" content="\//.test(html)) {
    // Relativa: las redes la descartan.
    sinImagen.push(`${ruta} — imagen social con URL relativa`);
  } else {
    // La tarjeta debe estar en el idioma de su página: la de raíz es española.
    const relativa = ruta.replace(/\\/g, "/").replace(new RegExp(`^${OUT}/`), "");
    const esIngles = relativa === "en/index.html" || relativa.startsWith("en/");
    const m = html.match(/property="og:image" content="([^"]+)"/);
    if (m) {
      const camino = m[1].split("?")[0].replace(/^https?:\/\/[^/]+/, "");
      // Se busca `/en/` en cualquier posición y no tras el prefijo del entorno,
      // que está vacío en local mientras las URLs ya lo llevan desde `SITE_URL`.
      const bajoEn = /\/en\//.test(camino);
      if (esIngles !== bajoEn) {
        sinImagen.push(
          `${ruta} — tarjeta en el idioma equivocado: la página es ${esIngles ? "inglesa" : "española"} y anuncia ${camino}`,
        );
      }
    }
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
