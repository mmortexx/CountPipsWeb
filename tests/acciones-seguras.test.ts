import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Los flujos de GitHub Actions corren código de terceros con acceso al
 * repositorio y, al publicar, a GitHub Pages. Una etiqueta (`@v5`) la puede
 * mover quien controle esa acción; un commit (40 hexadecimales) no. Dependabot
 * actualiza el commit y el comentario de versión juntos.
 */
const DIR = join(import.meta.dirname, "..", ".github", "workflows");
const flujos = readdirSync(DIR)
  .filter((n) => /\.ya?ml$/.test(n))
  .map((n) => [n, readFileSync(join(DIR, n), "utf8")] as const);

describe("flujos de GitHub Actions", () => {
  it("hay flujos que mirar", () => {
    expect(flujos.length).toBeGreaterThanOrEqual(2);
  });

  it("cada acción va fijada a un commit, con su versión en comentario", () => {
    const mal = flujos.flatMap(([n, t]) =>
      [...t.matchAll(/^\s*(?:-\s*)?uses:\s*(\S+)(.*)$/gm)]
        .filter(([, accion, resto]) => !/^\.\//.test(accion) && !(/@[0-9a-f]{40}$/.test(accion) && /#\s*v\d/.test(resto)))
        .map(([, accion]) => `${n}: ${accion}`),
    );
    expect(mal).toEqual([]);
  });

  it("declaran permisos (solo lectura por defecto) y no usan pull_request_target", () => {
    for (const [n, t] of flujos) {
      expect(t, n).toMatch(/^permissions:\s*\n\s+contents:\s*read\s*$/m);
      expect(t, n).not.toMatch(/pull_request_target|workflow_run/);
    }
  });

  /** Cada orden `run:`, con sus líneas si es un bloque (`run: |`). */
  const ordenes = (yml: string) => {
    const lineas = yml.split(/\r?\n/);
    const out: string[] = [];
    lineas.forEach((l, i) => {
      const m = l.match(/^(\s*)(?:-\s*)?run:\s*(.*)$/);
      if (!m) return;
      if (!/^[|>]/.test(m[2])) return void out.push(m[2]);
      const sangria = m[1].length;
      const bloque: string[] = [];
      for (const s of lineas.slice(i + 1)) {
        if (s.trim() && s.search(/\S/) <= sangria) break;
        bloque.push(s);
      }
      out.push(bloque.join("\n"));
    });
    return out;
  };

  it("ningún `run:` mete datos del evento en la orden (inyección de órdenes)", () => {
    const peligroso = /\$\{\{\s*(github\.event|github\.head_ref|inputs\.|steps\.[^}]*outputs)/;
    expect(ordenes("steps:\n  - run: |\n      echo ok\n      echo ${{ github.event.issue.title }}\n  - run: echo fin").filter((o) => peligroso.test(o))).toHaveLength(1);
    const mal = flujos.flatMap(([n, t]) => ordenes(t).filter((o) => peligroso.test(o)).map((o) => `${n}: ${o}`));
    expect(mal).toEqual([]);
  });

  it("antes de publicar, las dependencias de la web no tienen avisos graves", () => {
    const despliegue = flujos.find(([n]) => n === "deploy.yml")![1];
    const auditoria = despliegue.search(/^\s+run:\s*bun audit --prod --audit-level=high\s*$/m);
    expect(auditoria).toBeGreaterThan(0);
    expect(auditoria).toBeLessThan(despliegue.search(/run:\s*bun run build/));
  });

  it("el checkout no deja el token guardado en el disco", () => {
    for (const [n, t] of flujos) {
      for (const m of t.matchAll(/uses:\s*actions\/checkout@[^\n]*\n((?:\s+[^\n]*\n){0,3})/g)) {
        expect(m[1], n).toMatch(/persist-credentials:\s*false/);
      }
    }
  });
});
