import { beforeAll, describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { FAQ_EN, FAQ_ES } from "@/lib/faq";
import { documentoPorSlug } from "@/lib/legal/documentos";

/* La FAQ y la política de privacidad dicen qué pide el formulario de
   acceso anticipado. La FAQ se quedó en cinco campos cuando el formulario
   tenía siete: prometía pedir menos de lo que pedía. Se cuentan los campos
   del HTML compilado —lo que el visitante rellena— y se comparan con las
   dos listas. */

const BETA = join(process.cwd(), "out", "beta", "index.html");

function camposDelFormulario(html: string): number {
  const form = html.match(/<form[\s\S]*?<\/form>/)?.[0] ?? "";
  const controles = form.match(/<(input|select|textarea)\b[^>]*>/g) ?? [];
  const radios = new Set<string>();
  let n = 0;
  for (const c of controles) {
    if (/type="(checkbox|hidden|submit)"/.test(c) || /beta-botcheck/.test(c)) continue;
    const radio = /type="radio"/.test(c) && c.match(/name="([^"]+)"/)?.[1];
    if (radio) {
      if (radios.has(radio)) continue;
      radios.add(radio);
    }
    n++;
  }
  return n;
}

/** «a, b, c y d» → 4. */
function elementos(lista: string, y: RegExp): number {
  return lista.split(/,\s*/).flatMap((p) => p.split(y)).filter((p) => p.trim()).length;
}

/* `skipIf` salta las pruebas pero ejecuta igual el cuerpo del `describe`:
   leer aquí arriba rompía el CI, que pasa las pruebas antes de compilar. */
describe.skipIf(!existsSync(BETA))("lo que se dice que pide el formulario es lo que pide", () => {
  let n = 0;
  beforeAll(() => {
    n = camposDelFormulario(readFileSync(BETA, "utf8"));
  });

  it("el formulario compilado tiene campos que contar", () => {
    expect(n).toBeGreaterThan(3);
  });

  it("la FAQ nombra tantos campos como tiene", () => {
    const es = FAQ_ES.find((q) => q.q === "¿Qué datos pide esta web?")!.a;
    const en = FAQ_EN.find((q) => q.q === "What data does this website ask for?")!.a;
    expect(elementos(es.match(/el de acceso anticipado, ([^—]+)—/)![1], / y /)).toBe(n);
    expect(elementos(en.match(/the early-access form, ([^—]+)—/)![1], / and /)).toBe(n);
  });

  it("la política de privacidad también", () => {
    const texto = JSON.stringify(documentoPorSlug("privacidad"));
    expect(elementos(texto.match(/seleccionar un piloto: ([^.]+)\./)![1], / y /)).toBe(n);
    expect(elementos(texto.match(/select a pilot: ([^.]+)\./)![1], / and /)).toBe(n);
  });
});
