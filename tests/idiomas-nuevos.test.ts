import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { TABLA_IDIOMAS, RUTAS_NUEVOS_IDIOMAS } from "@/lib/locale";

const SALIDA = join(process.cwd(), "out");

const TERMINOS_PERMITIDOS = new Set([
  // Marca y tecnología
  "countpips",
  "windows",
  "directx",
  "winui",
  "sqlite",
  "directwrite",
  "geistmono",
  "instrumentsans",
  "newsreader",
  "pc",
  "ram",
  "cpu",
  "ssd",
  "csv",
  "json",
  "api",
  "desktop",
  "offline",
  // Vocabulario y jerga de trading universal / nombres propios de plataformas
  "drawdown",
  "win",
  "rate",
  "prop",
  "firm",
  "firms",
  "sharpe",
  "sortino",
  "calmar",
  "cagr",
  "maxdd",
  "expectancy",
  "payoff",
  "mae",
  "mfe",
  "sqn",
  "kelly",
  "omega",
  "ulcer",
  "index",
  "pnl",
  "spread",
  "slippage",
  "tick",
  "stop",
  "loss",
  "take",
  "profit",
  "trading",
  "trades",
  "trade",
  "trader",
  "traders",
  "journal",
  "demo",
  "track",
  "record",
  "equity",
  "balance",
  "monte",
  "carlo",
  "tools",
  // Nombres propios de marcas / plataformas comparadas / ediciones
  "core",
  "playbook",
  "tradezella",
  "tradersync",
  "tradesviz",
  "tradervue",
  "excel",
  "sheets",
  "cloud",
  "server",
  "import",
  "export",
  "simulator",
  "support",
  "interactive",
  "brokers",
  "metatrader",
  "tradingview",
  "binance",
  "bybit",
]);

function extraerTextoMain(html: string): string {
  const match = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (!match) return "";
  return match[1]
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    // La FAQ y componentes legales/demo no se traducen en esta fase por especificación
    .replace(/<section\b[^>]*id=["'](?:pricing-faq|faq)["'][^>]*>[\s\S]*?<\/section>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extraerPalabrasSignificativas(texto: string): string[] {
  const limpio = texto
    .toLowerCase()
    .replace(/[\d$€%+\-·/×:—_(){}[\];,.;!?"'»«]/g, " ");
  const palabras = limpio.split(/\s+/).filter((w) => w.length >= 4);
  return palabras.filter((w) => !TERMINOS_PERMITIDOS.has(w));
}

function porcentajeIdentico(palabrasNuevo: string[], palabrasEn: string[]): number {
  if (palabrasNuevo.length === 0) return 0;
  const setEn = new Set(palabrasEn);
  let identicos = 0;
  for (const p of palabrasNuevo) {
    if (setEn.has(p)) identicos++;
  }
  return (identicos / palabrasNuevo.length) * 100;
}

function rutaFicheroHtml(lang: string, ruta: string): string {
  const seg = ruta === "/" ? "" : ruta.replace(/^\//, "");
  if (!seg) {
    return join(SALIDA, lang, "index.html");
  }
  return join(SALIDA, lang, seg, "index.html");
}

function extraerHtmlLang(html: string): string {
  const match = html.match(/<html[^>]+lang="([^"]+)"/i);
  return match ? match[1] : "";
}

describe("Guarda de idiomas nuevos (pt, fr, de, it)", () => {
  const idiomasNuevos = TABLA_IDIOMAS.filter(
    (i) => i.codigo !== "es" && i.codigo !== "en"
  );

  it("verifica las 8 páginas nuevas sobre out/", (ctx) => {
    if (!existsSync(SALIDA)) {
      ctx.skip();
      return;
    }

    const fallos: string[] = [];
    const textosPorRutaYIdioma: Record<string, Record<string, string[]>> = {};

    for (const ruta of RUTAS_NUEVOS_IDIOMAS) {
      textosPorRutaYIdioma[ruta] = {};

      const ficheroEn = rutaFicheroHtml("en", ruta);
      if (!existsSync(ficheroEn)) {
        fallos.push(`No existe la versión inglesa de referencia: ${ficheroEn}`);
        continue;
      }
      const htmlEn = readFileSync(ficheroEn, "utf8");
      const palabrasEn = extraerPalabrasSignificativas(extraerTextoMain(htmlEn));

      for (const info of idiomasNuevos) {
        const fichero = rutaFicheroHtml(info.codigo, ruta);
        if (!existsSync(fichero)) {
          fallos.push(`Falta el fichero generado para [${info.codigo}] en ${ruta}: ${fichero}`);
          continue;
        }

        const html = readFileSync(fichero, "utf8");

        // 1. Verificar lang del HTML
        const langDetectado = extraerHtmlLang(html);
        if (langDetectado !== info.htmlLang) {
          fallos.push(
            `El lang HTML de [${info.codigo}] en ${ruta} es "${langDetectado}", se esperaba "${info.htmlLang}"`
          );
        }

        // 2. Comparar textos visibles de <main> con la versión inglesa
        const palabrasNuevo = extraerPalabrasSignificativas(extraerTextoMain(html));
        textosPorRutaYIdioma[ruta][info.codigo] = palabrasNuevo;

        const ratio = porcentajeIdentico(palabrasNuevo, palabrasEn);
        if (ratio > 15) {
          fallos.push(
            `[${info.codigo}] en ${ruta} tiene un ${ratio.toFixed(1)}% de palabras idénticas al inglés (máximo permitido 15%)`
          );
        }
      }

      // 3. Verificar que dos idiomas nuevos no tengan el mismo texto entre sí
      for (let i = 0; i < idiomasNuevos.length; i++) {
        for (let j = i + 1; j < idiomasNuevos.length; j++) {
          const idA = idiomasNuevos[i].codigo;
          const idB = idiomasNuevos[j].codigo;
          const palabrasA = textosPorRutaYIdioma[ruta][idA];
          const palabrasB = textosPorRutaYIdioma[ruta][idB];

          if (palabrasA && palabrasB && palabrasA.length > 0 && palabrasB.length > 0) {
            const setB = new Set(palabrasB);
            let comunes = 0;
            for (const p of palabrasA) {
              if (setB.has(p)) comunes++;
            }
            const similitud = (comunes / Math.min(palabrasA.length, palabrasB.length)) * 100;
            if (similitud > 30) {
              fallos.push(
                `Los idiomas [${idA}] e [${idB}] en ${ruta} son demasiado idénticos entre sí (${similitud.toFixed(1)}% coincidencia)`
              );
            }
          }
        }
      }
    }

    expect(fallos, `Errores en la guarda de idiomas nuevos:\n${fallos.join("\n")}`).toEqual([]);
  });
});
