import { describe, expect, it } from "vitest";
import { GLOSSARY, GLOSSARY_CATEGORIES } from "@/lib/trading/glossary";
import { FORMULAS_GLOSARIO, CATEGORIAS as CATEGORIAS_GLOSARIO, SEGUIR_LEYENDO } from "@/lib/glosario";
import { FAQ_EN, PRICING_FAQ_EN } from "@/lib/faq";
import { LAMINAS_PRODUCTO } from "@/lib/laminas";
import { STR } from "@/lib/i18n";

/**
 * ORTOGRAFÍA BRITÁNICA EN EL TEXTO INGLÉS VISIBLE.
 *
 * ── Qué vigila ─────────────────────────────────────────────────────────
 * El inglés de CountPips se declara británico (openGraph en_GB, "Minimise"
 * en los botones de Windows). Una lista cerrada de raíces americanas
 * conocidas —"-ize", "defense", "color", "behavior", "favor", "center",
 * "catalog"— no puede aparecer en ningún campo `en` / `Es`-menos de los
 * catálogos de contenido: el glosario, sus fórmulas, la FAQ, las láminas
 * del producto y las cadenas de `i18n.tsx`.
 *
 * ── Excepciones ────────────────────────────────────────────────────────
 * Los nombres propios de términos técnicos que llevan la ortografía
 * americana congelada en el propio nombre («MFE (Maximum Favorable
 * Excursion)», «MAE (Maximum Adverse Excursion)») se excluyen explícita y
 * únicamente por ese literal — no abren la puerta a nuevas excepciones sin
 * tocar esta lista.
 *
 * ── Qué la deja ciega ──────────────────────────────────────────────────
 * Esta prueba solo ve las raíces de la lista cerrada. Una palabra
 * americana que no esté en ella (p. ej. "modeling" con una "l", o
 * "program" en vez de "programme") pasa desapercibida. Ensancharla es
 * trabajo manual cada vez que se detecta una nueva a mano.
 */

const RAICES_AMERICANAS = [
  "penaliz",
  "annualiz",
  "summariz",
  "normaliz",
  "optimiz",
  "analyz",
  "realiz",
  "recogniz",
  "organiz",
  "minimiz",
  "maximiz",
  "standardiz",
  "prioritiz",
  "defense",
  "color",
  "behavior",
  "favor",
  "center",
  "catalog",
];

const EXCEPCIONES = ["Maximum Favorable Excursion", "Maximum Adverse Excursion"];

type Campo = { origen: string; texto: string };

function limpiarExcepciones(texto: string): string {
  return EXCEPCIONES.reduce((acc, ex) => acc.split(ex).join(""), texto);
}

function raicesEncontradas(texto: string): string[] {
  const limpio = limpiarExcepciones(texto).toLowerCase();
  return RAICES_AMERICANAS.filter((raiz) => limpio.includes(raiz));
}

const CAMPOS: Campo[] = [];

function agregar(origen: string, texto: unknown): void {
  if (typeof texto === "string") CAMPOS.push({ origen, texto });
}

GLOSSARY.forEach((t, i) => {
  // `term` es siempre inglés (ver la cabecera de glossary.ts): también se
  // recorre, y es lo que hace que la lista de EXCEPCIONES tenga un caso
  // real que probar — «MFE (Maximum Favorable Excursion)» solo pasa
  // gracias a ella.
  agregar(`glossary.ts GLOSSARY[${i}].term`, t.term);
  agregar(`glossary.ts GLOSSARY[${i}] "${t.term}".en`, t.en);
});
GLOSSARY_CATEGORIES.forEach((c, i) => agregar(`glossary.ts GLOSSARY_CATEGORIES[${i}] "${c.id}".en`, c.en));

Object.entries(FORMULAS_GLOSARIO).forEach(([slug, f]) => {
  agregar(`glosario.ts FORMULAS_GLOSARIO["${slug}"].formulaEn`, f.formulaEn);
  agregar(`glosario.ts FORMULAS_GLOSARIO["${slug}"].variablesEn`, f.variablesEn);
});
Object.entries(CATEGORIAS_GLOSARIO).forEach(([cat, c]) => {
  agregar(`glosario.ts CATEGORIAS["${cat}"].en`, c.en);
  agregar(`glosario.ts CATEGORIAS["${cat}"].descEn`, c.descEn);
});
Object.entries(SEGUIR_LEYENDO).forEach(([cat, s]) => {
  agregar(`glosario.ts SEGUIR_LEYENDO["${cat}"].en`, s.en);
});

FAQ_EN.forEach((qa, i) => {
  agregar(`faq.ts FAQ_EN[${i}].q`, qa.q);
  agregar(`faq.ts FAQ_EN[${i}].a`, qa.a);
});
PRICING_FAQ_EN.forEach((qa, i) => {
  agregar(`faq.ts PRICING_FAQ_EN[${i}].q`, qa.q);
  agregar(`faq.ts PRICING_FAQ_EN[${i}].a`, qa.a);
});

Object.entries(LAMINAS_PRODUCTO).forEach(([slug, l]) => {
  agregar(`laminas.ts LAMINAS_PRODUCTO["${slug}"].pestanaEn`, l.pestanaEn);
  agregar(`laminas.ts LAMINAS_PRODUCTO["${slug}"].tituloEn`, l.tituloEn);
  agregar(`laminas.ts LAMINAS_PRODUCTO["${slug}"].notaEn`, l.notaEn);
  agregar(`laminas.ts LAMINAS_PRODUCTO["${slug}"].altEn`, l.altEn);
  agregar(`laminas.ts LAMINAS_PRODUCTO["${slug}"].detalleEn`, l.detalleEn);
});

Object.entries(STR).forEach(([clave, valor]) => {
  agregar(`i18n.tsx STR.${clave}.en`, (valor as { en?: unknown }).en);
});

describe("ortografía británica del texto inglés visible", () => {
  it("recorre al menos los campos ingleses de los cinco catálogos", () => {
    // Guarda contra un cambio de forma en los datos que vacíe el barrido
    // sin que ningún otro assert se entere.
    expect(CAMPOS.length).toBeGreaterThan(200);
  });

  it("no contiene ninguna raíz americana de la lista cerrada", () => {
    const fallos = CAMPOS.flatMap(({ origen, texto }) =>
      raicesEncontradas(texto).map((raiz) => `${origen}: "${raiz}" en → ${JSON.stringify(texto)}`),
    );
    expect(fallos, fallos.join("\n")).toEqual([]);
  });
});
