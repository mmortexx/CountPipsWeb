import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/layout/PageHeader";
import { Story } from "@/components/marketing/Story";
import { TableOfContents } from "@/components/tj/TableOfContents";
import { FinalCTANew } from "@/components/marketing/FinalCTANew";
import { SITE_URL, hreflangDe } from "@/lib/site";

/** Migas de pan de esta página: Inicio y Acerca de. */
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
    alternateLocale: ["en_GB"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Acerca de — CountPips",
    description:
      "La historia de CountPips: por qué existe, para quién es, y cómo evoluciona. Hecho para el trader manual serio.",
  },
};

// Sin `loading` en `next/dynamic`: un `loading` abre un límite de Suspense y el
// prerenderizado escribe el contenido real en un `<div hidden>` al final del
// body, que sin JavaScript no vuelve a su sitio. Lo vigila `scripts/humo.mjs`
// («contenido en bloques ocultos»).

const Changelog = dynamic(
  () => import("@/components/marketing/Changelog").then((m) => m.Changelog)
);

/** Exportado con nombre para que `app/en/about/page.tsx` lo reutilice.
 *  Sin el `<script>` de datos estructurados. */
export function AboutBody() {
  return (
    <>
      <PageHeader
        tono="capitulo"
        titleEs="Hecho para el trader manual serio."
        titleEn="Made for the serious manual trader."
        subtitleEs="Una app nativa de Windows que vive en tu equipo, sin suscripción ni servidores, con métricas institucionales y una disciplina que se mide en dinero."
        subtitleEn="A native Windows app that lives on your computer, with no subscription and no servers, institutional metrics and discipline measured in money."
        breadcrumbEs="Acerca de"
        breadcrumbEn="About"
      />
      <Story />
      <Changelog />

      <FinalCTANew variante="empresa" sinFilete />
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
