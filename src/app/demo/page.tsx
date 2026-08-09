import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/layout/PageHeader";
import { DemoCapabilities } from "@/components/demo/DemoCapabilities";
import { AppDemoClient } from "@/components/demo/AppDemoClient";
import { DemoConversionPanel } from "@/components/demo/DemoConversionPanel";
import { PlateInterlude } from "@/components/tj/PlateInterlude";
import { SITE_URL, hreflangDe } from "@/lib/site";

// Estimated reading time (capabilities + demo + decision bridge + stats).
// ~400 words at 220 wpm = ~2 min.
const READING_TIME_MIN = 2;

// PNG (not SVG) — Twitter/X, Facebook, LinkedIn, Slack and Discord all
// silently fail to render SVG OG images. See layout.tsx for the full note.

/**
 * Breadcrumb structured data — page-specific. Lists just [Home, Demo]
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
    alternateLocale: ["en_US"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Demo en vivo — CountPips",
    description:
      "Explora el recorrido esencial de CountPips con datos de muestra, sin registro ni instalación.",
  },
};

// Heavy below-the-fold sections are split into their own JS chunks via
// `next/dynamic` so the initial bundle stays lean. Each gets a tall
// skeleton fallback to prevent layout shift while the chunk loads.
const sectionFallback = (
  <div className="section" aria-hidden="true" style={{ minHeight: 360 }} />
);
const StatsBandNew = dynamic(
  () => import("@/components/marketing/StatsBandNew").then((m) => m.StatsBandNew),
  { loading: () => sectionFallback }
);
const FinalCTANew = dynamic(
  () => import("@/components/marketing/FinalCTANew").then((m) => m.FinalCTANew),
  { loading: () => sectionFallback }
);

/** Exportado con nombre para que `app/en/demo/page.tsx` lo reutilice.
 *  Sin el `<script>` de datos estructurados. */
export function DemoBody() {
  return (
    <>
      <PageHeader
        tono="instrumento"
        folio="[ DEMO ]"
        eyebrowEs="Demo"
        eyebrowEn="Demo"
        titleEs="La app, en tu navegador."
        titleEn="The app, in your browser."
        titleHighlightEs="en tu navegador."
        titleHighlightEn="in your browser."
        subtitleEs="No es un vídeo ni una galería: explora el recorrido esencial de CountPips con datos de muestra, sin registro ni instalación."
        subtitleEn="Not a video or a gallery: explore CountPips' essential workflow with sample data, no sign-up and no installation."
        breadcrumbEs="Demo"
        breadcrumbEn="Demo"
        readingTimeMin={READING_TIME_MIN}
      />
      {/* What you can do — 6 feature cards previewing the demo */}
      <DemoCapabilities />
      <section id="demo" className="section bg-veil scroll-mt-16">
        {/* `hideHeader`: el PageHeader de arriba ya titula "La app, en tu
            navegador." y repite el mismo subtítulo, así que sin esta
            bandera el visitante leía el titular dos veces seguidas. */}
        <AppDemoClient hideHeader />
      </section>
      <DemoConversionPanel />
      <PlateInterlude index={0} />
      <StatsBandNew />
      {/* Ready-to-buy CTA — catches visitors who just played with the demo */}
      {/* `DemoReadyToBuy` retirado: era un segundo CTA idéntico pegado
          al de cierre — mismo precio, misma promesa y casi los mismos
          botones dos veces seguidas. FinalCTANew cierra la página. El
          componente sigue en el repositorio. */}
      <FinalCTANew />
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
