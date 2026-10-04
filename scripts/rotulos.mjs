/**
 * RÓTULOS — lo que oye quien no ve la pantalla
 *
 * ── Qué mide ──────────────────────────────────────────────────────────
 * En el HTML compilado de TODAS las páginas, seis cosas que con la vista
 * no se notan y con un lector de pantalla dejan la herramienta muda:
 *
 *  1. Grupos de opciones sin nombre. El lector entra en «grupo» y anuncia
 *     «Forex, activado» sin decir a qué pregunta responde.
 *  2. Nombres que apuntan a nada: `aria-labelledby` o `aria-describedby`
 *     con un id que no existe en la página.
 *  3. Botones sin nombre: un icono suelto se oye como «botón» y nada más.
 *  4. Elecciones sin estado: dentro de un grupo de opciones, un botón que
 *     no dice si está elegido. La opción vigente solo se distinguía por
 *     un fondo gris.
 *  5. Deslizadores que leen el número crudo («10000») mientras la
 *     pantalla dice «10.000 $».
 *  6. Rótulos en inglés en una página española («Close», «Notifications»).
 *
 * ── Qué encontró el día que se escribió (2026-10-04) ──────────────────
 * 23 grupos sin nombre en las páginas españolas, 26 deslizadores sin
 * valor legible, el selector compuesto/riesgo fijo del proyector sin
 * estado y la región «Notifications (F8)» en inglés en todas las páginas.
 *
 * ── Por qué sin navegador ─────────────────────────────────────────────
 * Es el HTML que llega antes de que corra ningún script, que es también
 * lo primero que lee un lector. React lo escribe bien formado, así que
 * basta seguir la pila de etiquetas; los diálogos y avisos que solo
 * existen tras un clic los cubre teclado.mjs.
 *
 * Uso:  node scripts/rotulos.mjs out   (--todo para la lista entera)
 */
import { readFileSync, globSync, existsSync } from "node:fs";

const dir = process.argv.slice(2).find((a) => !a.startsWith("-")) || "out";
if (!existsSync(dir)) {
  console.log(`[rotulos] no encuentro el directorio «${dir}». ¿Falta compilar el sitio con \`npm run build\`?`);
  process.exit(1);
}

const VACIAS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
const GRUPOS = new Set(["group", "radiogroup", "tablist", "toolbar"]);
const CON_ESTADO = ["aria-pressed", "aria-checked", "aria-selected", "aria-current", "aria-expanded"];
const INGLES = /^(close|dismiss|open|menu|search|next|previous|back|loading|toggle\b.*|notifications?\b.*)$/i;

const atributos = (s) => {
  const a = {};
  for (const m of s.matchAll(/([\w:.-]+)(?:\s*=\s*"([^"]*)")?/g)) a[m[1].toLowerCase()] = m[2] ?? "";
  return a;
};

/** Árbol mínimo: cada nodo con etiqueta, atributos, hijos y texto propio. */
function arbol(html) {
  const limpio = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|template)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
  const raiz = { tag: "#raiz", attr: {}, hijos: [], texto: "" };
  const pila = [raiz];
  let ultimo = 0;
  for (const m of limpio.matchAll(/<(\/?)([a-zA-Z][\w-]*)((?:"[^"]*"|[^>"])*)>/g)) {
    pila.at(-1).texto += limpio.slice(ultimo, m.index);
    ultimo = m.index + m[0].length;
    const tag = m[2].toLowerCase();
    if (m[1]) {
      const i = pila.findLastIndex((n) => n.tag === tag);
      if (i > 0) pila.length = i;
      continue;
    }
    const nodo = { tag, attr: atributos(m[3].replace(/\/\s*$/, "")), hijos: [], texto: "", padre: pila.at(-1) };
    pila.at(-1).hijos.push(nodo);
    if (!VACIAS.has(tag) && !/\/\s*$/.test(m[3])) pila.push(nodo);
  }
  return raiz;
}

function* recorre(n) {
  for (const h of n.hijos) {
    yield h;
    yield* recorre(h);
  }
}

