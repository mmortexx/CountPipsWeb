import type { Metadata } from "next";
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
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What do I receive when I request early access?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We review every request by profile and product phase. If it fits the private pilot, you receive an invitation with next steps. We do not show a queue position.",
      },
    },
    {
      "@type": "Question",
      name: "Does the demo cost anything?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. The demo is public, uses sample data and requires no card, sign-up or installation.",
      },
    },
    {
      "@type": "Question",
      name: "What do the launch prices include?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Core is planned at $149 and Pro at $249. They are launch references until commercial delivery, licensing and support are open.",
      },
    },
    {
      "@type": "Question",
      name: "What data do you not request?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We never ask for credentials, capital, statements or financial data. We only ask what is needed to select the pilot and understand your journaling context.",
      },
    },
  ],
};

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
