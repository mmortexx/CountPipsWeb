import type { Metadata } from "next";
import { pricingFaq, jsonLdFaq } from "@/lib/faq";
import { PricingBody } from "../../pricing/page";
import { SITE_URL, hreflangDe } from "@/lib/site";
import { localesAlternos } from "@/lib/locale";
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

/** One description for search, social cards and X. */
const DESCRIPCION = `CountPips trading journal pricing for Windows: Core ${fmtMoney(PRECIO_CORE, "en", { decimals: 0 })} and Pro ${fmtMoney(PRECIO_PRO, "en", { decimals: 0 })}, planned launch prices. Try the demo first, no sign-up.`;

export const metadata: Metadata = {
  title: "Trading journal pricing",
  description: DESCRIPCION,
  alternates: {
    canonical: `${SITE_URL}/en/pricing/`,
    languages: hreflangDe("/pricing"),
  },
  openGraph: {
    title: "Trading journal pricing — CountPips",
    description: DESCRIPCION,
    url: `${SITE_URL}/en/pricing/`,
    type: "website",
    siteName: "CountPips",
    locale: "en_GB",
    alternateLocale: localesAlternos("/pricing", "en"),
  },
  twitter: {
    card: "summary_large_image",
    title: "Trading journal pricing — CountPips",
    description: DESCRIPCION,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <PricingBody />
    </>
  );
}
