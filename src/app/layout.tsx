import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { CookieConsent } from "@/components/tj/CookieConsent";
import { BackToTop } from "@/components/tj/BackToTop";
import { GlobalShortcuts } from "@/components/tj/GlobalShortcuts";
import { OverlayHost } from "@/components/tj/OverlayHost";
import { ScrollToTop } from "@/components/tj/ScrollToTop";
import { TransicionPagina } from "@/components/tj/TransicionPagina";
import { SkipLink } from "@/components/tj/SkipLink";
import { SectionReveal } from "@/components/tj/SectionReveal";
import { Aparecer } from "@/components/tj/Aparecer";
import { SubrayadoPestanas } from "@/components/tj/SubrayadoPestanas";
import { SITE_URL } from "@/lib/site";

/** Mismo valor que usa `asset()`; vacío en Cloudflare, `/CountPipsWeb` en
 *  GitHub Pages. Lo necesita el script de `lang` de más abajo. */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * `viewport-fit=cover` hace que los `env(safe-area-inset-*)` de globals.css
 * valgan algo en iOS. `themeColor` es `--bg` del tema oscuro y debe coincidir
 * con el `theme_color` de `manifest.ts`.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0c1116",
};

// Las fuentes viven en el repositorio (`src/app/fonts/`, subconjunto latin,
// variables) y se cargan con `next/font/local`: compilar no depende de la red
// ni de fonts.gstatic. `adjustFontFallback` sigue activo por defecto para que
// el cambio a la webfont no mueva la maqueta.
const geistMono = localFont({
  src: "./fonts/GeistMono.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

// La sans del sitio (`--font-sans`).
const instrumentSans = localFont({
  src: "./fonts/InstrumentSans.woff2",
  variable: "--font-sans",
  weight: "400 700",
  display: "swap",
});

// La serif de titulares. De contraste moderado: tiene que sostener cifras.
const newsreader = localFont({
  /* Eje de grosor recortado a 400–500, lo único que usa el sitio. El eje
     óptico se queda entero (`font-optical-sizing: auto` en globals.css). Este
     rango y el fichero deben coincidir: un peso que la fuente no trae se
     finge en silencio como negrita falsa. Lo vigila `scripts/pesos.mjs`. */
  src: [{ path: "./fonts/Newsreader.woff2", weight: "400 500", style: "normal" }],
  variable: "--font-serif",
  display: "swap",
});

// La cursiva va aparte y con `preload: false`: `next/font` precarga el
// conjunto entero y solo se usa en una cita de /features. Se aplica con la
// utilidad `font-cursiva`; no se finge con una oblicua sintética.
const newsreaderItalic = localFont({
  // Fijada a 400, el único peso que se usa (`scripts/pesos.mjs` lo vigila).
  src: [{ path: "./fonts/Newsreader-Italic.woff2", weight: "400", style: "italic" }],
  variable: "--font-serif-cursiva",
  display: "swap",
  preload: false,
});

// La tarjeta para compartir la generan `opengraph-image.tsx` y
// `twitter-image.tsx` en la compilación y Next las inyecta en los metadatos;
// por eso `openGraph.images` y `twitter.images` se omiten a propósito (los
// sobrescribirían). Es PNG de 1200×630: las tarjetas SVG fallan en silencio en
// X, Facebook, LinkedIn, Slack y Discord.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CountPips — Tu operativa, medida.",
    template: "%s — CountPips",
  },
  description:
    "El diario de trading profesional, nativo de Windows. Explora la demo con métricas institucionales, disciplina y tus datos en tu equipo.",
  authors: [{ name: "CountPips" }],
  creator: "CountPips",
  alternates: {
    canonical: `${SITE_URL}/`,
  },
  openGraph: {
    title: "CountPips — Tu operativa, medida.",
    description:
      "El diario de trading profesional, nativo de Windows. Demo interactiva, métricas institucionales, disciplina y tus datos en tu equipo.",
    url: SITE_URL,
    siteName: "CountPips",
    type: "website",
    locale: "es_ES",
    alternateLocale: ["en_GB"],
    // `images` se omite: Next inyecta la de src/app/opengraph-image.tsx.
  },
  twitter: {
    card: "summary_large_image",
    title: "CountPips — Tu operativa, medida.",
    description:
      "Diario de trading profesional, nativo de Windows. Métricas institucionales, disciplina y tus datos en tu equipo.",
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
      // "es" es el valor de partida; en las páginas bajo `/en` lo corrige,
      // antes del primer pintado, el script de `lang` de más abajo.
      lang="es"
      suppressHydrationWarning
      data-theme="light"
      data-palette="clasico"
    >
      <head>
        <script
          // Aplica el tema antes de pintar, para evitar el parpadeo.
          // suppressHydrationWarning: el servidor no puede reproducir este
          // script tal cual lo ve React, y daría un aviso de desajuste.
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            // La paleta es única ("clasico") y no se lee de localStorage, para
            // que un valor antiguo guardado no deje el primer pintado sin
            // tokens. Solo se recuerda papel o tinta: lo elegido, y si nunca
            // eligió, el sistema (orden de `src/lib/theme.tsx`). Se resuelve
            // aquí para no dar un fogonazo blanco a quien tiene el sistema oscuro.
            __html: `(function(){document.documentElement.dataset.js='1';try{var t=localStorage.getItem('tj-theme');if(t!=='dark'&&t!=='light'){t=(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';}document.documentElement.dataset.theme=t;document.documentElement.dataset.palette='clasico';document.documentElement.classList.toggle('dark',t==='dark');}catch(e){document.documentElement.dataset.theme='light';document.documentElement.dataset.palette='clasico';}})();`,
          }}
        />
        <script
          // Corrige `lang` antes de pintar en las páginas bajo `/en`.
          // `location.pathname` lleva el prefijo de GitHub Pages
          // (`/CountPipsWeb/en/...`) y `usePathname()` no, así que hay que
          // descontar `BASE_PATH` a mano; en Cloudflare sale vacío.
          // suppressHydrationWarning: mismo motivo que el script de arriba.
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=location.pathname;var b='${BASE_PATH}';if(b&&p.indexOf(b)===0)p=p.slice(b.length)||'/';document.documentElement.lang=(p==='/en'||p.indexOf('/en/')===0)?'en':'es';}catch(e){}})();`,
          }}
        />
        {/* Red de seguridad sin JavaScript: un `opacity:0` en línea solo lo sube
            un script al hidratar y dejaría secciones invisibles. Hoy ninguna
            página lo emite (las entradas son CSS, `.tj-emerge` y compañía en
            globals.css). Solo cubre el cero exacto: el `:not(...)` respeta los
            velos con decimales. `scripts/humo.mjs` lo comprueba sin JS. */}
        <noscript
          dangerouslySetInnerHTML={{
            __html: `<style>[style*="opacity:0"]:not([style*="opacity:0."]),[style*="opacity: 0"]:not([style*="opacity: 0."]){opacity:1!important;transform:none!important;visibility:visible!important}</style>`,
          }}
        />
      </head>
      <body
        className={`${geistMono.variable} ${instrumentSans.variable} ${newsreader.variable} ${newsreaderItalic.variable} antialiased`}
      >
        {/* Los datos estructurados del sitio no van aquí (viajarían en todas las
            páginas, en un solo idioma): `esquemasGlobales()` (src/lib/site.ts)
            y las dos portadas los emiten. */}
        <Providers>
          <div className="min-h-screen flex flex-col">
            <SectionReveal />
            <Aparecer />
            <SubrayadoPestanas />
            <SkipLink />
            {/* Justo después del SkipLink para entrar pronto en el orden de tabulación. */}
            <CookieConsent />
            <GlobalShortcuts />
            {/* Glosario y ayuda de atajos se cargan bajo demanda (ver OverlayHost.tsx). */}
            <OverlayHost />
            <ScrollToTop />
            {/* Ver TransicionPagina.tsx, sobre todo lo que no intercepta. */}
            <TransicionPagina />
            <Navbar />
            {/* `view-transition-name` solo en el contenido, y solo mientras dura la
                transición (lo pone `TransicionPagina`); coreografía en
                `::view-transition-*` de globals.css. */}
            {/* `tabIndex={-1}` hace fiable «Saltar al contenido» en WebKit, que
                no mueve el punto de partida del tabulador a un destino no
                enfocable. No entra en el orden de tabulación; su anillo de
                foco se apaga en globals.css. */}
            <main id="main-content" tabIndex={-1} className="flex-1">
              {children}
            </main>
            <Footer />
            <BackToTop />
          </div>
        </Providers>
      </body>
    </html>
  );
}
