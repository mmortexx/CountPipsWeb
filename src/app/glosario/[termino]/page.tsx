import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { TerminoVista } from "@/components/glosario/TerminoVista";
import { FinalCTANew } from "@/components/marketing/FinalCTANew";
import { CATEGORIAS, TERMINOS, terminoPorSlug, tituloDeTermino } from "@/lib/glosario";
import { SITE_URL, hreflangDe } from "@/lib/site";

/**
 * /glosario/[termino] — una página por cada uno de los 51 términos.
 *
 * `generateStaticParams` las genera todas durante la compilación, que es
 * lo que exige el modo de exportación estática: no hay servidor que pueda
 * resolver una dirección desconocida más tarde.
 */

export function generateStaticParams() {
  return TERMINOS.map((t) => ({ termino: t.slug }));
}

/* Sin esto, cualquier dirección que no esté en la lista de arriba
   intentaría resolverse en ejecución, y con exportación estática eso es
   un error de compilación en vez de un 404 limpio. */
export const dynamicParams = false;

type Props = { params: Promise<{ termino: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { termino: slug } = await params;
  const t = terminoPorSlug(slug);
  if (!t) return {};

  const familia = CATEGORIAS[t.category].es;
  /* El título lleva «qué es» porque es literalmente como se busca esto:
     nadie teclea «Drawdown», se teclea «qué es el drawdown». La cola se
     recorta sola en las voces cuyo nombre trae la expansión dentro —MAE y
     MFE— para no pasar de los 60 caracteres que muestra el buscador. */
  const titulo = tituloDeTermino(t.term, "es");
  /* La descripción es la definición recortada. Google corta sobre los 160
     caracteres y prefiere una frase entera a una cortada a media palabra. */
  const desc = t.es.length > 155 ? `${t.es.slice(0, 152).trimEnd()}…` : t.es;

  return {
    title: { absolute: `${titulo} — CountPips` },
    description: desc,
    keywords: undefined,
    alternates: {
      canonical: `${SITE_URL}/glosario/${t.slug}/`,
      languages: hreflangDe(`/glosario/${t.slug}`),
    },
    openGraph: {
      title: `${t.term} — ${familia} | CountPips`,
      description: desc,
      url: `${SITE_URL}/glosario/${t.slug}/`,
      type: "article",
      siteName: "CountPips",
      locale: "es_ES",
      alternateLocale: ["en_US"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${t.term} — CountPips`,
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

  /* `DefinedTerm` con `inDefinedTermSet` apuntando al índice: así el
     buscador entiende que esta página es una entrada de un glosario, no un
     artículo suelto que casualmente define una palabra. */
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
