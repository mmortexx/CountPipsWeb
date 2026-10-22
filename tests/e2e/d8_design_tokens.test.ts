import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { PALETTES, readSavedTheme } from "@/lib/theme";

/**
 * Dimensión D8: tokens de diseño y pureza de tema. Lee `globals.css` y
 * `theme.tsx` como texto: propiedades CSS, selectores de tema, paletas,
 * colores crudos en componentes, contraste (con los tokens que de verdad se
 * pintan) y sombras. El arranque del tema con valores guardados rotos se
 * prueba con `readSavedTheme`.
 */

const ROOT = join(import.meta.dirname, "..", "..");
const readSrc = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

function getAllSrcFiles(dir: string, extensions = [".tsx", ".ts"]): string[] {
  const results: string[] = [];
  const fullPath = join(ROOT, dir);
  const traverse = (currentDir: string) => {
    const list = readdirSync(currentDir);
    for (const file of list) {
      const p = join(currentDir, file);
      const stat = statSync(p);
      if (stat.isDirectory()) {
        traverse(p);
      } else if (extensions.some((ext) => file.endsWith(ext))) {
        results.push(p);
      }
    }
  };
  traverse(fullPath);
  return results;
}

function parseChannelTriplet(tripletStr: string): [number, number, number] {
  const parts = tripletStr.trim().split(/\s+/).map((s) => parseInt(s, 10));
  if (parts.length !== 3 || parts.some((n) => isNaN(n) || n < 0 || n > 255)) {
    throw new Error(`Invalid RGB triplet: "${tripletStr}"`);
  }
  return [parts[0], parts[1], parts[2]];
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(lum1: number, lum2: number): number {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Tokens que ve de verdad cada tema: solo reglas sueltas (fuera de `@layer` y
 * `@media`, que pierden contra ellas), por especificidad y luego por orden.
 * `data-palette` vale siempre "clasico", así que su bloque pisa a los de base.
 */
function tokensEfectivos(css: string, tema: "dark" | "light"): Record<string, string> {
  const selectores: Record<string, number> =
    tema === "dark"
      ? { ":root": 1, ':root[data-palette="clasico"]': 2 }
      : {
          ":root": 1,
          ':root[data-theme="light"]': 2,
          ':root[data-palette="clasico"]': 2,
          ':root[data-theme="light"][data-palette="clasico"]': 3,
        };
  const limpio = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const bloques: { esp: number; pos: number; cuerpo: string }[] = [];
  let nivel = 0;
  let inicio = 0;
  let selector = "";
  for (let i = 0; i < limpio.length; i++) {
    const c = limpio[i];
    if (c === "{") {
      if (nivel === 0) {
        selector = limpio.slice(inicio, i).trim().split(/[;}]/).pop()!.trim();
        inicio = i + 1;
      }
      nivel++;
    } else if (c === "}") {
      nivel--;
      if (nivel === 0) {
        if (selector in selectores) {
          bloques.push({ esp: selectores[selector], pos: i, cuerpo: limpio.slice(inicio, i) });
        }
        inicio = i + 1;
      }
    }
  }
  bloques.sort((a, b) => a.esp - b.esp || a.pos - b.pos);
  const tokens: Record<string, string> = {};
  for (const { cuerpo } of bloques) {
    for (const m of cuerpo.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) tokens[m[1]] = m[2].trim();
  }
  return tokens;
}

/** Luminancia de un token: triplete «R G B», `#rrggbb` o `var(--otro)`. */
function luminanciaDe(tokens: Record<string, string>, nombre: string): number {
  const valor = tokens[nombre];
  expect(valor, `${nombre} sin declarar`).toBeDefined();
  const alias = valor.match(/^var\((--[\w-]+)\)$/);
  if (alias) return luminanciaDe(tokens, alias[1]);
  const hex = valor.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (hex) return relativeLuminance(...(hex.slice(1).map((h) => parseInt(h, 16)) as [number, number, number]));
  return relativeLuminance(...parseChannelTriplet(valor));
}

describe("Dimension D8: Design System Tokens (Tier 1 Feature Coverage)", () => {
  const globalsCss = readSrc("src/app/globals.css");

  it("T1.1: Core CSS custom properties are properly defined in :root", () => {
    expect(globalsCss).toMatch(/--accent-base:\s*\d+\s+\d+\s+\d+;/);
    expect(globalsCss).toMatch(/--accent-ink:\s*\d+\s+\d+\s+\d+;/);
    expect(globalsCss).toMatch(/--pnl-pos:\s*\d+\s+\d+\s+\d+;/);
    expect(globalsCss).toMatch(/--pnl-neg:\s*\d+\s+\d+\s+\d+;/);
    expect(globalsCss).toMatch(/--pnl-warn:\s*\d+\s+\d+\s+\d+;/);
    expect(globalsCss).toMatch(/--sig-green:\s*\d+\s+\d+\s+\d+;/);
    expect(globalsCss).toMatch(/--sig-amber:\s*\d+\s+\d+\s+\d+;/);
    expect(globalsCss).toMatch(/--sig-red:\s*\d+\s+\d+\s+\d+;/);
    expect(globalsCss).toMatch(/--txt-primary:\s*\d+\s+\d+\s+\d+;/);
    expect(globalsCss).toMatch(/--txt-secondary:\s*\d+\s+\d+\s+\d+;/);
    expect(globalsCss).toMatch(/--txt-tertiary:\s*\d+\s+\d+\s+\d+;/);
    expect(globalsCss).toMatch(/--divider:\s*\d+\s+\d+\s+\d+;/);
    expect(globalsCss).toMatch(/--ease-suave:\s*cubic-bezier\(/);
    expect(globalsCss).toMatch(/--cal-tint-max:\s*0\.\d+;/);
  });

  it("T1.2: Theme switching selectors maintain symmetry and proper color-scheme", () => {
    expect(globalsCss).toContain(':root[data-theme="light"]');
    expect(globalsCss).toMatch(/:root\[data-theme="light"\]\s*\{[^}]*--pnl-pos:\s*30 122 76;/);
    expect(globalsCss).toMatch(/:root\[data-theme="light"\]\s*\{[^}]*--pnl-neg:\s*153 27 27;/);
    expect(globalsCss).toMatch(/:root\[data-theme="light"\]\s*\{[^}]*--txt-primary:\s*20 22 28;/);

    expect(globalsCss).toContain(':root:not([data-theme="light"]) { color-scheme: dark; }');
    expect(globalsCss).toContain(':root[data-theme="light"] { color-scheme: light; }');
  });

  it("T1.3: la única paleta es 'clasico' y se fuerza antes de pintar", () => {
    expect(PALETTES).toHaveLength(1);
    expect(PALETTES[0].name).toBe("clasico");
    expect(PALETTES[0].light).toBe("#131D26");
    expect(PALETTES[0].dark).toBe("#CDD9E4");

    // Valores viejos de localStorage («verde», «grafito») no llegan al DOM:
    // el script de arranque escribe 'clasico' tanto si lee bien como si falla.
    const arranque = readSrc("src/app/layout.tsx");
    expect(arranque.match(/dataset\.palette='clasico'/g)?.length).toBe(2);
    expect(globalsCss).toContain(':root[data-palette="clasico"]');
  });

  it("T1.4: Surface classes (.tj-paper, .tj-paper-dense, .tj-range) map to design tokens", () => {
    expect(globalsCss).toMatch(/\.tj-paper \{\s*background-color: var\(--raised\);/);
    expect(globalsCss).toMatch(/\.tj-paper-dense \{\s*background-color: var\(--paper-dense\);/);

    expect(globalsCss).toContain(".tj-range {");
  });

  it("T1.5: Theme module contracts and types are consistent", () => {
    const themeSrc = readSrc("src/lib/theme.tsx");

    expect(themeSrc).toContain('export type Theme = "dark" | "light";');
    expect(themeSrc).toContain('export type PaletteName = "clasico";');
    expect(themeSrc).toContain("export function ThemeProvider");
    expect(themeSrc).toContain("export function useTheme");
    expect(themeSrc).toContain('document.documentElement.dataset.theme = theme');
    expect(themeSrc).toContain('document.documentElement.dataset.palette = palette');
  });
});

describe("Dimension D8: Design System Tokens (Tier 2 Boundary & Corner Cases)", () => {
  const globalsCss = readSrc("src/app/globals.css");

  it("T2.1: Prohibited raw inline hex/rgb colors audit across components", () => {
    const componentFiles = getAllSrcFiles("src/components");
    const allowedHexExceptions = new Set([
      "#131D26", "#CDD9E4", // muestras de la paleta
      "#00F5A0", "#FF4D4D", "#E0932B", // constantes canónicas de P&L
    ]);

    const flaggedHexUsage: string[] = [];
    const hexRegex = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;

    for (const filePath of componentFiles) {
      const relativePath = filePath.replace(ROOT, "").replace(/\\/g, "/").replace(/^\//, "");
      const content = readFileSync(filePath, "utf8");

      // Sin comentarios: solo se analiza código activo.
      const codeOnly = content
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");

      const lines = codeOnly.split("\n");
      lines.forEach((line, idx) => {
        // Se saltan trazos SVG y líneas que ya usan tokens.
        if (line.includes("<path") || line.includes("viewBox") || line.includes("xml")) return;
        if (line.includes("var(--") || line.includes("rgb(var(")) return;

        const matches = line.matchAll(hexRegex);
        for (const m of matches) {
          const hex = m[0].toUpperCase();
          if (!allowedHexExceptions.has(hex) && (line.includes("color:") || line.includes("background:") || line.includes("border:") || line.includes("style="))) {
            flaggedHexUsage.push(`${relativePath}:${idx + 1} -> ${hex} in line: ${line.trim()}`);
          }
        }
      });
    }

    expect(flaggedHexUsage).toEqual([]);
  });

  it("T2.2: Channel triplets parse correctly into integers between 0 and 255", () => {
    const tripletMatches = globalsCss.matchAll(/--[a-z0-9-]+:\s*(\d+\s+\d+\s+\d+);/g);
    let tripletCount = 0;

    for (const match of tripletMatches) {
      const rawTriplet = match[1];
      const channels = parseChannelTriplet(rawTriplet);
      expect(channels[0]).toBeGreaterThanOrEqual(0);
      expect(channels[0]).toBeLessThanOrEqual(255);
      expect(channels[1]).toBeGreaterThanOrEqual(0);
      expect(channels[1]).toBeLessThanOrEqual(255);
      expect(channels[2]).toBeGreaterThanOrEqual(0);
      expect(channels[2]).toBeLessThanOrEqual(255);
      tripletCount++;
    }

    expect(tripletCount).toBeGreaterThanOrEqual(15);
  });

  it("T2.3: el texto y los colores de P&L de la paleta que se pinta pasan WCAG AA sobre sus fondos", () => {
    for (const tema of ["dark", "light"] as const) {
      const tokens = tokensEfectivos(globalsCss, tema);
      for (const fondo of ["--bg", "--surface", "--raised"]) {
        const lumFondo = luminanciaDe(tokens, fondo);
        // 7:1 para el texto principal, 4,5:1 para el resto de texto normal.
        const minimos: [string, number][] = [
          ["--txt-primary", 7],
          ["--txt-secondary", 4.5],
          ["--txt-tertiary", 4.5],
          ["--pnl-pos", 4.5],
          ["--pnl-neg", 4.5],
        ];
        for (const [tinta, minimo] of minimos) {
          const ratio = contrastRatio(luminanciaDe(tokens, tinta), lumFondo);
          expect(ratio, `${tema}: ${tinta} sobre ${fondo} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(minimo);
        }
      }
    }
  });

  describe("T2.4: un valor de tema guardado roto o un almacenamiento bloqueado no rompen el arranque", () => {
    afterEach(() => vi.unstubAllGlobals());

    /** `readSavedTheme` con lo que haya en `localStorage` y lo que pida el sistema. */
    function arrancaCon(guardado: () => string | null, sistemaOscuro: () => boolean): string {
      vi.stubGlobal("window", {});
      vi.stubGlobal("localStorage", { getItem: guardado });
      vi.stubGlobal("matchMedia", () => ({ matches: sistemaOscuro() }));
      return readSavedTheme();
    }
    const falla = () => {
      throw new Error("SecurityError: The operation is insecure.");
    };

    it("lo elegido con el interruptor manda sobre el sistema", () => {
      expect(arrancaCon(() => "dark", () => false)).toBe("dark");
      expect(arrancaCon(() => "light", () => true)).toBe("light");
    });

    it("un valor que no es un tema se ignora y manda el sistema", () => {
      for (const roto of ["invalid_theme", "", "{bad: json}", "verde", "DARK", null]) {
        expect(arrancaCon(() => roto, () => true), String(roto)).toBe("dark");
        expect(arrancaCon(() => roto, () => false), String(roto)).toBe("light");
      }
    });

    it("sin almacenamiento (modo privado) manda el sistema, y sin sistema, el papel", () => {
      expect(arrancaCon(falla, () => true)).toBe("dark");
      expect(arrancaCon(falla, falla)).toBe("light");
    });
  });

  /**
   * La elevación la lleva el token `--sombra`, teñido del material y distinto
   * en cada tema. Se exige que esté definido en los dos y que alguien lo use,
   * para que la prueba no proteja código muerto.
   */
  it("T2.5: Elevation and depth shadow tokens maintain hierarchy across light and dark modes", () => {
    // Los dos bloques solo declaran `--sombra` y se casan enteros: buscar desde
    // `:root` hasta el primer `--sombra` tropezaba con el `:root` gigante.
    const leer = (re: RegExp) => {
      const m = globalsCss.match(re);
      return m ? m[1].trim().split(/\s+/).map(Number) : null;
    };
    const oscuro = leer(/:root\s*\{\s*--sombra:\s*([\d ]+);\s*\}/);
    const claro = leer(
      /:root\[data-theme="light"\]\s*\{\s*--sombra:\s*([\d ]+);\s*\}/,
    );

    expect(oscuro, "--sombra sin definir en el tema oscuro").not.toBeNull();
    expect(claro, "--sombra sin definir en el tema claro").not.toBeNull();
    for (const canal of [...oscuro!, ...claro!]) {
      expect(canal).toBeGreaterThanOrEqual(0);
      expect(canal).toBeLessThanOrEqual(255);
    }
    expect(oscuro!).toHaveLength(3);
    expect(claro!).toHaveLength(3);
    expect(
      oscuro!.join(" "),
      "los dos temas comparten sombra: entonces no esta tenida con su material",
    ).not.toBe(claro!.join(" "));

    const consumidores = getAllSrcFiles("src").filter((f) =>
      readFileSync(f, "utf8").includes("var(--sombra)"),
    );
    expect(
      consumidores.length,
      "nadie usa --sombra: o la elevacion se pinta de otra forma, o sobra",
    ).toBeGreaterThan(0);
  });
});
