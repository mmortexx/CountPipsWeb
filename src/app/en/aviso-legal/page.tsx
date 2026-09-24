import type { Metadata } from "next";
import { AvisoLegalBody } from "../../aviso-legal/page";
import { documentoPorSlug } from "@/lib/legal/documentos";
import { SITE_URL, hreflangDe } from "@/lib/site";

const doc = documentoPorSlug("aviso-legal")!;

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/en/` },
    { "@type": "ListItem", position: 2, name: doc.tituloEn, item: `${SITE_URL}/en/aviso-legal/` },
  ],
};

export const metadata: Metadata = {
  title: doc.tituloEn,
  description: doc.descripcionEn,
  alternates: {
    canonical: `${SITE_URL}/en/aviso-legal/`,
    languages: hreflangDe("/aviso-legal"),
  },
  openGraph: {
    title: `${doc.tituloEn} — CountPips`,
    description: doc.descripcionEn,
    url: `${SITE_URL}/en/aviso-legal/`,
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

export default function AvisoLegalEnPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <AvisoLegalBody />
    </>
  );
}
