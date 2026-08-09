import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { LegalDoc } from "@/components/legal/LegalDoc";
import { documentoPorSlug } from "@/lib/legal/documentos";
import { SITE_URL, hreflangDe } from "@/lib/site";

/**
 * /cookies — la lista de todo lo que la web deja en tu navegador.
 *
 * El aviso de cookies pedía consentimiento sin ofrecer nada que
 * consultar, que es justo lo que la norma no permite. Ahora enlaza aquí.
 *
 * La página tiene además un valor comercial que conviene no desaprovechar:
 * este producto vende que tus datos no salen de tu máquina, y ésta es la
 * única página donde eso se puede demostrar con una lista cerrada en vez
 * de con un eslogan.
 */

const doc = documentoPorSlug("cookies")!;

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: doc.tituloEs, item: `${SITE_URL}/cookies/` },
  ],
};

export const metadata: Metadata = {
  title: doc.tituloEs,
  description: doc.descripcionEs,
  alternates: {
    canonical: `${SITE_URL}/cookies/`,
    languages: hreflangDe("/cookies"),
  },
  openGraph: {
    title: `${doc.tituloEs} — CountPips`,
    description: doc.descripcionEs,
    url: `${SITE_URL}/cookies/`,
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

/** Exportado con nombre para que `app/en/cookies/page.tsx` lo reutilice.
 *  Sin el `<script>` de datos estructurados: cada idioma lleva el suyo. */
export function CookiesBody() {
  return (
    <>
      <PageHeader
        tono="documento"
        eyebrowEs="Legal"
        eyebrowEn="Legal"
        titleEs="Preferencias claras. Analítica opcional."
        titleEn="Clear preferences. Optional analytics."
        titleHighlightEs="Analítica opcional."
        titleHighlightEn="Optional analytics."
        subtitleEs="Las preferencias técnicas se quedan en tu navegador. PostHog sólo se carga si aceptas la medición y puedes retirarla cuando quieras."
        subtitleEn="Technical preferences stay in your browser. PostHog only loads if you accept measurement, and you can withdraw it at any time."
        breadcrumbEs="Cookies"
        breadcrumbEn="Cookies"
      />
      <LegalDoc doc={doc} />
    </>
  );
}

export default function CookiesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <CookiesBody />
    </>
  );
}
