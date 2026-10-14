import type { Metadata } from "next";
import { pricingFaq, jsonLdFaq } from "@/lib/faq";
import { PricingBody } from "../../pricing/page";
import { SITE_URL, hreflangDe } from "@/lib/site";
import { PRECIO_CORE, PRECIO_PRO } from "@/lib/precios";
import { fmtMoney } from "@/lib/trading/format";

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/en/` },
    { "@type": "ListItem", position: 2, name: "Pricing", item: `${SITE_URL}/en/pricing/` },
  ],
};

// Generado desde la misma lista que pinta el acordeón, para no publicar una
// respuesta que la página no da (src/lib/faq.ts).
const faqSchema = jsonLdFaq(pricingFaq("en"));

const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "CountPips",
  description:
    "Windows-native trading journal. Interactive demo, institutional metrics, discipline that acts and local data.",
  brand: { "@type": "Brand", name: "CountPips" },
  category: "Software",
};

export const metadata: Metadata = {
  title: "Pricing",
  description:
    `No-sign-up interactive demo. Planned launch prices: Core ${fmtMoney(PRECIO_CORE, "en", { decimals: 0 })} · Pro ${fmtMoney(PRECIO_PRO, "en", { decimals: 0 })}.`,
  alternates: {
    canonical: `${SITE_URL}/en/pricing/`,
    languages: hreflangDe("/pricing"),
  },
  openGraph: {
    title: "Pricing — CountPips",
    description: `No-sign-up interactive demo. Planned launch prices: Core ${fmtMoney(PRECIO_CORE, "en", { decimals: 0 })} · Pro ${fmtMoney(PRECIO_PRO, "en", { decimals: 0 })}.`,
    url: `${SITE_URL}/en/pricing/`,
    type: "website",
    siteName: "CountPips",
    locale: "en_GB",
    alternateLocale: ["es_ES"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing — CountPips",
    description: `No-sign-up interactive demo. Core ${fmtMoney(PRECIO_CORE, "en", { decimals: 0 })} · Pro ${fmtMoney(PRECIO_PRO, "en", { decimals: 0 })} as planned launch prices.`,
  },
};

export default function PricingEnPage() {
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
