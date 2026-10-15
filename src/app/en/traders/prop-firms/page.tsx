import type { Metadata } from "next";
import { TraderProfileBody } from "@/components/beta/TraderProfilePage";
import { SITE_URL, hreflangDe, esquemasTrader } from "@/lib/site";
import { PROGRAMA, enumerar } from "@/lib/producto";

/** The firms come from PROGRAMA: the ones the app really ships. */
const DESCRIPCION = `${enumerar(PROGRAMA.plantillasProp, "en")} templates: your firm’s rules with every trade, a warning before you break them and an evaluation report.`;

export const metadata: Metadata = {
  title: "Prop firms: evaluations and funded accounts",
  description: DESCRIPCION,
  alternates: { canonical: `${SITE_URL}/en/traders/prop-firms/`, languages: hreflangDe("/traders/prop-firms") },
  openGraph: {
    title: "Prop firms — CountPips",
    description: DESCRIPCION,
    url: `${SITE_URL}/en/traders/prop-firms/`,
    type: "website",
    siteName: "CountPips",
    locale: "en_GB",
    alternateLocale: ["es_ES"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prop firms — CountPips",
    description: DESCRIPCION,
  },
};

export default function PropFirmsEnPage() {
  return (
    <>
      {esquemasTrader("en", "prop").map((s, i) => (
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
