import type { Metadata } from "next";
import { BetaPage } from "../../beta/page";
import { SITE_URL, hreflangDe } from "@/lib/site";

export const metadata: Metadata = {
  title: "Early access",
  description: "Request private early access to CountPips and bring your own trading data to the pilot.",
  alternates: { canonical: `${SITE_URL}/en/beta/`, languages: hreflangDe("/beta") },
  openGraph: { title: "Early access — CountPips", description: "Request private early access to CountPips and bring your own trading data to the pilot.", url: `${SITE_URL}/en/beta/`, type: "website", siteName: "CountPips", locale: "en_US", alternateLocale: ["es_ES"] },
};

export default function BetaEnPage() {
  return <BetaPage lang="en" />;
}
