import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { HerramientaVista } from "@/components/herramientas/HerramientaVista";
import { FinalCTANew } from "@/components/marketing/FinalCTANew";
import { HERRAMIENTAS, herramientaPorSlug } from "@/lib/herramientas";
import { SITE_URL, hreflangDe } from "@/lib/site";

/** Una página por herramienta, todas generadas en la compilación. */
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
    title: { absolute: `${h.tituloEs} — CountPips` },
    description: h.descripcionEs,
    alternates: {
      canonical: `${SITE_URL}/herramientas/${h.slug}/`,
      languages: hreflangDe(`/herramientas/${h.slug}`),
    },
    openGraph: {
      title: `${h.tituloEs} — CountPips`,
      description: h.descripcionEs,
      url: `${SITE_URL}/herramientas/${h.slug}/`,
      type: "website",
      siteName: "CountPips",
      locale: "es_ES",
      alternateLocale: ["en_GB"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${h.tituloEs} — CountPips`,
      description: h.descripcionEs,
    },
  };
}

export default async function HerramientaPage({ params }: Props) {
  const { herramienta: slug } = await params;
  const h = herramientaPorSlug(slug);
  if (!h) notFound();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Herramientas", item: `${SITE_URL}/herramientas/` },
      {
        "@type": "ListItem",
        position: 3,
        name: h.tituloEs,
        item: `${SITE_URL}/herramientas/${h.slug}/`,
      },
    ],
  };

  /* `WebApplication` y no `SoftwareApplication`: esto es una herramienta
     que se usa DENTRO del navegador, sin instalar nada. El precio a cero
     no es adorno — es lo que permite que se muestre como gratuita, y es
     cierto: no pide correo ni registro. */
  const appSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: h.tituloEs,
    description: h.descripcionEs,
    url: `${SITE_URL}/herramientas/${h.slug}/`,
    applicationCategory: "FinanceApplication",
    browserRequirements: "Requiere JavaScript",
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
        padre={{ href: "/herramientas", es: "Herramientas", en: "Tools" }}
        breadcrumbEs={h.tituloEs}
        breadcrumbEn={h.tituloEn}
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
