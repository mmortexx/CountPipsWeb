import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { HerramientaVista } from "@/components/herramientas/HerramientaVista";
import { FinalCTANew } from "@/components/marketing/FinalCTANew";
import { HERRAMIENTAS, herramientaPorSlug } from "@/lib/herramientas";
import { SITE_URL, hreflangDe } from "@/lib/site";

/** English counterpart of /herramientas/[herramienta]. Same 7 static
 *  params: the tool data (`tituloEn`/`descripcionEn`/...) already exists,
 *  this route only needed its own address and English metadata/schema. */
export function generateStaticParams() {
  return HERRAMIENTAS.map((h) => ({ herramienta: h.slug }));
}

export const dynamicParams = false;

type Props = { params: Promise<{ herramienta: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { herramienta: slug } = await params;
  const h = herramientaPorSlug(slug);
  if (!h) return {};

  return {
    title: { absolute: `${h.tituloEn} — CountPips` },
    description: h.descripcionEn,
    alternates: {
      canonical: `${SITE_URL}/en/herramientas/${h.slug}/`,
      languages: hreflangDe(`/herramientas/${h.slug}`),
    },
    openGraph: {
      title: `${h.tituloEn} — CountPips`,
      description: h.descripcionEn,
      url: `${SITE_URL}/en/herramientas/${h.slug}/`,
      type: "website",
      siteName: "CountPips",
      locale: "en_US",
      alternateLocale: ["es_ES"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${h.tituloEn} — CountPips`,
      description: h.descripcionEn,
    },
  };
}

export default async function HerramientaEnPage({ params }: Props) {
  const { herramienta: slug } = await params;
  const h = herramientaPorSlug(slug);
  if (!h) notFound();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/en/` },
      { "@type": "ListItem", position: 2, name: "Tools", item: `${SITE_URL}/en/herramientas/` },
      {
        "@type": "ListItem",
        position: 3,
        name: h.tituloEn,
        item: `${SITE_URL}/en/herramientas/${h.slug}/`,
      },
    ],
  };

  const appSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: h.tituloEn,
    description: h.descripcionEn,
    url: `${SITE_URL}/en/herramientas/${h.slug}/`,
    applicationCategory: "FinanceApplication",
    browserRequirements: "Requires JavaScript",
    inLanguage: ["es", "en"],
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    publisher: { "@type": "Organization", name: "CountPips" },
  };

  return (
    <>
      <PageHeader
        eyebrowEs="Herramienta gratuita"
        eyebrowEn="Free tool"
        titleEs={h.h1Es}
        titleEn={h.h1En}
        titleHighlightEs={h.resaltaEs}
        titleHighlightEn={h.resaltaEn}
        subtitleEs={h.subtituloEs}
        subtitleEn={h.subtituloEn}
        breadcrumbEs={`Herramientas · ${h.tituloEs}`}
        breadcrumbEn={`Tools · ${h.tituloEn}`}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
      />
      <HerramientaVista herramienta={h} />
      <FinalCTANew variante="herramienta" />
    </>
  );
}
