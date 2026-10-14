import type { Metadata } from "next";
import { pricingFaq, jsonLdFaq } from "@/lib/faq";
import { PricingBody } from "../../pricing/page";
import {
  metadataPricing,
  breadcrumbPricingSchema,
  productPricingSchema,
} from "@/lib/rutas-internacionales";

export const metadata: Metadata = metadataPricing("pt");

const breadcrumbSchema = breadcrumbPricingSchema("pt");
const productSchema = productPricingSchema("pt");
const faqSchema = jsonLdFaq(pricingFaq("pt"));

export default function PricingPtPage() {
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
