import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

let ruta = "/";
vi.mock("next/navigation", () => ({ usePathname: () => ruta, useRouter: () => ({ push() {}, replace() {} }) }));

import { LanguageProvider } from "@/lib/i18n";
import { DisciplineCost } from "@/components/marketing/DisciplineCost";

function html(pathname: string): string {
  ruta = pathname;
  return renderToString(createElement(LanguageProvider, null, createElement(DisciplineCost))).replaceAll(String.fromCharCode(0xa0), " ");
}

const numeros = (h: string, patron: RegExp) => [...h.matchAll(patron)].map((m) => Number(m[1]));

/**
 * «Si evitaras parte de la fuga»: el párrafo y las fichas de debajo hablan del
 * mismo escenario. Antes el párrafo decía el 60 % y las fichas el 50 % y el 80 %.
 */
describe("coste de indisciplina: el párrafo del escenario y sus fichas dicen lo mismo", () => {
  it("en español, el porcentaje del párrafo es el de una de las fichas", () => {
    const h = html("/");
    const fichas = numeros(h, /Evitando el (\d+) %/g);
    const parrafo = numeros(h, /Si evitaras el (\d+) % de tus operaciones/g);
    expect(fichas.length).toBeGreaterThan(0);
    expect(parrafo).toHaveLength(1);
    expect(fichas).toContain(parrafo[0]);
  });

  it("en inglés, igual", () => {
    const h = html("/en/");
    const fichas = numeros(h, /Avoiding (\d+)%/g);
    const parrafo = numeros(h, /If you avoided (\d+)% of your off-plan trades/g);
    expect(fichas.length).toBeGreaterThan(0);
    expect(parrafo).toHaveLength(1);
    expect(fichas).toContain(parrafo[0]);
  });

  it("el importe del párrafo es el de la ficha de ese mismo porcentaje", () => {
    const h = html("/");
    const aNumero = (s: string) => Number(s.replace(/\./g, "").replace(",", "."));
    const fichas = numeros(h, /Evitando el (\d+) %/g);
    // El `title` de cada ficha trae el importe exacto: «+1.234,56 $», en el orden de las fichas.
    const importes = [...h.matchAll(/title="\+([\d.,]+) \$"/g)].map((m) => aNumero(m[1]));
    const [pct] = numeros(h, /Si evitaras el (\d+) % de tus operaciones/g);
    const parrafo = /dejarías de perder unos ([\d.]+) \$ al mes/.exec(h);
    expect(parrafo, "importe del párrafo").not.toBeNull();
    expect(importes).toHaveLength(fichas.length);
    expect(aNumero(parrafo![1])).toBe(Math.round(importes[fichas.indexOf(pct)]));
  });
});
