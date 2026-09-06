import type { Metadata } from "next";
import { TraderProfileBody } from "@/components/beta/TraderProfilePage";
import { SITE_URL, hreflangDe, esquemasTrader } from "@/lib/site";

export const metadata: Metadata = {
  title: "Prop firms — evaluaciones y cuentas fondeadas",
  description: "Riesgo visible antes de cada entrada, reglas de la firma siempre delante y un track record que sostiene tu evaluación. Pensado para quien opera cuenta fondeada.",
  alternates: { canonical: `${SITE_URL}/traders/prop-firms/`, languages: hreflangDe("/traders/prop-firms") },
  openGraph: {
    title: "Prop firms — CountPips",
    description: "Riesgo visible antes de cada entrada, reglas de la firma siempre delante y un track record que sostiene tu evaluación. Pensado para quien opera cuenta fondeada.",
    url: `${SITE_URL}/traders/prop-firms/`,
    type: "website",
    siteName: "CountPips",
    locale: "es_ES",
    alternateLocale: ["en_US"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prop firms — CountPips",
    description: "Riesgo visible antes de cada entrada, reglas de la firma siempre delante y un track record que sostiene tu evaluación. Pensado para quien opera cuenta fondeada.",
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
