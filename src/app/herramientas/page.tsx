import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { HerramientasIndice } from "@/components/herramientas/HerramientasIndice";
import { FinalCTANew } from "@/components/marketing/FinalCTANew";
import { HERRAMIENTAS } from "@/lib/herramientas";
import { SITE_URL, hreflangDe } from "@/lib/site";

/**
 * /herramientas — las calculadoras, cada una con su dirección.
 *
 * Estaban todas metidas dentro de otras páginas: la de riesgo a media
 * página de métricas, el Monte Carlo al final de disciplina, la de ahorro
 * dentro de precios. Funcionaban, calculaban de verdad, y no había forma
 * de enlazarlas. Son justo el tipo de página que la gente comparte.
 *
 * Siguen apareciendo donde ya aparecían: esto no las mueve, les da además
 * una puerta propia.
 */

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Herramientas", item: `${SITE_URL}/herramientas/` },
  ],
};

/* `ItemList` con las herramientas en orden. Le dice al buscador que esto
   es un listado y cuáles son sus miembros, en vez de una página suelta con
   enlaces sueltos. */
const listaSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Herramientas de trading gratuitas",
  itemListOrder: "https://schema.org/ItemListOrderAscending",
  numberOfItems: HERRAMIENTAS.length + 1,
  itemListElement: [
    ...HERRAMIENTAS.map((h, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: h.tituloEs,
      url: `${SITE_URL}/herramientas/${h.slug}/`,
    })),
    {
      "@type": "ListItem",
      position: HERRAMIENTAS.length + 1,
      name: "Test de disciplina",
      url: `${SITE_URL}/test/`,
    },
  ],
};

export const metadata: Metadata = {
  title: "Herramientas de trading",
  description:
    "Ocho calculadoras de trading: riesgo por operación, Monte Carlo, significancia estadística y coste de comisiones. Gratis, sin registro y sin enviar datos.",
  alternates: { canonical: `${SITE_URL}/herramientas/`, languages: hreflangDe("/herramientas") },
  openGraph: {
    title: "Herramientas de trading — CountPips",
    description:
      "Ocho herramientas que funcionan en tu navegador. Sin registro y sin enviar datos.",
    url: `${SITE_URL}/herramientas/`,
    type: "website",
    siteName: "CountPips",
    locale: "es_ES",
    alternateLocale: ["en_US"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Herramientas de trading — CountPips",
    description: "Ocho herramientas gratis, sin registro y sin enviar datos.",
  },
};

/** Exportado con nombre para que `app/en/herramientas/page.tsx` lo
 *  reutilice. Sin los `<script>` de datos estructurados: cada idioma
 *  lleva los suyos. */
export function HerramientasBody() {
  return (
    <>
      <PageHeader
        tono="instrumento"
        eyebrowEs="Gratis"
        eyebrowEn="Free"
        titleEs="Herramientas que hacen la cuenta por ti."
        titleEn="Tools that do the maths for you."
        titleHighlightEs="la cuenta por ti."
        titleHighlightEn="the maths for you."
        subtitleEs="Ocho calculadoras y un test de disciplina, que funcionan enteros en tu navegador. Sin registro, sin correo y sin que ninguno de los números que escribas salga de tu equipo."
        subtitleEn="Eight calculators and a discipline test, all running entirely in your browser. No sign-up, no email, and none of the numbers you type ever leave your machine."
        breadcrumbEs="Herramientas"
        breadcrumbEn="Tools"
      />
      <HerramientasIndice />
      <FinalCTANew />
    </>
  );
}

export default function HerramientasPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listaSchema) }}
      />
      <HerramientasBody />
    </>
  );
}
