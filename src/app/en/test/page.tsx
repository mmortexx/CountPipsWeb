import type { Metadata } from "next";
import { TestBody } from "../../test/page";
import { QUESTIONS } from "@/lib/trading/disciplineQuestions";
import { SITE_URL, hreflangDe } from "@/lib/site";

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/en/` },
    { "@type": "ListItem", position: 2, name: "Discipline test", item: `${SITE_URL}/en/test/` },
  ],
};

const quizSchema = {
  "@context": "https://schema.org",
  "@type": "Quiz",
  name: "Trading discipline test",
  about: {
    "@type": "Thing",
    name: "Trading discipline",
  },
  inLanguage: "en",
  url: `${SITE_URL}/en/test/`,
  publisher: { "@type": "Organization", name: "CountPips" },
  /* Misma corrección que en la versión española: `acceptedAnswer` es, en
     schema.org, LA RESPUESTA CORRECTA, y las opciones van de peor a mejor
     conducta. Marcaba la primera — la menos disciplinada — como correcta.
     Ver el comentario largo en `src/app/test/page.tsx`. */
  hasPart: QUESTIONS.map((q) => ({
    "@type": "Question",
    text: q.qEn,
    acceptedAnswer: {
      "@type": "Answer",
      text: q.options[q.options.length - 1].en,
    },
    suggestedAnswer: q.options.slice(0, -1).map((o) => ({
      "@type": "Answer",
      text: o.en,
    })),
  })),
};

export const metadata: Metadata = {
  title: "Discipline test",
  description:
    "Fifteen questions on risk, plan, record, composure and consistency. Your profile across each axis, a weighted overall score, and what to fix first. No email.",
  alternates: {
    canonical: `${SITE_URL}/en/test/`,
    languages: hreflangDe("/test"),
  },
  openGraph: {
    title: "Discipline test — CountPips",
    description:
      "Measure yourself across five axes: risk, plan, record, composure and consistency. Full profile and where to start.",
    url: `${SITE_URL}/en/test/`,
    type: "website",
    siteName: "CountPips",
    locale: "en_US",
    alternateLocale: ["es_ES"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Discipline test — CountPips",
    description: "Fifteen questions, five axes, a weighted score and what to fix first. No email.",
  },
};

export default function TestEnPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(quizSchema) }}
      />
      <TestBody />
    </>
  );
}
