import type { Metadata } from "next";
import { TerminosBody } from "../../terminos/page";
import { documentoPorSlug } from "@/lib/legal/documentos";
import { SITE_URL, hreflangDe } from "@/lib/site";

const doc = documentoPorSlug("terminos")!;

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/en/` },
    { "@type": "ListItem", position: 2, name: doc.tituloEn, item: `${SITE_URL}/en/terminos/` },
  ],
};

export const metadata: Metadata = {
  title: doc.tituloEn,
  description: doc.descripcionEn,
  alternates: {
    canonical: `${SITE_URL}/en/terminos/`,
    languages: hreflangDe("/terminos"),
  },
  openGraph: {
    title: `${doc.tituloEn} — CountPips`,
    description: doc.descripcionEn,
    url: `${SITE_URL}/en/terminos/`,
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

export default function TerminosEnPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <TerminosBody />
    </>
  );
}
