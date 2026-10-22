import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * `comprobar.yml` repite en cada PR las barreras que `deploy.yml` corre antes
 * de publicar. Si una barrera nueva entra solo en el despliegue, el PR sale en
 * verde y el fallo vuelve a verse al publicar, que es lo que se quería evitar.
 */
const RAIZ = join(import.meta.dirname, "..");
const flujo = (nombre: string) => readFileSync(join(RAIZ, ".github/workflows", nombre), "utf8");
const despliegue = flujo("deploy.yml");
const pr = flujo("comprobar.yml");

// Pasos que solo tienen sentido al publicar.
const SOLO_DESPLIEGUE = ["touch out/.nojekyll"];

const comandos = (yml: string) =>
  [...yml.matchAll(/^\s*(?:-\s*)?run:\s*(.+?)\s*$/gm)].map((m) => m[1]);
const valor = (yml: string, clave: string) =>
  yml.match(new RegExp(`^\\s*${clave}:\\s*(.+?)\\s*$`, "m"))?.[1];

describe("la comprobación de PR corre lo mismo que el despliegue", () => {
  it("cada comando de comprobación del despliegue está en el PR", () => {
    const deDespliegue = comandos(despliegue).filter((c) => !SOLO_DESPLIEGUE.includes(c));
    expect(deDespliegue.length).toBeGreaterThanOrEqual(7);
    expect(deDespliegue.filter((c) => !comandos(pr).includes(c))).toEqual([]);
  });

  it.each(["bun-version", "NEXT_PUBLIC_BASE_PATH", "NEXT_PUBLIC_SITE_URL"])(
    "%s es el mismo en los dos",
    (clave) => {
      expect(valor(despliegue, clave)).toBeTruthy();
      expect(valor(pr, clave)).toBe(valor(despliegue, clave));
    },
  );

  it("se dispara en cada PR, sin secretos ni permiso de escritura", () => {
    expect(pr).toMatch(/^on:\s*\n\s+pull_request:/m);
    expect(pr).not.toMatch(/secrets\./);
    expect(pr).not.toMatch(/:\s*write\b/);
  });
});

/** Bloque de un trabajo de `jobs:` (desde su nombre hasta el siguiente trabajo). */
const trabajo = (yml: string, nombre: string) => {
  const jobs = yml.slice(yml.search(/^jobs:\s*$/m));
  const inicio = jobs.search(new RegExp(`^  ${nombre}:\\s*$`, "m"));
  if (inicio < 0) return "";
  const resto = jobs.slice(inicio + 1);
  const fin = resto.search(/^  [A-Za-z_-]+:\s*$/m);
  return fin < 0 ? jobs.slice(inicio) : jobs.slice(inicio, inicio + 1 + fin);
};
const cabecera = (yml: string) => yml.slice(0, yml.search(/^jobs:\s*$/m));

describe("el despliegue da a cada trabajo solo lo que usa", () => {
  it("lo que se repasa existe", () => {
    expect(trabajo(despliegue, "build")).toMatch(/bun run build/);
    expect(trabajo(despliegue, "deploy")).toMatch(/deploy-pages/);
  });

  it("publicar en Pages (pages: write, id-token: write) solo lo puede el trabajo «deploy»", () => {
    expect(cabecera(despliegue)).not.toMatch(/pages:\s*write|id-token:\s*write/);
    expect(trabajo(despliegue, "build")).not.toMatch(/pages:\s*write|id-token:\s*write/);
    expect(trabajo(despliegue, "deploy")).toMatch(/pages:\s*write/);
    expect(trabajo(despliegue, "deploy")).toMatch(/id-token:\s*write/);
  });

  it("el checkout de «build», que instala y ejecuta dependencias, no guarda el token", () => {
    expect(trabajo(despliegue, "build")).toMatch(/uses:\s*actions\/checkout@\S+\s*\n\s+with:\s*\n\s+persist-credentials:\s*false/);
  });
});
