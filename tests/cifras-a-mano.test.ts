import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { GLOSSARY } from "@/lib/trading/glossary";
import { PRECIO_CORE, PRECIO_PRO } from "@/lib/precios";
import { TERMINOS_GLOSARIO } from "@/lib/producto";
import { fmtMoney } from "@/lib/trading/format";

const RAIZ = join(import.meta.dirname, "..");

/* Ficheros de `src/` medidos al escribir la prueba (265). El margen deja
   borrar algunos sin tocar esta cifra; si baja de ahí, el recorrido se ha
   quedado ciego. */
const FICHEROS_HOY = 265;
const MARGEN = 15;

function fuentes(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const ruta = join(dir, e);
    if (statSync(ruta).isDirectory()) fuentes(ruta, out);
    else if (/\.(ts|tsx)$/.test(e)) out.push(ruta);
  }
  return out;
}

/* El espacio puede ser el carácter real o el escape `\u00a0` del código fuente. */
const PRECIO_A_MANO = /(?<!\d[.,]?)(?:149|249)(?:\s|\\u00a0)*(?:\$|USD\b)|\$(?:\s|\\u00a0)*(?:149|249)(?!\d|[.,]\d)/;
const TERMINOS_A_MANO = /(?<!\d[.,]?)57(?:\s|\\u00a0)+(?:términos|terms|termos|termes|Begriffe|termini)\b/i;
const METRICAS_A_MANO = /(?<![\d.,])40\+|(?<!\p{L})(?:más de|over|mais de|plus de|über|oltre)\s+40(?!\d)/iu;
const CUENTAS_A_MANO = /(?<![\d.,])2(?:\s|\\u00a0)+(?:[\p{L}-]+(?:\s+|-))?(?:cuentas|accounts|contas|comptes|Konten|conti)\b/iu;

function hallazgos(archivos: string[], patron: RegExp, excepto: string[] = []): string[] {
  const out: string[] = [];
  for (const f of archivos) {
    const rel = relative(RAIZ, f).split(sep).join("/");
    if (excepto.includes(rel)) continue;
    readFileSync(f, "utf8")
      .split(/\r?\n/)
      .forEach((linea, i) => {
        const m = linea.match(patron);
        if (m) out.push(`${rel}:${i + 1}  ${m[0]}`);
      });
  }
  return out;
}

describe("los patrones cazan lo que deben y nada más", () => {
  it.each([
    "Core 149\\u00a0$ y Pro 249\\u00a0$",
    "Core 149 $",
    "Core $149 and Pro $249.",
    "Pro 249 USD",
  ])("«%s» es un precio a mano", (linea) => {
    expect(PRECIO_A_MANO.test(linea)).toBe(true);
  });
  it.each(["[150.2, 149.9, 150.8]", "1149 $", "$1,149", "tiene 149 casos"])("«%s» no lo es", (linea) => {
    expect(PRECIO_A_MANO.test(linea)).toBe(false);
  });
  it.each(["57 términos explicados", "57\\u00a0terms explained", "57 Begriffe", "57 termini"])(
    "«%s» es un recuento a mano",
    (linea) => {
      expect(TERMINOS_A_MANO.test(linea)).toBe(true);
    }
  );
  it.each(["157 términos", "tiene 57 casos"])("«%s» no lo es", (linea) => {
    expect(TERMINOS_A_MANO.test(linea)).toBe(false);
  });
  it.each(["40+ métricas", "\"40+\"", "Más de 40 métricas", "Over 40 institutional", "Über 40"])(
    "«%s» es el recuento de métricas a mano",
    (linea) => {
      expect(METRICAS_A_MANO.test(linea)).toBe(true);
    }
  );
  it.each(["140+ ms", "más de 400", "h-40 md", "0.40+x"])("«%s» no lo es", (linea) => {
    expect(METRICAS_A_MANO.test(linea)).toBe(false);
  });
  it.each(["2 cuentas de trading", "2 trading accounts", "2 contas de trading", "2 comptes de trading", "2 Trading-Konten", "2 conti di trading"])(
    "«%s» es el número de cuentas a mano",
    (linea) => {
      expect(CUENTAS_A_MANO.test(linea)).toBe(true);
    }
  );
  it.each(["12 cuentas", "tiene 2 casos", "2,5 cuentas"])("«%s» no lo es", (linea) => {
    expect(CUENTAS_A_MANO.test(linea)).toBe(false);
  });
});

describe("ninguna cifra de precio ni de glosario se escribe a mano en src/", () => {
  const archivos = fuentes(join(RAIZ, "src"));

  it("recorre todo src/, no una lista de rutas", () => {
    expect(archivos.length, `ficheros recorridos: ${archivos.length}`).toBeGreaterThanOrEqual(FICHEROS_HOY - MARGEN);
  });

  it("149 y 249 con símbolo de dólar salen de precios.ts", () => {
    const sueltos = hallazgos(archivos, PRECIO_A_MANO, ["src/lib/precios.ts"]);
    expect(sueltos, sueltos.join("\n")).toEqual([]);
  });

  it("«57 términos» y sus variantes salen de TERMINOS_GLOSARIO", () => {
    const sueltos = hallazgos(archivos, TERMINOS_A_MANO);
    expect(sueltos, sueltos.join("\n")).toEqual([]);
  });

  it("«40+» y «más de 40» salen de PROGRAMA.metricasMinimo", () => {
    const sueltos = hallazgos(archivos, METRICAS_A_MANO, ["src/lib/producto.ts"]);
    expect(sueltos, sueltos.join("\n")).toEqual([]);
  });

  it("«2 cuentas» y sus variantes salen de PROGRAMA.cuentasCore", () => {
    const sueltos = hallazgos(archivos, CUENTAS_A_MANO);
    expect(sueltos, sueltos.join("\n")).toEqual([]);
  });
});

describe("las cifras que salen de precios.ts siguen diciendo lo mismo", () => {
  it.each([
    ["es", "149\u00a0$", "249\u00a0$"],
    ["en", "$149", "$249"],
    ["fr", "149\u00a0$", "249\u00a0$"],
    ["de", "149\u00a0$", "249\u00a0$"],
    ["it", "149\u00a0$", "249\u00a0$"],
  ] as const)("%s: Core y Pro como se leían antes", (lang, core, pro) => {
    expect(fmtMoney(PRECIO_CORE, lang, { decimals: 0 })).toBe(core);
    expect(fmtMoney(PRECIO_PRO, lang, { decimals: 0 })).toBe(pro);
  });

  /* En Brasil «$ 149» se lee como reales: el dólar se escribe «US$». */
  it("pt: el dólar con su «US$», en precios, negativos y cifras cortas", () => {
    expect(fmtMoney(PRECIO_CORE, "pt", { decimals: 0 })).toBe("US$ 149");
    expect(fmtMoney(-1234.5, "pt")).toBe("−US$ 1.234,50");
    expect(fmtMoney(3_000_000, "pt", { compact: true })).toBe("US$ 3 mi");
  });
});

describe("TERMINOS_GLOSARIO es el número real de términos", () => {
  it("coincide con las entradas de GLOSSARY", () => {
    expect(TERMINOS_GLOSARIO).toBe(GLOSSARY.length);
  });
});
