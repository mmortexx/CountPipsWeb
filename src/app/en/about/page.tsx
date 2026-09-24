import type { Metadata } from "next";
import { AboutBody } from "../../about/page";
import { SITE_URL, hreflangDe } from "@/lib/site";

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/en/` },
    { "@type": "ListItem", position: 2, name: "About", item: `${SITE_URL}/en/about/` },
  ],
};

export const metadata: Metadata = {
  title: "About",
  description:
    "The story of CountPips: why it exists, who it's for, and how it evolves. Made for the serious manual trader.",
  alternates: {
    canonical: `${SITE_URL}/en/about/`,
    languages: hreflangDe("/about"),
  },
  openGraph: {
    title: "About — CountPips",
    description: "The story of CountPips: why it exists, who it's for, and how it evolves.",
    url: `${SITE_URL}/en/about/`,
    type: "website",
    siteName: "CountPips",
    locale: "en_GB",
    alternateLocale: ["es_ES"],
  },
  twitter: {
    card: "summary_large_image",
    title: "About — CountPips",
    description: "The story of CountPips: why it exists, who it's for, and how it evolves. Made for the serious manual trader.",
  },
};

export default function AboutEnPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <AboutBody />
    </>
  );
}
