import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * COMPILAR NO PUEDE DEPENDER DE QUE GOOGLE CONTESTE.
 *
 * `next/font/google` no deja una etiqueta apuntando a un CDN: Next se
 * descarga el binario DURANTE LA COMPILACIÓN y luego lo sirve desde el
 * propio dominio. Eso es bueno para quien visita la web y malo para quien
 * la publica — si `fonts.gstatic.com` devuelve un 404, `bun run build`
 * falla, y el fallo no depende de nada que esté en este repositorio. Ya
 * ocurrió una vez y tumbó un despliegue.
 *
 * Las cuatro caras viven ahora en `src/app/fonts/` y se cargan con
 * `next/font/local`. Esta barrera existe porque el defecto que evita es
 * INVISIBLE mientras el tercero funcione: volver a escribir un
 * `next/font/google` compila en verde en local y en el 99 % de los
 * despliegues, y sólo revienta el día que no toca.
 *
 * Se rompió a propósito para comprobar que salta, en las dos direcciones:
 * reponiendo el `import { Newsreader } from "next/font/google"` en
 * `layout.tsx` (falla la primera prueba) y renombrando
 * `fonts/Newsreader.woff2` (falla la segunda).
 */

const RAIZ = process.cwd();
const DIR_FUENTES = join(RAIZ, "src", "app", "fonts");

/** Las cuatro caras que compone el sitio, y para qué es cada una. */
const CARAS = [
  { fichero: "InstrumentSans.woff2", papel: "sans de texto (--font-sans)" },
  { fichero: "Newsreader.woff2", papel: "serif de titulares (--font-serif)" },
  {
    fichero: "Newsreader-Italic.woff2",
    papel: "cursiva real de la serif, no una inclinación sintética",
  },
  { fichero: "GeistMono.woff2", papel: "cara de datos (--font-geist-mono)" },
];

/** Todos los `.ts`/`.tsx` de `src/`, recorridos a mano para no depender
 *  de ninguna utilidad de globbing. */
function fuentesDelProyecto(dir: string, acc: string[] = []): string[] {
  for (const entrada of readdirSync(dir)) {
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) fuentesDelProyecto(ruta, acc);
    else if (/\.tsx?$/.test(entrada)) acc.push(ruta);
  }
  return acc;
}

/**
 * Se busca la IMPORTACIÓN, no la mención. La primera versión de esta
 * prueba buscaba la subcadena suelta y señalaba a `layout.tsx`, cuyo
 * comentario nombra el módulo justo para explicar por qué ya no se usa:
 * una barrera que prohíbe hablar del defecto obliga a borrar la
 * explicación para pasar en verde, que es lo contrario de lo que quiere
 * este proyecto. Cubre las dos formas con las que un módulo puede
 * entrar de verdad — `from "…"` y `require("…")`.
 */
