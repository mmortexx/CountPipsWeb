import type { Metadata, Viewport } from "next";
import { Geist_Mono, Instrument_Sans, Newsreader } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { CookieConsent } from "@/components/tj/CookieConsent";
import { BackToTop } from "@/components/tj/BackToTop";
import { GlobalShortcuts } from "@/components/tj/GlobalShortcuts";
import { OverlayHost } from "@/components/tj/OverlayHost";
import { ScrollToTop } from "@/components/tj/ScrollToTop";
import { SkipLink } from "@/components/tj/SkipLink";
import { BackgroundFX } from "@/components/tj/BackgroundFX";
import { IntroSequence } from "@/components/tj/IntroSequence";
import { SectionReveal } from "@/components/tj/SectionReveal";
import { DecorFX } from "@/components/tj/DecorFX";
import { SITE_URL } from "@/lib/site";
import { SUPPORT_EMAIL } from "@/lib/forms";

/** Mismo valor que usa `asset()`; vacío en Cloudflare, `/CountPipsWeb` en
 *  GitHub Pages. Lo necesita el script de `lang` de más abajo. */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Viewport — `viewport-fit=cover` lets the layout extend into the notch /
 * home-indicator area on iOS so the safe-area-inset CSS env() values
 * (`.safe-top`, `.safe-bottom` in globals.css) actually take effect.
 * Without this, the env() values resolve to 0 and the safe-area padding
 * is a no-op. `themeColor` colours the Android Chrome tab bar / Safari
 * status-bar background to match the brand palette (matches the
 * `theme_color` declared in `manifest.ts`).
 *
 * El valor es `--bg` del tema oscuro (globals.css). Antes eran dos
 * colores distintos y ninguno de la marca: aquí un gris cálido claro
 * (#B9B2A6) y en manifest.ts un verde (#34B476), de modo que el navegador
 * teñía su barra de un color que no aparece en ninguna parte del sitio y
 * además cada superficie decía una cosa.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0c1116",
};

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* Instrument Sans es la sans del sitio (--font-sans): texto, rótulos y
   etiquetas. Geist Sans se retiró: solo actuaba de respaldo de esta, y una
   familia cargada que nadie compone es peso de descarga sin contrapartida. */
const instrumentSans = Instrument_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

/* ─────────────────────────────────────────────────────────────────────────
   LA SERIF DE TITULARES: NEWSREADER, NO INSTRUMENT SERIF

   Se cambia por dos motivos independientes, y cualquiera de los dos basta.

   1. INSTRUMENT SERIF SE VOLVIÓ UNA FIRMA RECONOCIBLE. La crítica de diseño
      de 2025-2026 la nombra, junto con Space Grotesk y Geist, como una de
      las caras que delatan una web hecha en masa: es la serif que traen por
      defecto los generadores y las plantillas. El registro editorial no es
      el problema — lo son las referencias del sector (Financial Times, iA,
      Linear) usan serif y aguantan el escrutinio porque su tipografía no la
      puede descargar cualquiera en treinta segundos. Newsreader no arrastra
      esa asociación.

   2. INSTRUMENT SERIF SOLO EXISTE EN PESO 400. Eso obligaba a pedirle
      negritas falsas al navegador o a renunciar a jerarquía dentro del
      titular. Newsreader es variable de 200 a 800, con cursiva real y eje
      óptico, así que la jerarquía se compone con la familia en lugar de
      pelearse con ella.

   Es además una serif de contraste MODERADO, no una didona: los trazos
   finos de una serif de contraste alto desaparecen por debajo de 18 px y en
   pantallas sin densidad doble. Aquí la serif tiene que sostener cifras,
   no solo titulares.

   La lista de respaldo de globals.css ya nombraba Newsreader antes que
   Georgia, así que la intención estaba escrita; esto la hace efectiva. */
const newsreader = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

