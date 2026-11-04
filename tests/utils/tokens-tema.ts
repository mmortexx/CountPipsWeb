import { expect } from "vitest";

/**
 * Contraste con los tokens que de verdad se pintan en cada tema: la usan
 * `tests/e2e/d8_design_tokens.test.ts` y las pruebas de componentes que
 * necesitan saber si un color se lee sobre su fondo.
 */

export function parseChannelTriplet(tripletStr: string): [number, number, number] {
  const parts = tripletStr.trim().split(/\s+/).map((s) => parseInt(s, 10));
  if (parts.length !== 3 || parts.some((n) => isNaN(n) || n < 0 || n > 255)) {
    throw new Error(`Invalid RGB triplet: "${tripletStr}"`);
  }
  return [parts[0], parts[1], parts[2]];
}

export function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function contrastRatio(lum1: number, lum2: number): number {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Tokens que ve de verdad cada tema: solo reglas sueltas (fuera de `@layer` y
 * `@media`, que pierden contra ellas), por especificidad y luego por orden.
 * `data-palette` vale siempre "clasico", así que su bloque pisa a los de base.
 */
export function tokensEfectivos(css: string, tema: "dark" | "light"): Record<string, string> {
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

/** Canales de un token: triplete «R G B», `#rrggbb` o `var(--otro)`. */
export function canalesDe(tokens: Record<string, string>, nombre: string): [number, number, number] {
  const valor = tokens[nombre];
  expect(valor, `${nombre} sin declarar`).toBeDefined();
  const alias = valor.match(/^var\((--[\w-]+)\)$/);
  if (alias) return canalesDe(tokens, alias[1]);
  const hex = valor.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (hex) return hex.slice(1).map((h) => parseInt(h, 16)) as [number, number, number];
  return parseChannelTriplet(valor);
}

/** Luminancia de un token. */
export function luminanciaDe(tokens: Record<string, string>, nombre: string): number {
  return relativeLuminance(...canalesDe(tokens, nombre));
}
