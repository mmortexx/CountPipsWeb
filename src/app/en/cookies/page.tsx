import type { Metadata } from "next";
import { CookiesBody } from "../../cookies/page";
import { documentoPorSlug } from "@/lib/legal/documentos";
import { SITE_URL, hreflangDe } from "@/lib/site";

const doc = documentoPorSlug("cookies")!;

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/en/` },
    { "@type": "ListItem", position: 2, name: doc.tituloEn, item: `${SITE_URL}/en/cookies/` },
  ],
};

export const metadata: Metadata = {
  title: doc.tituloEn,
  description: doc.descripcionEn,
  alternates: {
    canonical: `${SITE_URL}/en/cookies/`,
    languages: hreflangDe("/cookies"),
  },
  openGraph: {
    title: `${doc.tituloEn} — CountPips`,
    description: doc.descripcionEn,
    url: `${SITE_URL}/en/cookies/`,
    type: "website",
    siteName: "CountPips",
    locale: "en_GB",
    alternateLocale: ["es_ES"],
  },
  twitter: {
    card: "summary_large_image",
    title: `${doc.tituloEn} — CountPips`,
    description: doc.descripcionEn,
  },
};

export default function CookiesEnPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <CookiesBody />
    </>
  );
}
