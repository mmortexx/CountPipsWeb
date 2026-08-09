import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/layout/PageHeader";
import { FAQ } from "@/components/marketing/FAQ";
import { TableOfContents } from "@/components/tj/TableOfContents";
import { PlateInterlude } from "@/components/tj/PlateInterlude";
import { SITE_URL, hreflangDe } from "@/lib/site";

// Estimated reading time (16 Q&A entries + contact sections). ~650 words
// across all answers at 220 wpm = ~3 min.
const READING_TIME_MIN = 3;

// PNG (not SVG) — Twitter/X, Facebook, LinkedIn, Slack and Discord all
// silently fail to render SVG OG images. See layout.tsx for the full note.

/**
 * Breadcrumb structured data — page-specific. Lists just [Home, FAQ]
 * so Google renders a correct breadcrumb rich result for the actual
 * page hierarchy.
 */
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
      name: "FAQ",
      item: `${SITE_URL}/faq/`,
    },
  ],
};

/**
 * FAQ structured data — mirrors the ES questions/answers shown in the
 * FAQ component below so Google can render FAQ rich snippets on the SERP.
 * Lives on this page ONLY (not in `layout.tsx`): Google's structured data
 * guidelines require FAQ schema to appear on pages where the Q&A is
 * actually visible to the user, and emitting it on every page can trigger
 * a manual-action penalty.
 */
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "¿Cuál es el estado de compra?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "La demo es pública y no pide registro ni tarjeta. Core $149 y Pro $249 son precios de lanzamiento previstos hasta que la entrega comercial esté abierta.",
      },
    },
    {
      "@type": "Question",
      name: "¿Mis datos están seguros?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Tus datos viven en un único archivo .sqlite dentro de tu equipo. Nunca se suben a ningún servidor: no hay servidor. Puedes cifrar la carpeta con BitLocker/VeraCrypt para una capa extra de seguridad.",
      },
    },
    {
      "@type": "Question",
      name: "¿Puedo exportar mis datos?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí. Puedes exportar todo tu journal a CSV (para Excel o Google Sheets), PDF (informes listos para compartir) y JSON (backup completo y reimportable). Tus datos son tuyos: puedes llevártelos cuando quieras, sin API que cerrar ni servidor que apagar.",
      },
    },
    {
      "@type": "Question",
      name: "¿Funciona en Mac o Linux?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "CountPips es una app nativa de Windows (WinUI 3). En Mac o Linux puedes ejecutarla a través de una máquina virtual con Windows o Parallels. Estamos explorando activamente una versión local-first para Mac y Linux: si quieres entrar en el acceso anticipado, escríbenos.",
      },
    },
    {
      "@type": "Question",
      name: "¿Puedo importar de otro journal?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí. Aceptamos importación desde CSV (formato flexible con mapeo de columnas) y un importador dedicado para journals populares. Si tu journal actual exporta a CSV, lo tienes en tu CountPips en menos de 5 minutos.",
      },
    },
    {
      "@type": "Question",
      name: "¿Cómo se selecciona el acceso anticipado?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Revisamos las solicitudes por perfil y fase del producto, no por orden de llegada. Si encaja con el piloto privado, escribiremos con los pasos de invitación.",
      },
    },
    {
      "@type": "Question",
      name: "¿Qué está listo y qué se está validando?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "La demo, el journal, las métricas y los recorridos de riesgo están listos para explorar. El piloto privado valida la instalación y el flujo con usuarios reales; la página de estado explica lo que todavía no prometemos.",
      },
    },
    {
      "@type": "Question",
      name: "¿Qué métodos de pago aceptáis?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Tarjeta de crédito/débito y PayPal. Emitimos factura con IVA si procede.",
      },
    },
    {
      "@type": "Question",
      name: "¿Puedo ver el producto antes de solicitar acceso?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí. Puedes explorar la demo en vivo con datos deterministas, sin registro y sin descargar nada. La aplicación instalada se entrega sólo a participantes del piloto privado invitados.",
      },
    },
    {
      "@type": "Question",
      name: "¿Cuál es la diferencia entre Core y Pro?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Core incluye el journal completo, 40+ métricas, 2 cuentas de trading, gestión de riesgo, disciplina e informes PDF básicos. Pro desbloquea además: cuentas ilimitadas, modo prop firm, simulador Monte Carlo, informe de track record, risk of ruin, informes PDF avanzados y el importador de rivales que migra tu journal anterior en 5 minutos.",
      },
    },
    {
      "@type": "Question",
      name: "¿Cómo funcionará la privacidad de mis datos?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "La aplicación está diseñada local-first: las operaciones viven en tu equipo y la web no pide credenciales, capital, extractos ni datos financieros. El piloto privado valida el flujo sin exponer esos datos.",
      },
    },
    {
      "@type": "Question",
      name: "¿Podré usarlo en varios ordenadores?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "La política de dispositivos se concretará antes de la venta. Durante el piloto privado recibirás instrucciones de instalación sólo si eres invitado.",
      },
    },
    {
      "@type": "Question",
      name: "¿Qué ocurre si cambio de ordenador durante el piloto?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "El equipo de CountPips te indicará el procedimiento para mover tu entorno. No pediremos credenciales ni datos financieros para hacerlo.",
      },
    },
  ],
};

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Preguntas frecuentes sobre CountPips: precio, privacidad, compatibilidad, importación, actualizaciones y más.",
  alternates: {
    canonical: `${SITE_URL}/faq/`,
    languages: hreflangDe("/faq"),
  },
  openGraph: {
    title: "FAQ — CountPips",
    description: "Preguntas frecuentes sobre CountPips: precio, privacidad, compatibilidad y más.",
    url: `${SITE_URL}/faq/`,
    type: "website",
    siteName: "CountPips",
    locale: "es_ES",
    alternateLocale: ["en_US"],
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ — CountPips",
    description:
      "Preguntas frecuentes sobre CountPips: precio, privacidad, compatibilidad, importación, actualizaciones y más.",
  },
};

