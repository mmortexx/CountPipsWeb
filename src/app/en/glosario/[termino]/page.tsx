import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { TerminoVista } from "@/components/glosario/TerminoVista";
import { FinalCTANew } from "@/components/marketing/FinalCTANew";
import { CATEGORIAS, TERMINOS, terminoPorSlug, tituloDeTermino } from "@/lib/glosario";
import { SITE_URL, hreflangDe } from "@/lib/site";

/**
 * /en/glosario/[termino] — English counterpart of /glosario/[termino].
 * Same static params as the Spanish route: the term data (`t.en`)
 * already exists, this
 * route only needed its own address and its own English metadata/schema.
 */

export function generateStaticParams() {
  return TERMINOS.map((t) => ({ termino: t.slug }));
}

export const dynamicParams = false;

type Props = { params: Promise<{ termino: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { termino: slug } = await params;
  const t = terminoPorSlug(slug);
  if (!t) return {};

  const familia = CATEGORIAS[t.category].en;
  const titulo = tituloDeTermino(t.term, "en");
  const desc = t.en.length > 155 ? `${t.en.slice(0, 152).trimEnd()}…` : t.en;

  return {
    title: { absolute: `${titulo} — CountPips` },
    description: desc,
    keywords: undefined,
    alternates: {
      canonical: `${SITE_URL}/en/glosario/${t.slug}/`,
      languages: hreflangDe(`/glosario/${t.slug}`),
    },
    openGraph: {
      title: `${t.term} — ${familia} | CountPips`,
      description: desc,
      url: `${SITE_URL}/en/glosario/${t.slug}/`,
      type: "article",
      siteName: "CountPips",
      locale: "en_US",
      alternateLocale: ["es_ES"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${t.term} — CountPips`,
      description: desc,
    },
  };
}

export default async function TerminoEnPage({ params }: Props) {
  const { termino: slug } = await params;
  const t = terminoPorSlug(slug);
  if (!t) notFound();

  const familia = CATEGORIAS[t.category];

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/en/` },
      { "@type": "ListItem", position: 2, name: "Glossary", item: `${SITE_URL}/en/glosario/` },
      {
        "@type": "ListItem",
        position: 3,
        name: t.term,
        item: `${SITE_URL}/en/glosario/${t.slug}/`,
      },
    ],
  };

  const terminoSchema = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: t.term,
    description: t.en,
    inLanguage: "en",
    url: `${SITE_URL}/en/glosario/${t.slug}/`,
    termCode: t.slug,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: "CountPips trading glossary",
      url: `${SITE_URL}/en/glosario/`,
    },
  };

  return (
    <>
      <PageHeader
        eyebrowEs={familia.es}
        eyebrowEn={familia.en}
        titleEs={t.term}
        titleEn={t.term}
        subtitleEs={`Qué significa «${t.term}» y por qué cambia la forma de medir tu operativa.`}
        subtitleEn={`What "${t.term}" means and why it changes the way you measure your trading.`}
        breadcrumbEs={`Glosario · ${t.term}`}
        breadcrumbEn={`Glossary · ${t.term}`}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(terminoSchema) }}
      />
      <TerminoVista termino={t} />
      <FinalCTANew />
    </>
  );
}