const textoDe = (n) =>
  n.attr["aria-hidden"] === "true" ? "" : (n.texto + n.hijos.map(textoDe).join(" ")).replace(/&nbsp;|&#160;/g, " ").trim();

const nombreDe = (n) =>
  n.attr["aria-label"]?.trim() || n.attr["aria-labelledby"] || n.attr.title?.trim() || textoDe(n) ||
  [...recorre(n)].find((h) => h.tag === "img" && h.attr.alt)?.attr.alt || "";

const grupoDe = (n) => {
  for (let p = n.padre; p; p = p.padre) if (GRUPOS.has(p.attr.role)) return p;
  return null;
};

const TODO = process.argv.includes("--todo");
const fallos = [];
const anota = (regla, ruta, detalle) => fallos.push({ regla, ruta, detalle });

const ficheros = globSync(`${dir}/**/*.html`);
for (const f of ficheros) {
  const html = readFileSync(f, "utf8");
  const ruta = "/" + f.replace(/\\/g, "/").slice(dir.length + 1).replace(/(^|\/)index\.html$/, "$1");
  const lang = /<html[^>]*\blang="([^"]+)"/.exec(html)?.[1] ?? "";
  const raiz = arbol(html);
  const nodos = [...recorre(raiz)];
  const ids = new Set(nodos.map((n) => n.attr.id).filter(Boolean));
  const corto = (n) => (textoDe(n) || n.attr.class || "").slice(0, 50);

  for (const n of nodos) {
    const a = n.attr;
    if (GRUPOS.has(a.role) && !a["aria-label"]?.trim() && !a["aria-labelledby"])
      anota("grupo de opciones sin nombre", ruta, `role="${a.role}" — «${corto(n)}»`);

    for (const clave of ["aria-labelledby", "aria-describedby"])
      for (const id of (a[clave] ?? "").split(/\s+/).filter(Boolean))
        if (!ids.has(id)) anota("nombre que apunta a nada", ruta, `${clave}="${id}" — «${corto(n)}»`);

    const esBoton = n.tag === "button" || a.role === "button";
    if (esBoton && !nombreDe(n)) anota("botón sin nombre", ruta, `«${a.class?.slice(0, 50) ?? n.tag}»`);

    if (esBoton && !a.role) {
      const g = grupoDe(n);
      if (g && !CON_ESTADO.some((k) => k in a))
        anota("elección sin estado", ruta, `«${corto(n)}» en el grupo «${g.attr["aria-label"] ?? g.attr["aria-labelledby"] ?? "?"}»`);
    }

    if (n.tag === "input" && a.type === "range" && !a["aria-valuetext"])
      anota("deslizador sin valor legible", ruta, `«${a["aria-label"] ?? a.id ?? "?"}» lee «${a.value ?? a["aria-valuenow"] ?? "?"}»`);

    if (lang.startsWith("es")) {
      const rotulo = a["aria-label"]?.trim();
      if (rotulo && INGLES.test(rotulo)) anota("rótulo en inglés en una página española", ruta, `aria-label="${rotulo}"`);
      if (/\bsr-only\b/.test(a.class ?? "") && INGLES.test(textoDe(n)))
        anota("rótulo en inglés en una página española", ruta, `texto oculto «${textoDe(n)}»`);
    }
  }
}

const porRegla = {};
for (const f of fallos) (porRegla[f.regla] ||= []).push(f);
for (const [regla, casos] of Object.entries(porRegla)) {
  const rutas = new Set(casos.map((c) => c.ruta));
  console.log(`\n  ${regla} — ${casos.length} caso(s) en ${rutas.size} página(s)`);
  const vistos = new Map();
  for (const c of casos) vistos.set(c.detalle, [...(vistos.get(c.detalle) ?? []), c.ruta]);
  for (const [detalle, rs] of [...vistos].slice(0, TODO ? Infinity : 12))
    console.log(`    ${rs[0]}${rs.length > 1 ? ` (+${rs.length - 1})` : ""}  ${detalle}`);
  if (!TODO && vistos.size > 12) console.log(`    … y ${vistos.size - 12} más`);
}
console.log(`\n[rotulos] ${ficheros.length} páginas, ${fallos.length} fallo(s)`);
process.exit(fallos.length ? 1 : 0);
