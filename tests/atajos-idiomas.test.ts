import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

let ruta = "/";
vi.mock("next/navigation", () => ({ usePathname: () => ruta, useRouter: () => ({ push() {}, replace() {} }) }));

import { LanguageProvider } from "@/lib/i18n";
import { ShortcutsHelp } from "@/components/tj/ShortcutsHelp";
import { PESTANAS_DEMO } from "@/components/demo/pestanas";

/* La ayuda de atajos se abre desde el pie en todas las páginas, también en
   /pt, /fr, /de e /it: tiene que hablar su idioma y citar las pestañas que hay. */
function texto(pathname: string): string {
  ruta = pathname;
  const html = renderToString(
    createElement(LanguageProvider, null, createElement(ShortcutsHelp, { open: true, onOpenChange() {} })),
  );
  return html.replace(/<!-- -->/g, "").replace(/<[^>]+>/g, "\n").replace(/&#x27;/g, "'");
}

const INGLES = ["Keyboard shortcuts", "Open the glossary", "Single-key shortcuts", "Show this help", "Go to", "Pricing", "Open it from the page footer", "Press ? anytime"];

describe("la ayuda de atajos en los idiomas nuevos", () => {
  it.each([
    ["/pt/", "Atalhos de teclado", "Preços"],
    ["/fr/", "Raccourcis clavier", "Tarifs"],
    ["/de/", "Tastenkürzel", "Preise"],
    ["/it/", "Scorciatoie da tastiera", "Prezzi"],
  ])("%s habla su idioma", (pathname, titulo, precios) => {
    const t = texto(pathname);
    expect(t).toContain(titulo);
    expect(t.split("\n").map((l) => l.trim())).toContain(precios);
    expect(INGLES.filter((s) => t.includes(s))).toEqual([]);
  });

  it("cita tantas pestañas de la demo como tiene", () => {
    expect(texto("/")).toContain(`1–${PESTANAS_DEMO.length}`);
    expect(texto("/")).not.toContain("1–6");
  });
});
