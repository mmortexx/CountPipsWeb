import type { Metadata } from "next";
import { FeaturesBody } from "../../features/page";
import { SITE_URL, hreflangDe } from "@/lib/site";
import { PUBLICACION_ISO, ULTIMA_ACTUALIZACION_ISO } from "@/lib/fechas";

const READING_TIME_MIN = 3;

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/en/` },
    { "@type": "ListItem", position: 2, name: "Features", item: `${SITE_URL}/en/features/` },
  ],
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Everything you need to trade with discipline",
  description:
    "Features bento, app gallery, how it works and more. Metrics, discipline and security have their own focused pages.",
  url: `${SITE_URL}/en/features/`,
  mainEntityOfPage: `${SITE_URL}/en/features/`,
  author: { "@type": "Organization", name: "CountPips" },
  publisher: { "@type": "Organization", name: "CountPips" },
  inLanguage: "en",
  timeRequired: `PT${READING_TIME_MIN}M`,
  datePublished: PUBLICACION_ISO,
  dateModified: ULTIMA_ACTUALIZACION_ISO,
  image: `${SITE_URL}/opengraph-image`,
  about: [
    { "@type": "Thing", name: "trading journal" },
    { "@type": "Thing", name: "trading metrics" },
    { "@type": "Thing", name: "trading discipline" },
    { "@type": "Thing", name: "local-first" },
    { "@type": "Thing", name: "Windows app" },
  ],
};

export const metadata: Metadata = {
  title: "Features",
  description:
    "Everything to trade with discipline: features bento, gallery, how it works and more. Metrics, discipline and security each have their own focused page.",
  alternates: {
    canonical: `${SITE_URL}/en/features/`,
    languages: hreflangDe("/features"),
  },
  openGraph: {
    title: "Features — CountPips",
    description: "Explore every CountPips feature in depth.",
    url: `${SITE_URL}/en/features/`,
    type: "website",
    siteName: "CountPips",
    locale: "en_US",
    alternateLocale: ["es_ES"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Features — CountPips",
    description: "40+ institutional metrics, discipline that costs money, a live playbook and 100% local.",
  },
};

export default function FeaturesEnPage() {
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
      <FeaturesBody />
    </>
  );
}
