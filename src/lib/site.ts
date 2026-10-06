/**
 * Identidad pública del sitio: una sola declaración de `SITE_URL`, para que
 * canónico, sitemap, robots y tarjeta social no se contradigan.
 *
 * Es fija y no depende de dónde se publique: la copia en GitHub Pages declara
 * como canónica la dirección buena en vez de competir con ella. Lo que sí
 * cambia según el destino es el prefijo de rutas (ver `asset()` y
 * `next.config.ts`).
 */
/* El valor por defecto es donde está publicado hoy. El dominio propio se
   activa con NEXT_PUBLIC_SITE_URL=https://countpips.com en Cloudflare Pages,
   y solo cuando exista y resuelva: un canónico que apunta al vacío es peor
   que no tenerlo.
   `||` y no `??`: `next.config.ts` declara la variable como cadena vacía
   cuando nadie la define, y con `??` el canónico saldría sin dominio. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://mmortexx.github.io/CountPipsWeb";

/** Nombre de la marca, tal cual debe aparecer en metadatos y esquemas. */
export const SITE_NAME = "CountPips";

/**
 * Logotipo de la marca para el dato estructurado `Organization`. Se regenera
 * con `python scripts/generate-brand.py` (también apple-icon y favicon.ico);
 * hay que relanzarlo si cambia el glifo de `BrandGlyph.tsx`.
 * Absoluta: una ruta relativa se resuelve de nuevo contra `metadataBase` y
 * duplica el prefijo de GitHub Pages.
 */
export const LOGO_URL = `${SITE_URL}/logo.png`;

/** URL absoluta de una ruta del sitio. Normaliza las barras. */
export function siteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Etiquetas `hreflang` recíprocas de una ruta que existe en los dos idiomas.
 * `path` es la ruta española, sin el prefijo `/en` (la de `LOCALIZED_PATHS`).
 * `x-default` apunta siempre a la española, el mercado principal.
 */
export function hreflangDe(path: string): {
  es: string;
  en: string;
  "x-default": string;
} {
  const es = siteUrl(path === "/" ? "/" : `${path}/`);
  const en = siteUrl(path === "/" ? "/en/" : `/en${path}/`);
  return { es, en, "x-default": es };
}

/**
 * Los tres datos estructurados que describen el sitio (aplicación,
 * organización y web). Solo los emiten las dos portadas, cada una en su
 * idioma: en el layout viajarían en todas las páginas y con el idioma
 * equivocado en las inglesas.
 *
 * `soporte` se pasa desde fuera para no depender del módulo de formularios,
 * que arrastra el cliente del formulario de espera.
 */