const IMPORTACION = /(?:from\s*|require\s*\(\s*)["']next\/font\/google["']/;

describe("las tipografías son del repositorio, no de un tercero", () => {
  it("ningún fichero de src/ importa next/font/google", () => {
    const culpables = fuentesDelProyecto(join(RAIZ, "src")).filter((f) =>
      IMPORTACION.test(readFileSync(f, "utf8"))
    );
    expect(
      culpables.map((f) => f.slice(RAIZ.length + 1).replace(/\\/g, "/"))
    ).toEqual([]);
  });

  it.each(CARAS)("$fichero está versionada — $papel", ({ fichero }) => {
    const tam = statSync(join(DIR_FUENTES, fichero)).size;
    // Un woff2 de una familia completa no baja de 15 KB. El umbral no
    // busca el tamaño exacto: busca que nadie deje en su sitio un fichero
    // vacío o un HTML de error renombrado y se quede tan tranquilo.
    expect(tam).toBeGreaterThan(15_000);
  });

  it("layout.tsx declara las tres variables CSS que lee globals.css", () => {
    const layout = readFileSync(join(RAIZ, "src", "app", "layout.tsx"), "utf8");
    for (const variable of ["--font-sans", "--font-serif", "--font-geist-mono"])
      expect(layout).toContain(`variable: "${variable}"`);
  });
});

/**
 * LA ESCALA DE CUERPO ESTÁ ESCRITA EN EL COMENTARIO DE `@theme` DE
 * `globals.css` — 10 · 11 · 12 · 13 · 14 · 15 px— y esa lista es la que
 * manda, no la memoria de quien la escribió. Sin una prueba que lea el
 * código, nada impide que aparezca un séptimo escalón la próxima vez que
 * un texto se ve «un pelín pequeño» y alguien teclea un número nuevo.
 *
 * EXCEPCIONES: cada entrada de abajo es un `{fichero, valor}` puntual, no
 * un permiso genérico para ese tamaño en cualquier sitio — un
 * `text-[17px]` nuevo en un fichero que no está en la lista sigue
 * rompiendo esta prueba, y también lo hace un `text-[17px]` DE MÁS en un
 * fichero que ya tenía uno permitido, porque se compara ocurrencia a
 * ocurrencia, no sólo por fichero.
 *
 *  · 22px y 28px (DashboardPage, GlosarioIndice, FeaturesBento): tamaños
 *    de TITULAR, no de cuerpo — la cifra protagonista de la demo y algún
 *    rótulo grande. Bajarlos a 15px cambiaría la jerarquía de esas
 *    pantallas; es una decisión tomada, no un olvido.
 *  · 17px en `legal/LegalDoc.tsx`: la entradilla del documento legal.
 *    Comparte estilo (sin negrita, `text-secondary`) con el párrafo de
 *    cuerpo que viene después en la misma página; bajarla a 15px la
 *    haría indistinguible de ese párrafo y borraría la única señal de
 *    que es la entradilla. Se decidió no tocarla.
 *  · El resto — 17px en FeaturesBento/GuardianNew/Navbar/SecuritySection
 *    y 20px en SessionClock —: huérfanos ya localizados que quedan fuera
 *    del alcance de la tanda que escribió esta prueba (sólo tocaba
 *    `legal/LegalDoc.tsx` y `glosario/TerminoVista.tsx`). Siguen
 *    pendientes de que otra tanda decida su escalón; quitar una fila de
 *    aquí sin arreglar antes el fichero vuelve a poner la prueba en rojo,
 *    que es la señal correcta.
 */
const ESCALA_CUERPO = [10, 11, 12, 13, 14, 15];

const EXCEPCIONES: Array<{ fichero: string; valor: number }> = [
  { fichero: "components/demo/pages/DashboardPage.tsx", valor: 28 },
  { fichero: "components/demo/pages/DashboardPage.tsx", valor: 22 },
  { fichero: "components/demo/pages/DashboardPage.tsx", valor: 28 },
  { fichero: "components/glosario/GlosarioIndice.tsx", valor: 22 },
  { fichero: "components/legal/LegalDoc.tsx", valor: 17 },
  { fichero: "components/marketing/FeaturesBento.tsx", valor: 22 },
  { fichero: "components/marketing/FeaturesBento.tsx", valor: 17 },
  { fichero: "components/marketing/FeaturesBento.tsx", valor: 17 },
  { fichero: "components/marketing/GuardianNew.tsx", valor: 17 },
  { fichero: "components/marketing/Navbar.tsx", valor: 17 },
  { fichero: "components/marketing/SecuritySection.tsx", valor: 17 },
  { fichero: "components/marketing/SessionClock.tsx", valor: 20 },
];

/** Todos los `.tsx` de `src/`, recorridos a mano igual que `fuentesDelProyecto`. */
function tsxDelProyecto(dir: string, acc: string[] = []): string[] {
  for (const entrada of readdirSync(dir)) {
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) tsxDelProyecto(ruta, acc);
    else if (entrada.endsWith(".tsx")) acc.push(ruta);
  }
  return acc;
}

/** Cada `text-[Npx]` fuera de la escala, como `"N px en fichero"`, en el
 *  mismo orden en que aparece — así una lista y otra se pueden comparar
 *  ocurrencia a ocurrencia y no sólo por conjunto. */
function huerfanosDelCuerpo(): string[] {
  const huerfanos: string[] = [];
  for (const fichero of tsxDelProyecto(join(RAIZ, "src"))) {
    const rel = fichero.slice(RAIZ.length + 1).replace(/\\/g, "/").replace(/^src\//, "");
    const contenido = readFileSync(fichero, "utf8");
    for (const m of contenido.matchAll(/text-\[(\d+)px\]/g)) {
      const valor = Number(m[1]);
      if (!ESCALA_CUERPO.includes(valor)) huerfanos.push(`${valor}px en ${rel}`);
    }
  }
  return huerfanos.sort();
}

describe("la escala de cuerpo no gana escalones por sorpresa", () => {
  it("todo text-[Npx] fuera de 10·11·12·13·14·15 está en la lista de excepciones conocida", () => {
    const esperados = EXCEPCIONES.map((e) => `${e.valor}px en ${e.fichero}`).sort();
    expect(
      huerfanosDelCuerpo(),
      "Escala de cuerpo documentada en el comentario de @theme de globals.css " +
        "(10·11·12·13·14·15 px). Un valor nuevo aquí es un tamaño inventado sin " +
        "decidirlo: añádelo a la escala a propósito o corrígelo al escalón más cercano."
    ).toEqual(esperados);
  });
});
