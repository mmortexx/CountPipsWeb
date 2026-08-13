import type { Metadata } from "next";
import { MetricasBody } from "../../../features/metricas/page";
import { SITE_URL, hreflangDe } from "@/lib/site";
import { PUBLICACION_ISO, ULTIMA_ACTUALIZACION_ISO } from "@/lib/fechas";

const READING_TIME_MIN = 3;

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/en/` },
    { "@type": "ListItem", position: 2, name: "Features", item: `${SITE_URL}/en/features/` },
    { "@type": "ListItem", position: 3, name: "Metrics", item: `${SITE_URL}/en/features/metricas/` },
  ],
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Metrics that separate a real edge from a streak",
  description:
    "40+ institutional ratios computed from your trades. Sharpe, Sortino, Calmar, profit factor, expectancy in R.",
  url: `${SITE_URL}/en/features/metricas/`,
  mainEntityOfPage: `${SITE_URL}/en/features/metricas/`,
  author: { "@type": "Organization", name: "CountPips" },
  publisher: { "@type": "Organization", name: "CountPips" },
  inLanguage: "en",
  timeRequired: `PT${READING_TIME_MIN}M`,
  datePublished: PUBLICACION_ISO,
  dateModified: ULTIMA_ACTUALIZACION_ISO,
  image: `${SITE_URL}/opengraph-image`,
  about: [
    { "@type": "Thing", name: "trading metrics" },
    { "@type": "Thing", name: "Sharpe ratio" },
    { "@type": "Thing", name: "profit factor" },
    { "@type": "Thing", name: "expectancy" },
    { "@type": "Thing", name: "risk calculator" },
  ],
};

export const metadata: Metadata = {
  title: { absolute: "Metrics — CountPips" },
  description:
    "40+ institutional ratios: Sharpe, Sortino, Calmar, profit factor, expectancy in R. Risk calculator. Metrics that correlate with consistency.",
  alternates: {
    canonical: `${SITE_URL}/en/features/metricas/`,
    languages: hreflangDe("/features/metricas"),
  },
  openGraph: {
    title: "Metrics — CountPips",
    description: "40+ institutional ratios and a risk calculator. Metrics that separate a real edge from a streak.",
    url: `${SITE_URL}/en/features/metricas/`,
    type: "website",
    siteName: "CountPips",
    locale: "en_US",
    alternateLocale: ["es_ES"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Metrics — CountPips",
    description: "40+ institutional ratios and an interactive risk calculator.",
  },
};

export default function MetricasEnPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <MetricasBody />
    </>
  );
}
