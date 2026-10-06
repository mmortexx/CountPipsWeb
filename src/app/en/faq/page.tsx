import type { Metadata } from "next";
import { FAQ_EN, jsonLdFaq } from "@/lib/faq";
import { FaqBody } from "../../faq/page";
import { SITE_URL, hreflangDe } from "@/lib/site";

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/en/` },
    { "@type": "ListItem", position: 2, name: "FAQ", item: `${SITE_URL}/en/faq/` },
  ],
};

// Sale de la misma lista que pinta el acordeón (src/lib/faq.ts), para no
// declarar a Google respuestas que la página no da.
const faqSchema = jsonLdFaq(FAQ_EN);

export const metadata: Metadata = {
  title: "FAQ: questions before you install",
  description:
    "Frequently asked questions about CountPips: price, privacy, compatibility, import, updates and more.",
  alternates: {
    canonical: `${SITE_URL}/en/faq/`,
    languages: hreflangDe("/faq"),
  },
  openGraph: {
    title: "FAQ — CountPips",
    description: "Frequently asked questions about CountPips: price, privacy, compatibility and more.",
    url: `${SITE_URL}/en/faq/`,
    type: "website",
    siteName: "CountPips",
    locale: "en_GB",
    alternateLocale: ["es_ES"],
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ — CountPips",
    description: "Frequently asked questions about CountPips: price, privacy, compatibility, import, updates and more.",
  },
};

export default function FaqEnPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <FaqBody />
    </>
  );
}
