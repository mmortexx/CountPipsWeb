import type { Metadata } from "next";
import { TraderProfileBody } from "@/components/beta/TraderProfilePage";
import { SITE_URL, hreflangDe, esquemasTrader } from "@/lib/site";

export const metadata: Metadata = {
  title: "Prop firms — evaluations and funded accounts",
  description: "Your firm’s rules measured with every trade you log, a warning before you break them and an evaluation report in PDF. Built for funded-account traders.",
  alternates: { canonical: `${SITE_URL}/en/traders/prop-firms/`, languages: hreflangDe("/traders/prop-firms") },
  openGraph: {
    title: "Prop firms — CountPips",
    description: "Your firm’s rules measured with every trade you log, a warning before you break them and an evaluation report in PDF. Built for funded-account traders.",
    url: `${SITE_URL}/en/traders/prop-firms/`,
    type: "website",
    siteName: "CountPips",
    locale: "en_GB",
    alternateLocale: ["es_ES"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prop firms — CountPips",
    description: "Your firm’s rules measured with every trade you log, a warning before you break them and an evaluation report in PDF. Built for funded-account traders.",
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
