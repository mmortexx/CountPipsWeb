import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { LegalDoc } from "@/components/legal/LegalDoc";
import { documentoPorSlug } from "@/lib/legal/documentos";
import { SITE_URL, hreflangDe } from "@/lib/site";

/**
 * /terminos — condiciones de uso de la web y de sus herramientas.
 *
 * La cláusula que de verdad importa aquí no es la de propiedad
 * intelectual: es la de que nada de esto es asesoramiento financiero. La
 * web ofrece siete calculadoras, un simulador de Monte Carlo y datos de
 * operaciones de muestra que parecen reales porque están calculados de
 * verdad. Sin esa cláusula, alguien podría entender que se le está
 * recomendando operar de una forma concreta.
 */

const doc = documentoPorSlug("terminos")!;

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: doc.tituloEs, item: `${SITE_URL}/terminos/` },
  ],
};

export const metadata: Metadata = {
  title: doc.tituloEs,
  description: doc.descripcionEs,
  alternates: {
    canonical: `${SITE_URL}/terminos/`,
    languages: hreflangDe("/terminos"),
  },
  openGraph: {
    title: `${doc.tituloEs} — CountPips`,
    description: doc.descripcionEs,
    url: `${SITE_URL}/terminos/`,
    type: "website",
    siteName: "CountPips",
    locale: "es_ES",
    alternateLocale: ["en_US"],
  },
  twitter: {
    card: "summary_large_image",
    title: `${doc.tituloEs} — CountPips`,
    description: doc.descripcionEs,
  },
};

/** Exportado con nombre para que `app/en/terminos/page.tsx` lo reutilice.
 *  Sin el `<script>` de datos estructurados: cada idioma lleva el suyo. */
export function TerminosBody() {
  return (
    <>
      <PageHeader
        tono="documento"
        eyebrowEs="Legal"
        eyebrowEn="Legal"
        titleEs="Términos de uso."
        titleEn="Terms of use."
        titleHighlightEs="de uso."
        titleHighlightEn="of use."
        subtitleEs="Condiciones de esta web y de sus herramientas. Lo más importante en una línea: las calculadoras calculan lo que tú introduces, y nada de lo que hay aquí es asesoramiento financiero."
        subtitleEn="Conditions for this site and its tools. The important part in one line: the calculators compute what you enter, and nothing here is financial advice."
        breadcrumbEs="Términos"
        breadcrumbEn="Terms"
      />
      <LegalDoc doc={doc} />
    </>
  );
}

export default function TerminosPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <TerminosBody />
    </>
  );
}
