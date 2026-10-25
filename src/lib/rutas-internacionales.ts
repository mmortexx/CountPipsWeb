import type { Metadata } from "next";
import { SITE_URL, hreflangDe } from "@/lib/site";
import { fmtMoney } from "@/lib/trading/format";
import { PRECIO_CORE, PRECIO_PRO } from "@/lib/precios";
import { METRICAS } from "@/lib/producto";
import { localesAlternos, ogLocaleDe } from "@/lib/locale";

interface MetaIdioma {
  /** Título de la pestaña y del buscador: la búsqueda que persigue, como en es y en. */
  homeTitle: string;
  /** Eslogan para las tarjetas sociales. */
  homeSlogan: string;
  /** Buscador, Open Graph y X: una sola descripción; el eslogan ya dice «institucional». */
  homeDescription: string;
  pricingTitle: string;
  pricingDescription: string;
  pricingTwitterDesc: string;
  breadcrumbHome: string;
  breadcrumbPricing: string;
}

export const META_POR_IDIOMA: Record<"pt" | "fr" | "de" | "it", MetaIdioma> = {
  pt: {
    homeTitle: "App de diário de trading para Windows — CountPips",
    homeSlogan: "CountPips — Opere como uma mesa institucional.",
    homeDescription:
      `Diário de trading para Windows: ${METRICAS} métricas, um guardião de disciplina e seus dados na sua máquina. Experimente a demo sem cadastro.`,
    pricingTitle: "Preços",
    pricingDescription:
      `Demo interativa sem cadastro. Preços previstos de lançamento: Core ${fmtMoney(PRECIO_CORE, "pt", { decimals: 0 })} · Pro ${fmtMoney(PRECIO_PRO, "pt", { decimals: 0 })}.`,
    pricingTwitterDesc:
      `Demo interativa sem cadastro. Core ${fmtMoney(PRECIO_CORE, "pt", { decimals: 0 })} · Pro ${fmtMoney(PRECIO_PRO, "pt", { decimals: 0 })} como preços previstos de lançamento.`,
    breadcrumbHome: "Início",
    breadcrumbPricing: "Preços",
  },
  fr: {
    homeTitle: "Application de journal de trading pour Windows — CountPips",
    homeSlogan: "CountPips — Tradez comme un desk institutionnel.",
    homeDescription:
      `Journal de trading pour Windows\u00a0: ${METRICAS} métriques, un gardien de discipline et vos données sur votre machine. Essayez la démo sans inscription.`,
    pricingTitle: "Tarifs",
    pricingDescription:
      `Démo interactive sans inscription. Tarifs de lancement prévus\u00a0: Core ${fmtMoney(PRECIO_CORE, "fr", { decimals: 0 })} · Pro ${fmtMoney(PRECIO_PRO, "fr", { decimals: 0 })}.`,
    pricingTwitterDesc:
      `Démo interactive sans inscription. Core ${fmtMoney(PRECIO_CORE, "fr", { decimals: 0 })} · Pro ${fmtMoney(PRECIO_PRO, "fr", { decimals: 0 })} comme tarifs de lancement prévus.`,
    breadcrumbHome: "Accueil",
    breadcrumbPricing: "Tarifs",
  },
  de: {
    homeTitle: "Trading-Journal-App für Windows — CountPips",
    homeSlogan: "CountPips — Traden wie ein institutioneller Desk.",
    homeDescription:
      `Trading-Journal für Windows: ${METRICAS} Kennzahlen, ein Disziplin-Wächter und Ihre Daten auf Ihrem Rechner. Testen Sie die Demo ohne Anmeldung.`,
    pricingTitle: "Preise",
    pricingDescription:
      `Interaktive Demo ohne Registrierung. Geplante Einführungspreise: Core ${fmtMoney(PRECIO_CORE, "de", { decimals: 0 })} · Pro ${fmtMoney(PRECIO_PRO, "de", { decimals: 0 })}.`,
    pricingTwitterDesc:
      `Interaktive Demo ohne Registrierung. Core ${fmtMoney(PRECIO_CORE, "de", { decimals: 0 })} · Pro ${fmtMoney(PRECIO_PRO, "de", { decimals: 0 })} als geplante Einführungspreise.`,
    breadcrumbHome: "Startseite",
    breadcrumbPricing: "Preise",
  },
  it: {
    homeTitle: "App di diario di trading per Windows — CountPips",
    homeSlogan: "CountPips — Opera come un desk istituzionale.",
    homeDescription:
      `Diario di trading per Windows: ${METRICAS} metriche, un guardiano della disciplina e i tuoi dati sulla tua macchina. Prova la demo senza registrazione.`,
    pricingTitle: "Prezzi",
    pricingDescription:
      `Demo interattiva senza registrazione. Prezzi di lancio previsti: Core ${fmtMoney(PRECIO_CORE, "it", { decimals: 0 })} · Pro ${fmtMoney(PRECIO_PRO, "it", { decimals: 0 })}.`,
    pricingTwitterDesc:
      `Demo interattiva senza registrazione. Core ${fmtMoney(PRECIO_CORE, "it", { decimals: 0 })} · Pro ${fmtMoney(PRECIO_PRO, "it", { decimals: 0 })} come prezzi di lancio previsti.`,
    breadcrumbHome: "Home",
    breadcrumbPricing: "Prezzi",
  },
};

export function metadataHome(lang: "pt" | "fr" | "de" | "it"): Metadata {
  const meta = META_POR_IDIOMA[lang];
  return {
    title: { absolute: meta.homeTitle },
    description: meta.homeDescription,
    alternates: {
      canonical: `${SITE_URL}/${lang}/`,
      languages: hreflangDe("/"),
    },
    openGraph: {
      title: meta.homeSlogan,
      description: meta.homeDescription,
      url: `${SITE_URL}/${lang}/`,
      type: "website",
      siteName: "CountPips",
      locale: ogLocaleDe(lang),
      alternateLocale: localesAlternos("/", lang),
    },
    twitter: {
      card: "summary_large_image",
      title: meta.homeSlogan,
      description: meta.homeDescription,
    },
  };
}

export function metadataPricing(lang: "pt" | "fr" | "de" | "it"): Metadata {
  const meta = META_POR_IDIOMA[lang];
  return {
    title: meta.pricingTitle,
    description: meta.pricingDescription,
    alternates: {
      canonical: `${SITE_URL}/${lang}/pricing/`,
      languages: hreflangDe("/pricing"),
    },
    openGraph: {
      title: `${meta.pricingTitle} — CountPips`,
      description: meta.pricingDescription,
      url: `${SITE_URL}/${lang}/pricing/`,
      type: "website",
      siteName: "CountPips",
      locale: ogLocaleDe(lang),
      alternateLocale: localesAlternos("/pricing", lang),
    },
    twitter: {
      card: "summary_large_image",
      title: `${meta.pricingTitle} — CountPips`,
      description: meta.pricingTwitterDesc,
    },
  };
}

export function breadcrumbPricingSchema(lang: "pt" | "fr" | "de" | "it") {
  const meta = META_POR_IDIOMA[lang];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: meta.breadcrumbHome, item: `${SITE_URL}/${lang}/` },
      { "@type": "ListItem", position: 2, name: meta.breadcrumbPricing, item: `${SITE_URL}/${lang}/pricing/` },
    ],
  };
}

