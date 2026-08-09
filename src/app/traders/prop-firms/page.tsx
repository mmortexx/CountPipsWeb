import type { Metadata } from "next";
import { TraderProfileBody } from "@/components/beta/TraderProfilePage";
import { SITE_URL, hreflangDe } from "@/lib/site";

export const metadata: Metadata = {
  title: "Prop firms — evaluaciones y cuentas fondeadas",
  description: "Riesgo visible, reglas y track record para traders de prop firms.",
  alternates: { canonical: `${SITE_URL}/traders/prop-firms/`, languages: hreflangDe("/traders/prop-firms") },
  openGraph: {
    title: "Prop firms — CountPips",
    description: "Riesgo visible, reglas y track record para traders de prop firms.",
    url: `${SITE_URL}/traders/prop-firms/`,
    type: "website",
    siteName: "CountPips",
    locale: "es_ES",
    alternateLocale: ["en_US"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prop firms — CountPips",
    description: "Riesgo visible, reglas y track record para traders de prop firms.",
  },
};

export default function PropFirmsPage() {
  return <TraderProfileBody profile="prop" />;
}
