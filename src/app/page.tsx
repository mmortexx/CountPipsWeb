import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { Hero } from "@/components/marketing/Hero";
import { ProfileSelector } from "@/components/marketing/ProfileSelector";
import { ProductShowcase } from "@/components/marketing/ProductShowcase";
import { SITE_URL, hreflangDe, esquemasGlobales } from "@/lib/site";
import { SUPPORT_EMAIL } from "@/lib/forms";

// PNG (not SVG) — see layout.tsx for the rationale (social platforms
// silently fail to render SVG OG images). Absolute URL bypasses the
// metadataBase + basePath double-resolution issue (also see layout.tsx).

const PAGE_DESCRIPTION =
  "Diario de trading nativo de Windows. Explora una demo interactiva con métricas institucionales, disciplina y datos 100 % locales.";

export const metadata: Metadata = {
  title: { absolute: "CountPips — Opera como una mesa institucional." },
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: `${SITE_URL}/`,
    languages: hreflangDe("/"),
  },
  openGraph: {
    title: "CountPips — Opera como una mesa institucional.",
    description: PAGE_DESCRIPTION,
    url: `${SITE_URL}/`,
    type: "website",
    siteName: "CountPips",
    locale: "es_ES",
    alternateLocale: ["en_US"],
  },
  twitter: {
    card: "summary_large_image",
    title: "CountPips — Opera como una mesa institucional.",
    description:
      "Diario de trading profesional, nativo de Windows. Explora el producto antes de instalarlo: métricas institucionales, disciplina y datos locales.",
  },
};


// LAS SECCIONES PESADAS SIGUEN EN SU PROPIO TROZO DE JAVASCRIPT, PERO YA
// NO LLEVAN `loading`.
//
// Un `loading` en `next/dynamic` abre un límite de Suspense, y React
// resuelve un límite de Suspense durante el prerenderizado escribiendo el
// hueco en su sitio y el contenido REAL al final del <body>, dentro de un
// <div hidden> que sólo un script sabe devolver a su lugar. Sin
// JavaScript ese script no corre: medido en el HTML compilado, la portada
// servía 37.921 de sus 118.707 caracteres —el 32 %— dentro de bloques
// ocultos, y /features 61.865 de 128.953, el 48 %.
//
// Sin `loading` no hay límite, el contenido se escribe donde va y el
// reparto en trozos se conserva intacto: medido tras el cambio, la
// portada pide los mismos 17 scripts y los mismos 948 KB. El salto de
// maquetación que el hueco venía a evitar tampoco ocurre — no hay hueco,
// porque la sección ya viene escrita.
//
// Lo vigila `scripts/humo.mjs` (guardián «contenido en bloques ocultos»).

const StatsBandNew = dynamic(
  () => import("@/components/marketing/StatsBandNew").then((m) => m.StatsBandNew)
);
const MetricsShowcaseNew = dynamic(
  () =>
    import("@/components/marketing/MetricsShowcaseNew").then(
      (m) => m.MetricsShowcaseNew
    )
);
const GuardianNew = dynamic(
  () => import("@/components/marketing/GuardianNew").then((m) => m.GuardianNew)
);
const Values = dynamic(
  () => import("@/components/marketing/Values").then((m) => m.Values)
);
const FinalCTANew = dynamic(
  () => import("@/components/marketing/FinalCTANew").then((m) => m.FinalCTANew)
);

/**
 * Portada: promesa y producto en la primera pantalla, las cifras que la
 * sostienen, los dos recorridos, las pantallas reales y, después, qué
 * mide, cómo frena y en qué cree. Una idea por sección y un solo cierre.
 * `app/en/page.tsx` reutiliza este cuerpo; cada sección lee `useLang()`.
 */
export function HomeBody() {
  return (
    <>
      <Hero />
      <StatsBandNew />
      <ProfileSelector />
      <ProductShowcase />
      <MetricsShowcaseNew />
      <GuardianNew />
      <Values />
      <FinalCTANew />
    </>
  );
}

export default function Home() {
  return (
    <>
      {/* Los tres datos estructurados del sitio, en español. Estaban en el
          layout raíz, que los repetía en las 155 páginas —76 de ellas en
          inglés— con el texto español fijo. Ver `esquemasGlobales()`. */}
      {esquemasGlobales("es", { soporte: SUPPORT_EMAIL }).map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
        />
      ))}
      <HomeBody />
    </>
  );
}
