import type { Metadata } from "next";
import { HerramientasBody } from "../../herramientas/page";
import { HERRAMIENTAS } from "@/lib/herramientas";
import { SITE_URL, hreflangDe } from "@/lib/site";

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/en/` },
    { "@type": "ListItem", position: 2, name: "Tools", item: `${SITE_URL}/en/herramientas/` },
  ],
};

const listaSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Free trading tools",
  itemListOrder: "https://schema.org/ItemListOrderAscending",
  numberOfItems: HERRAMIENTAS.length + 1,
  itemListElement: [
    ...HERRAMIENTAS.map((h, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: h.tituloEn,
      url: `${SITE_URL}/en/herramientas/${h.slug}/`,
    })),
    {
      "@type": "ListItem",
      position: HERRAMIENTAS.length + 1,
      name: "Discipline test",
      url: `${SITE_URL}/en/test/`,
    },
  ],
};

export const metadata: Metadata = {
  title: "Trading tools",
  description:
    "Eight trading calculators: risk per trade, Monte Carlo, edge significance and commission drag. Free, no sign-up and nothing sent anywhere.",
  alternates: {
    canonical: `${SITE_URL}/en/herramientas/`,
    languages: hreflangDe("/herramientas"),
  },
  openGraph: {
    title: "Trading tools — CountPips",
    description: "Eight tools that run in your browser. No sign-up and nothing sent anywhere.",
    url: `${SITE_URL}/en/herramientas/`,
    type: "website",
    siteName: "CountPips",
    locale: "en_US",
    alternateLocale: ["es_ES"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trading tools — CountPips",
    description: "Eight free tools, no sign-up and nothing sent anywhere.",
  },
};

export default function HerramientasEnPage() {
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
