/**
 * EQUIPAJE: lee los `<script src>` de todas las páginas compiladas y busca en
 * esos ficheros dos módulos que solo deben viajar adonde se usan:
 *  1. La librería de avisos emergentes (Radix Toast): solo la demo lanza
 *     avisos y va dentro de su módulo, que se baja al montarse; no puede estar
 *     en el arranque de ninguna página.
 *  2. El diccionario completo del glosario: solo lo necesita el índice de
 *     /glosario, que filtra en el navegador.
 * Cada módulo se reconoce por una cadena que la minificación no toca: la
 * etiqueta por defecto de Radix («({hotkey})») y un término del diccionario
 * («Wald-Wolfowitz»). Si una marca deja de existir en el sitio, la guarda
 * falla y hay que buscar otra. No mira lo que se descarga después, al abrir
 * una ventana.
 *
 * Uso:  node scripts/equipaje.mjs out
 */
import { readFileSync, globSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv.slice(2).find((a) => !a.startsWith("-")) || "out";
if (!existsSync(dir)) {
  console.log(`[equipaje] no encuentro el directorio «${dir}». ¿Falta compilar el sitio con \`npm run build\`?`);
  process.exit(1);
}
const PREFIJO = process.env.NEXT_PUBLIC_BASE_PATH || "";

const MODULOS = [
  {
    // Ni siquiera en /demo: viaja con su módulo, que se descarga al montarse (la precarga de Next desde la barra lo traería).
    nombre: "la librería de avisos emergentes",
    marca: "({hotkey})",
    permitida: () => false,
    donde: "en ninguna: va con el módulo de la demo",
  },
  {
    nombre: "el diccionario entero del glosario",
    marca: "Wald-Wolfowitz",
    permitida: (ruta) => /^\/(en\/)?glosario\/$/.test(ruta),
    donde: "solo en el índice de /glosario",
  },
];

const cache = new Map();
const leeChunk = (src) => {
  if (!cache.has(src)) {
    const rel = src.startsWith(PREFIJO) ? src.slice(PREFIJO.length) : src;
    const f = join(dir, rel);
    cache.set(src, existsSync(f) ? { texto: readFileSync(f, "utf8"), bytes: statSync(f).size } : null);
  }
  return cache.get(src);
};

const ficheros = globSync(`${dir}/**/index.html`);
const fallos = new Map();
const pesos = [];
let sinChunk = 0;
for (const f of ficheros) {
  const ruta = "/" + f.replace(/\\/g, "/").slice(dir.length + 1).replace(/index\.html$/, "");
  const html = readFileSync(f, "utf8");
  const srcs = [...new Set([...html.matchAll(/<script[^>]*\ssrc="([^"]+\.js)"/g)].map((m) => m[1]))];
  let bytes = 0;
  for (const src of srcs) {
    const c = leeChunk(src);
    if (!c) {
      sinChunk++;
      continue;
    }
    bytes += c.bytes;
    for (const m of MODULOS) {
      if (!m.permitida(ruta) && c.texto.includes(m.marca)) {
        if (!fallos.has(m)) fallos.set(m, new Set());
        fallos.get(m).add(ruta);
      }
    }
  }
  pesos.push({ ruta, bytes, n: srcs.length });
}

pesos.sort((a, b) => a.bytes - b.bytes);
const kb = (b) => `${(b / 1024).toFixed(1).replace(".", ",")} KB`;
const mediana = pesos[Math.floor(pesos.length / 2)];
console.log(`[equipaje] ${pesos.length} páginas · JavaScript al cargar, sin comprimir:`);
console.log(`   la más ligera  ${kb(pesos[0].bytes)}  ${pesos[0].ruta}`);
console.log(`   la mediana     ${kb(mediana.bytes)}  ${mediana.ruta}`);
console.log(`   la más pesada  ${kb(pesos.at(-1).bytes)}  ${pesos.at(-1).ruta}`);

let problemas = 0;
for (const [m, rutas] of fallos) {
  problemas += rutas.size;
  const lista = [...rutas].sort();
  console.log(`\n  ${m.nombre} viaja a ${lista.length} página(s); debe ir ${m.donde}:`);
  for (const r of lista.slice(0, 8)) console.log(`     ${r}`);
  if (lista.length > 8) console.log(`     … y ${lista.length - 8} más`);
}
// Una guarda de ausencias aprueba sola si deja de leer: sin scripts resueltos no ha mirado nada, y sin la marca no reconocería el módulo.
const todos = globSync(`${dir}/_next/static/chunks/**/*.js`).map((f) => readFileSync(f, "utf8"));
for (const m of MODULOS) {
  if (!todos.some((t) => t.includes(m.marca))) {
    console.log(`[equipaje] ningún fichero del sitio contiene «${m.marca}»: la guarda ya no reconoce ${m.nombre}; busca otra marca`);
    process.exit(1);
  }
}
if (pesos.every((p) => p.bytes === 0)) {
  console.log(`[equipaje] no resolví ningún <script src> en ${dir}: la guarda no está leyendo los ficheros (¿prefijo ${PREFIJO || "vacío"}?)`);
  process.exit(1);
}
if (sinChunk) console.log(`[equipaje] aviso: ${sinChunk} referencias a scripts que no están en ${dir}`);
if (problemas) {
  console.log(`\n[equipaje] ${problemas} página(s) cargan lo que no usan`);
  process.exit(1);
}
console.log("[equipaje] correcto — ni los avisos ni el diccionario viajan adonde no se usan");
