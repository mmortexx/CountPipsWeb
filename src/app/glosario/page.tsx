import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlosarioIndice } from "@/components/glosario/GlosarioIndice";
import { FinalCTANew } from "@/components/marketing/FinalCTANew";
import { TERMINOS } from "@/lib/glosario";
import { SITE_URL, hreflangDe } from "@/lib/site";

/**
 * /glosario: los términos con dirección propia, para quien llega desde un
 * buscador. La ventana emergente (`GlossaryModal`) sirve para consultar sin
 * salir de la página.
 */

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Glosario", item: `${SITE_URL}/glosario/` },
  ],
};

// `DefinedTermSet` describe un glosario entero y enumera sus términos.
const glosarioSchema = {
  "@context": "https://schema.org",
  "@type": "DefinedTermSet",
  name: "Glosario de trading de CountPips",
  description:
    "Definiciones precisas de los términos que se usan al operar y al medir una operativa.",
  url: `${SITE_URL}/glosario/`,
  inLanguage: "es",
  hasDefinedTerm: TERMINOS.map((t) => ({
    "@type": "DefinedTerm",
    name: t.term,
    description: t.es,
    url: `${SITE_URL}/glosario/${t.slug}/`,
  })),
};

export const metadata: Metadata = {
  title: "Glosario de trading",
  // La cifra sale de la lista, no se escribe a mano.
  description: `${TERMINOS.length} términos de trading explicados sin rodeos: riesgo, métricas, ejecución y psicología. Qué significa cada uno y por qué importa al medir tu operativa.`,
  alternates: { canonical: `${SITE_URL}/glosario/`, languages: hreflangDe("/glosario") },
  openGraph: {
    title: "Glosario de trading — CountPips",
    description: `${TERMINOS.length} términos explicados sin rodeos. Riesgo, métricas, ejecución y psicología.`,
    url: `${SITE_URL}/glosario/`,
    type: "website",
    siteName: "CountPips",
    locale: "es_ES",
    alternateLocale: ["en_GB"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Glosario de trading — CountPips",
    description: `${TERMINOS.length} términos explicados sin rodeos.`,
  },
};

/** Exportado con nombre para que `app/en/glosario/page.tsx` lo reutilice.
 *  Sin los `<script>` de datos estructurados: cada idioma lleva los suyos. */
export function GlosarioBody() {
  return (
    <>
      <PageHeader
        tono="registro"
        titleEs="Glosario de trading."
        titleEn="Trading glossary."
        subtitleEs={`${TERMINOS.length} términos, definidos como los usa alguien que opera y no como los define un diccionario. El nombre se queda en inglés a propósito: es como aparecen en tu plataforma y en cualquier comunidad.`}
        subtitleEn={`${TERMINOS.length} terms, defined the way someone who trades uses them rather than the way a dictionary does. Grouped into five families, each one written to be read in under a minute.`}
        breadcrumbEs="Glosario"
        breadcrumbEn="Glossary"
      />
      <GlosarioIndice />
      <FinalCTANew variante="glosario" sinFilete />
    </>
  );
}

export default function GlosarioPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(glosarioSchema) }}
      />
      <GlosarioBody />
    </>
  );
}
