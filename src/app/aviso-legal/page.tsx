import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { LegalDoc } from "@/components/legal/LegalDoc";
import { documentoPorSlug } from "@/lib/legal/documentos";
import { SITE_URL, hreflangDe } from "@/lib/site";

/**
 * /aviso-legal — quién está detrás del sitio.
 *
 * Hoy la página se publica sin los datos fiscales del titular, y lo dice
 * abiertamente en pantalla en lugar de disimularlo. Es defendible mientras
 * la web solo informa y recoge correos; deja de serlo en cuanto haya
 * venta, porque entonces la ley obliga a identificar al prestador. Ver
 * `src/lib/legal/titular.ts`.
 */

const doc = documentoPorSlug("aviso-legal")!;

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: doc.tituloEs, item: `${SITE_URL}/aviso-legal/` },
  ],
};

export const metadata: Metadata = {
  title: doc.tituloEs,
  description: doc.descripcionEs,
  alternates: {
    canonical: `${SITE_URL}/aviso-legal/`,
    languages: hreflangDe("/aviso-legal"),
  },
  openGraph: {
    title: `${doc.tituloEs} — CountPips`,
    description: doc.descripcionEs,
    url: `${SITE_URL}/aviso-legal/`,
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

/** Exportado con nombre para que `app/en/aviso-legal/page.tsx` lo reutilice.
 *  Sin el `<script>` de datos estructurados: cada idioma lleva el suyo. */
export function AvisoLegalBody() {
  return (
    <>
      <PageHeader
        tono="documento"
        eyebrowEs="Legal"
        eyebrowEn="Legal"
        titleEs="Aviso legal."
        titleEn="Legal notice."
        titleHighlightEs="legal."
        titleHighlightEn="notice."
        subtitleEs="Quién está detrás de este sitio, para qué existe y en qué condiciones se ofrece."
        subtitleEn="Who is behind this site, what it exists for and on what terms it is offered."
        breadcrumbEs="Aviso legal"
        breadcrumbEn="Legal notice"
      />
      <LegalDoc doc={doc} />
    </>
  );
}

export default function AvisoLegalPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <AvisoLegalBody />
    </>
  );
}
