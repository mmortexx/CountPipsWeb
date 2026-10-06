import type { Metadata } from "next";
import { TraderProfileBody } from "@/components/beta/TraderProfilePage";
import { SITE_URL, hreflangDe, esquemasTrader } from "@/lib/site";

export const metadata: Metadata = {
  title: "Operativa manual",
  description: "Métricas, playbooks y revisión de operaciones para quien opera a mano: mide tu ventaja real y detecta el patrón que te está costando dinero.",
  alternates: { canonical: `${SITE_URL}/traders/manual/`, languages: hreflangDe("/traders/manual") },
  openGraph: {
    title: "Operativa manual — CountPips",
    description: "Métricas, playbooks y revisión de operaciones para quien opera a mano: mide tu ventaja real y detecta el patrón que te está costando dinero.",
    url: `${SITE_URL}/traders/manual/`,
    type: "website",
    siteName: "CountPips",
    locale: "es_ES",
    alternateLocale: ["en_GB"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Operativa manual — CountPips",
    description: "Métricas, playbooks y revisión de operaciones para quien opera a mano: mide tu ventaja real y detecta el patrón que te está costando dinero.",
  },
};

export default function ManualTradersPage() {
  return (
    <>
      {esquemasTrader("es", "manual").map((s, i) => (
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
