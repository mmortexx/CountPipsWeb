import type { Metadata } from "next";
import { TraderProfileBody } from "@/components/beta/TraderProfilePage";
import { SITE_URL, hreflangDe } from "@/lib/site";

export const metadata: Metadata = {
  title: "Prop firms — evaluations and funded accounts",
  description: "Visible risk, rules and track record for prop-firm traders.",
  alternates: { canonical: `${SITE_URL}/en/traders/prop-firms/`, languages: hreflangDe("/traders/prop-firms") },
  openGraph: {
    title: "Prop firms — CountPips",
    description: "Visible risk, rules and track record for prop-firm traders.",
    url: `${SITE_URL}/en/traders/prop-firms/`,
    type: "website",
    siteName: "CountPips",
    locale: "en_US",
    alternateLocale: ["es_ES"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prop firms — CountPips",
    description: "Visible risk, rules and track record for prop-firm traders.",
  },
};

export default function PropFirmsEnPage() {
  return <TraderProfileBody profile="prop" />;
}
