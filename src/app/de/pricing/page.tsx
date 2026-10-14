import type { Metadata } from "next";
import { pricingFaq, jsonLdFaq } from "@/lib/faq";
import { PricingBody } from "../../pricing/page";
import {
  metadataPricing,
  breadcrumbPricingSchema,
  productPricingSchema,
} from "@/lib/rutas-internacionales";

export const metadata: Metadata = metadataPricing("de");

const breadcrumbSchema = breadcrumbPricingSchema("de");
const productSchema = productPricingSchema("de");
const faqSchema = jsonLdFaq(pricingFaq("de"));

export default function PricingDePage() {
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
