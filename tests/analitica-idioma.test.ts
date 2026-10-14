import { afterEach, describe, expect, it, vi } from "vitest";
import { trackEvent } from "@/lib/analytics";
import { CONSENT_KEY } from "@/lib/consent";

/**
 * Cada evento lleva el idioma que fija `<html lang>`. Con la ruta del despliegue
 * (`/CountPipsWeb/en/…`) la ruta ya no empieza por `/en`: el inglés salía como
 * español y pt, fr, de e it también.
 */
function simularPagina(htmlLang: string, pathname: string) {
  const capture = vi.fn();
  vi.stubGlobal("window", {
    location: { pathname },
    posthog: { capture },
    localStorage: {
      getItem: (clave: string) => (clave === CONSENT_KEY ? "accepted" : null),
    },
  });
  vi.stubGlobal("document", { documentElement: { lang: htmlLang } });
  return capture;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("la analítica etiqueta el idioma de la página", () => {
  it.each([
    ["es", "/CountPipsWeb/pricing/", "es"],
    ["en", "/CountPipsWeb/en/pricing/", "en"],
    ["pt-BR", "/CountPipsWeb/pt/pricing/", "pt"],
    ["fr-FR", "/CountPipsWeb/fr/pricing/", "fr"],
    ["de-DE", "/CountPipsWeb/de/pricing/", "de"],
    ["it-IT", "/CountPipsWeb/it/pricing/", "it"],
  ])("%s en %s → locale %s", (htmlLang, pathname, codigo) => {
    const capture = simularPagina(htmlLang, pathname);
    trackEvent("evento_prueba");
    expect(capture).toHaveBeenCalledWith("evento_prueba", { locale: codigo });
  });

  it("un idioma que no está en la tabla se envía tal cual", () => {
    const capture = simularPagina("nl", "/CountPipsWeb/nl/pricing/");
    trackEvent("evento_prueba");
    expect(capture).toHaveBeenCalledWith("evento_prueba", { locale: "nl" });
  });
});
