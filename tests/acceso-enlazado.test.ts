import { beforeAll, describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Portada, características y FAQ enlazan al acceso anticipado desde su
// contenido, no solo desde el menú: quien llega convencido al final de la
// página no tiene que volver arriba.

const OUT = join(process.cwd(), "out");
const PAGINAS = ["index.html", "en/index.html", "features/index.html", "faq/index.html", "en/faq/index.html"];

const enlacesAlAcceso = (html: string) => {
  const main = html.match(/<main[\s\S]*<\/main>/)?.[0] ?? "";
  return (main.match(/href="[^"]*\/beta\/?"/g) ?? []).length;
};

// `skipIf` ejecuta el cuerpo del `describe`: `out/` se lee en `beforeAll`.
describe.skipIf(!existsSync(join(OUT, "index.html")) && process.env.COMPROBAR_OUT !== "1")(
  "el contenido enlaza al acceso anticipado",
  () => {
    const cuentas = new Map<string, number>();
    beforeAll(() => {
      for (const p of PAGINAS) cuentas.set(p, enlacesAlAcceso(readFileSync(join(OUT, p), "utf8")));
    });

    it.each(PAGINAS)("%s", (p) => {
      expect(cuentas.get(p)).toBeGreaterThan(0);
    });
  },
);
