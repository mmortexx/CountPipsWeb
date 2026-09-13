import type { Metadata } from "next";
import { FAQ_ES, jsonLdFaq } from "@/lib/faq";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/layout/PageHeader";
import { FAQ } from "@/components/marketing/FAQ";
import { TableOfContents } from "@/components/tj/TableOfContents";
import { SITE_URL, hreflangDe } from "@/lib/site";

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

// `StillHaveQuestions` retirado de esta página (ver el comentario junto
// a <ContactSupport /> más abajo).
// LAS SECCIONES PESADAS SIGUEN EN SU PROPIO TROZO DE JAVASCRIPT, PERO YA
// NO LLEVAN `loading`.
//
// Un `loading` en `next/dynamic` abre un límite de Suspense, y React
// resuelve un límite de Suspense durante el prerenderizado escribiendo el
// hueco en su sitio y el contenido REAL al final del <body>, dentro de un
// <div hidden> que sólo un script sabe devolver a su lugar. Sin
// JavaScript ese script no corre: medido en el HTML compilado, la portada
// servía 37.921 de sus 118.707 caracteres —el 32 %— dentro de bloques
// ocultos, y /features 61.865 de 128.953, el 48 %.
//
// Sin `loading` no hay límite, el contenido se escribe donde va y el
// reparto en trozos se conserva intacto: medido tras el cambio, la
// portada pide los mismos 17 scripts y los mismos 948 KB. El salto de
// maquetación que el hueco venía a evitar tampoco ocurre — no hay hueco,
// porque la sección ya viene escrita.
//
// Lo vigila `scripts/humo.mjs` (guardián «contenido en bloques ocultos»).

const ContactSupport = dynamic(
  () => import("@/components/marketing/ContactSupport").then((m) => m.ContactSupport)
);
const EdgeSignificanceChecker = dynamic(
  () => import("@/components/marketing/EdgeSignificanceChecker").then((m) => m.EdgeSignificanceChecker)
);
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
      />
      <FAQ standalone />
      <EdgeSignificanceChecker />
      {/* `StillHaveQuestions` retirado: la página encadenaba CUATRO
          bloques seguidos diciendo lo mismo ("¿aún tienes dudas?",
          "¿no encuentras tu respuesta?", el formulario y el cierre).
          Aquel banner era además una caja de cristal a todo ancho con
          una sola frase centrada, sin icono ni acción. El componente
          sigue en el repositorio por si hace falta en otra página. */}
      <ContactSupport />

      <ContactForm />

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
