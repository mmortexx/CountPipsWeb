import type { Metadata } from "next";
import { TraderProfileBody } from "@/components/beta/TraderProfilePage";
import { SITE_URL, hreflangDe, esquemasTrader } from "@/lib/site";

export const metadata: Metadata = {
  title: "Prop firms — evaluaciones y cuentas fondeadas",
  description: "Las reglas de la firma medidas con cada operación que registras, aviso antes de romperlas y un informe de evaluación en PDF. Pensado para quien opera cuenta fondeada.",
  alternates: { canonical: `${SITE_URL}/traders/prop-firms/`, languages: hreflangDe("/traders/prop-firms") },
  openGraph: {
    title: "Prop firms — CountPips",
    description: "Las reglas de la firma medidas con cada operación que registras, aviso antes de romperlas y un informe de evaluación en PDF. Pensado para quien opera cuenta fondeada.",
    url: `${SITE_URL}/traders/prop-firms/`,
    type: "website",
    siteName: "CountPips",
    locale: "es_ES",
    alternateLocale: ["en_US"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prop firms — CountPips",
    description: "Las reglas de la firma medidas con cada operación que registras, aviso antes de romperlas y un informe de evaluación en PDF. Pensado para quien opera cuenta fondeada.",
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
