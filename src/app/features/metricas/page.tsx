import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/layout/PageHeader";
import { cifrasMuestra, lecturasMuestra } from "@/lib/trading/cifras-muestra";
import { FeaturePageNav } from "@/components/marketing/FeaturePageNav";
import { TableOfContents } from "@/components/tj/TableOfContents";
import { FinalCTANew } from "@/components/marketing/FinalCTANew";
import { SITE_URL, hreflangDe } from "@/lib/site";
import { PUBLICACION_ISO, ULTIMA_ACTUALIZACION_ISO } from "@/lib/fechas";

// Tiempo de lectura estimado: ~480 palabras a 220 ppm, redondeado hacia arriba.
const READING_TIME_MIN = 3;


const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Características", item: `${SITE_URL}/features/` },
    { "@type": "ListItem", position: 3, name: "Métricas", item: `${SITE_URL}/features/metricas/` },
  ],
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Métricas que separan un edge real de una racha",
  description:
    "40+ ratios institucionales calculados de tus operaciones. Sharpe, Sortino, Calmar, profit factor, expectancy en R.",
  url: `${SITE_URL}/features/metricas/`,
  mainEntityOfPage: `${SITE_URL}/features/metricas/`,
  author: { "@type": "Organization", name: "CountPips" },
  publisher: { "@type": "Organization", name: "CountPips" },
  inLanguage: "es",
  timeRequired: `PT${READING_TIME_MIN}M`,
  // Google exige `datePublished` (ISO 8601); la modificación sale del último commit.
  datePublished: PUBLICACION_ISO,
  dateModified: ULTIMA_ACTUALIZACION_ISO,
  image: `${SITE_URL}/features/metricas/opengraph-image`,
  about: [
    { "@type": "Thing", name: "trading metrics" },
    { "@type": "Thing", name: "Sharpe ratio" },
    { "@type": "Thing", name: "profit factor" },
    { "@type": "Thing", name: "expectancy" },
    { "@type": "Thing", name: "risk calculator" },
  ],
};

export const metadata: Metadata = {
  // `absolute` evita la plantilla `%s — CountPips` del layout (saldría duplicada).
  title: { absolute: "Métricas — CountPips" },
  description:
    "40+ ratios institucionales: Sharpe, Sortino, Calmar, profit factor, expectancy en R. Métricas que dicen si tu ventaja es real o una racha.",
  alternates: { canonical: `${SITE_URL}/features/metricas/`, languages: hreflangDe("/features/metricas") },
  openGraph: {
    title: "Métricas — CountPips",
    description: "40+ ratios institucionales y calculadora de riesgo. Métricas que separan un edge real de una racha.",
    url: `${SITE_URL}/features/metricas/`,
    type: "website",
    siteName: "CountPips",
    locale: "es_ES",
    alternateLocale: ["en_GB"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Métricas — CountPips",
    description: "40+ ratios institucionales y calculadora de riesgo interactiva.",
  },
};

// Sin `loading` en `next/dynamic`: un `loading` abre un límite de Suspense y el
// prerenderizado escribe el contenido real en un `<div hidden>` al final del
// body, que sin JavaScript no vuelve a su sitio. Lo vigila `scripts/humo.mjs`
// («contenido en bloques ocultos»).

const MetricsShowcaseNew = dynamic(
  () => import("@/components/marketing/MetricsShowcaseNew").then((m) => m.MetricsShowcaseNew)
);
const RiskCalculator = dynamic(
  () => import("@/components/marketing/RiskCalculator").then((m) => m.RiskCalculator)
);
const EquityProjector = dynamic(
  () => import("@/components/marketing/EquityProjector").then((m) => m.EquityProjector)
);
const Wrapped = dynamic(
  () => import("@/components/marketing/Wrapped").then((m) => m.Wrapped)
);

/** Exportado con nombre para que `app/en/features/metricas/page.tsx` lo
 *  reutilice. Sin los `<script>` de datos estructurados, que van en el
 *  `default export` de cada idioma. */
export function MetricasBody() {
  return (
    <>
      <PageHeader
        tono="capitulo"
        titleEs="Métricas que separan un edge real de una racha."
        titleEn="Metrics that separate a real edge from a streak."
        subtitleEs="40+ ratios institucionales calculados de tus operaciones. Sharpe, Sortino, Calmar, profit factor, expectancy en R. No gráficos bonitos: números con su muestra y su intervalo de confianza."
        subtitleEn="40+ institutional ratios computed from your trades. Sharpe, Sortino, Calmar, profit factor, expectancy in R. Not pretty charts: numbers with their sample size and confidence interval."
        padre={{ href: "/features", es: "Características", en: "Features" }}
        breadcrumbEs="Métricas"
        breadcrumbEn="Metrics"
      />
      <MetricsShowcaseNew cifras={cifrasMuestra()} enPagina />
      <RiskCalculator />
      <EquityProjector />

      <Wrapped datos={lecturasMuestra()} />

      <FeaturePageNav current="metricas" />

      <FinalCTANew variante="producto" />
      <TableOfContents />
    </>
  );
}

export default function MetricasPage() {
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
      <MetricasBody />
    </>
  );
}
