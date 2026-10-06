import type { Metadata } from "next";
import { PRICING_FAQ_ES, jsonLdFaq } from "@/lib/faq";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/layout/PageHeader";
import { Pricing } from "@/components/marketing/Pricing";
import { TableOfContents } from "@/components/tj/TableOfContents";
import { SITE_URL, hreflangDe } from "@/lib/site";
import { BetaStatus } from "@/components/beta/BetaStatus";

/** Migas de pan de esta página: Inicio y Precios. */
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Inicio",
      item: `${SITE_URL}/`,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Precios",
      item: `${SITE_URL}/pricing/`,
    },
  ],
};

// Generado desde la misma lista que pinta el acordeón, para no publicar a los
// buscadores una respuesta que la página no da (src/lib/faq.ts).
const faqSchema = jsonLdFaq(PRICING_FAQ_ES);

/** `Product` sin `Offer`: durante el piloto privado los precios son una referencia futura, no una oferta comprable. */
const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "CountPips",
  description:
    "Diario de trading nativo de Windows. Demo interactiva, métricas institucionales, disciplina que actúa y datos locales.",
  brand: { "@type": "Brand", name: "CountPips" },
  category: "Software",
};

export const metadata: Metadata = {
  title: "Precios",
  description:
    "Demo interactiva sin registro. Precios de lanzamiento previstos: Core 149\u00a0$ · Pro 249\u00a0$.",
  alternates: {
    canonical: `${SITE_URL}/pricing/`,
    languages: hreflangDe("/pricing"),
  },
  openGraph: {
    title: "Precios — CountPips",
    description: "Demo interactiva sin registro. Precios de lanzamiento previstos: Core 149\u00a0$ · Pro 249\u00a0$.",
    url: `${SITE_URL}/pricing/`,
    type: "website",
    siteName: "CountPips",
    locale: "es_ES",
    alternateLocale: ["en_GB"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Precios — CountPips",
    description: "Demo interactiva sin registro. Core 149\u00a0$ · Pro 249\u00a0$ como precios de lanzamiento previstos.",
  },
};

// Sin `loading` en `next/dynamic`: un `loading` abre un límite de Suspense y el
// prerenderizado escribe el contenido real en un `<div hidden>` al final del
// body, que sin JavaScript no vuelve a su sitio. Lo vigila `scripts/humo.mjs`
// («contenido en bloques ocultos»).

const Comparison = dynamic(
  () => import("@/components/marketing/Comparison").then((m) => m.Comparison)
);
const PricingFAQ = dynamic(
  () => import("@/components/marketing/PricingFAQ").then((m) => m.PricingFAQ)
);
const FinalCTANew = dynamic(
  () => import("@/components/marketing/FinalCTANew").then((m) => m.FinalCTANew)
);

/** Exportado con nombre para que `app/en/pricing/page.tsx` lo reutilice.
 *  Sin los `<script>` de datos estructurados. */
export function PricingBody() {
  return (
    <>
      {/* El titular no puede decir «comprar»: no hay nada que comprar, los dos
          CTA llevan al piloto privado y el esquema Product va sin Offer. */}
      <PageHeader
        tono="tarifa"
        titleEs="El precio, por escrito."
        titleEn="The price, up front."
        subtitleEs={"Core 149\u00a0$ y Pro 249\u00a0$ son precios de lanzamiento previstos. Prueba primero la demo; el acceso anticipado privado no es una preventa."}
        subtitleEn="Core $149 and Pro $249 are planned launch prices. Try the demo first; private early access is not a pre-order."
        breadcrumbEs="Precios"
        breadcrumbEn="Pricing"
      />
      <Pricing standalone />
      <Comparison />
      <PricingFAQ />
      <BetaStatus />

      <FinalCTANew enPrecios />
      <TableOfContents />
    </>
  );
}

export default function PricingPage() {
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