// LA TARJETA PARA COMPARTIR YA NO ES UN FICHERO QUE SE MANTENGA A MANO.
// La generan `src/app/opengraph-image.tsx` y `src/app/twitter-image.tsx`
// durante la compilación, y Next las inyecta solo en los metadatos de cada
// ruta. Por eso aquí abajo `openGraph.images` se omite a propósito: ponerlo
// sobrescribiría la imagen generada.
//
// Antes era un PNG fijo en `public/og.png`, compuesto por un script de
// Python y referenciado con un `?v=` que había que subir a mano cada vez.
// Ese trío —fichero, script y número de versión— se retiró al pasar a la
// generación automática; editar el diseño ahora es editar el componente.
//
// Sigue siendo PNG y no SVG, y eso no es indiferente: Twitter/X, Facebook,
// LinkedIn, Slack y Discord fallan en silencio con tarjetas en SVG y
// enseñan una miniatura rota o genérica. 1200×630 en PNG es el único
// formato que renderiza en todas.
//
// Ojo con el prefijo de ruta: cuando se escribía la dirección a mano había
// que ponerla ABSOLUTA, porque una ruta con barra inicial se volvía a
// resolver contra `metadataBase` y el prefijo de GitHub Pages salía
// duplicado. Con la imagen generada lo compone Next y sale bien —
// comprobado en el HTML de las dos compilaciones, no supuesto.
//
// `logo.png` es el logotipo de la marca —el cuaderno con las tres velas,
// el mismo icono que la aplicación de escritorio— rasterizado desde la
// misma geometría del glifo vectorial. Va en el dato estructurado de
// Organization, que es de donde Google saca el logotipo del sitio. Se
// regenera con `python scripts/generate-brand.py`, que produce además el
// apple-icon y el favicon.ico; si se toca el glifo de `BrandGlyph.tsx`
// hay que volver a lanzarlo o la marca se parte entre la web y lo que
// ven el buscador y el sistema operativo.
const LOGO_URL = `${SITE_URL}/logo.png`;

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "CountPips",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Windows",
  url: SITE_URL,
  description:
    "El diario de trading profesional, nativo de Windows. Explora una demo interactiva con métricas institucionales, disciplina y datos 100 % locales.",
  inLanguage: ["es", "en"],
  /* Capturas reales de la aplicación. Estaban en `public/img/` sin que
     ningún dato estructurado las mencionara: Google las admite en
     `SoftwareApplication` y son gratis, ya existen. */
  screenshot: [
    `${SITE_URL}/img/app-resumen.webp`,
    `${SITE_URL}/img/app-curva.webp`,
    `${SITE_URL}/img/app-operaciones.webp`,
  ],
  featureList: [
    "Métricas institucionales (Sharpe, Profit Factor, Expectancy, R-multiple)",
    "Curva de equity y drawdown en tiempo real",
    "Guardián de disciplina: frenos antes de operar fuera de reglas",
    "Datos 100 % locales, sin nube, sin suscripciones",
    "Playbooks y plantillas de trading",
    "Calendario de P&L y heatmap por día/hora",
    "Diario narrativo con anotaciones por operación",
    "Multi-cuenta y multi-activo (acciones, futuros, forex, crypto)",
    "Exportación a CSV/JSON y backups locales",
  ],
  // Sin `aggregateRating` a propósito: no hay reseñas reales todavía.
  // Aquí se emitía 4,8/47 inventado. Las directrices de datos
  // estructurados de Google exigen que la valoración proceda de usuarios
  // reales, así que publicarla era arriesgar una acción manual además de
  // engañar a quien la viera en el buscador. Se vuelve a poner cuando
  // haya reseñas verificables (G2/Capterra/Trustpilot), tomando el valor
  // de esa plataforma.
  publisher: {
    "@type": "Organization",
    name: "CountPips",
    url: SITE_URL,
  },
};

