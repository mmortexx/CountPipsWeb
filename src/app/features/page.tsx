import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/layout/PageHeader";
import { TableOfContents } from "@/components/tj/TableOfContents";
import { FinalCTANew } from "@/components/marketing/FinalCTANew";
import { SITE_URL, hreflangDe } from "@/lib/site";
import { PUBLICACION_ISO, ULTIMA_ACTUALIZACION_ISO } from "@/lib/fechas";

// Estimated reading time (features bento + gallery + how it works + more
// features). ~620 words across four sections at 220 wpm = ~3 min.
const READING_TIME_MIN = 3;


/**
 * Breadcrumb structured data — page-specific. [Home, Features] so Google
 * renders a correct breadcrumb rich result for the actual page hierarchy.
 */
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Características", item: `${SITE_URL}/features/` },
  ],
};

// Article schema — overview page that aggregates the feature deep dives
// (FeaturesBento + HowItWorks + MoreFeatures). Tells search
// engines this is an in-depth product overview article (not just a nav
// page), with a headline, description, and reading time. Mirrors the
// Article schema pattern used by /features/metricas, /features/disciplina
// and /features/seguridad. See worklog Task R26-1c (E4 + E6).
const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Todo lo que necesitas para operar con disciplina",
  description:
    "Bento de características, galería de la app, cómo funciona y más. Métricas, disciplina y seguridad tienen sus propias páginas enfocadas.",
  url: `${SITE_URL}/features/`,
  mainEntityOfPage: `${SITE_URL}/features/`,
  author: { "@type": "Organization", name: "CountPips" },
  publisher: { "@type": "Organization", name: "CountPips" },
  inLanguage: "es",
  timeRequired: `PT${READING_TIME_MIN}M`,
  // datePublished/dateModified use the frozen build date — same value
  // as sitemap.ts LAST_MODIFIED. Google's Article rich-result spec
  // REQUIRES datePublished (ISO 8601) and recommends dateModified.
  datePublished: PUBLICACION_ISO,
  /* La de modificación sale del último commit, no clavada. Con las dos
     iguales y congeladas, la página declaraba no haberse tocado desde
     hace año y medio — y la frescura pesa en el posicionamiento. */
  dateModified: ULTIMA_ACTUALIZACION_ISO,
  // Reuse the OG image (1200×630 PNG, meets Google's 1.91:1 spec).
  image: `${SITE_URL}/opengraph-image`,
  // about[] as canonical Thing objects (not plain strings) — slightly
  // improves classification signals.
  about: [
    { "@type": "Thing", name: "trading journal" },
    { "@type": "Thing", name: "trading metrics" },
    { "@type": "Thing", name: "trading discipline" },
    { "@type": "Thing", name: "local-first" },
    { "@type": "Thing", name: "Windows app" },
  ],
};

export const metadata: Metadata = {
  title: "Características",
  description:
    "Todo para operar con disciplina: bento de características, galería, cómo funciona y más. Métricas, disciplina y seguridad tienen su propia página enfocada.",
  alternates: { canonical: `${SITE_URL}/features/`, languages: hreflangDe("/features") },
  openGraph: {
    title: "Características — CountPips",
    description: "Explora cada característica de CountPips en profundidad.",
    url: `${SITE_URL}/features/`,
    type: "website",
    siteName: "CountPips",
    locale: "es_ES",
    alternateLocale: ["en_US"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Características — CountPips",
    description: "40+ métricas institucionales, disciplina que cuesta dinero, playbook en vivo y 100 % local.",
  },
};

// Overview page keeps the broad-stroke sections. The deep dives live in
// their own focused routes: /features/metricas, /features/disciplina,
// /features/seguridad. This page is the index that points to them.
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

const FeaturesBento = dynamic(
  () => import("@/components/marketing/FeaturesBento").then((m) => m.FeaturesBento)
);
const FeatureExplorer = dynamic(
  () => import("@/components/marketing/FeatureExplorer").then((m) => m.FeatureExplorer)
);
const GaleriaPantallas = dynamic(
  () => import("@/components/marketing/GaleriaPantallas").then((m) => m.GaleriaPantallas)
);
const HowItWorks = dynamic(
  () => import("@/components/marketing/HowItWorks").then((m) => m.HowItWorks)
);
const MoreFeatures = dynamic(
  () => import("@/components/marketing/MoreFeatures").then((m) => m.MoreFeatures)
);

/**
 * Exportado con nombre para que `app/en/features/page.tsx` lo reutilice.
 *
 * NO lleva los `<script>` de datos estructurados — esos son distintos por
 * idioma (el `BreadcrumbList` y el `Article` cambian sus nombres,
 * descripciones e `inLanguage`), así que cada `page.tsx` de cada idioma
 * los pone por su cuenta, alrededor de este cuerpo compartido.
 */
export function FeaturesBody() {
  return (
    <>
      <PageHeader
        tono="capitulo"
        eyebrowEs="Producto"
        eyebrowEn="Product"
        titleEs="Todo lo que necesitas para operar con disciplina."
        titleEn="Everything you need to trade with discipline."
        titleHighlightEs="operar con disciplina."
        titleHighlightEn="trade with discipline."
        subtitleEs="Métricas institucionales, un guardián que te frena antes de la tontería, y tus datos 100 % en tu máquina. No es otro diario con las mismas 30 métricas. Profundiza en cada eje en su propia página."
        subtitleEn="Institutional metrics, a guardian that stops you before the dumb trade, and your data 100% on your machine. Not another journal with the same 30 metrics. Dive into each axis on its own page."
        breadcrumbEs="Características"
        breadcrumbEn="Features"
      />
      {/* Overview sections — broad strokes. Deep dives moved to
          /features/metricas, /features/disciplina, /features/seguridad. */}
      <FeaturesBento />
      <FeatureExplorer />

      {/* La galería que esta página lleva prometiendo desde su primer
          `articleSchema` y no existía. Va aquí, después del explorador:
          el visitante acaba de marcar lo que le importa y de leer una
          lista de nombres, y lo siguiente que necesita es ver la cosa. */}
      <GaleriaPantallas />

      <HowItWorks />

      <MoreFeatures />

      <FinalCTANew />
      <TableOfContents />
    </>
  );
}

export default function FeaturesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <FeaturesBody />
    </>
  );
}
