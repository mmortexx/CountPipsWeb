import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { componerInforme } from "@/lib/informe";
import { SITE_URL } from "@/lib/site";

const RAIZ = join(import.meta.dirname, "..");

function fuentes(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const ruta = join(dir, e);
    if (statSync(ruta).isDirectory()) fuentes(ruta, out);
    else if (/\.(ts|tsx)$/.test(e)) out.push(ruta);
  }
  return out;
}

describe("el texto que copian las herramientas", () => {
  it("lleva marca, bloques separados por una línea en blanco y la dirección al pie", () => {
    const texto = componerInforme(
      "Plan de operación",
      [
        { lineas: ["Entrada: 100,00", false, "", "Stop: 95,00"] },
        { rotulo: "Resultado", lineas: ["R:R: 1:3,00"] },
        { rotulo: "Vacío", lineas: [null, undefined] },
      ],
      "/herramientas/calculadora-de-riesgo/",
    );
    expect(texto).toBe(
      [
        "CountPips · Plan de operación",
        "",
        "• Entrada: 100,00",
        "• Stop: 95,00",
        "",
        "Resultado:",
        "• R:R: 1:3,00",
        "",
        `${SITE_URL}/herramientas/calculadora-de-riesgo/`,
      ].join("\n"),
    );
  });

  /* Siete herramientas escribían su propio portapapeles, y cuatro no
     decían nada si el navegador lo negaba. Una herramienta nueva que
     vuelva a hacerlo por su cuenta se salta el formato y el aviso. */
  it("solo el botón común toca el portapapeles", () => {
    const propias = fuentes(join(RAIZ, "src"))
      .filter((f) => /navigator\??\.clipboard/.test(readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "")))
      .map((f) => relative(RAIZ, f).split(sep).join("/"));
    expect(propias).toEqual(["src/components/tj/BotonCopiar.tsx"]);
  });
});
