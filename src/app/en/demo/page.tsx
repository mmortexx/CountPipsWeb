import type { Metadata } from "next";
import { DemoBody } from "../../demo/page";
import { SITE_URL, hreflangDe } from "@/lib/site";

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/en/` },
    { "@type": "ListItem", position: 2, name: "Demo", item: `${SITE_URL}/en/demo/` },
  ],
};

export const metadata: Metadata = {
  title: "Live demo",
  description:
    "The app recreated in your browser. 4 clickable sections with realistic sample data. Not a video: the app itself.",
  alternates: {
    canonical: `${SITE_URL}/en/demo/`,
    languages: hreflangDe("/demo"),
  },
  openGraph: {
    title: "Live demo — CountPips",
    description: "The app recreated in your browser. 4 clickable sections with sample data.",
    url: `${SITE_URL}/en/demo/`,
    type: "website",
    siteName: "CountPips",
    locale: "en_GB",
    alternateLocale: ["es_ES"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Live demo — CountPips",
    description: "The app recreated in your browser. 4 clickable sections with realistic sample data.",
  },
};

export default function DemoEnPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <DemoBody />
    </>
  );
}
