import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { Hero } from "@/components/marketing/Hero";
import { ProfileSelector } from "@/components/marketing/ProfileSelector";
import { ProductShowcase } from "@/components/marketing/ProductShowcase";
import { MetricsShowcaseNew } from "@/components/marketing/MetricsShowcaseNew";
import { cifrasMuestra } from "@/lib/trading/cifras-muestra";
import { HERRAMIENTAS } from "@/lib/herramientas";
import { SITE_URL, hreflangDe, esquemasGlobales } from "@/lib/site";
import { SUPPORT_EMAIL } from "@/lib/forms";

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
    alternateLocale: ["en_GB"],
  },
  twitter: {
    card: "summary_large_image",
    title: "CountPips — Opera como una mesa institucional.",
    description:
      "Diario de trading profesional, nativo de Windows. Explora el producto antes de instalarlo: métricas institucionales, disciplina y datos locales.",
  },
};


// Sin `loading` en `next/dynamic`: un `loading` abre un límite de Suspense y el
// prerenderizado escribe el contenido real en un `<div hidden>` al final del
// body, que sin JavaScript no vuelve a su sitio. Lo vigila `scripts/humo.mjs`
// («contenido en bloques ocultos»).

const StatsBandNew = dynamic(
  () => import("@/components/marketing/StatsBandNew").then((m) => m.StatsBandNew)
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
 * Portada: primero qué es (promesa, pantallas reales, cómo frena) y luego si
 * es para ti. `app/en/page.tsx` reutiliza este cuerpo; cada sección lee
 * `useLang()`.
 */
export function HomeBody() {
  return (
    <>
      <Hero producto={<MetricsShowcaseNew cifras={cifrasMuestra()} enPortada />} />
      <StatsBandNew herramientas={HERRAMIENTAS.length} />
      <ProductShowcase />
      <GuardianNew />
      <ProfileSelector />
      <Values />
      <FinalCTANew sinFilete />
    </>
  );
}

export default function Home() {
  return (
    <>
      {/* Datos estructurados del sitio, en español (ver `esquemasGlobales()`). */}
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
