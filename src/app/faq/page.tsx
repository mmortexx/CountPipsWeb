import type { Metadata } from "next";
import { FAQ_ES, jsonLdFaq } from "@/lib/faq";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/layout/PageHeader";
import { FAQ } from "@/components/marketing/FAQ";
import { TableOfContents } from "@/components/tj/TableOfContents";
import { SITE_URL, hreflangDe } from "@/lib/site";

/** Migas de pan de esta página: Inicio y FAQ. */
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
      name: "FAQ",
      item: `${SITE_URL}/faq/`,
    },
  ],
};

// El FAQPage va solo en esta página (Google lo exige donde las preguntas se
// ven) y sale de la misma lista que pinta el acordeón (src/lib/faq.ts), para
// no declarar respuestas que la página no da.
const faqSchema = jsonLdFaq(FAQ_ES);

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Preguntas frecuentes sobre CountPips: precio, privacidad, compatibilidad, importación, actualizaciones y más.",
  alternates: {
    canonical: `${SITE_URL}/faq/`,
    languages: hreflangDe("/faq"),
  },
  openGraph: {
    title: "FAQ — CountPips",
    description: "Preguntas frecuentes sobre CountPips: precio, privacidad, compatibilidad y más.",
    url: `${SITE_URL}/faq/`,
    type: "website",
    siteName: "CountPips",
    locale: "es_ES",
    alternateLocale: ["en_GB"],
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ — CountPips",
    description:
      "Preguntas frecuentes sobre CountPips: precio, privacidad, compatibilidad, importación, actualizaciones y más.",
  },
};

// Sin `loading` en `next/dynamic`: un `loading` abre un límite de Suspense y el
// prerenderizado escribe el contenido real en un `<div hidden>` al final del
// body, que sin JavaScript no vuelve a su sitio. Lo vigila `scripts/humo.mjs`
// («contenido en bloques ocultos»).

const ContactForm = dynamic(
  () => import("@/components/marketing/ContactForm").then((m) => m.ContactForm)
);
const FinalCTANew = dynamic(
  () => import("@/components/marketing/FinalCTANew").then((m) => m.FinalCTANew)
);

/** Exportado con nombre para que `app/en/faq/page.tsx` lo reutilice. Sin
 *  los `<script>` de datos estructurados. */
export function FaqBody() {
  return (
    <>
      <PageHeader
        tono="registro"
        titleEs="Preguntas frecuentes."
        titleEn="Frequently asked questions."
        subtitleEs="Todo lo que necesitas saber antes de probar CountPips o solicitar acceso anticipado."
        subtitleEn="Everything you need to know before trying CountPips or requesting early access."
        breadcrumbEs="FAQ"
        breadcrumbEn="FAQ"
      />
      <FAQ standalone />
      <ContactForm />

      <FinalCTANew variante="empresa" />
      <TableOfContents />
    </>
  );
}

export default function FaqPage() {
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
