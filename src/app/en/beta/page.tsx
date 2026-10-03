import type { Metadata } from "next";
import { BetaPage } from "../../beta/page";
import { SITE_URL, hreflangDe } from "@/lib/site";

const TITULO = "Early access — CountPips";
const DESCRIPCION = "Request private early access to CountPips and bring your own trading data to the pilot.";

export const metadata: Metadata = {
  title: { absolute: TITULO },
  description: DESCRIPCION,
  alternates: { canonical: `${SITE_URL}/en/beta/`, languages: hreflangDe("/beta") },
  openGraph: { title: TITULO, description: DESCRIPCION, url: `${SITE_URL}/en/beta/`, type: "website", siteName: "CountPips", locale: "en_GB", alternateLocale: ["es_ES"] },
  twitter: { card: "summary_large_image", title: TITULO, description: DESCRIPCION },
};

export default function BetaEnPage() {
  return <BetaPage lang="en" />;
}
