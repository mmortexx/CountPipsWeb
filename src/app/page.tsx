import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { Ticker } from "@/components/marketing/Ticker";
import { Hero } from "@/components/marketing/Hero";
import { ProfileSelector } from "@/components/marketing/ProfileSelector";
import { SideRail } from "@/components/tj/SideRail";
import { PlateInterlude } from "@/components/tj/PlateInterlude";
import { ProductShowcase } from "@/components/marketing/ProductShowcase";
import { SITE_URL, hreflangDe, esquemasGlobales } from "@/lib/site";
import { SUPPORT_EMAIL } from "@/lib/forms";

// PNG (not SVG) — see layout.tsx for the rationale (social platforms
// silently fail to render SVG OG images). Absolute URL bypasses the
// metadataBase + basePath double-resolution issue (also see layout.tsx).

const PAGE_DESCRIPTION =
  "Diario de trading nativo de Windows. Explora una demo interactiva con métricas institucionales, disciplina y datos 100% locales.";

export const metadata: Metadata = {
  title: { absolute: "CountPips — Opera como una mesa institucional." },
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: `${SITE_URL}/`,
    languages: hreflangDe("/"),
  },
  openGraph: {
    title: "CountPips — Opera como una mesa institucional.",
    description: PAGE_DESCRIPTION,
    url: `${SITE_URL}/`,
    type: "website",
    siteName: "CountPips",
    locale: "es_ES",
    alternateLocale: ["en_US"],
  },
  twitter: {
    card: "summary_large_image",
    title: "CountPips — Opera como una mesa institucional.",
    description:
      "Diario de trading profesional, nativo de Windows. Explora el producto antes de instalarlo: métricas institucionales, disciplina y datos locales.",
  },
};


// LAS SECCIONES PESADAS SIGUEN EN SU PROPIO TROZO DE JAVASCRIPT, PERO YA
// NO LLEVAN `loading`.
//
// Un `loading` en `next/dynamic` abre un límite de Suspense, y React
// resuelve un límite de Suspense durante el prerenderizado escribiendo el
// hueco en su sitio y el contenido REAL al final del <body>, dentro de un
// <div hidden> que sólo un script sabe devolver a su lugar. Sin
// JavaScript ese script no corre: medido en el HTML compilado, la portada
// servía 37.921 de sus 118.707 caracteres —el 32 %— dentro de bloques
// ocultos, y /features 61.865 de 128.953, el 48 %.
//
// Sin `loading` no hay límite, el contenido se escribe donde va y el
// reparto en trozos se conserva intacto: medido tras el cambio, la
// portada pide los mismos 17 scripts y los mismos 948 KB. El salto de
// maquetación que el hueco venía a evitar tampoco ocurre — no hay hueco,
// porque la sección ya viene escrita.
//
// Lo vigila `scripts/humo.mjs` (guardián «contenido en bloques ocultos»).

const StatsBandNew = dynamic(
  () => import("@/components/marketing/StatsBandNew").then((m) => m.StatsBandNew)
);
const MetricsShowcaseNew = dynamic(
  () =>
    import("@/components/marketing/MetricsShowcaseNew").then(
      (m) => m.MetricsShowcaseNew
    )
);
const GuardianNew = dynamic(
  () => import("@/components/marketing/GuardianNew").then((m) => m.GuardianNew)
);
const Values = dynamic(
  () => import("@/components/marketing/Values").then((m) => m.Values)
);
const TrustStrip = dynamic(
  () => import("@/components/marketing/TrustStrip").then((m) => m.TrustStrip)
);
const FinalCTANew = dynamic(
  () => import("@/components/marketing/FinalCTANew").then((m) => m.FinalCTANew)
);

