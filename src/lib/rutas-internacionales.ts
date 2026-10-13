import type { Metadata } from "next";
import { SITE_URL, hreflangDe } from "@/lib/site";
import { fmtMoney } from "@/lib/trading/format";
import { PRECIO_CORE, PRECIO_PRO } from "@/lib/precios";

interface MetaIdioma {
  homeTitle: string;
  homeDescription: string;
  homeTwitterDesc: string;
  pricingTitle: string;
  pricingDescription: string;
  pricingTwitterDesc: string;
  breadcrumbHome: string;
  breadcrumbPricing: string;
  productDescription: string;
  ogLocale: string;
}

export const META_POR_IDIOMA: Record<"pt" | "fr" | "de" | "it", MetaIdioma> = {
  pt: {
    homeTitle: "CountPips — Opere como uma mesa institucional.",
    homeDescription:
      "Diário de trading nativo para Windows. Explore a demo interativa com métricas institucionais, disciplina e dados no seu computador.",
    homeTwitterDesc:
      "Diário de trading profissional nativo para Windows. Métricas institucionais, disciplina e dados locais.",
    pricingTitle: "Preços",
    pricingDescription:
      `Demo interativa sem cadastro. Preços previstos de lançamento: Core ${fmtMoney(PRECIO_CORE, "pt", { decimals: 0 })} · Pro ${fmtMoney(PRECIO_PRO, "pt", { decimals: 0 })}.`,
    pricingTwitterDesc:
      `Demo interativa sem cadastro. Core ${fmtMoney(PRECIO_CORE, "pt", { decimals: 0 })} · Pro ${fmtMoney(PRECIO_PRO, "pt", { decimals: 0 })} como preços previstos de lançamento.`,
    breadcrumbHome: "Início",
    breadcrumbPricing: "Preços",
    productDescription:
      "Diário de trading nativo para Windows. Demo interativa, métricas institucionais, disciplina ativa e dados no seu computador.",
    ogLocale: "pt_BR",
  },
  fr: {
    homeTitle: "CountPips — Tradez comme un desk institutionnel.",
    homeDescription:
      "Journal de trading natif pour Windows. Explorez la démo interactive avec métriques institutionnelles, discipline et données locales.",
    homeTwitterDesc:
      "Journal de trading professionnel natif pour Windows. Métriques institutionnelles, discipline et données locales.",
    pricingTitle: "Tarifs",
    pricingDescription:
      `Démo interactive sans inscription. Tarifs de lancement prévus : Core ${fmtMoney(PRECIO_CORE, "fr", { decimals: 0 })} · Pro ${fmtMoney(PRECIO_PRO, "fr", { decimals: 0 })}.`,
    pricingTwitterDesc:
      `Démo interactive sans inscription. Core ${fmtMoney(PRECIO_CORE, "fr", { decimals: 0 })} · Pro ${fmtMoney(PRECIO_PRO, "fr", { decimals: 0 })} comme tarifs de lancement prévus.`,
    breadcrumbHome: "Accueil",
    breadcrumbPricing: "Tarifs",
    productDescription:
      "Journal de trading natif pour Windows. Démo interactive, métriques institutionnelles, discipline active et données locales.",
    ogLocale: "fr_FR",
  },
  de: {
    homeTitle: "CountPips — Traden wie ein institutioneller Desk.",
    homeDescription:
      "Trading-Journal, nativ für Windows. Interaktive Demo mit institutionellen Kennzahlen, Disziplin und lokalen Daten.",
    homeTwitterDesc:
      "Professionelles Trading-Journal für Windows. Institutionelle Kennzahlen, Disziplin und lokale Daten.",
    pricingTitle: "Preise",
    pricingDescription:
      `Interaktive Demo ohne Registrierung. Geplante Einführungspreise: Core ${fmtMoney(PRECIO_CORE, "de", { decimals: 0 })} · Pro ${fmtMoney(PRECIO_PRO, "de", { decimals: 0 })}.`,
    pricingTwitterDesc:
      `Interaktive Demo ohne Registrierung. Core ${fmtMoney(PRECIO_CORE, "de", { decimals: 0 })} · Pro ${fmtMoney(PRECIO_PRO, "de", { decimals: 0 })} als geplante Einführungspreise.`,
    breadcrumbHome: "Startseite",
    breadcrumbPricing: "Preise",
    productDescription:
      "Trading-Journal, nativ für Windows. Interaktive Demo, institutionelle Kennzahlen, aktive Disziplin und lokale Daten.",
    ogLocale: "de_DE",
  },
  it: {
    homeTitle: "CountPips — Opera come un desk istituzionale.",
    homeDescription:
      "Diario di trading nativo per Windows. Esplora la demo interattiva con metriche istituzionali, disciplina e dati sul tuo PC.",
    homeTwitterDesc:
      "Diario di trading professionale nativo per Windows. Metriche istituzionali, disciplina e dati locali.",
    pricingTitle: "Prezzi",
    pricingDescription:
      `Demo interattiva senza registrazione. Prezzi di lancio previsti: Core ${fmtMoney(PRECIO_CORE, "it", { decimals: 0 })} · Pro ${fmtMoney(PRECIO_PRO, "it", { decimals: 0 })}.`,
    pricingTwitterDesc:
      `Demo interattiva senza registrazione. Core ${fmtMoney(PRECIO_CORE, "it", { decimals: 0 })} · Pro ${fmtMoney(PRECIO_PRO, "it", { decimals: 0 })} come prezzi di lancio previsti.`,
    breadcrumbHome: "Home",
    breadcrumbPricing: "Prezzi",
    productDescription:
      "Diario di trading nativo per Windows. Demo interattiva, metriche istituzionali, disciplina attiva e dati sul tuo PC.",
    ogLocale: "it_IT",
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
      title: meta.homeTitle,
      description: meta.homeDescription,
      url: `${SITE_URL}/${lang}/`,
      type: "website",
      siteName: "CountPips",
      locale: meta.ogLocale,
      alternateLocale: ["es_ES", "en_GB"],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.homeTitle,
      description: meta.homeTwitterDesc,
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
      locale: meta.ogLocale,
      alternateLocale: ["es_ES", "en_GB"],
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

export function productPricingSchema(lang: "pt" | "fr" | "de" | "it") {
  const meta = META_POR_IDIOMA[lang];
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "CountPips",
    description: meta.productDescription,
    brand: { "@type": "Brand", name: "CountPips" },
    category: "Software",
  };
}
