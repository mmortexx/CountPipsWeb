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

// SocialProof y TestimonialsWall se han retirado: sus testimonios eran
// personas inventadas. Vuelven cuando haya reseñas reales de usuarios.
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

const Changelog = dynamic(
  () => import("@/components/marketing/Changelog").then((m) => m.Changelog)
);
const SessionClock = dynamic(
  () => import("@/components/marketing/SessionClock").then((m) => m.SessionClock)
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