export function esquemasGlobales(
  lang: "es" | "en",
  { soporte }: { soporte: string | null },
): Record<string, unknown>[] {
  const es = lang === "es";
  const inicio = siteUrl(es ? "/" : "/en/");

  const descripcionApp = es
    ? "El diario de trading profesional, nativo de Windows. Explora una demo interactiva con métricas institucionales, disciplina y tus datos en tu equipo."
    : "The professional trading journal, native to Windows. Explore an interactive demo with institutional metrics, discipline and your data on your machine.";

  const funciones = es
    ? [
        "Métricas institucionales (Sharpe, Profit Factor, Expectancy, R-multiple)",
        "Curva de capital y drawdown",
        "Guardián de disciplina: semáforo de riesgo y freno opcional",
        "Datos en tu equipo, sin cuenta y sin telemetría",
        "Playbooks y plantillas de trading",
        "Calendario de P&L y heatmap por día/hora",
        "Diario narrativo con anotaciones por operación",
        "Multi-cuenta y multi-activo (acciones, futuros, forex, crypto)",
        "Exportación a CSV/JSON y backups locales",
      ]
    : [
        "Institutional metrics (Sharpe, Profit Factor, Expectancy, R-multiple)",
        "Equity curve and drawdown",
        "Discipline guardian: risk light and optional hard brake",
        "Data on your machine, no account and no telemetry",
        "Playbooks and trading templates",
        "P&L calendar and day/hour heatmap",
        "Narrative journal with per-trade annotations",
        "Multi-account and multi-asset (stocks, futures, forex, crypto)",
        "CSV/JSON export and local backups",
      ];

  return [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Windows",
      url: inicio,
      description: descripcionApp,
      inLanguage: ["es", "en"],
      /* Los ficheros de `public/img/` ya van recortados en disco
         (`scripts/capturas.py`): lo declarado aquí es lo que se ve. */
      screenshot: [
        `${SITE_URL}/img/app-resumen.webp`,
        `${SITE_URL}/img/app-operaciones.webp`,
        `${SITE_URL}/img/app-analitica.webp`,
      ],
      featureList: funciones,
      // Sin `aggregateRating` a propósito: Google exige valoraciones de
      // usuarios reales y aún no hay reseñas verificables.
      publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      // `ImageObject` y no la URL suelta: Google valida las dimensiones sin descargar.
      logo: { "@type": "ImageObject", url: LOGO_URL, width: 512, height: 512 },
      description: es
        ? "El diario de trading profesional, nativo de Windows. Explora el producto antes de instalarlo: métricas institucionales, disciplina y datos locales."
        : "The professional trading journal, native to Windows. Explore the product before installing it: institutional metrics, discipline and local data.",
      foundingDate: "2024",
      // Solo el repositorio: es el único perfil que existe.
      sameAs: ["https://github.com/mmortexx/CountPipsWeb"],
      // La dirección sale de la misma constante que usan el formulario y las pantallas.
      ...(soporte && {
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: soporte,
          availableLanguage: ["Spanish", "English"],
        },
      }),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      alternateName: es
        ? `${SITE_NAME} — Diario de trading`
        : `${SITE_NAME} — Trading journal`,
      url: inicio,
      inLanguage: lang,
      publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      // El buscador existe: la FAQ lee `q` de la dirección y filtra en vivo.
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: siteUrl(
            es ? "/faq/?q={search_term_string}" : "/en/faq/?q={search_term_string}",
          ),
        },
        "query-input": "required name=search_term_string",
      },
    },
  ];
}

/**
 * El `BreadcrumbList` de una página. `escalones` va sin la raíz, que se añade
 * sola según el idioma; las rutas llevan su barra final y no llevan `/en`.
 */
export function migasSchema(
  lang: "es" | "en",
  escalones: { nombre: string; ruta: string }[],
): Record<string, unknown> {
  const raiz = lang === "es" ? "/" : "/en/";
  const conIdioma = (ruta: string) =>
    siteUrl(lang === "es" ? ruta : `/en${ruta}`);

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: lang === "es" ? "Inicio" : "Home",
        item: siteUrl(raiz),
      },
      ...escalones.map((e, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: e.nombre,
        item: conIdioma(e.ruta),
      })),
    ],
  };
}

/**
 * Datos estructurados de las páginas de perfil de trader. Vive aquí y no junto
 * al componente porque `TraderProfilePage` es de cliente y esto debe
 * renderizarse en el servidor para que el rastreador lo vea en el HTML.
 */
export function esquemasTrader(
  lang: "es" | "en",
  // El mismo identificador que `TraderProfileBody`: el segmento de la URL se deriva de él.
  perfil: "manual" | "prop",
): Record<string, unknown>[] {
  const ruta = `/traders/${perfil === "prop" ? "prop-firms" : "manual"}/`;
  const nombre = {
    es: { manual: "Operativa manual", prop: "Prop firms" },
    en: { manual: "Manual trading", prop: "Prop firms" },
  }[lang][perfil];
  const descripcion = {
    es: {
      manual: "Métricas, playbooks y revisión de operaciones para traders manuales.",
      prop: "Reglas de la firma, aviso de riesgo e informe de evaluación para prop firms.",
    },
    en: {
      manual: "Metrics, playbooks and trade review for manual traders.",
      prop: "Firm rules, risk warnings and an evaluation report for prop-firm traders.",
    },
  }[lang][perfil];

  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `${nombre} — ${SITE_NAME}`,
      description: descripcion,
      url: siteUrl(lang === "es" ? ruta : `/en${ruta}`),
    },
    migasSchema(lang, [{ nombre, ruta }]),
  ];
}
