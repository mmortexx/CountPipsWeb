import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push() {}, replace() {} }) }));

import { LanguageProvider } from "@/lib/i18n";
import { Histogram } from "@/components/charts/Histogram";

// Con muchas barras, en móvil se calla un rótulo de cada dos. Si el rótulo
// callado deja de ocupar sitio, su barra baja hasta el fondo y cruza la fila de
// rótulos de las vecinas: tiene que seguir reservando su renglón.
describe("Histogram con rótulos alternos", () => {
  const data = Array.from({ length: 10 }, (_, i) => ({ x: i - 5, count: i + 1 }));
  const html = renderToString(createElement(LanguageProvider, null, createElement(Histogram, { data, colorize: "pos-neg" })));
  const rotulos = [...html.matchAll(/<div class="mt-1 [^"]*"/g)].map((m) => m[0]);

  it("pinta un rótulo por barra", () => {
    expect(rotulos).toHaveLength(data.length);
  });

  it("los rótulos callados guardan su sitio: invisibles, no fuera del flujo", () => {
    const callados = rotulos.filter((r) => /\binvisible\b/.test(r));
    expect(callados.length).toBeGreaterThan(0);
    for (const r of rotulos) expect(r).not.toMatch(/(^|[\s"])hidden(\s|")/);
  });
});
