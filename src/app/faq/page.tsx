import type { Metadata } from "next";
import { FAQ_ES, jsonLdFaq } from "@/lib/faq";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/layout/PageHeader";
import { FAQ } from "@/components/marketing/FAQ";
import { TableOfContents } from "@/components/tj/TableOfContents";
import { PlateInterlude } from "@/components/tj/PlateInterlude";
import { SITE_URL, hreflangDe } from "@/lib/site";

// Estimated reading time (16 Q&A entries + contact sections). ~650 words
// across all answers at 220 wpm = ~3 min.
const READING_TIME_MIN = 3;

// PNG (not SVG) — Twitter/X, Facebook, LinkedIn, Slack and Discord all
// silently fail to render SVG OG images. See layout.tsx for the full note.

/**
 * Breadcrumb structured data — page-specific. Lists just [Home, FAQ]
 * so Google renders a correct breadcrumb rich result for the actual
 * page hierarchy.
 */
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

/**
 * FAQ structured data — mirrors the ES questions/answers shown in the
 * FAQ component below so Google can render FAQ rich snippets on the SERP.
 * Lives on this page ONLY (not in `layout.tsx`): Google's structured data
 * guidelines require FAQ schema to appear on pages where the Q&A is
 * actually visible to the user, and emitting it on every page can trigger
 * a manual-action penalty.
 */
/* El dato estructurado sale de la MISMA lista que pinta el acordeon,
   no de una copia a mano. Aqui habia trece respuestas escritas aparte
   que ya no coincidian con la pagina: a la pregunta por los metodos de
   pago se le declaraba a Google tarjeta y PayPal cuando no hay compra
   posible. Ver src/lib/faq.ts. */
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
    alternateLocale: ["en_US"],
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ — CountPips",
    description:
      "Preguntas frecuentes sobre CountPips: precio, privacidad, compatibilidad, importación, actualizaciones y más.",
  },
};

// Heavy below-the-fold sections are split into their own JS chunks via
// `next/dynamic` so the initial bundle stays lean. Each gets a tall
// skeleton fallback to prevent layout shift while the chunk loads.
const sectionFallback = (
  <div className="section" aria-hidden="true" style={{ minHeight: 360 }} />
);
// `StillHaveQuestions` retirado de esta página (ver el comentario junto
// a <ContactSupport /> más abajo).
const ContactSupport = dynamic(
  () => import("@/components/marketing/ContactSupport").then((m) => m.ContactSupport),
  { loading: () => sectionFallback }
);
const EdgeSignificanceChecker = dynamic(
  () => import("@/components/marketing/EdgeSignificanceChecker").then((m) => m.EdgeSignificanceChecker),
  { loading: () => sectionFallback }
);
const ContactForm = dynamic(
  () => import("@/components/marketing/ContactForm").then((m) => m.ContactForm),
  { loading: () => sectionFallback }
);
const FinalCTANew = dynamic(
  () => import("@/components/marketing/FinalCTANew").then((m) => m.FinalCTANew),
  { loading: () => sectionFallback }
);

/** Exportado con nombre para que `app/en/faq/page.tsx` lo reutilice. Sin
 *  los `<script>` de datos estructurados. */
export function FaqBody() {
  return (
    <>
      <PageHeader
        tono="registro"
        eyebrowEs="Dudas"
        eyebrowEn="Questions"
        titleEs="Preguntas frecuentes."
        titleEn="Frequently asked questions."
        titleHighlightEs="frecuentes."
        titleHighlightEn="questions."
        subtitleEs="Todo lo que necesitas saber antes de probar CountPips o solicitar acceso anticipado. ¿No encuentras tu respuesta? Consulta el glosario o escríbenos."
        subtitleEn="Everything you need to know before trying CountPips or requesting early access. Can't find your answer? Browse the glossary or write to us."
        breadcrumbEs="FAQ"
        breadcrumbEn="FAQ"
        readingTimeMin={READING_TIME_MIN}
      />
      <FAQ standalone />
      <EdgeSignificanceChecker num="01" />
      {/* `StillHaveQuestions` retirado: la página encadenaba CUATRO
          bloques seguidos diciendo lo mismo ("¿aún tienes dudas?",
          "¿no encuentras tu respuesta?", el formulario y el cierre).
          Aquel banner era además una caja de cristal a todo ancho con
          una sola frase centrada, sin icono ni acción. El componente
          sigue en el repositorio por si hace falta en otra página. */}
      <ContactSupport />

      <PlateInterlude index={0} />
      <ContactForm />

      <PlateInterlude index={1} />
      <FinalCTANew />
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
