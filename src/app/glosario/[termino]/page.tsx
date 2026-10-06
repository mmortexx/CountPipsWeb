import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { TerminoVista } from "@/components/glosario/TerminoVista";
import { FinalCTANew } from "@/components/marketing/FinalCTANew";
import { CATEGORIAS, TERMINOS, descripcionDeTermino, fichaDeTermino, terminoPorSlug, tituloDeTermino } from "@/lib/glosario";
import { SITE_URL, hreflangDe } from "@/lib/site";

/**
 * /glosario/[termino]: una página por término. `generateStaticParams` las
 * genera todas en la compilación (la exportación estática no tiene servidor
 * que resuelva una dirección desconocida después).
 */

export function generateStaticParams() {
  return TERMINOS.map((t) => ({ termino: t.slug }));
}

// Sin esto, una dirección fuera de la lista se intentaría resolver en
// ejecución y con exportación estática da error de compilación, no un 404.
export const dynamicParams = false;

type Props = { params: Promise<{ termino: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { termino: slug } = await params;
  const t = terminoPorSlug(slug);
  if (!t) return {};

  // El título lleva «qué es» porque así se busca; se recorta solo en las voces
  // con la expansión dentro (MAE, MFE) para no pasar de 60 caracteres.
  const titulo = `${tituloDeTermino(t.term, "es")} — CountPips`;
  const desc = descripcionDeTermino(t, "es");

  return {
    title: { absolute: titulo },
    description: desc,
    keywords: undefined,
    alternates: {
      canonical: `${SITE_URL}/glosario/${t.slug}/`,
      languages: hreflangDe(`/glosario/${t.slug}`),
    },
    openGraph: {
      title: titulo,
      description: desc,
      url: `${SITE_URL}/glosario/${t.slug}/`,
      type: "article",
      siteName: "CountPips",
      locale: "es_ES",
      alternateLocale: ["en_GB"],
    },
    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: desc,
    },
  };
}

export default async function TerminoPage({ params }: Props) {
  const { termino: slug } = await params;
  const t = terminoPorSlug(slug);
  if (!t) notFound();

  const familia = CATEGORIAS[t.category];

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Glosario", item: `${SITE_URL}/glosario/` },
      {
        "@type": "ListItem",
        position: 3,
        name: t.term,
        item: `${SITE_URL}/glosario/${t.slug}/`,
      },
    ],
  };

  // `inDefinedTermSet` apunta al índice: es una entrada de glosario, no un artículo suelto.
  const terminoSchema = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: t.term,
    description: t.es,
    inLanguage: "es",
    url: `${SITE_URL}/glosario/${t.slug}/`,
    termCode: t.slug,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: "Glosario de trading de CountPips",
      url: `${SITE_URL}/glosario/`,
    },
  };

  return (
    <>
      <PageHeader
        eyebrowEs={familia.es}
        eyebrowEn={familia.en}
        titleEs={t.term}
        titleEn={t.term}
        subtitleEs={t.es}
        subtitleEn={t.en}
        padre={{ href: "/glosario", es: "Glosario", en: "Glossary" }}
        breadcrumbEs={t.term}
        breadcrumbEn={t.term}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(terminoSchema) }}
      />
      <TerminoVista ficha={fichaDeTermino(t)} />
      <FinalCTANew variante="glosario" />
    </>
  );
}
