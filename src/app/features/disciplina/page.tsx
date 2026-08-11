import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/layout/PageHeader";
import { FeaturePageNav } from "@/components/marketing/FeaturePageNav";
import { TableOfContents } from "@/components/tj/TableOfContents";
import { FinalCTANew } from "@/components/marketing/FinalCTANew";
import { PlateInterlude } from "@/components/tj/PlateInterlude";
import { SITE_URL, hreflangDe } from "@/lib/site";
import { ULTIMA_ACTUALIZACION_ISO } from "@/lib/fechas";

// Estimated reading time (guardian + discipline cost + before/after + comparison
// slider). ~600 words across four sections at 220 wpm = ~3 min.
const READING_TIME_MIN = 3;


const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Características", item: `${SITE_URL}/features/` },
    { "@type": "ListItem", position: 3, name: "Disciplina", item: `${SITE_URL}/features/disciplina/` },
  ],
};

// Article schema — in-depth feature article on trading discipline.
const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Disciplina que actúa, no que sermonea",
  description:
    "El Guardián frena antes del error: bloquea tamaños que exceden tu riesgo, te obliga a respetar el plan y audita cada excepción.",
  url: `${SITE_URL}/features/disciplina/`,
  mainEntityOfPage: `${SITE_URL}/features/disciplina/`,
  author: { "@type": "Organization", name: "CountPips" },
  publisher: { "@type": "Organization", name: "CountPips" },
  inLanguage: "es",
  timeRequired: `PT${READING_TIME_MIN}M`,
  // datePublished/dateModified use the frozen build date — same value
  // as sitemap.ts LAST_MODIFIED. Google's Article rich-result spec
  // REQUIRES datePublished (ISO 8601) and recommends dateModified;
  // without datePublished the Article schema earns no rich result.
  // See worklog Task R20-1d (E2) + R20-2d.
  datePublished: "2025-01-01",
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
    { "@type": "Thing", name: "trading discipline" },
    { "@type": "Thing", name: "risk management" },
    { "@type": "Thing", name: "drawdown limits" },
    { "@type": "Thing", name: "guardian" },
    { "@type": "Thing", name: "trade journal" },
  ],
};

export const metadata: Metadata = {
  // `absolute` bypasses layout.tsx's `title.template: "%s · CountPips"`
  // — a plain string would render "Disciplina — CountPips · CountPips"
  // (double-branded). See worklog Task R22-1d (G1) + R23-2a.
  title: { absolute: "Disciplina — CountPips" },
  description:
    "El Guardián frena antes del error: bloquea tamaños sobre tu riesgo, te obliga a respetar el plan y audita cada excepción. Indisciplina medida en dinero.",
  alternates: { canonical: `${SITE_URL}/features/disciplina/`, languages: hreflangDe("/features/disciplina") },
  openGraph: {
    title: "Disciplina — CountPips",
    description: "El Guardián frena antes del error. Disciplina que actúa, no que sermonea.",
    url: `${SITE_URL}/features/disciplina/`,
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
    title: "Disciplina — CountPips",
    description: "El Guardián frena antes del error. Disciplina que actúa, no que sermonea.",
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

const GuardianNew = dynamic(
  () => import("@/components/marketing/GuardianNew").then((m) => m.GuardianNew)
);
const DisciplineCost = dynamic(
  () => import("@/components/marketing/DisciplineCost").then((m) => m.DisciplineCost)
);
const BeforeAfter = dynamic(
  () => import("@/components/marketing/BeforeAfter").then((m) => m.BeforeAfter)
);
const ComparisonSlider = dynamic(
  () => import("@/components/tj/ComparisonSlider").then((m) => m.ComparisonSlider)
);
const RMultipleSimulator = dynamic(
  () => import("@/components/marketing/RMultipleSimulator").then((m) => m.RMultipleSimulator)
);

/** Exportado con nombre para que `app/en/features/disciplina/page.tsx`
 *  lo reutilice. Sin los `<script>` de datos estructurados. */
export function DisciplinaBody() {
  return (
    <>
      <PageHeader
        tono="capitulo"
        folio="I·b"
        eyebrowEs="Producto"
        eyebrowEn="Product"
        titleEs="Disciplina que actúa, no que sermonea."
        titleEn="Discipline that acts, not lectures."
        titleHighlightEs="actúa."
        titleHighlightEn="acts."
        subtitleEs="El Guardián no te dice qué hacer. Te bloquea cuando rompes tus propias reglas: tamaños que exceden tu riesgo, drawdowns diarios, operaciones fuera de plan. Cada excepción queda registrada con su motivo y su resultado."
        subtitleEn="The Guardian doesn't tell you what to do. It blocks you when you break your own rules: sizes over your risk, daily drawdowns, off-plan trades. Every exception is logged with its reason and its outcome."
        breadcrumbEs="Características · Disciplina"
        breadcrumbEn="Features · Discipline"
        readingTimeMin={READING_TIME_MIN}
      />
      <GuardianNew num="01" />
      <DisciplineCost num="02" />

      <PlateInterlude index={0} />
      <BeforeAfter />

      <PlateInterlude index={1} />
      <ComparisonSlider />

      <RMultipleSimulator num="03" />

      {/* El diagnóstico de disciplina se mudó a `/test`, con página y
          entrada propias en el menú. Aquí estaba al final del todo, así
          que sólo lo encontraba quien ya había bajado la página entera —
          y es la pieza que más engancha del sitio.

          No se deja también aquí a propósito: el mismo cuestionario en
          dos direcciones es contenido duplicado, y el buscador reparte
          entre ambas lo que debería ir a una. */}

      <PlateInterlude index={2} />
      <FeaturePageNav current="disciplina" />
      <FinalCTANew />
      <TableOfContents />
    </>
  );
}

export default function DisciplinaPage() {
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
      <DisciplinaBody />
    </>
  );
}
