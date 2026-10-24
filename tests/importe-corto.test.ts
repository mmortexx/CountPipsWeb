// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

let ruta = "/";
vi.mock("next/navigation", () => ({ usePathname: () => ruta, useRouter: () => ({ push() {}, replace() {} }) }));

import { importeCortoPorTrozos } from "@/lib/trading/format";
import { LIMITE_PROYECCION_USD } from "@/lib/trading/proyeccion";
import { LanguageProvider } from "@/lib/i18n";
import { RMultipleSimulator } from "@/components/marketing/RMultipleSimulator";

/* Las cinco cifras de percentil del simulador de rachas, a 320 px con el texto
   espaciado, no caben en una línea. Partían «en cualquier sitio» y salía
   «12,9» / «0 M $». Ahora el número va entero y solo se parte entre él y cada
   palabra de la unidad. La medida en navegador está en `scripts/humo.mjs`. */
const texto = (v: number, lang: "es" | "en") => {
  const { trozos, junta } = importeCortoPorTrozos(v, lang, LIMITE_PROYECCION_USD);
  return trozos.join(junta);
};

describe("importe corto de los percentiles: tres cifras significativas, en trozos", () => {
  it("abrevia sin ceros de relleno", () => {
    expect(texto(876, "es")).toBe("876 $");
    expect(texto(9_876, "es")).toBe("9,88 k $");
    expect(texto(15_000, "es")).toBe("15 k $");
    expect(texto(718_400, "es")).toBe("718 k $");
    expect(texto(12_900_000, "es")).toBe("12,9 M $");
    expect(texto(1_250_000_000, "es")).toBe("1,25 mil M $");
    expect(texto(876, "en")).toBe("$876");
    expect(texto(12_900_000, "en")).toBe("$12.9M");
    expect(texto(108_700_000_000, "en")).toBe("$109B");
  });

  it("el redondeo sube de unidad en vez de escribir «1.000»", () => {
    expect(texto(999_600, "es")).toBe("1 M $");
    expect(texto(9_996, "en")).toBe("$10k");
    expect(texto(999_700_000_000, "es")).toBe("—");
    expect(texto(LIMITE_PROYECCION_USD * 2, "es")).toBe("—");
    expect(texto(Number.NaN, "en")).toBe("—");
  });

  it("ningún trozo con cifras pasa de cuatro caracteres, del 1 al billón", () => {
    for (const lang of ["es", "en"] as const) {
      for (let v = 1; v < LIMITE_PROYECCION_USD; v *= 1.0137) {
        const { trozos } = importeCortoPorTrozos(v, lang, LIMITE_PROYECCION_USD);
        for (const t of trozos) if (/\d/.test(t)) expect(t.length, `${lang} ${v} «${t}»`).toBeLessThanOrEqual(4);
      }
    }
  });
});

describe("la celda de percentil solo puede partir entre trozos", () => {
  it.each(["/", "/en/"])("%s", (r) => {
    ruta = r;
    const raiz = document.createElement("div");
    raiz.innerHTML = renderToString(createElement(LanguageProvider, null, createElement(RMultipleSimulator)));
    const celdas = [...raiz.querySelectorAll(".tj-matriz.grid-cols-5 > .caja-cifra")];
    expect(celdas).toHaveLength(5);
    for (const celda of celdas) {
      const cifra = celda.lastElementChild!;
      expect(cifra.className).not.toMatch(/overflow-wrap:anywhere|break-all/);
      const trozos = [...cifra.children].filter((e) => e.tagName === "SPAN");
      expect(trozos.length, cifra.textContent ?? "").toBeGreaterThanOrEqual(2);
      for (const t of trozos) expect(t.className, t.textContent ?? "").toMatch(/\bwhitespace-nowrap\b/);
      for (const n of cifra.childNodes) {
        if (n.nodeType === 3) expect(n.textContent, "texto suelto entre trozos").toMatch(/^ $/);
      }
    }
  });
});
