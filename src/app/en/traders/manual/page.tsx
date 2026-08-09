import type { Metadata } from "next";
import { TraderProfileBody } from "@/components/beta/TraderProfilePage";
import { SITE_URL, hreflangDe, esquemasTrader } from "@/lib/site";

export const metadata: Metadata = {
  title: "Manual trading",
  description: "Metrics, playbooks and trade review for manual traders.",
  alternates: { canonical: `${SITE_URL}/en/traders/manual/`, languages: hreflangDe("/traders/manual") },
  openGraph: {
    title: "Manual trading — CountPips",
    description: "Metrics, playbooks and trade review for manual traders.",
    url: `${SITE_URL}/en/traders/manual/`,
    type: "website",
    siteName: "CountPips",
    locale: "en_US",
    alternateLocale: ["es_ES"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Manual trading — CountPips",
    description: "Metrics, playbooks and trade review for manual traders.",
  },
};

export default function ManualTradersEnPage() {
  return (
    <>
      {esquemasTrader("en", "manual").map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
        />
      ))}
      <TraderProfileBody profile="manual" />
    </>
  );
}
