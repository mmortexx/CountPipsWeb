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
import { TRADES, notaEnIdioma } from "@/lib/trading/data";
import { CAMINOS_FONDEO, HERRAMIENTAS } from "@/lib/herramientas";
import { PropChallengeSimulator } from "@/components/marketing/PropChallengeSimulator";
import { MetricsShowcaseNew } from "@/components/marketing/MetricsShowcaseNew";
import { Pricing } from "@/components/marketing/Pricing";
import { PricingFAQ } from "@/components/marketing/PricingFAQ";
import { GuardianNew } from "@/components/marketing/GuardianNew";
import { ProductShowcase } from "@/components/marketing/ProductShowcase";
import { Hero } from "@/components/marketing/Hero";
import { PRODUCT_ITEMS } from "@/components/marketing/Navbar";
import { metadataHome } from "@/lib/rutas-internacionales";
import { Navbar } from "@/components/marketing/Navbar";
import { ThemeProvider } from "@/lib/theme";
import { ProfileSelector } from "@/components/marketing/ProfileSelector";
import { FinalCTANew } from "@/components/marketing/FinalCTANew";
import { Comparison } from "@/components/marketing/Comparison";
import { BetaStatus } from "@/components/beta/BetaStatus";
import { pricingFaq } from "@/lib/faq";
import { LAMINAS_PRODUCTO } from "@/lib/laminas";
import { SALTOS_TECLADO } from "@/lib/saltos-teclado";

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

  const SALDO: Partial<Record<Lang, string>> = { pt: "Saldo", fr: "Solde", de: "Kontostand", it: "Saldo" };
  it.each(NUEVOS)("la leyenda del gráfico de la portada traduce «Balance» (%s)", (lang) => {
    ruta = `${prefijoDeIdioma(lang)}/`;
    const html = renderToString(createElement(LanguageProvider, null, createElement(MetricsShowcaseNew, { cifras: cifrasMuestra(), enPortada: true })));
    const etiqueta = html.match(/<label[^>]*data-serie="balance"[^>]*>([\s\S]*?)<\/label>/)?.[1].replace(/<[^>]+>/g, "").trim();
    expect(etiqueta).toBe(SALDO[lang]);
  });

  const FRENO: Partial<Record<Lang, RegExp>> = { pt: /freio rígido/i, fr: /frein strict/i, de: /harte Bremse/i, it: /freno rigido/i };
  it.each(NUEVOS)("el freno duro se llama igual en precios, en la portada y en el menú (%s)", (lang) => {
    expect(texto(lang, createElement(GuardianNew))).toMatch(FRENO[lang]!);
    expect(texto(lang, createElement(Pricing))).toMatch(FRENO[lang]!);
    const disciplina = PRODUCT_ITEMS.find((i) => i.href === "/features/disciplina")!;
    const clave = `desc${lang[0].toUpperCase()}${lang[1]}` as "descPt" | "descFr" | "descDe" | "descIt";
    expect(disciplina[clave]).toMatch(FRENO[lang]!);
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

describe("cada idioma nombra las cosas de una sola forma", () => {
  it("alemán: «Prop-Firms» en la barra y en la portada, como en el cajón y el pie", () => {
    for (const el of [createElement(ThemeProvider, null, createElement(Navbar)), createElement(ProfileSelector)]) {
      const t = texto("de", el);
      expect(t).toMatch(/Prop-Firms/);
      expect(t).not.toMatch(/Prop firms/);
    }
  });

  it("alemán: la venta abre al «Verkaufsstart», no al «Launch»", () => {
    expect(texto("de", createElement(Pricing))).not.toMatch(/\bLaunch\b/);
    // El cierre de /de/pricing es la variante de precios (la general no habla de la venta).
    const cierre = texto("de", createElement(() => FinalCTANew({ enPrecios: true })));
    expect(cierre).toMatch(/Verkaufsstart/);
    expect(cierre).not.toMatch(/\bLaunch\b/);
  });

  it("italiano: «diario di trading», no «trading journal», en la portada, la comparativa, el estado y las preguntas de precios", () => {
    expect(texto("it", createElement(Hero))).not.toMatch(/\bjournal\b/i);
    expect(texto("it", createElement(Comparison))).not.toMatch(/\bjournal\b/i);
    expect(texto("it", createElement(BetaStatus))).not.toMatch(/\bjournal\b/i);
    for (const { q, a } of pricingFaq("it")) expect(`${q} ${a}`).not.toMatch(/\bjournal\b/i);
  });

  it.each([
    ["fr", /\bpérimètre\b/, /\bportée\b/],
    ["it", /\bfunzionalità/, /\b(perimetro|ambito)\b/],
  ] as const)("el «alcance» de los planes se dice igual en el menú, en precios y en sus preguntas (%s)", (lang, termino, otros) => {
    const faq = PRODUCT_ITEMS.find((i) => i.href === "/faq")!;
    const clave = `desc${lang[0].toUpperCase()}${lang[1]}` as "descFr" | "descIt";
    for (const t of [faq[clave]!, texto(lang, createElement(Pricing)), texto(lang, createElement(PricingFAQ))]) {
      expect(t).toMatch(termino);
      expect(t).not.toMatch(otros);
    }
  });

  it("italiano: la respuesta del precio lleva sus artículos", () => {
    const precio = pricingFaq("it").find((q) => /Core è previsto/.test(q.a))!;
    expect(precio.a).toMatch(/finché la distribuzione commerciale, la licenza e il supporto/);
  });

  it("francés y portugués llaman a la pantalla de resumen como su pestaña; italiano con apóstrofo tipográfico", () => {
    const lamina = Object.values(LAMINAS_PRODUCTO).find((l) => l.notaFr?.includes("formulaire de saisie"))!;
    expect(lamina.notaFr).not.toMatch(/vue d.ensemble/);
    expect(lamina.notaPt).not.toMatch(/visão geral/);
    expect(Object.values(LAMINAS_PRODUCTO).map((l) => l.tituloIt ?? "").filter((t) => t.includes("'"))).toEqual([]);
  });

  it("italiano: ningún texto de las láminas lleva apóstrofo recto", () => {
    const rectos = Object.values(LAMINAS_PRODUCTO).flatMap((l) =>
      Object.entries(l).filter(([k, v]) => k.endsWith("It") && typeof v === "string" && /\p{L}'\p{L}/u.test(v)).map(([k]) => k),
    );
    expect(rectos).toEqual([]);
  });

  it("alemán: «Vorabzugang» también en la ayuda de atajos", () => {
    expect(SALTOS_TECLADO.find((s) => s.ruta === "/beta")?.de).toMatch(/^Vorabzugang/);
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

describe("notas de la muestra de la demo", () => {
  /* Marcas que en una nota inglesa solo pueden ser restos del español. */
  const ESPANOL = /[áéíóúñ¿¡]|\b(el|la|los|las|en|de|del|y|con|salí|entré|esperé)\b/i;
  const notas = [...new Set(TRADES.flatMap((t) => [t.entryNote, t.closeNote]))];

  it("en inglés ninguna nota de entrada o cierre queda en español", () => {
    expect(notas.length).toBeGreaterThan(20);
    const sinTraducir = notas.filter((n) => notaEnIdioma(n, "en") === n || ESPANOL.test(notaEnIdioma(n, "en")));
    expect(sinTraducir).toEqual([]);
  });

  it("en español se enseñan tal cual, y lo que escribe el visitante no se toca", () => {
    for (const n of notas) expect(notaEnIdioma(n, "es")).toBe(n);
    expect(notaEnIdioma("Mi nota propia", "en")).toBe("Mi nota propia");
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

  it("la ficha de la prueba de fondeo cuenta sus intentos con la constante", () => {
    const f = HERRAMIENTAS.find((h) => h.slug === "prueba-de-fondeo")!;
    for (const t of [f.subtituloEs, f.resumenEs]) expect(t).toContain(`${fmtInt(CAMINOS_FONDEO, "es")} intentos`);
    for (const t of [f.subtituloEn, f.resumenEn]) expect(t).toContain(`${fmtInt(CAMINOS_FONDEO, "en")} attempts`);
    expect(Object.values(f).filter((v) => typeof v === "string" && /dos mil|two thousand/i.test(v))).toEqual([]);
  });
});

describe("títulos de las portadas pt, fr, de e it", () => {
  // Como en es («App de diario de trading para Windows») y en: el título lleva la búsqueda, no el eslogan.
  it.each([
    ["pt", /^App de diário de trading para Windows/],
    ["fr", /journal de trading pour Windows/i],
    ["de", /^Trading-Journal-App für Windows/],
    ["it", /^App di diario di trading per Windows/],
  ] as const)("%s", (lang, busqueda) => {
    const m = metadataHome(lang);
    const titulo = (m.title as { absolute: string }).absolute;
    expect(titulo).toMatch(busqueda);
    expect(titulo).toMatch(/— CountPips$/);
    expect(m.openGraph?.title).toBe(m.twitter?.title);
  });
});
