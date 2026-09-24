import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { documentoPorSlug } from "@/lib/legal/documentos";

/* La política de cookies promete «todo lo que se guarda, sin excepción».
   Declaró durante semanas una clave de sesión («si ya viste la animación de
   entrada») que el rediseño de la portada había quitado. Se cuentan las
   claves que el código escribe en el navegador y las filas de la tabla. */

function fuentes(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const ruta = join(dir, e.name);
    if (e.isDirectory()) return fuentes(ruta);
    return /\.(ts|tsx)$/.test(e.name) ? [ruta] : [];
  });
}

const escrituras = fuentes(join(process.cwd(), "src")).flatMap((f) =>
  [...readFileSync(f, "utf8").matchAll(/(local|session)Storage\.setItem\(\s*([^,]+),/g)].map(
    (m) => `${m[1]}:${m[2].trim()}`,
  ),
);

const tabla = documentoPorSlug("cookies")
  ?.secciones.find((s) => s.tituloEs.startsWith("Todo lo que se guarda"))
  ?.bloques.find((b) => b.tipo === "tabla");
const filas = tabla?.tipo === "tabla" ? tabla.filas : [];

describe("la política de cookies declara lo que la web guarda", () => {
  it("encuentra la tabla y las escrituras (si no, la prueba se ha quedado ciega)", () => {
    expect(filas.length).toBeGreaterThan(0);
    expect(escrituras.length).toBeGreaterThan(0);
  });

  it("una fila por clave propia, más la de PostHog", () => {
    const propias = new Set(escrituras);
    const posthog = filas.filter((f) => f.es[0].includes("PostHog"));
    expect(posthog).toHaveLength(1);
    expect(filas.length - posthog.length).toBe(propias.size);
  });

  it("lo que dura hasta cerrar la pestaña existe como almacenamiento de sesión", () => {
    const deSesion = filas.filter((f) => /cierres la pestaña/.test(f.es[2]));
    const enCodigo = new Set(escrituras.filter((e) => e.startsWith("session:")));
    expect(deSesion.length).toBe(enCodigo.size);
  });
});
