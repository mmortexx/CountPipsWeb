import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/layout/PageHeader";
import { FinalCTANew } from "@/components/marketing/FinalCTANew";
import { QUESTIONS } from "@/lib/trading/disciplineQuestions";
import { SITE_URL, hreflangDe } from "@/lib/site";

/**
 * /test: el diagnóstico de disciplina, con página propia y deliberadamente
 * corta (más secciones competirían con lo único que se viene a hacer).
 */

const DisciplineScore = dynamic(
  () => import("@/components/marketing/DisciplineScore").then((m) => m.DisciplineScore),
);

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Test de disciplina", item: `${SITE_URL}/test/` },
  ],
};

// Datos estructurados `Quiz` (resultado enriquecido). No lleva
// `educationalLevel`: el vocabulario no reconoce texto libre.
const quizSchema = {
  "@context": "https://schema.org",
  "@type": "Quiz",
  name: "Test de disciplina operativa",
  about: {
    "@type": "Thing",
    name: "Disciplina en trading",
  },
  inLanguage: "es",
  url: `${SITE_URL}/test/`,
  publisher: { "@type": "Organization", name: "CountPips" },
  // `hasPart` con las preguntas (de `DisciplineScore`) es lo que da el
  // resultado enriquecido.
  hasPart: QUESTIONS.map((q) => ({
    "@type": "Question",
    text: q.qEs,
    // `acceptedAnswer` es «la respuesta correcta» en schema.org y las opciones
    // van de peor a mejor conducta (tipo `Q` en disciplineQuestions.ts): se
    // marca la última, y las demás van en `suggestedAnswer`.
    acceptedAnswer: {
      "@type": "Answer",
      text: q.options[q.options.length - 1].es,
    },
    suggestedAnswer: q.options.slice(0, -1).map((o) => ({
      "@type": "Answer",
      text: o.es,
    })),
  })),
};

export const metadata: Metadata = {
  title: "Test de disciplina",
  description:
    "Quince preguntas sobre riesgo, plan, registro, temple y constancia. Tu perfil por ejes, una cifra global ponderada y qué arreglar primero. Sin email.",
  alternates: {
    canonical: `${SITE_URL}/test/`,
    languages: hreflangDe("/test"),
  },
  openGraph: {
    title: "Test de disciplina — CountPips",
    description:
      "Mídete en cinco ejes: riesgo, plan, registro, temple y constancia. Perfil completo y por dónde empezar.",
    url: `${SITE_URL}/test/`,
    type: "website",
    siteName: "CountPips",
    locale: "es_ES",
    alternateLocale: ["en_GB"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Test de disciplina — CountPips",
    description:
      "Quince preguntas, cinco ejes, una cifra ponderada y qué arreglar primero. Sin email.",
  },
};

/** Exportado con nombre para que `app/en/test/page.tsx` lo reutilice.
 *  Sin los `<script>` de datos estructurados. */
export function TestBody() {
  return (
    <>
      <PageHeader
        tono="instrumento"
        titleEs="¿Qué tipo de trader eres?"
        titleEn="What kind of trader are you?"
        subtitleEs="No es un test de personalidad: son quince preguntas sobre lo que haces de verdad cuando el mercado va en contra. Al final, tu perfil en cinco ejes y el que conviene arreglar primero."
        subtitleEn="Not a personality quiz: fifteen questions about what you actually do when the market turns. At the end, your profile across five axes and the one worth fixing first."
        breadcrumbEs="Test de disciplina"
        breadcrumbEn="Discipline test"
      />
      <DisciplineScore enPagina />

      <FinalCTANew variante="herramienta" />
    </>
  );
}

export default function TestPage() {
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
