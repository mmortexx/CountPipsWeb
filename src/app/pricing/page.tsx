import type { Metadata } from "next";
import { pricingFaq, jsonLdFaq } from "@/lib/faq";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/layout/PageHeader";
import { Pricing } from "@/components/marketing/Pricing";
import { TableOfContents } from "@/components/tj/TableOfContents";
import { SITE_URL, hreflangDe } from "@/lib/site";
import { BetaStatus } from "@/components/beta/BetaStatus";
import { fmtMoney } from "@/lib/trading/format";
import { PRECIO_CORE, PRECIO_PRO } from "@/lib/precios";

/** Migas de pan de esta página: Inicio y Precios. */
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Inicio",
      item: `${SITE_URL}/`,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Precios",
      item: `${SITE_URL}/pricing/`,
    },
  ],
};

// Generado desde la misma lista que pinta el acordeón, para no publicar a los
// buscadores una respuesta que la página no da (src/lib/faq.ts).
const faqSchema = jsonLdFaq(pricingFaq("es"));

/** Una sola descripción para el buscador, las redes y X. */
const DESCRIPCION = `Precios del diario de trading CountPips para Windows: Core ${fmtMoney(PRECIO_CORE, "es", { decimals: 0 })} y Pro ${fmtMoney(PRECIO_PRO, "es", { decimals: 0 })}, previstos de lanzamiento. Antes, prueba la demo sin registro.`;

export const metadata: Metadata = {
  title: "Precios del diario de trading",
  description: DESCRIPCION,
  alternates: {
    canonical: `${SITE_URL}/pricing/`,
    languages: hreflangDe("/pricing"),
  },
  openGraph: {
    title: "Precios del diario de trading — CountPips",
    description: DESCRIPCION,
    url: `${SITE_URL}/pricing/`,
    type: "website",
    siteName: "CountPips",
    locale: "es_ES",
    alternateLocale: ["en_GB"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Precios del diario de trading — CountPips",
    description: DESCRIPCION,
  },
};

// Sin `loading` en `next/dynamic`: un `loading` abre un límite de Suspense y el
// prerenderizado escribe el contenido real en un `<div hidden>` al final del
// body, que sin JavaScript no vuelve a su sitio. Lo vigila `scripts/humo.mjs`
// («contenido en bloques ocultos»).

const Comparison = dynamic(
  () => import("@/components/marketing/Comparison").then((m) => m.Comparison)
);
const PricingFAQ = dynamic(
  () => import("@/components/marketing/PricingFAQ").then((m) => m.PricingFAQ)
);
const FinalCTANew = dynamic(
  () => import("@/components/marketing/FinalCTANew").then((m) => m.FinalCTANew)
);

/** Exportado con nombre para que `app/en/pricing/page.tsx` lo reutilice.
 *  Sin los `<script>` de datos estructurados. */
export function PricingBody() {
  return (
    <>
      {/* El titular no puede decir «comprar»: no hay nada que comprar, los dos
          CTA llevan al piloto privado y no hay esquema Product: sin precio
          de venta, Google lo daría por inválido. */}
      <PageHeader
        tono="tarifa"
        titleEs="El precio, por escrito."
        titleEn="The price, up front."
        titlePt="O preço, por escrito."
        titleFr="Le prix, par écrit."
        titleDe="Der Preis, schwarz auf weiß."
        titleIt="Il prezzo, nero su bianco."
        subtitleEs={`Core ${fmtMoney(PRECIO_CORE, "es", { decimals: 0 })} y Pro ${fmtMoney(PRECIO_PRO, "es", { decimals: 0 })} son precios de lanzamiento previstos. Prueba primero la demo; el acceso anticipado privado no es una preventa.`}
        subtitleEn={`Core ${fmtMoney(PRECIO_CORE, "en", { decimals: 0 })} and Pro ${fmtMoney(PRECIO_PRO, "en", { decimals: 0 })} are planned launch prices. Try the demo first; private early access is not a pre-order.`}
        subtitlePt={`Core ${fmtMoney(PRECIO_CORE, "pt", { decimals: 0 })} e Pro ${fmtMoney(PRECIO_PRO, "pt", { decimals: 0 })} são preços de lançamento previstos. Experimente primeiro a demo; o acesso antecipado privado não é uma pré-venda.`}
        subtitleFr={`Core ${fmtMoney(PRECIO_CORE, "fr", { decimals: 0 })} et Pro ${fmtMoney(PRECIO_PRO, "fr", { decimals: 0 })} sont des prix de lancement prévus. Essayez d’abord la démo ; l’accès anticipé privé n’est pas une précommande.`}
        subtitleDe={`Core ${fmtMoney(PRECIO_CORE, "de", { decimals: 0 })} und Pro ${fmtMoney(PRECIO_PRO, "de", { decimals: 0 })} sind geplante Einführungspreise. Testen Sie zuerst die Demo; der private Vorabzugang ist kein Vorverkauf.`}
        subtitleIt={`Core ${fmtMoney(PRECIO_CORE, "it", { decimals: 0 })} e Pro ${fmtMoney(PRECIO_PRO, "it", { decimals: 0 })} sono prezzi di lancio previsti. Prova prima la demo; l’accesso anticipato privato non è un preordine.`}
        breadcrumbEs="Precios"
        breadcrumbEn="Pricing"
        breadcrumbPt="Preços"
        breadcrumbFr="Tarifs"
        breadcrumbDe="Preise"
        breadcrumbIt="Prezzi"
      />
      <Pricing standalone />
      <Comparison />
      <PricingFAQ />
      <BetaStatus />

      <FinalCTANew enPrecios />
      <TableOfContents />
    </>
  );
}

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <PricingBody />
    </>
  );
}
