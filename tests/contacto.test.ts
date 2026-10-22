import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

let ruta = "/";
vi.mock("next/navigation", () => ({ usePathname: () => ruta, useRouter: () => ({ push() {}, replace() {} }) }));

import { LanguageProvider } from "@/lib/i18n";
import { ContactForm } from "@/components/marketing/ContactForm";
import { LIMITE_MENSAJE } from "@/lib/forms";
import { fmtInt } from "@/lib/trading/format";

const pinta = (pathname: string) => {
  ruta = pathname;
  return renderToString(createElement(LanguageProvider, null, createElement(ContactForm)));
};
const texto = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/[\u00a0\u202f]/g, " ").replace(/\s+/g, " ");

describe("formulario de contacto", () => {
  it.each([
    ["/", /Responsable:/, /Finalidad:/],
    ["/en/", /Controller:/, /Purpose:/],
  ] as const)("dice, donde se rellena, quién trata los datos, para qué, por dónde pasan y dónde leer más (%s)", (pathname, responsable, finalidad) => {
    const html = pinta(pathname);
    const t = texto(html);
    expect(t).toMatch(responsable);
    expect(t).toMatch(finalidad);
    expect(t).toContain("Web3Forms");
    expect(html).toMatch(/href="(\/en)?\/privacidad\/?"/);
    expect(t).not.toMatch(/No compartimos tu email|never share your email/);
  });

  it("el mensaje no se recorta en silencio: el campo tiene su límite y un contador", () => {
    const html = pinta("/");
    expect(html).toMatch(new RegExp(`<textarea[^>]*maxLength="${LIMITE_MENSAJE}"`, "i"));
    expect(texto(html)).toContain(`0 / ${fmtInt(LIMITE_MENSAJE, "es")}`.replace(/\u00a0/g, " "));
  });
});
