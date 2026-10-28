import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Dependabot solo mira los directorios que `.github/dependabot.yml` nombra. El
 * Worker de acceso anticipado tiene su propio `bun.lock`: sin su entrada, sus
 * dependencias envejecen sin aviso (pasó con `wrangler` y ocho avisos de
 * `undici`).
 */
const RAIZ = join(import.meta.dirname, "..");
const config = readFileSync(join(RAIZ, ".github", "dependabot.yml"), "utf8");

const conLock = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory()) return e.name === "node_modules" || e.name.startsWith(".") || e.name === "out" ? [] : conLock(join(dir, e.name));
    return e.name === "bun.lock" ? [`/${relative(RAIZ, dir).replace(/\\/g, "/")}`.replace(/\/$/, "") || "/"] : [];
  });

const entradas = [...config.matchAll(/package-ecosystem:\s*"([^"]+)"\s*\n\s*directory:\s*"([^"]+)"/g)].map(([, eco, dir]) => `${eco} ${dir}`);

describe("Dependabot vigila todas las dependencias", () => {
  it("cada bun.lock del repositorio tiene su entrada", () => {
    const locks = conLock(RAIZ);
    expect(locks).toContain("/");
    expect(locks.filter((d) => !entradas.includes(`bun ${d}`))).toEqual([]);
  });

  it("y las acciones de GitHub, que van fijadas a su commit", () => {
    expect(entradas).toContain("github-actions /");
  });
});
