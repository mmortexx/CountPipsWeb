import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/layout/PageHeader";
import { Story } from "@/components/marketing/Story";
import { Values } from "@/components/marketing/Values";
import { TableOfContents } from "@/components/tj/TableOfContents";
import { FinalCTANew } from "@/components/marketing/FinalCTANew";
import { PlateInterlude } from "@/components/tj/PlateInterlude";
import { SITE_URL, hreflangDe } from "@/lib/site";
import { BetaStatus } from "@/components/beta/BetaStatus";

// Estimated reading time (story + values + changelog + beta status).
const READING_TIME_MIN = 4;

// PNG (not SVG) — Twitter/X, Facebook, LinkedIn, Slack and Discord all
// silently fail to render SVG OG images. See layout.tsx for the full note.

/**
 * Breadcrumb structured data — page-specific. Lists just [Home, About]
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
      name: "Acerca de",
      item: `${SITE_URL}/about/`,
    },
  ],
};

export const metadata: Metadata = {
  title: "Acerca de",
  description:
    "La historia de CountPips: por qué existe, para quién es, y cómo evoluciona. Hecho para el trader manual serio.",
  alternates: {
    canonical: `${SITE_URL}/about/`,
    languages: hreflangDe("/about"),
  },
  openGraph: {
    title: "Acerca de — CountPips",
    description: "La historia de CountPips: por qué existe, para quién es, y cómo evoluciona.",
    url: `${SITE_URL}/about/`,
    type: "website",
    siteName: "CountPips",
    locale: "es_ES",
    alternateLocale: ["en_US"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Acerca de — CountPips",
    description:
      "La historia de CountPips: por qué existe, para quién es, y cómo evoluciona. Hecho para el trader manual serio.",
  },
};

// Heavy below-the-fold sections are split into their own JS chunks via
// `next/dynamic` so the initial bundle stays lean. Each gets a tall
// skeleton fallback to prevent layout shift while the chunk loads.
const sectionFallback = (
  <div className="section" aria-hidden="true" style={{ minHeight: 360 }} />
);
// SocialProof y TestimonialsWall se han retirado: sus testimonios eran
// personas inventadas. Vuelven cuando haya reseñas reales de usuarios.
const Changelog = dynamic(
  () => import("@/components/marketing/Changelog").then((m) => m.Changelog),
  { loading: () => sectionFallback }
);
const SessionClock = dynamic(
  () => import("@/components/marketing/SessionClock").then((m) => m.SessionClock),
  { loading: () => sectionFallback }
);

/** Exportado con nombre para que `app/en/about/page.tsx` lo reutilice.
 *  Sin el `<script>` de datos estructurados. */
export function AboutBody() {
  return (
    <>
      <PageHeader
        tono="capitulo"
        folio="II"
        eyebrowEs="Acerca de"
        eyebrowEn="About"
        titleEs="Hecho para el trader manual serio."
        titleEn="Made for the serious manual trader."
        titleHighlightEs="manual serio."
        titleHighlightEn="manual trader."
        subtitleEs="No es un SaaS más. Es una app nativa de Windows que vive en tu máquina, con métricas institucionales y disciplina que se mide en dinero."
        subtitleEn="Not another SaaS. It's a native Windows app that lives on your machine, with institutional metrics and discipline measured in money."
        breadcrumbEs="Acerca de"
        breadcrumbEn="About"
        readingTimeMin={READING_TIME_MIN}
      />
      <Story />
      <Values />
      <SessionClock num="02" />

      <PlateInterlude index={0} />
      <Changelog />

      <PlateInterlude index={1} />
      {/* `Milestones` retirado: repetía en horizontal los cinco mismos
          hitos que el Changelog acababa de contar dos pantallas antes
          (v1.0, Playbook, Monte Carlo, Guardián, Importador). Dos líneas
          de tiempo distintas para los mismos datos restan credibilidad
          en vez de sumarla. El componente sigue en el repositorio. */}
      <BetaStatus />
      <FinalCTANew />
      <TableOfContents />
    </>
  );
}

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <AboutBody />
    </>
  );
}
