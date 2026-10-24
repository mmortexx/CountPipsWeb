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

import { TABLA_IDIOMAS, tieneVersion, type Lang } from "@/lib/locale";

/**
 * Etiquetas `hreflang` recíprocas de una ruta que existe en los idiomas correspondientes.
 * Declara cada idioma solo en las rutas que lo tienen.
 * `path` es la ruta española, sin el prefijo `/en` (la de `LOCALIZED_PATHS`).
 * `x-default` es para quien no habla ninguno de los idiomas declarados: el
 * inglés le sirve más que el español, aunque el mercado principal sea España.
 */
export function hreflangDe(path: string): Record<string, string> {
  const limpia = path.length > 1 ? path.replace(/\/+$/, "") || "/" : path;
  const es = siteUrl(limpia === "/" ? "/" : `${limpia}/`);
  const en = siteUrl(limpia === "/" ? "/en/" : `/en${limpia}/`);
  const resultado: Record<string, string> = { es, en, "x-default": en };

  for (const idioma of TABLA_IDIOMAS) {
    if (idioma.codigo === "es" || idioma.codigo === "en") continue;
    if (tieneVersion(limpia, idioma.codigo)) {
      resultado[idioma.codigo] = siteUrl(
        limpia === "/" ? `${idioma.prefijo}/` : `${idioma.prefijo}${limpia}/`,
      );
    }
  }

  return resultado;
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
  lang: Lang,
  { soporte }: { soporte: string | null },
): Record<string, unknown>[] {
  const inicio = siteUrl(lang === "es" ? "/" : `/${lang}/`);

  const descripcionesApp: Record<Lang, string> = {
    es: "El diario de trading profesional, nativo de Windows. Explora una demo interactiva con métricas institucionales, disciplina y tus datos en tu equipo.",
    en: "The professional trading journal, native to Windows. Explore an interactive demo with institutional metrics, discipline and your data on your machine.",
    pt: "O diário de trading profissional, nativo para Windows. Explore uma demonstração interativa com métricas institucionais, disciplina e dados no seu computador.",
    fr: "Le journal de trading professionnel, natif Windows. Explorez une démo interactive avec métriques institutionnelles, discipline et données sur votre machine.",
    de: "Das professionelle Trading-Journal, nativ für Windows. Entdecken Sie eine interaktive Demo mit institutionellen Kennzahlen, Disziplin und lokalen Daten.",
    it: "Il diario di trading professionale, nativo per Windows. Esplora una demo interattiva con metriche istituzionali, disciplina e dati sul tuo computer.",
  };

  const funcionesPorIdioma: Record<Lang, string[]> = {
    es: [
      "Métricas institucionales (Sharpe, Profit Factor, Expectancy, R-multiple)",
      "Curva de capital y drawdown",
      "Guardián de disciplina: semáforo de riesgo y freno opcional",
      "Datos en tu equipo, sin cuenta y sin telemetría",
      "Playbooks y plantillas de trading",
      "Calendario de P&L y heatmap por día/hora",
      "Diario narrativo con anotaciones por operación",
      "Multi-cuenta y multi-activo (acciones, futuros, forex, cripto)",
      "Exportación a CSV, JSON, PDF y Markdown, y copias locales",
    ],
    en: [
      "Institutional metrics (Sharpe, Profit Factor, Expectancy, R-multiple)",
      "Equity curve and drawdown",
      "Discipline guardian: risk light and optional hard brake",
      "Data on your machine, no account and no telemetry",
      "Playbooks and trading templates",
      "P&L calendar and day/hour heatmap",
      "Narrative journal with per-trade annotations",
      "Multi-account and multi-asset (stocks, futures, forex, crypto)",
      "CSV, JSON, PDF and Markdown export, and local backups",
    ],
    pt: [
      "Métricas institucionais (Sharpe, Profit Factor, Expectancy, R-multiple)",
      "Curva de patrimônio e drawdown",
      "Guardião de disciplina: sinal de risco e freio opcional",
      "Dados no seu computador, sem conta e sem telemetria",
      "Playbooks e modelos de trading",
      "Calendário de P&L e mapa de calor por dia/hora",
      "Diário narrativo com anotações por operação",
      "Multicontas e multiativos (ações, futuros, forex, cripto)",
      "Exportação para CSV, JSON, PDF e Markdown, e backups locais",
    ],
    fr: [
      "Métriques institutionnelles (Sharpe, Profit Factor, Expectancy, R-multiple)",
      "Courbe de capital et drawdown",
      "Gardien de discipline : voyant de risque et frein optionnel",
      "Données sur votre machine, sans compte et sans télémétrie",
      "Playbooks et modèles de trading",
      "Calendrier de P&L et heatmap par jour/heure",
      "Journal narratif avec annotations par trade",
      "Multi-comptes et multi-actifs (actions, futures, forex, crypto)",
      "Exportation CSV, JSON, PDF et Markdown, et sauvegardes locales",
    ],
    de: [
      "Institutionelle Kennzahlen (Sharpe, Profit Factor, Expectancy, R-Multiple)",
      "Kapitalkurve und Drawdown",
      "Disziplin-Wächter: Risiko-Ampel und optionale harte Bremse",
      "Daten auf Ihrem Rechner, kein Konto und keine Telemetrie",
      "Playbooks und Trading-Vorlagen",
      "P&L-Kalender und Heatmap nach Wochentag/Uhrzeit",
      "Narratives Journal mit Trade-Notizen",
      "Multi-Konto und Multi-Asset (Aktien, Futures, Forex, Krypto)",
      "Export als CSV, JSON, PDF und Markdown, lokale Backups",
    ],
    it: [
      "Metriche istituzionali (Sharpe, Profit Factor, Expectancy, R-multiplo)",
      "Curva del capitale e drawdown",
      "Guardiano della disciplina: semaforo di rischio e freno opzionale",
      "Dati sul tuo computer, senza account e senza telemetria",
      "Playbook e modelli di trading",
      "Calendario P&L e heatmap per giorno/ora",
      "Diario narrativo con annotazioni per operazione",
      "Multi-conto e multi-asset (azioni, future, forex, crypto)",
      "Esportazione in CSV, JSON, PDF e Markdown, e backup locali",
    ],
  };

  const descripcionesOrg: Record<Lang, string> = {
    es: "El diario de trading profesional, nativo de Windows. Explora el producto antes de instalarlo: métricas institucionales, disciplina y datos locales.",
    en: "The professional trading journal, native to Windows. Explore the product before installing it: institutional metrics, discipline and local data.",
    pt: "O diário de trading profissional, nativo para Windows. Conheça o produto antes de instalar: métricas institucionais, disciplina e dados locais.",
    fr: "Le journal de trading professionnel, natif Windows. Découvrez le produit avant de l’installer : métriques institutionnelles, discipline et données locales.",
    de: "Das professionelle Trading-Journal, nativ für Windows. Testen Sie das Produkt vor der Installation: institutionelle Kennzahlen, Disziplin und lokale Daten.",
    it: "Il diario di trading professionale, nativo per Windows. Esplora il prodotto prima di installarlo: metriche istituzionali, disciplina e dati locali.",
  };

  const alternateNames: Record<Lang, string> = {
    es: `${SITE_NAME} — Diario de trading`,
    en: `${SITE_NAME} — Trading journal`,
    pt: `${SITE_NAME} — Diário de trading`,
    fr: `${SITE_NAME} — Journal de trading`,
    de: `${SITE_NAME} — Trading-Journal`,
    it: `${SITE_NAME} — Diario di trading`,
  };

  return [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Windows",
      url: inicio,
      description: descripcionesApp[lang] ?? descripcionesApp.en,
      inLanguage: [lang],
      screenshot: [
        `${SITE_URL}/img/app-resumen.webp`,
        `${SITE_URL}/img/app-operaciones.webp`,
        `${SITE_URL}/img/app-analitica.webp`,
      ],
      featureList: funcionesPorIdioma[lang] ?? funcionesPorIdioma.en,
      publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: LOGO_URL, width: 512, height: 512 },
      description: descripcionesOrg[lang] ?? descripcionesOrg.en,
      sameAs: ["https://github.com/mmortexx/CountPipsWeb"],
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
      alternateName: alternateNames[lang] ?? alternateNames.en,
      url: inicio,
      inLanguage: lang,
      publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: siteUrl(
            lang === "es" ? "/faq/?q={search_term_string}" : `/en/faq/?q={search_term_string}`,
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
  lang: Lang,
  escalones: { nombre: string; ruta: string }[],
): Record<string, unknown> {
  const raiz = lang === "es" ? "/" : `/${lang}/`;
  const conIdioma = (ruta: string) =>
    siteUrl(lang === "es" ? ruta : `/${lang}${ruta}`);

  const nombresInicio: Record<Lang, string> = {
    es: "Inicio",
    en: "Home",
    pt: "Início",
    fr: "Accueil",
    de: "Startseite",
    it: "Home",
  };

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: nombresInicio[lang] ?? "Home",
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
  lang: Lang,
  perfil: "manual" | "prop",
): Record<string, unknown>[] {
  const l = lang === "es" ? "es" : "en";
  const ruta = `/traders/${perfil === "prop" ? "prop-firms" : "manual"}/`;
  const nombre = {
    es: { manual: "Operativa manual", prop: "Prop firms" },
    en: { manual: "Manual trading", prop: "Prop firms" },
  }[l][perfil];
  const descripcion = {
    es: {
      manual: "Métricas, playbooks y revisión de operaciones para traders manuales.",
      prop: "Reglas de la firma, aviso de riesgo e informe de evaluación para prop firms.",
    },
    en: {
      manual: "Metrics, playbooks and trade review for manual traders.",
      prop: "Firm rules, risk warnings and an evaluation report for prop-firm traders.",
    },
  }[l][perfil];

  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `${nombre} — ${SITE_NAME}`,
      description: descripcion,
      url: siteUrl(l === "es" ? ruta : `/en${ruta}`),
    },
    migasSchema(l, [{ nombre, ruta }]),
  ];
}