// Heavy below-the-fold sections are split into their own JS chunks via
// `next/dynamic` so the initial bundle stays lean. Each gets a tall
// skeleton fallback to prevent layout shift while the chunk loads.
const sectionFallback = (
  <div className="section" aria-hidden="true" style={{ minHeight: 360 }} />
);
// `StillHaveQuestions` retirado de esta página (ver el comentario junto
// a <ContactSupport /> más abajo).
const ContactSupport = dynamic(
  () => import("@/components/marketing/ContactSupport").then((m) => m.ContactSupport),
  { loading: () => sectionFallback }
);
const EdgeSignificanceChecker = dynamic(
  () => import("@/components/marketing/EdgeSignificanceChecker").then((m) => m.EdgeSignificanceChecker),
  { loading: () => sectionFallback }
);
const ContactForm = dynamic(
  () => import("@/components/marketing/ContactForm").then((m) => m.ContactForm),
  { loading: () => sectionFallback }
);
const FinalCTANew = dynamic(
  () => import("@/components/marketing/FinalCTANew").then((m) => m.FinalCTANew),
  { loading: () => sectionFallback }
);

/** Exportado con nombre para que `app/en/faq/page.tsx` lo reutilice. Sin
 *  los `<script>` de datos estructurados. */
export function FaqBody() {
  return (
    <>
      <PageHeader
        eyebrowEs="Dudas"
        eyebrowEn="Questions"
        titleEs="Preguntas frecuentes."
        titleEn="Frequently asked questions."
        titleHighlightEs="frecuentes."
        titleHighlightEn="questions."
        subtitleEs="Todo lo que necesitas saber antes de probar CountPips o solicitar acceso anticipado. ¿No encuentras tu respuesta? Consulta el glosario o escríbenos."
        subtitleEn="Everything you need to know before trying CountPips or requesting early access. Can't find your answer? Browse the glossary or write to us."
        breadcrumbEs="FAQ"
        breadcrumbEn="FAQ"
        readingTimeMin={READING_TIME_MIN}
      />
      <FAQ standalone />
      <EdgeSignificanceChecker num="01" />
      {/* `StillHaveQuestions` retirado: la página encadenaba CUATRO
          bloques seguidos diciendo lo mismo ("¿aún tienes dudas?",
          "¿no encuentras tu respuesta?", el formulario y el cierre).
          Aquel banner era además una caja de cristal a todo ancho con
          una sola frase centrada, sin icono ni acción. El componente
          sigue en el repositorio por si hace falta en otra página. */}
      <ContactSupport />

      <PlateInterlude index={0} />
      <ContactForm />

      <PlateInterlude index={1} />
      <FinalCTANew />
      <TableOfContents />
    </>
  );
}

export default function FaqPage() {
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
      <FaqBody />
    </>
  );
}
