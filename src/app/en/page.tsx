import type { Metadata } from "next";
import { HomeBody } from "../page";
import { SITE_URL, hreflangDe, esquemasGlobales } from "@/lib/site";
import { SUPPORT_EMAIL } from "@/lib/forms";

/**
 * `/en`: la portada en inglés. El cuerpo es `HomeBody` de `../page`; cada
 * sección elige idioma con `useLang()`, que deriva "en" de esta dirección. Este
 * fichero solo aporta los metadatos que ven buscadores y enlaces compartidos.
 */
const PAGE_DESCRIPTION =
  "Windows-native trading journal. Explore an interactive demo with institutional metrics, discipline and your data on your machine.";

export const metadata: Metadata = {
  title: { absolute: "CountPips — Trade like an institutional desk." },
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: `${SITE_URL}/en/`,
    languages: hreflangDe("/"),
  },
  openGraph: {
    title: "CountPips — Trade like an institutional desk.",
    description: PAGE_DESCRIPTION,
    url: `${SITE_URL}/en/`,
    type: "website",
    siteName: "CountPips",
    locale: "en_GB",
    alternateLocale: ["es_ES"],
  },
  twitter: {
    card: "summary_large_image",
    title: "CountPips — Trade like an institutional desk.",
    description:
      "Professional trading journal, native to Windows. Explore the product before installing it: institutional metrics, discipline and local data.",
  },
};

export default function HomeEn() {
  return (
    <>
      {/* Mismos esquemas que `/`, en inglés: el layout no sabe el idioma de la ruta. */}
      {esquemasGlobales("en", { soporte: SUPPORT_EMAIL }).map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
        />
      ))}
      <HomeBody />
    </>
  );
}
