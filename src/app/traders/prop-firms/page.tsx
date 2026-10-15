import type { Metadata } from "next";
import { TraderProfileBody } from "@/components/beta/TraderProfilePage";
import { SITE_URL, hreflangDe, esquemasTrader } from "@/lib/site";
import { PROGRAMA, enumerar } from "@/lib/producto";

/** Las firmas salen de PROGRAMA: las que el programa trae de verdad. */
const DESCRIPCION = `Plantillas de ${enumerar(PROGRAMA.plantillasProp, "es")}: las reglas de tu firma con cada operación, aviso antes de romperlas e informe de evaluación.`;

export const metadata: Metadata = {
  title: "Prop firms: evaluaciones y cuentas fondeadas",
  description: DESCRIPCION,
  alternates: { canonical: `${SITE_URL}/traders/prop-firms/`, languages: hreflangDe("/traders/prop-firms") },
  openGraph: {
    title: "Prop firms — CountPips",
    description: DESCRIPCION,
    url: `${SITE_URL}/traders/prop-firms/`,
    type: "website",
    siteName: "CountPips",
    locale: "es_ES",
    alternateLocale: ["en_GB"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prop firms — CountPips",
    description: DESCRIPCION,
  },
};

export default function PropFirmsPage() {
  return (
    <>
      {esquemasTrader("es", "prop").map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
        />
      ))}
      <TraderProfileBody profile="prop" />
    </>
  );
}
