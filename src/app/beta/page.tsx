import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { BetaApplication } from "@/components/beta/BetaApplication";
import { BetaStatus } from "@/components/beta/BetaStatus";
import { BetaApplicationNote, BetaDetails } from "@/components/beta/BetaDetails";
import { SITE_URL, hreflangDe, siteUrl, migasSchema } from "@/lib/site";

export const metadata: Metadata = {
  title: "Acceso anticipado",
  description: "Solicita acceso anticipado privado a CountPips para probar la aplicación con tus propios datos.",
  alternates: { canonical: `${SITE_URL}/beta/`, languages: hreflangDe("/beta") },
  openGraph: { title: "Acceso anticipado — CountPips", description: "Solicita acceso anticipado privado a CountPips.", url: `${SITE_URL}/beta/`, type: "website", siteName: "CountPips", locale: "es_ES", alternateLocale: ["en_US"] },
};

/* El `WebPage` estaba fijo en la versión española y la inglesa reutiliza
   este mismo componente, así que `/en/beta/` le declaraba a Google el
   nombre, la descripción y la URL de la página en español. Ahora el
   esquema se construye por idioma.

   Y le acompaña el `BreadcrumbList` que faltaba: esta página SÍ enseña sus
   migas en la cabecera —«Inicio / Acceso anticipado»—, así que ocultarle
   esa jerarquía al buscador era enseñar dos cosas distintas al visitante y
   al rastreador. */
function esquemasDe(lang: "es" | "en") {
  const ruta = "/beta/";
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: lang === "es" ? "Acceso anticipado de CountPips" : "CountPips early access",
      description:
        lang === "es"
          ? "Solicitud de acceso anticipado privado a CountPips."
          : "Request for private early access to CountPips.",
      url: siteUrl(lang === "es" ? ruta : `/en${ruta}`),
    },
    migasSchema(lang, [
      { nombre: lang === "es" ? "Acceso anticipado" : "Early access", ruta },
    ]),
  ];
}

export function BetaPage({ lang = "es" }: { lang?: "es" | "en" } = {}) {
  return (
    <>
      {esquemasDe(lang).map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
        />
      ))}
      <PageHeader
        eyebrowEs="Acceso anticipado"
        eyebrowEn="Early access"
        titleEs="Prueba CountPips antes de la apertura comercial."
        titleEn="Try CountPips before commercial launch."
        titleHighlightEs="apertura comercial."
        titleHighlightEn="commercial launch."
        subtitleEs="La demo pública te enseña el flujo. Este acceso anticipado es para quienes quieren llevar sus propios datos a un piloto privado, con invitación y sin pedir credenciales financieras."
        subtitleEn="The public demo shows the workflow. This early access is for people who want to bring their own data into a private pilot, by invitation and without sharing financial credentials."
        breadcrumbEs="Acceso anticipado"
        breadcrumbEn="Early access"
        readingTimeMin={2}
      />
      <section className="section bg-veil">
        <div className="tj-container">
          <BetaApplication />
          <BetaApplicationNote />
        </div>
      </section>
      <BetaStatus />
      <BetaDetails />
    </>
  );
}

export default BetaPage;
