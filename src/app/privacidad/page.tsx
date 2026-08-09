import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { LegalDoc } from "@/components/legal/LegalDoc";
import { documentoPorSlug } from "@/lib/legal/documentos";
import { SITE_URL, hreflangDe } from "@/lib/site";

/**
 * /privacidad — qué datos recoge la web.
 *
 * El pie del sitio llevaba meses enlazando «Privacidad» a `#`, en las diez
 * páginas, mientras dos formularios recogían correos. Esta página existe
 * para cerrar eso.
 *
 * `robots: index` a propósito, aunque una legal no atraiga visitas: que
 * exista y sea accesible es una señal de confianza que los buscadores
 * valoran, y las pasarelas de pago la piden localizable antes de aprobar
 * una cuenta.
 */

const doc = documentoPorSlug("privacidad")!;

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: doc.tituloEs, item: `${SITE_URL}/privacidad/` },
  ],
};

export const metadata: Metadata = {
  title: doc.tituloEs,
  description: doc.descripcionEs,
  alternates: {
    canonical: `${SITE_URL}/privacidad/`,
    languages: hreflangDe("/privacidad"),
  },
  openGraph: {
    title: `${doc.tituloEs} — CountPips`,
    description: doc.descripcionEs,
    url: `${SITE_URL}/privacidad/`,
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

/** Exportado con nombre para que `app/en/privacidad/page.tsx` lo reutilice.
 *  Sin el `<script>` de datos estructurados: cada idioma lleva el suyo. */
export function PrivacidadBody() {
  return (
    <>
      <PageHeader
        tono="documento"
        eyebrowEs="Legal"
        eyebrowEn="Legal"
        titleEs="Política de privacidad."
        titleEn="Privacy policy."
        titleHighlightEs="privacidad."
        titleHighlightEn="policy."
        subtitleEs="Una solicitud de acceso anticipado, un consentimiento separado para comunicaciones y analítica opcional sólo tras aceptarla. Aquí está qué se recoge y cómo pedir que se borre."
        subtitleEn="An early-access application, separate consent for communications, and optional analytics only after acceptance. Here is what is collected and how to have it deleted."
        breadcrumbEs="Privacidad"
        breadcrumbEn="Privacy"
      />
      <LegalDoc doc={doc} />
    </>
  );
}

export default function PrivacidadPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <PrivacidadBody />
    </>
  );
}