/**
 * Home (R7) — composición corta, calcada de la RUTA home del HTML de
 * referencia (el resto de secciones viven en sus propias páginas, como
 * en el HTML viven tras el megamenú):
 *
 * La página alterna CAPÍTULO y LÁMINA, como un tratado ilustrado:
 *
 *   Hero                    — portada, entra con el intro
 *   StatsBandNew            — las cuatro cifras que definen el producto
 *   ── Lámina I             — la curva de rendimiento y su drawdown
 *   MetricsShowcaseNew      — qué mide: ratios + distribución de R
 *   Ticker                  — banda animada con símbolos
 *   ── Lámina II            — el calendario del mes, día a día
 *   GuardianNew             — la disciplina que frena antes del error
 *   ── Lámina III           — la distribución de R: ¿ventaja o suerte?
 *   Values                  — los cuatro principios del producto
 *   TrustStrip              — banda de señales de confianza
 *   ── Lámina IV            — el cuadrante de riesgo y su límite
 *   FinalCTANew             — CTA de cierre
 *
 * ── Por qué este ritmo ────────────────────────────────────────────────
 * El fondo de este sitio es un atlas que se GRABA conforme bajas. Con
 * las secciones encadenadas una tras otra, ese fondo no tenía un solo
 * instante para sí: siempre había una superficie encima. Se intentó
 * resolver bajando el velo, ensanchando los márgenes y oscureciendo el
 * trazo, y ninguna de las tres funcionó, porque el problema no era de
 * opacidad sino de RITMO.
 *
 * Las cuatro pausas son láminas a página completa. En cada una no hay
 * ninguna sección encima: el fondo se ve entero durante una pantalla
 * larga, con su marco y su cartela, y su pie de figura explica qué es lo
 * que se está dibujando. El texto ocupa su página; la figura, la suya.
 *
 * Además están SINCRONIZADAS: `EngravedAtlas` lee el `data-plate` de
 * cada pausa y ajusta su progreso para que la lámina N termine de
 * grabarse justo cuando la pausa N llena la pantalla. Sin eso, una
 * pausa podía caer en mitad de una transición y enseñar dos figuras a
 * medias — lo contrario de lo que viene a hacer.
 *
 * ── Fuera la demo y el mockup ─────────────────────────────────────────
 * La home tenía dos bloques con una reproducción de la aplicación: la
 * demo interactiva (1.270 px de alto) y el mockup de "Todo tu día en una
 * pantalla". Los dos eran superficies OPACAS a pantalla casi completa, y
 * entre ambos ocupaban más de la mitad del recorrido: el atlas del fondo
 * quedaba tapado justo en el tramo donde graba sus primeras láminas.
 *
 * La demo vive ahora SOLO en /demo, que es su sitio — una demo a página
 * completa se disfruta a página completa, no incrustada en una landing
 * entre otras seis secciones. Desde la home se llega por el CTA del
 * hero, por el megamenú, por el cierre y por ⌘K.
 *
 * Lo que las sustituye NO es relleno: son seis secciones tipográficas
 * —cifras, ratios, reglas, principios— que ya existían en el proyecto y
 * que cuentan el producto sin una sola captura. Al no llevar imagen, el
 * papel grabado se ve entre ellas y a través de sus márgenes, que es
 * exactamente lo que se buscaba. Cuentan más y tapan menos.
 *
 * NO se repiten `HowItWorks` ni `MoreFeatures`: esas dos ya viven en
 * /features y duplicarlas aquí sería alargar por alargar.
 *
 * Características / Métricas / Disciplina / Seguridad → /features
 * Precios → /pricing · Demo a página completa → /demo · FAQ → /faq ·
 * Acerca de → /about.
 *
 * El SideRail ahora es un índice LOCAL de la home con sólo 2 anclas
 * (01 Inicio #top, 02 Vistazo #overview) — no un índice del sitio. Las
 * 9 rutas reales ya viven en el megamenú del Navbar, en el Footer, en
 * el CommandPalette (⌘K) y en los atajos `g`+letra de GlobalShortcuts;
 * duplicarlas en el raíl era justo lo que generaba "secciones que no
 * hay en ese menú". La sección HomeDemo sigue siendo alcanzable con
 * scroll, pero no la indexamos para evitar la colisión "Demo" (ancla
 * de la home) vs "/demo" (ruta independiente).
 */
/**
 * Exportada con nombre, no sólo como default: `app/en/page.tsx` la
 * reutiliza para no duplicar 25 líneas de composición. El cuerpo no
 * necesita saber en qué idioma está — cada sección lee `useLang()` por
 * su cuenta —, así que lo único que cambia entre `/` y `/en` es la
 * `metadata` de cada fichero, no esto.
 */
export function HomeBody() {
  return (
    <>
      {/* Raíl lateral 01–02 — índice local de la home (solo ≥1100px) */}
      <SideRail />
      <Hero />
      <ProfileSelector />
      <StatsBandNew />

      {/* La portada enseña el programa ANTES de la primera lámina dibujada:
          hasta aquí solo ha habido promesa, y quien decide en diez segundos
          no llega más abajo. */}
      <ProductShowcase />

      <PlateInterlude index={0} />

      <MetricsShowcaseNew />
      <Ticker />

      <PlateInterlude index={1} />

      <GuardianNew />

      <PlateInterlude index={2} />

      <Values />
      <TrustStrip />

      <PlateInterlude index={3} />

      <FinalCTANew />
    </>
  );
}

export default function Home() {
  return (
    <>
      {/* Los tres datos estructurados del sitio, en español. Estaban en el
          layout raíz, que los repetía en las 155 páginas —76 de ellas en
          inglés— con el texto español fijo. Ver `esquemasGlobales()`. */}
      {esquemasGlobales("es", { soporte: SUPPORT_EMAIL }).map((s, i) => (
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