/**
 * Organization structured data — gives Google a canonical reference for
 * the publisher behind the site (used for knowledge-panel disambiguation
 * and to anchor the SoftwareApplication publisher field).
 */
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "CountPips",
  url: SITE_URL,
  /* `ImageObject` en vez de la dirección suelta: Google prefiere el objeto
     porque así puede validar las dimensiones sin descargar la imagen. */
  logo: {
    "@type": "ImageObject",
    url: LOGO_URL,
    width: 512,
    height: 512,
  },
  description:
    "El diario de trading profesional, nativo de Windows. Explora el producto antes de instalarlo: métricas institucionales, disciplina y datos locales.",
  foundingDate: "2024",
  /* Sólo el repositorio, que es el único perfil que existe de verdad. Los
     iconos de X, YouTube y Discord se retiraron del pie por apuntar a
     ninguna parte; añadirlos aquí sería el mismo error en otro sitio. */
  sameAs: ["https://github.com/mmortexx/CountPipsWeb"],
  /* Faltaba, y es lo que permite que un buscador sepa a dónde escribir.
     La dirección sale de la misma constante que usan el formulario y las
     cinco pantallas donde aparece. */
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: SUPPORT_EMAIL,
    availableLanguage: ["Spanish", "English"],
  },
};

/**
 * WebSite — faltaba por completo, y con él la posibilidad de que Google
 * muestre un cuadro de búsqueda del sitio en sus resultados.
 *
 * El buscador que se declara aquí EXISTE y funciona: la FAQ lee el
 * parámetro `q` de la dirección y filtra en vivo — es el mismo mecanismo
 * que usa la página de error 404 para rescatar a quien se pierde. No se
 * anuncia nada que no esté construido.
 */
const webSiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "CountPips",
  alternateName: "CountPips — Diario de trading",
  url: SITE_URL,
  inLanguage: "es",
  publisher: { "@type": "Organization", name: "CountPips", url: SITE_URL },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/faq/?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CountPips — Tu operativa, medida.",
    template: "%s · CountPips",
  },
  description:
    "El diario de trading profesional, nativo de Windows. Explora la demo con métricas institucionales, disciplina y tus datos siempre en tu máquina.",
  /* Aquí iban 28 palabras clave. Se retiran: Google dejó de usar
     `meta keywords` en 2009 y lo anunció públicamente, Bing lo trata como
     señal de spam, y lo único que hacían era viajar en cada una de las
     páginas del sitio.
     Lo que sí posiciona es lo que hay debajo: un título y una descripción
     escritos para quien los va a leer. Eso ya está. */
  authors: [{ name: "CountPips" }],
  creator: "CountPips",
  alternates: {
    canonical: `${SITE_URL}/`,
  },
  openGraph: {
    title: "CountPips — Tu operativa, medida.",
    description:
      "El diario de trading profesional, nativo de Windows. Demo interactiva, métricas institucionales, disciplina y datos 100 % locales.",
    url: SITE_URL,
    siteName: "CountPips",
    type: "website",
    locale: "es_ES",
    alternateLocale: ["en_US"],
    // `images` se omite AQUÍ a propósito: Next.js auto-inyecta la
    // tarjeta desde src/app/opengraph-image.tsx (imagen dinámica
    // generada en runtime, servida desde /opengraph-image en la raíz
    // del dominio). Antes apuntábamos a `${SITE_URL}/og.png?v=2`, una
    // URL absoluta que dependía de SITE_URL — si el dominio no
    // coincidía o el archivo faltaba, la vista previa social quedaba
    // en blanco. La imagen dinámica siempre coincide con la web real,
    // sin importar dónde se publique.
  },
  twitter: {
    card: "summary_large_image",
    title: "CountPips — Tu operativa, medida.",
    description:
      "Diario de trading profesional, nativo de Windows. Métricas institucionales, disciplina y datos 100 % locales.",
    // `images` se omite también: src/app/twitter-image.tsx la inyecta.
  },
  robots: {
    index: true,
    follow: true,
  },
  category: "finance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      // El literal "es" es correcto para casi todo el sitio —el español
      // vive en la raíz sin prefijo— y para las diez páginas que sí
      // tienen versión inglesa (bajo `/en`) lo corrige, ANTES del primer
      // pintado, el script embebido de aquí abajo. Es el mismo patrón que
      // ya usa el tema: un valor de partida razonable en el propio JSX,
      // corregido por un script bloqueante que lee la dirección real
      // antes de que el navegador pinte nada, así que no hay parpadeo ni
      // una declaración incorrecta que un lector de pantalla o un
      // buscador puedan llegar a ver.
      lang="es"
      suppressHydrationWarning
      data-theme="light"
      data-palette="clasico"
    >
      <head>
        <script
          // Prevent FOUC: apply saved theme/palette before paint
          // suppressHydrationWarning: este script sólo existe para leer
          // localStorage antes del primer paint — el servidor nunca puede
          // reproducir su __html tal cual lo ve React al reconciliar, igual
          // que ya pasa con el <html> de arriba. Sin esto, React marcaba un
          // "mismatch" en cada primera visita (consola sucia en cada carga,
          // no sólo la primera de la sesión de un visitante).
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            // El estilo es único ("clasico") y se fija aquí sin consultar
            // el localStorage: así un valor antiguo guardado en el
            // navegador de un visitante ("grafito", "verde", "oro"…) no
            // puede aplicarse al <html> y dejar el primer paint sin
            // ningún bloque de tokens que lo respalde. Lo único que se
            // recuerda del visitante es si prefiere papel o tinta.
            __html: `(function(){try{var t=localStorage.getItem('tj-theme');if(t!=='dark'&&t!=='light')t='light';document.documentElement.dataset.theme=t;document.documentElement.dataset.palette='clasico';document.documentElement.classList.toggle('dark',t==='dark');}catch(e){document.documentElement.dataset.theme='light';document.documentElement.dataset.palette='clasico';}})();`,
          }}
        />
        <script
          // Intro del HTML de referencia: en la primera visita de la
          // sesión, oculta los [data-seq] del hero ANTES del primer
          // paint (IntroSequence los revela tras el loader).
          // suppressHydrationWarning: lee sessionStorage, sólo existe en el
          // navegador — mismo motivo que el script de arriba.
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(!sessionStorage.getItem('tj_intro'))document.documentElement.classList.add('tj-preload')}catch(e){}})();`,
          }}
        />
        <script
          // Corrige `lang` antes de pintar en las páginas bajo `/en`.
          // `location.pathname` SÍ lleva el prefijo de GitHub Pages
          // (`/CountPipsWeb/en/...`), a diferencia del `usePathname()` de
          // React que consume `LanguageProvider` —ese lo devuelve Next ya
          // sin el prefijo—, así que aquí hay que descontarlo a mano
          // antes de comprobar si el segmento es `/en`. `BASE_PATH` se
          // interpola en la compilación con el mismo valor que usa
          // `asset()`, y en Cloudflare —donde no hay prefijo— la cadena
          // sale vacía y la resta no hace nada.
          // suppressHydrationWarning: lee location.pathname del navegador —
          // mismo motivo que los dos scripts de arriba.
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=location.pathname;var b='${BASE_PATH}';if(b&&p.indexOf(b)===0)p=p.slice(b.length)||'/';document.documentElement.lang=(p==='/en'||p.indexOf('/en/')===0)?'en':'es';}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${geistMono.variable} ${instrumentSans.variable} ${newsreader.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(softwareApplicationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(webSiteSchema),
          }}
        />
        <Providers>
          <div className="min-h-screen flex flex-col">
            {/* Capa de efectos del HTML de referencia: fondo fijo con
                rejilla interactiva, barra de progreso de scroll, intro
                con loader, reveal por sección y spotlight de tarjetas. */}
            <BackgroundFX />
            <IntroSequence />
            <SectionReveal />
            <DecorFX />
            <SkipLink />
            <GlobalShortcuts />
            {/* La paleta ⌘K y la ayuda de atajos `?` se cargan bajo
                demanda: OverlayHost escucha las teclas y trae el código
                de cada overlay la primera vez que se abre. Ver el
                encabezado de OverlayHost.tsx para el porqué. */}
            <OverlayHost />
            {/* Scrolls window to top on every client-side route change.
                Next.js App Router handles scroll restoration for
                browser back/forward automatically; this guarantees a
                "start at the top" feel on forward navigations too. */}
            <ScrollToTop />
            <Navbar />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <Footer />
            <CookieConsent />
            <BackToTop />
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
