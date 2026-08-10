import type { Metadata } from "next";
import { PRICING_FAQ_EN, jsonLdFaq } from "@/lib/faq";
import { PricingBody } from "../../pricing/page";
import { SITE_URL, hreflangDe } from "@/lib/site";

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/en/` },
    { "@type": "ListItem", position: 2, name: "Pricing", item: `${SITE_URL}/en/pricing/` },
  ],
};

/* Debe coincidir palabra por palabra con las 4 preguntas EN visibles en
   `PricingFAQ.tsx` — están copiadas de ahí, no traducidas de nuevo, por
   el mismo motivo que avisa el fichero español: Google penaliza cuando
   el dato estructurado no coincide con lo que se ve en pantalla. */
/* Generado desde la misma lista que pinta el acordeon, para que no se
   pueda publicar a los buscadores una respuesta que la pagina no da.
   Ver src/lib/faq.ts. */
const faqSchema = jsonLdFaq(PRICING_FAQ_EN);

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
    "No-sign-up interactive demo. Planned launch prices: Core $149 · Pro $249.",
  alternates: {
    canonical: `${SITE_URL}/en/pricing/`,
    languages: hreflangDe("/pricing"),
  },
  openGraph: {
    title: "Pricing — CountPips",
    description: "No-sign-up interactive demo. Planned launch prices: Core $149 · Pro $249.",
    url: `${SITE_URL}/en/pricing/`,
    type: "website",
    siteName: "CountPips",
    locale: "en_US",
    alternateLocale: ["es_ES"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing — CountPips",
    description: "No-sign-up interactive demo. Core $149 · Pro $249 as planned launch prices.",
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
