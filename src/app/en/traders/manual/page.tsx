import type { Metadata } from "next";
import { TraderProfileBody } from "@/components/beta/TraderProfilePage";
import { SITE_URL, hreflangDe, esquemasTrader } from "@/lib/site";

export const metadata: Metadata = {
  title: "Manual trading",
  description: "Metrics, playbooks and trade review for traders who work by hand: measure your real edge, revisit every entry and find the pattern that keeps costing you money.",
  alternates: { canonical: `${SITE_URL}/en/traders/manual/`, languages: hreflangDe("/traders/manual") },
  openGraph: {
    title: "Manual trading — CountPips",
    description: "Metrics, playbooks and trade review for traders who work by hand: measure your real edge, revisit every entry and find the pattern that keeps costing you money.",
    url: `${SITE_URL}/en/traders/manual/`,
    type: "website",
    siteName: "CountPips",
    locale: "en_US",
    alternateLocale: ["es_ES"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Manual trading — CountPips",
    description: "Metrics, playbooks and trade review for traders who work by hand: measure your real edge, revisit every entry and find the pattern that keeps costing you money.",
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
