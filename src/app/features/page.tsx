import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/layout/PageHeader";
import { TableOfContents } from "@/components/tj/TableOfContents";
import { FinalCTANew } from "@/components/marketing/FinalCTANew";
import { getCal, getSetups } from "@/lib/trading/fixtures";
import { SITE_URL, hreflangDe } from "@/lib/site";
import { PUBLICACION_ISO, ULTIMA_ACTUALIZACION_ISO } from "@/lib/fechas";

// Tiempo de lectura estimado: ~620 palabras a 220 ppm.
const READING_TIME_MIN = 3;


/** Migas de pan de esta página: Inicio y Características. */
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Características", item: `${SITE_URL}/features/` },
  ],
};

// Mismo patrón de `Article` que /features/metricas, /disciplina y /seguridad.
const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Todo lo que necesitas para operar con disciplina",
  description:
    "Las funciones de CountPips, capturas reales del programa y cómo se usa. Métricas, disciplina y seguridad tienen su propia página.",
  url: `${SITE_URL}/features/`,
  mainEntityOfPage: `${SITE_URL}/features/`,
  author: { "@type": "Organization", name: "CountPips" },
  publisher: { "@type": "Organization", name: "CountPips" },
  inLanguage: "es",
  timeRequired: `PT${READING_TIME_MIN}M`,
  // Google exige `datePublished` (ISO 8601); la modificación sale del último commit.
  datePublished: PUBLICACION_ISO,
  dateModified: ULTIMA_ACTUALIZACION_ISO,
  image: `${SITE_URL}/features/opengraph-image`,
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
    "Las funciones de CountPips, capturas reales del programa y cómo se usa. Métricas, disciplina y seguridad tienen su propia página.",
  alternates: { canonical: `${SITE_URL}/features/`, languages: hreflangDe("/features") },
  openGraph: {
    title: "Características — CountPips",
    description: "Explora cada característica de CountPips en profundidad.",
    url: `${SITE_URL}/features/`,
    type: "website",
    siteName: "CountPips",
    locale: "es_ES",
    alternateLocale: ["en_GB"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Características — CountPips",
    description: "40+ métricas institucionales, disciplina medida en dinero, playbook en vivo y tus datos en tu equipo.",
  },
};

// Sin `loading` en `next/dynamic`: un `loading` abre un límite de Suspense y el
// prerenderizado escribe el contenido real en un `<div hidden>` al final del
// body, que sin JavaScript no vuelve a su sitio. Lo vigila `scripts/humo.mjs`
// («contenido en bloques ocultos»).

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

/**
 * Exportado con nombre para que `app/en/features/page.tsx` lo reutilice. Sin
 * los `<script>` de datos estructurados, que cambian por idioma y cada
 * `page.tsx` pone alrededor.
 */
export function FeaturesBody() {
  return (
    <>
      <PageHeader
        tono="capitulo"
        titleEs="Todo lo que necesitas para operar con disciplina."
        titleEn="Everything you need to trade with discipline."
        subtitleEs="Métricas institucionales, un guardián de disciplina con semáforo de riesgo y freno opcional, y tus datos en tu equipo. Cada eje tiene su propia página."
        subtitleEn="Institutional metrics, a discipline guardian with a risk light and an optional hard brake, and your data on your machine. Each axis has its own page."
        breadcrumbEs="Características"
        breadcrumbEn="Features"
      />
      <FeaturesBento cal={getCal()} setups={getSetups()} enPagina />

      <GaleriaPantallas />

      <HowItWorks />

      <FeatureExplorer />

      <FinalCTANew variante="producto" sinFilete />
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
