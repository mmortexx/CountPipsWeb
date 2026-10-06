import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/layout/PageHeader";
import { FeaturePageNav } from "@/components/marketing/FeaturePageNav";
import { TableOfContents } from "@/components/tj/TableOfContents";
import { FinalCTANew } from "@/components/marketing/FinalCTANew";
import { RESUMEN_SEGURIDAD } from "@/lib/conexiones";
import { SITE_URL, hreflangDe } from "@/lib/site";
import { PUBLICACION_ISO, ULTIMA_ACTUALIZACION_ISO } from "@/lib/fechas";

// Tiempo de lectura estimado: ~520 palabras a 220 ppm.
const READING_TIME_MIN = 3;


const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Características", item: `${SITE_URL}/features/` },
    { "@type": "ListItem", position: 3, name: "Seguridad", item: `${SITE_URL}/features/seguridad/` },
  ],
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Tus datos, en tu equipo",
  description:
    RESUMEN_SEGURIDAD.es,
  url: `${SITE_URL}/features/seguridad/`,
  mainEntityOfPage: `${SITE_URL}/features/seguridad/`,
  author: { "@type": "Organization", name: "CountPips" },
  publisher: { "@type": "Organization", name: "CountPips" },
  inLanguage: "es",
  timeRequired: `PT${READING_TIME_MIN}M`,
  // Google exige `datePublished` (ISO 8601); la modificación sale del último commit.
  datePublished: PUBLICACION_ISO,
  dateModified: ULTIMA_ACTUALIZACION_ISO,
  image: `${SITE_URL}/features/seguridad/opengraph-image`,
  about: [
    { "@type": "Thing", name: "local-first" },
    { "@type": "Thing", name: "data privacy" },
    { "@type": "Thing", name: "encryption" },
    { "@type": "Thing", name: "offline-first" },
    { "@type": "Thing", name: "trading journal security" },
  ],
};

export const metadata: Metadata = {
  // `absolute` evita la plantilla `%s — CountPips` del layout (saldría duplicada).
  title: { absolute: "Seguridad — CountPips" },
  description:
    "Local-first: tus operaciones en tu equipo, sin cuenta ni telemetría. Ficha técnica, la lista completa de conexiones y cómo se importan tus datos.",
  alternates: { canonical: `${SITE_URL}/features/seguridad/`, languages: hreflangDe("/features/seguridad") },
  openGraph: {
    title: "Seguridad — CountPips",
    description: "Sin cuenta, sin telemetría y sin servidores de CountPips. Tus datos, en tu equipo.",
    url: `${SITE_URL}/features/seguridad/`,
    type: "website",
    siteName: "CountPips",
    locale: "es_ES",
    alternateLocale: ["en_GB"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Seguridad — CountPips",
    description: "Sin cuenta, sin telemetría y sin servidores de CountPips. Tus datos, en tu equipo.",
  },
};

// Sin `loading` en `next/dynamic`: un `loading` abre un límite de Suspense y el
// prerenderizado escribe el contenido real en un `<div hidden>` al final del
// body, que sin JavaScript no vuelve a su sitio. Lo vigila `scripts/humo.mjs`
// («contenido en bloques ocultos»).

const SecuritySection = dynamic(
  () => import("@/components/marketing/SecuritySection").then((m) => m.SecuritySection)
);
const DataFlowComparison = dynamic(
  () => import("@/components/marketing/DataFlowComparison").then((m) => m.DataFlowComparison)
);
const TechSpecs = dynamic(
  () => import("@/components/marketing/TechSpecs").then((m) => m.TechSpecs)
);
const Integrations = dynamic(
  () => import("@/components/marketing/Integrations").then((m) => m.Integrations)
);

/** Exportado con nombre para que `app/en/features/seguridad/page.tsx` lo
 *  reutilice. Sin los `<script>` de datos estructurados. */
export function SeguridadBody() {
  return (
    <>
      <PageHeader
        tono="capitulo"
        titleEs="Tus datos, en tu equipo."
        titleEn="Your data, on your machine."
        subtitleEs={RESUMEN_SEGURIDAD.es}
        subtitleEn={RESUMEN_SEGURIDAD.en}
        padre={{ href: "/features", es: "Características", en: "Features" }}
        breadcrumbEs="Seguridad"
        breadcrumbEn="Security"
      />
      <SecuritySection enPagina />
      <DataFlowComparison />
      <TechSpecs />

      <Integrations />

      <FeaturePageNav current="seguridad" />
      <FinalCTANew variante="producto" />
      <TableOfContents />
    </>
  );
}

export default function SeguridadPage() {
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
      <SeguridadBody />
    </>
  );
}
