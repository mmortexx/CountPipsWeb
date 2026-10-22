import { describe, expect, it, vi } from "vitest";
import { createElement, type ReactElement } from "react";
import { renderToString } from "react-dom/server";

let ruta = "/";
vi.mock("next/navigation", () => ({ usePathname: () => ruta, useRouter: () => ({ push() {}, replace() {} }) }));

import { LanguageProvider } from "@/lib/i18n";
import type { Lang } from "@/lib/locale";
import { prefijoDeIdioma } from "@/lib/locale";
import { cifrasMuestra } from "@/lib/trading/cifras-muestra";
import { fmtInt, fmtOperaciones } from "@/lib/trading/format";
import { CAMINOS_FONDEO, HERRAMIENTAS } from "@/lib/herramientas";
import { PropChallengeSimulator } from "@/components/marketing/PropChallengeSimulator";
import { MetricsShowcaseNew } from "@/components/marketing/MetricsShowcaseNew";
import { Pricing } from "@/components/marketing/Pricing";
import { GuardianNew } from "@/components/marketing/GuardianNew";
import { ProductShowcase } from "@/components/marketing/ProductShowcase";
import { Hero } from "@/components/marketing/Hero";

/** Texto visible de un componente pintado en el servidor en un idioma. */
function texto(lang: Lang, el: ReactElement): string {
  ruta = `${prefijoDeIdioma(lang)}/`;
  return renderToString(createElement(LanguageProvider, null, el))
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/[\u00a0\u202f]/g, " ")
    .replace(/\s+/g, " ");
}

const NUEVOS: Lang[] = ["pt", "fr", "de", "it"];

describe("textos de la portada en pt, fr, de e it", () => {
  it.each(NUEVOS)("la leyenda del gráfico de la portada no deja «Balance» sin traducir (%s)", (lang) => {
    expect(texto(lang, createElement(MetricsShowcaseNew, { cifras: cifrasMuestra(), enPortada: true }))).not.toMatch(/\bBalance\b/);
  });

  const FRENO: Partial<Record<Lang, RegExp>> = { pt: /freio rígido/i, fr: /frein strict/i, de: /harte Bremse/i, it: /freno rigido/i };
  it.each(NUEVOS)("el freno duro se llama igual en precios que en la portada (%s)", (lang) => {
    expect(texto(lang, createElement(GuardianNew))).toMatch(FRENO[lang]!);
    expect(texto(lang, createElement(Pricing))).toMatch(FRENO[lang]!);
  });

  it("en francés la pestaña del registro es «Saisie»", () => {
    const t = texto("fr", createElement(ProductShowcase));
    expect(t).toMatch(/\bSaisie\b/);
    expect(t).not.toMatch(/\bCapture\b/);
  });

  it.each([
    ["es", "y tus datos se quedan en tu equipo"],
    ["pt", "e seus dados ficam na sua máquina"],
    ["fr", "et vos données restent sur votre machine"],
    ["it", "e i tuoi dati restano sul tuo computer"],
  ] as const)("el subtítulo no dice «romper tus reglas y tus datos» (%s)", (lang, frase) => {
    expect(texto(lang, createElement(Hero))).toContain(frase);
  });
});

describe("el recuento de operaciones habla como el resto del texto", () => {
  it("francés e italiano dicen «opérations» y «operazioni», como la llamada final", () => {
    expect(fmtOperaciones(200, "fr")).toBe("200 opérations");
    expect(fmtOperaciones(1, "fr")).toBe("1 opération");
    expect(fmtOperaciones(200, "it")).toBe("200 operazioni");
    expect(fmtOperaciones(1, "it")).toBe("1 operazione");
  });
});

describe("textos de las herramientas", () => {
  it("ninguna ficha habla en primera persona («dime… te digo», «I will tell you»)", () => {
    const fallos = HERRAMIENTAS.flatMap((h) =>
      Object.entries(h)
        .filter(([, v]) => typeof v === "string" && /\b(dime|te digo|tell me|I will|I'll)\b/i.test(v))
        .map(([k]) => `${h.slug}.${k}`),
    );
    expect(fallos).toEqual([]);
  });

  it.each([
    ["es", "qué parte de", "intentos"],
    ["en", "what share of", "attempts"],
  ] as const)("la prueba de fondeo cuenta sus intentos con la constante (%s)", (lang, antes, despues) => {
    const t = texto(lang, createElement(PropChallengeSimulator));
    expect(t).toContain(`${antes} ${fmtInt(CAMINOS_FONDEO, lang)} ${despues}`);
    expect(t).not.toMatch(/dos mil|two thousand/i);
  });
});
