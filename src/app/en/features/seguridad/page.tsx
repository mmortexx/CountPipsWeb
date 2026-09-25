import type { Metadata } from "next";
import { SeguridadBody } from "../../../features/seguridad/page";
import { RESUMEN_SEGURIDAD } from "@/lib/conexiones";
import { SITE_URL, hreflangDe } from "@/lib/site";
import { PUBLICACION_ISO, ULTIMA_ACTUALIZACION_ISO } from "@/lib/fechas";

const READING_TIME_MIN = 3;

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/en/` },
    { "@type": "ListItem", position: 2, name: "Features", item: `${SITE_URL}/en/features/` },
    { "@type": "ListItem", position: 3, name: "Security", item: `${SITE_URL}/en/features/seguridad/` },
  ],
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Your data, on your machine",
  description:
    RESUMEN_SEGURIDAD.en,
  url: `${SITE_URL}/en/features/seguridad/`,
  mainEntityOfPage: `${SITE_URL}/en/features/seguridad/`,
  author: { "@type": "Organization", name: "CountPips" },
  publisher: { "@type": "Organization", name: "CountPips" },
  inLanguage: "en",
  timeRequired: `PT${READING_TIME_MIN}M`,
  datePublished: PUBLICACION_ISO,
  dateModified: ULTIMA_ACTUALIZACION_ISO,
  image: `${SITE_URL}/opengraph-image`,
  about: [
    { "@type": "Thing", name: "local-first" },
    { "@type": "Thing", name: "data privacy" },
    { "@type": "Thing", name: "encryption" },
    { "@type": "Thing", name: "offline-first" },
    { "@type": "Thing", name: "trading journal security" },
  ],
};

export const metadata: Metadata = {
  title: { absolute: "Security — CountPips" },
  description:
    "Local-first: your trades on your machine, no account and no telemetry. Technical specs, the complete list of connections and how your data is imported.",
  alternates: {
    canonical: `${SITE_URL}/en/features/seguridad/`,
    languages: hreflangDe("/features/seguridad"),
  },
  openGraph: {
    title: "Security — CountPips",
    description: "No account, no telemetry and no CountPips servers. Your data, on your machine.",
    url: `${SITE_URL}/en/features/seguridad/`,
    type: "website",
    siteName: "CountPips",
    locale: "en_GB",
    alternateLocale: ["es_ES"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Security — CountPips",
    description: "No account, no telemetry and no CountPips servers. Your data, on your machine.",
  },
};

export default function SeguridadEnPage() {
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
      <SeguridadBody />
    </>
  );
}
