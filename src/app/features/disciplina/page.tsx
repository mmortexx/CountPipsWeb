import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/layout/PageHeader";
import { FeaturePageNav } from "@/components/marketing/FeaturePageNav";
import { TableOfContents } from "@/components/tj/TableOfContents";
import { FinalCTANew } from "@/components/marketing/FinalCTANew";
import { SITE_URL, hreflangDe } from "@/lib/site";
import { PUBLICACION_ISO, ULTIMA_ACTUALIZACION_ISO } from "@/lib/fechas";

// Tiempo de lectura estimado: ~600 palabras a 220 ppm.
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

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Disciplina que actúa, no que sermonea",
  description:
    "El Guardián mide cada operación contra tus reglas con un semáforo de riesgo y, si lo activas, un freno duro deja de admitir operaciones nuevas al tocar tu límite.",
  url: `${SITE_URL}/features/disciplina/`,
  mainEntityOfPage: `${SITE_URL}/features/disciplina/`,
  author: { "@type": "Organization", name: "CountPips" },
  publisher: { "@type": "Organization", name: "CountPips" },
  inLanguage: "es",
  timeRequired: `PT${READING_TIME_MIN}M`,
  // Google exige `datePublished` (ISO 8601); la modificación sale del último commit.
  datePublished: PUBLICACION_ISO,
  dateModified: ULTIMA_ACTUALIZACION_ISO,
  image: `${SITE_URL}/features/disciplina/opengraph-image`,
  about: [
    { "@type": "Thing", name: "trading discipline" },
    { "@type": "Thing", name: "risk management" },
    { "@type": "Thing", name: "drawdown limits" },
    { "@type": "Thing", name: "guardian" },
    { "@type": "Thing", name: "trade journal" },
  ],
};

export const metadata: Metadata = {
  // `absolute` evita la plantilla `%s — CountPips` del layout (saldría duplicada).
  title: { absolute: "Disciplina — CountPips" },
  description:
    "El Guardián mide cada operación contra tus reglas: semáforo de riesgo y, si lo activas, un freno duro al tocar tu límite. Indisciplina medida en dinero.",
  alternates: { canonical: `${SITE_URL}/features/disciplina/`, languages: hreflangDe("/features/disciplina") },
  openGraph: {
    title: "Disciplina — CountPips",
    description: "Semáforo de riesgo y freno duro opcional. Disciplina que actúa, no que sermonea.",
    url: `${SITE_URL}/features/disciplina/`,
    type: "website",
    siteName: "CountPips",
    locale: "es_ES",
    alternateLocale: ["en_GB"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Disciplina — CountPips",
    description: "Semáforo de riesgo y freno duro opcional. Disciplina que actúa, no que sermonea.",
  },
};

// Sin `loading` en `next/dynamic`: un `loading` abre un límite de Suspense y el
// prerenderizado escribe el contenido real en un `<div hidden>` al final del
// body, que sin JavaScript no vuelve a su sitio. Lo vigila `scripts/humo.mjs`
// («contenido en bloques ocultos»).

const GuardianNew = dynamic(
  () => import("@/components/marketing/GuardianNew").then((m) => m.GuardianNew)
);
const DisciplineCost = dynamic(
  () => import("@/components/marketing/DisciplineCost").then((m) => m.DisciplineCost)
);
const BeforeAfter = dynamic(
  () => import("@/components/marketing/BeforeAfter").then((m) => m.BeforeAfter)
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
        titleEs="Disciplina que actúa, no que sermonea."
        titleEn="Discipline that acts, not lectures."
        subtitleEs="El Guardián no te dice qué hacer: mide cada operación contra tus reglas con un semáforo de riesgo y, si lo activas, un freno duro deja de admitir operaciones nuevas cuando tocas tu límite. Saltárselo exige escribir el motivo."
        subtitleEn="The Guardian doesn’t tell you what to do: it measures every trade against your rules with a risk light and, if you turn it on, a hard brake stops accepting new trades when you hit your limit. Skipping it requires writing the reason."
        padre={{ href: "/features", es: "Características", en: "Features" }}
        breadcrumbEs="Disciplina"
        breadcrumbEn="Discipline"
      />
      <GuardianNew enPagina />
      <DisciplineCost />

      <BeforeAfter />

      <RMultipleSimulator />

      {/* El diagnóstico vive solo en `/test`: en dos direcciones sería contenido duplicado. */}

      <FeaturePageNav current="disciplina" />
      <FinalCTANew variante="producto" />
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
