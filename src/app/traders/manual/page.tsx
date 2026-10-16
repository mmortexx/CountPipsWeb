import type { Metadata } from "next";
import { TraderProfileBody } from "@/components/beta/TraderProfilePage";
import { TERMINOS_DE_PERFIL, terminosPorNombre } from "@/lib/glosario";
import { SITE_URL, hreflangDe, esquemasTrader } from "@/lib/site";

export const metadata: Metadata = {
  title: "Diario de trading para operativa manual",
  description: "Métricas, playbooks y revisión de operaciones para quien opera a mano: mide tu ventaja real y detecta el patrón que te está costando dinero.",
  alternates: { canonical: `${SITE_URL}/traders/manual/`, languages: hreflangDe("/traders/manual") },
  openGraph: {
    title: "Diario de trading para operativa manual — CountPips",
    description: "Métricas, playbooks y revisión de operaciones para quien opera a mano: mide tu ventaja real y detecta el patrón que te está costando dinero.",
    url: `${SITE_URL}/traders/manual/`,
    type: "website",
    siteName: "CountPips",
    locale: "es_ES",
    alternateLocale: ["en_GB"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Diario de trading para operativa manual — CountPips",
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
      <TraderProfileBody profile="manual" terminos={terminosPorNombre(TERMINOS_DE_PERFIL.manual)} />
    </>
  );
}
