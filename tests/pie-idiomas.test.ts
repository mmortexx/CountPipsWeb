import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

let ruta = "/";
vi.mock("next/navigation", () => ({ usePathname: () => ruta, useRouter: () => ({ push() {}, replace() {} }) }));

import { LanguageProvider } from "@/lib/i18n";
import { Footer } from "@/components/marketing/Footer";

/** Los enlaces de idioma del pie tal como salen en el HTML estático, sin abrir nada. */
function enlacesDeIdioma(pathname: string): string[] {
  ruta = pathname;
  const html = renderToString(createElement(LanguageProvider, null, createElement(Footer)));
  return [...html.matchAll(/<a\b[^>]*data-cambio-idioma[^>]*>/g)].map((m) => m[0].match(/href="([^"]+)"/)![1]);
}

describe("el pie enlaza las otras versiones de la página en el HTML estático", () => {
  it("una página en todos los idiomas enlaza las otras cinco y no a sí misma", () => {
    const enlaces = enlacesDeIdioma("/");
    expect(enlaces).toHaveLength(5);
    expect(enlaces).toEqual(expect.arrayContaining(["/en", "/pt", "/fr", "/de", "/it"]));
  });

  it("desde otro idioma, la versión española de la misma página", () => {
    const enlaces = enlacesDeIdioma("/en/pricing/");
    expect(enlaces).toContain("/pricing");
    expect(enlaces).not.toContain("/en/pricing");
  });

  it("una página solo en español e inglés no enlaza a un idioma que no la tiene", () => {
    expect(enlacesDeIdioma("/glosario/slippage/")).toEqual(["/en/glosario/slippage"]);
  });
});
