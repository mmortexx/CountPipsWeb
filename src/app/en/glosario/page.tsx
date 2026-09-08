import type { Metadata } from "next";
import { GlosarioBody } from "../../glosario/page";
import { TERMINOS } from "@/lib/glosario";
import { SITE_URL, hreflangDe } from "@/lib/site";

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/en/` },
    { "@type": "ListItem", position: 2, name: "Glossary", item: `${SITE_URL}/en/glosario/` },
  ],
};

const glosarioSchema = {
  "@context": "https://schema.org",
  "@type": "DefinedTermSet",
  name: "CountPips trading glossary",
  description:
    "Precise definitions of the terms used when trading and when measuring a trading track record.",
  url: `${SITE_URL}/en/glosario/`,
  inLanguage: "en",
  hasDefinedTerm: TERMINOS.map((t) => ({
    "@type": "DefinedTerm",
    name: t.term,
    description: t.en,
    url: `${SITE_URL}/en/glosario/${t.slug}/`,
  })),
};

export const metadata: Metadata = {
  title: "Trading glossary",
  description: `${TERMINOS.length} trading terms explained without the jargon: risk, metrics, execution and psychology. What each one means and why it matters for measuring your trading.`,
  alternates: {
    canonical: `${SITE_URL}/en/glosario/`,
    languages: hreflangDe("/glosario"),
  },
  openGraph: {
    title: "Trading glossary — CountPips",
    description: `${TERMINOS.length} terms explained without the jargon. Risk, metrics, execution and psychology.`,
    url: `${SITE_URL}/en/glosario/`,
    type: "website",
    siteName: "CountPips",
    locale: "en_US",
    alternateLocale: ["es_ES"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trading glossary — CountPips",
    description: `${TERMINOS.length} terms explained without the jargon.`,
  },
};

export default function GlosarioEnPage() {
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
