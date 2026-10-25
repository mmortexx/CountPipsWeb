import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { documentoPorSlug, type Bloque } from "@/lib/legal/documentos";

/* La política dice qué se recoge; el servicio de admisión es quien lo recoge.
   Si el Worker guarda una huella de la IP o la pasa a Turnstile, la política
   tiene que contarlo, en los dos idiomas. */
const worker = readFileSync(join(__dirname, "..", "services", "beta-api", "src", "worker.js"), "utf8");
const politica = documentoPorSlug("privacidad");

const textos = (idioma: "es" | "en") => {
  const doc = politica!;
  const partes = [idioma === "es" ? doc.entradaEs : doc.entradaEn];
  const deBloque = (b: Bloque) => {
    if (b.tipo === "parrafo") partes.push(b[idioma]);
    else if (b.tipo === "lista") partes.push(...b[idioma]);
    else if (b.tipo === "tabla") for (const f of b.filas) partes.push(...f[idioma]);
  };
  for (const s of doc.secciones) s.bloques.forEach(deBloque);
  return partes;
};

describe("la política de privacidad cuenta lo que hace con la IP", () => {
  it("el Worker sigue guardando la huella y enviando la IP a Turnstile (si no, esta prueba sobra)", () => {
    expect(worker).toMatch(/ip_hash/);
    expect(worker).toMatch(/remoteip/);
  });

  for (const idioma of ["es", "en"] as const) {
    it(`${idioma}: menciona la huella de la IP`, () => {
      expect(textos(idioma).some((t) => /\bIP\b/.test(t) && /(huella|fingerprint)/i.test(t))).toBe(true);
    });
    it(`${idioma}: dice que Turnstile recibe la IP`, () => {
      expect(textos(idioma).some((t) => /Turnstile/.test(t) && /\bIP\b/.test(t))).toBe(true);
    });
    it(`${idioma}: la entrada no dice que solo se recoge lo que escribes`, () => {
      expect(textos(idioma)[0]).not.toMatch(/solo recoge lo que envías|only collects what you send/);
    });
  }
});
