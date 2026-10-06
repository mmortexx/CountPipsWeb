import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/layout/PageHeader";
import { AppDemoClient } from "@/components/demo/AppDemoClient";
import { DemoConversionPanel } from "@/components/demo/DemoConversionPanel";
import { SITE_URL, hreflangDe } from "@/lib/site";

/** Migas de pan de esta página: Inicio y Demo. */
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
      name: "Demo",
      item: `${SITE_URL}/demo/`,
    },
  ],
};

export const metadata: Metadata = {
  title: "Demo en vivo",
  description:
    "Explora el recorrido esencial de CountPips en tu navegador con datos de muestra, sin registro ni instalación.",
  alternates: {
    canonical: `${SITE_URL}/demo/`,
    languages: hreflangDe("/demo"),
  },
  openGraph: {
    title: "Demo en vivo — CountPips",
    description: "Explora el recorrido esencial de CountPips con datos de muestra, sin registro ni instalación.",
    url: `${SITE_URL}/demo/`,
    type: "website",
    siteName: "CountPips",
    locale: "es_ES",
    alternateLocale: ["en_GB"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Demo en vivo — CountPips",
    description:
      "Explora el recorrido esencial de CountPips con datos de muestra, sin registro ni instalación.",
  },
};

// Sin `loading` en `next/dynamic`: un `loading` abre un límite de Suspense y el
// prerenderizado escribe el contenido real en un `<div hidden>` al final del
// body, que sin JavaScript no vuelve a su sitio. Lo vigila `scripts/humo.mjs`
// («contenido en bloques ocultos»).

const FinalCTANew = dynamic(
  () => import("@/components/marketing/FinalCTANew").then((m) => m.FinalCTANew)
);

/** Exportado con nombre para que `app/en/demo/page.tsx` lo reutilice.
 *  Sin el `<script>` de datos estructurados. */
export function DemoBody() {
  return (
    <>
      <PageHeader
        tono="instrumento"
        titleEs="La app, en tu navegador."
        titleEn="The app, in your browser."
        subtitleEs="No es un vídeo ni una galería: explora el recorrido esencial de CountPips con datos de muestra, sin registro ni instalación."
        subtitleEn="Not a video or a gallery: explore the essential CountPips workflow with sample data, no sign-up and no installation."
        breadcrumbEs="Demo"
        breadcrumbEn="Demo"
      />
      <section id="demo" className="section scroll-mt-16">
        {/* `hideHeader`: el PageHeader de arriba ya pone titular y subtítulo. */}
        <AppDemoClient hideHeader />
      </section>
      <DemoConversionPanel />
      <FinalCTANew enDemo />
    </>
  );
}

export default function DemoPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <DemoBody />
    </>
  );
}
