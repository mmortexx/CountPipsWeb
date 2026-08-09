import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlosarioIndice } from "@/components/glosario/GlosarioIndice";
import { FinalCTANew } from "@/components/marketing/FinalCTANew";
import { PlateInterlude } from "@/components/tj/PlateInterlude";
import { TERMINOS } from "@/lib/glosario";
import { SITE_URL, hreflangDe } from "@/lib/site";

/**
 * /glosario — los 51 términos, cada uno con su dirección.
 *
 * Llevaban escritos desde hace tiempo, en los dos idiomas y con
 * definiciones buenas, encerrados en una ventana emergente que se abre
 * desde el pie. Ni una dirección propia: nadie podía llegar buscando «qué
 * es el drawdown», que es exactamente lo que busca quien empieza.
 *
 * La ventana emergente se queda donde estaba — sirve para consultar sin
 * abandonar la página que estás leyendo. Esto es otra cosa: la puerta por
 * la que entra quien viene de fuera.
 */

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Glosario", item: `${SITE_URL}/glosario/` },
  ],
};

/* `DefinedTermSet` es el tipo que describe un glosario entero. Enumera sus
   términos para que el buscador entienda que las 51 páginas de dentro son
   partes de una misma obra y no 51 artículos sueltos. */
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
  description:
    "51 términos de trading explicados sin rodeos: riesgo, métricas, ejecución y psicología. Qué significa cada uno y por qué importa al medir tu operativa.",
  alternates: { canonical: `${SITE_URL}/glosario/`, languages: hreflangDe("/glosario") },
  openGraph: {
    title: "Glosario de trading — CountPips",
    description:
      "51 términos explicados sin rodeos. Riesgo, métricas, ejecución y psicología.",
    url: `${SITE_URL}/glosario/`,
    type: "website",
    siteName: "CountPips",
    locale: "es_ES",
    alternateLocale: ["en_US"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Glosario de trading — CountPips",
    description: "51 términos explicados sin rodeos.",
  },
};

/** Exportado con nombre para que `app/en/glosario/page.tsx` lo reutilice.
 *  Sin los `<script>` de datos estructurados: cada idioma lleva los suyos. */
export function GlosarioBody() {
  return (
    <>
      <PageHeader
        tono="registro"
        /* El folio de un registro es lo que contiene, y sale de la
           lista, no de la memoria de quien lo escribió: si mañana entra
           un término, el margen lo dice solo. */
        folio={String(TERMINOS.length)}
        eyebrowEs="Referencia"
        eyebrowEn="Reference"
        titleEs="Glosario de trading."
        titleEn="Trading glossary."
        titleHighlightEs="de trading."
        titleHighlightEn="glossary."
        subtitleEs="Cincuenta y un términos, definidos como los usa alguien que opera y no como los define un diccionario. El nombre se queda en inglés a propósito: es como aparecen en tu plataforma y en cualquier comunidad."
        subtitleEn="Fifty-one terms, defined the way someone who trades uses them rather than the way a dictionary does. The name stays in English on purpose: that is how they appear on your platform and in any community."
        breadcrumbEs="Glosario"
        breadcrumbEn="Glossary"
      />
      <GlosarioIndice />
      <PlateInterlude index={0} />
      <FinalCTANew />
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
