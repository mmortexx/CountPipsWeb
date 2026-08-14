import type { Metadata } from "next";
import { DisciplinaBody } from "../../../features/disciplina/page";
import { SITE_URL, hreflangDe } from "@/lib/site";
import { PUBLICACION_ISO, ULTIMA_ACTUALIZACION_ISO } from "@/lib/fechas";

const READING_TIME_MIN = 3;

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/en/` },
    { "@type": "ListItem", position: 2, name: "Features", item: `${SITE_URL}/en/features/` },
    { "@type": "ListItem", position: 3, name: "Discipline", item: `${SITE_URL}/en/features/disciplina/` },
  ],
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Discipline that acts, not lectures",
  description:
    "The Guardian stops the mistake before it happens: it blocks sizes over your risk, forces you to respect the plan, and audits every exception.",
  url: `${SITE_URL}/en/features/disciplina/`,
  mainEntityOfPage: `${SITE_URL}/en/features/disciplina/`,
  author: { "@type": "Organization", name: "CountPips" },
  publisher: { "@type": "Organization", name: "CountPips" },
  inLanguage: "en",
  timeRequired: `PT${READING_TIME_MIN}M`,
  datePublished: PUBLICACION_ISO,
  dateModified: ULTIMA_ACTUALIZACION_ISO,
  image: `${SITE_URL}/opengraph-image`,
  about: [
    { "@type": "Thing", name: "trading discipline" },
    { "@type": "Thing", name: "risk management" },
    { "@type": "Thing", name: "drawdown limits" },
    { "@type": "Thing", name: "guardian" },
    { "@type": "Thing", name: "trade journal" },
  ],
};

export const metadata: Metadata = {
  title: { absolute: "Discipline — CountPips" },
  description:
    "The Guardian stops mistakes before they happen: blocking excessive sizes, enforcing trade plans, and auditing exceptions. Indiscipline measured in money.",
  alternates: {
    canonical: `${SITE_URL}/en/features/disciplina/`,
    languages: hreflangDe("/features/disciplina"),
  },
  openGraph: {
    title: "Discipline — CountPips",
    description: "The Guardian stops the mistake before it happens. Discipline that acts, not lectures.",
    url: `${SITE_URL}/en/features/disciplina/`,
    type: "website",
    siteName: "CountPips",
    locale: "en_US",
    alternateLocale: ["es_ES"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Discipline — CountPips",
    description: "The Guardian stops the mistake before it happens. Discipline that acts, not lectures.",
  },
};

export default function DisciplinaEnPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <DisciplinaBody />
    </>
  );
}
