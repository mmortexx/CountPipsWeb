import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/layout/PageHeader";
import { Pricing } from "@/components/marketing/Pricing";
import { TableOfContents } from "@/components/tj/TableOfContents";
import { PlateInterlude } from "@/components/tj/PlateInterlude";
import { SITE_URL, hreflangDe } from "@/lib/site";
import { BetaStatus } from "@/components/beta/BetaStatus";

// Estimated reading time (pricing cards + comparison + pricing FAQ +
// trust strip + beta status).
// ~850 words at 220 wpm = ~4 min.
const READING_TIME_MIN = 4;

// PNG (not SVG) — Twitter/X, Facebook, LinkedIn, Slack and Discord all
// silently fail to render SVG OG images. See layout.tsx for the full note.

/**
 * Breadcrumb structured data — page-specific. Lists just [Home, Pricing]
 * so Google renders a correct breadcrumb rich result for the actual
 * page hierarchy.
 */
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Inicio",
      item: `${SITE_URL}/`,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Precios",
      item: `${SITE_URL}/pricing/`,
    },
  ],
};

/**
 * FAQPage structured data — mirrors the 4 visible Q&A items rendered by
 * the PricingFAQ component (ES-default since the site is ES-default).
 * Per Google's FAQ rich-result guidelines, FAQPage schema must appear on
 * the page where the Q&A is visible — that requirement is met on /pricing
 * (the PricingFAQ component renders here). Unlocks FAQ rich results on
 * the pricing SERP entry. See worklog Task R20-1d (E5) + R20-2d.
 *
 * IMPORTANT: keep this in sync with src/components/marketing/PricingFAQ.tsx
 * if the visible ES Q&A copy changes — Google penalizes schema/visible-text
 * mismatches. The 4 Q&A texts below are the ES version verbatim from
 * PricingFAQ.tsx.
 */
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "¿Qué recibo al solicitar acceso anticipado?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Revisamos cada solicitud por perfil y fase del producto. Si encaja con el piloto privado, recibirás una invitación con los siguientes pasos. No mostramos una posición en cola.",
      },
    },
    {
      "@type": "Question",
      name: "¿La demo tiene algún coste?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. La demo es pública, funciona con datos de muestra y no pide tarjeta, registro ni instalación.",
      },
    },
    {
      "@type": "Question",
      name: "¿Qué incluyen los precios de lanzamiento?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Core está previsto en $149 y Pro en $249. Son referencias de lanzamiento hasta que la entrega comercial, la licencia y el soporte estén abiertos.",
      },
    },
    {
      "@type": "Question",
      name: "¿Qué datos no se solicitan?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Nunca pedimos credenciales, capital, extractos ni datos financieros. Sólo preguntamos lo necesario para seleccionar el piloto y entender tu contexto de journal.",
      },
    },
  ],
};

/**
 * Product structured data describes the product without an Offer. The prices
 * are future references during the private pilot, not a purchasable offer.
 */
const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "CountPips",
  description:
    "Diario de trading nativo de Windows. Demo interactiva, métricas institucionales, disciplina que actúa y datos locales.",
  brand: { "@type": "Brand", name: "CountPips" },
  category: "Software",
};

export const metadata: Metadata = {
  title: "Precios",
  description:
    "Demo interactiva sin registro. Precios de lanzamiento previstos: Core $149 · Pro $249.",
  alternates: {
    canonical: `${SITE_URL}/pricing/`,
    languages: hreflangDe("/pricing"),
  },
  openGraph: {
    title: "Precios — CountPips",
    description: "Demo interactiva sin registro. Precios de lanzamiento previstos: Core $149 · Pro $249.",
    url: `${SITE_URL}/pricing/`,
    type: "website",
    siteName: "CountPips",
    locale: "es_ES",
    alternateLocale: ["en_US"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Precios — CountPips",
    description: "Demo interactiva sin registro. Core $149 · Pro $249 como precios de lanzamiento previstos.",
  },
};

// Heavy below-the-fold sections are split into their own JS chunks via
// `next/dynamic` so the initial bundle stays lean. Each gets a tall
// skeleton fallback to prevent layout shift while the chunk loads.
const sectionFallback = (
  <div className="section" aria-hidden="true" style={{ minHeight: 360 }} />
);
const Comparison = dynamic(
  () => import("@/components/marketing/Comparison").then((m) => m.Comparison),
  { loading: () => sectionFallback }
);
const PricingFAQ = dynamic(
  () => import("@/components/marketing/PricingFAQ").then((m) => m.PricingFAQ),
  { loading: () => sectionFallback }
);
const TrustStrip = dynamic(
  () => import("@/components/marketing/TrustStrip").then((m) => m.TrustStrip),
  { loading: () => sectionFallback }
);
// ValueTestimonials retirado: sus tres testimonios eran personas
// inventadas. Vuelve cuando haya reseñas reales de usuarios.
const StatsBandNew = dynamic(
  () => import("@/components/marketing/StatsBandNew").then((m) => m.StatsBandNew),
  { loading: () => sectionFallback }
);
const FinalCTANew = dynamic(
  () => import("@/components/marketing/FinalCTANew").then((m) => m.FinalCTANew),
  { loading: () => sectionFallback }
);

/** Exportado con nombre para que `app/en/pricing/page.tsx` lo reutilice.
 *  Sin los `<script>` de datos estructurados. */
export function PricingBody() {
  return (
    <>
      <PageHeader
        eyebrowEs="Precios"
        eyebrowEn="Pricing"
        titleEs="Compara antes de comprar."
        titleEn="Compare before you buy."
        titleHighlightEs="antes de comprar."
        titleHighlightEn="before you buy."
        subtitleEs="Core $149 y Pro $249 son precios de lanzamiento previstos. Prueba primero la demo; el acceso anticipado privado no es una preventa."
        subtitleEn="Core $149 and Pro $249 are planned launch prices. Try the demo first; private early access is not a pre-order."
        breadcrumbEs="Precios"
        breadcrumbEn="Pricing"
        readingTimeMin={READING_TIME_MIN}
      />
      <Pricing standalone />
      <Comparison />
      {/* Pricing-specific FAQ — 4 bilingual Q&A focused on trial, payment,
          multi-computer and lost license. */}
      <PricingFAQ />
      <BetaStatus />

      <PlateInterlude index={0} />
      <TrustStrip />
      <StatsBandNew />

      <PlateInterlude index={1} />
      <FinalCTANew />
      <TableOfContents />
    </>
  );
}

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <PricingBody />
    </>
  );
}
