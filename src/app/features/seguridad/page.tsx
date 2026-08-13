import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/layout/PageHeader";
import { FeaturePageNav } from "@/components/marketing/FeaturePageNav";
import { TableOfContents } from "@/components/tj/TableOfContents";
import { FinalCTANew } from "@/components/marketing/FinalCTANew";
import { PlateInterlude } from "@/components/tj/PlateInterlude";
import { SITE_URL, hreflangDe } from "@/lib/site";
import { PUBLICACION_ISO, ULTIMA_ACTUALIZACION_ISO } from "@/lib/fechas";

// Estimated reading time (security + tech specs + integrations).
// ~520 words across three sections at 220 wpm = ~3 min.
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

// Article schema — in-depth feature article on local-first security.
const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Tus datos, 100% en tu máquina",
  description:
    "Local-first, sin nube ni cuentas. CountPips es local-first: tus operaciones viven en tu Windows, cifradas en reposo.",
  url: `${SITE_URL}/features/seguridad/`,
  mainEntityOfPage: `${SITE_URL}/features/seguridad/`,
  author: { "@type": "Organization", name: "CountPips" },
  publisher: { "@type": "Organization", name: "CountPips" },
  inLanguage: "es",
  timeRequired: `PT${READING_TIME_MIN}M`,
  // datePublished/dateModified use the frozen build date — same value
  // as sitemap.ts LAST_MODIFIED. Google's Article rich-result spec
  // REQUIRES datePublished (ISO 8601) and recommends dateModified;
  // without datePublished the Article schema earns no rich result.
  // See worklog Task R20-1d (E2) + R20-2d.
  datePublished: PUBLICACION_ISO,
  /* La de modificación sale del último commit, no clavada. Con las dos
     iguales y congeladas, la página declaraba no haberse tocado desde
     hace año y medio — y la frescura pesa en el posicionamiento. */
  dateModified: ULTIMA_ACTUALIZACION_ISO,
  // Reuse the OG image (1200×630 PNG, meets Google's 1.91:1 spec).
  // See worklog Task R20-1d (E3) + R20-2d.
  image: `${SITE_URL}/opengraph-image`,
  // about[] as canonical Thing objects (not plain strings) — slightly
  // improves classification signals. See worklog Task R20-1d (E7).
  about: [
    { "@type": "Thing", name: "local-first" },
    { "@type": "Thing", name: "data privacy" },
    { "@type": "Thing", name: "encryption" },
    { "@type": "Thing", name: "no cloud" },
    { "@type": "Thing", name: "trading journal security" },
  ],
};

export const metadata: Metadata = {
  // `absolute` bypasses layout.tsx's `title.template: "%s · CountPips"`
  // — a plain string would render "Seguridad — CountPips · CountPips"
  // (double-branded). See worklog Task R22-1d (G1) + R23-2a.
  title: { absolute: "Seguridad — CountPips" },
  description:
    "Local-first: tus datos 100% en tu máquina, sin nube ni cuentas. Especificaciones técnicas, integraciones con tu flujo y privacidad por diseño.",
  alternates: { canonical: `${SITE_URL}/features/seguridad/`, languages: hreflangDe("/features/seguridad") },
  openGraph: {
    title: "Seguridad — CountPips",
    description: "Local-first, sin nube ni cuentas. Tus datos 100% en tu máquina.",
    url: `${SITE_URL}/features/seguridad/`,
    type: "website",
    siteName: "CountPips",
    locale: "es_ES",
    alternateLocale: ["en_US"],
    // Next.js shallow-merges child openGraph over layout's — layout's
    // default OG image is NOT inherited when the child omits `images`.
    // See worklog Task R22-1d (G2) + R23-2a.
  },
  twitter: {
    card: "summary_large_image",
    title: "Seguridad — CountPips",
    description: "Local-first, sin nube ni cuentas. Tus datos 100% en tu máquina.",
  },
};

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
        folio="I·c"
        eyebrowEs="Producto"
        eyebrowEn="Product"
        titleEs="Tus datos, 100% en tu máquina."
        titleEn="Your data, 100% on your machine."
        titleHighlightEs="100% en tu máquina."
        titleHighlightEn="100% on your machine."
        subtitleEs="Sin nube, sin cuentas, sin servidores. CountPips es local-first: tus operaciones viven en tu Windows, cifradas en reposo, sin tocar nunca un servidor ajeno. Privacidad por diseño, no por configuración."
        subtitleEn="No cloud, no accounts, no servers. CountPips is local-first: your trades live on your Windows, encrypted at rest, never touching anyone else's server. Privacy by design, not by configuration."
        breadcrumbEs="Características · Seguridad"
        breadcrumbEn="Features · Security"
        readingTimeMin={READING_TIME_MIN}
      />
      <SecuritySection num="01" />
      <DataFlowComparison num="02" />
      <TechSpecs />

      <PlateInterlude index={0} />
      <Integrations />

      <PlateInterlude index={1} />
      <FeaturePageNav current="seguridad" />
      <FinalCTANew />
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
