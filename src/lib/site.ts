/**
 * La identidad pública del sitio: una sola declaración para todo.
 *
 * ── Por qué existe ────────────────────────────────────────────────────
 * `SITE_URL` estaba escrito a mano en diez archivos (el layout, las nueve
 * páginas, el sitemap y el robots). Diez copias de una cadena que tiene
 * que ser idéntica en todas o el buscador recibe señales contradictorias:
 * el canónico diciendo una dirección, el mapa del sitio otra y la tarjeta
 * social una tercera. Al mudarnos de dominio eso deja de ser hipotético —
 * basta olvidar UN archivo para publicar media web apuntando al sitio
 * viejo, y no hay error de compilación que lo delate.
 *
 * ── Por qué el canónico NO depende de dónde se publique ───────────────
 * Durante la mudanza el mismo contenido vive en dos sitios: el dominio
 * nuevo y el GitHub Pages antiguo, que se deja encendido a propósito
 * hasta comprobar que todo funciona. Para un buscador, dos direcciones
 * con el mismo contenido son contenido duplicado, y reparte entre ambas
 * lo que debería ir a una.
 *
 * Por eso `SITE_URL` es FIJO y apunta siempre al dominio definitivo, se
 * publique donde se publique. Así la copia de GitHub Pages declara como
 * canónica la dirección buena: sigue accesible para quien tenga el
 * enlace, y a la vez le dice al buscador cuál es la que cuenta. Lo que sí
 * cambia según el destino es el PREFIJO de rutas — ver `asset()` y
 * `next.config.ts`—, porque eso es dónde están los ficheros, no cómo se
 * llama el sitio.
 */
/* ── El valor por defecto es DONDE ESTÁ PUBLICADO HOY, no dónde queremos
      estar mañana ────────────────────────────────────────────────────
   Esto apuntó un rato a `countpips.com` con el dominio todavía sin
   comprar, y era un error con consecuencias: la copia de GitHub Pages
   —que sigue online— declaraba como canónica una dirección que no
   resuelve. Un buscador que sigue ese canónico no encuentra nada, y la
   respuesta razonable por su parte es dejar de indexar unas páginas que
   dicen "la buena es esta otra" señalando al vacío. Sin canónico habría
   estado mejor que con uno roto.

   Así que el valor por defecto es la dirección real y viva. El dominio
   propio se activa por entorno, y sólo cuando exista de verdad:

     NEXT_PUBLIC_SITE_URL=https://countpips.com

   Se define en Cloudflare Pages (Settings → Environment variables) el día
   que el dominio esté comprado y apuntando. Hasta entonces todo sigue
   coherente solo, sin fecha límite ni nada que recordar.

   `||` y no `??`, y la diferencia importa: `next.config.ts` declara esta
   variable como cadena VACÍA cuando nadie la define, y `??` solo cae al
   valor por defecto con `null`/`undefined`. Con `??`, el caso normal
   —nadie ha configurado nada— habría dejado `SITE_URL` en blanco y
   publicado canónicos como `href="/pricing/"`, sin dominio delante. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://mmortexx.github.io/CountPipsWeb";

/** Nombre de la marca, tal cual debe aparecer en metadatos y esquemas. */
export const SITE_NAME = "CountPips";

/**
 * El logotipo de la marca —el cuaderno con las tres velas, el mismo icono
 * que la aplicación de escritorio— rasterizado desde la misma geometría
 * del glifo vectorial. Va en el dato estructurado de `Organization`, que
 * es de donde Google saca el logotipo del sitio.
 *
 * Se regenera con `python scripts/generate-brand.py`, que produce además
 * el apple-icon y el favicon.ico; si se toca el glifo de `BrandGlyph.tsx`
 * hay que volver a lanzarlo o la marca se parte entre la web y lo que ven
 * el buscador y el sistema operativo.
 *
 * Absoluta, y no una ruta con barra inicial: una ruta relativa se vuelve
 * a resolver contra `metadataBase` y el prefijo de GitHub Pages sale
 * duplicado.
 */
export const LOGO_URL = `${SITE_URL}/logo.png`;

/** URL absoluta de una ruta del sitio. Normaliza las barras. */
export function siteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Las etiquetas `hreflang` recíprocas de una ruta que existe en los dos
 * idiomas.
 *
 * ── Por qué existe ────────────────────────────────────────────────────
 * Cada una de las veinte páginas —diez en español, diez en inglés— tiene
 * que declarar TRES direcciones: la suya, la de su pareja en el otro
 * idioma, y cuál de las dos es la que Google debe ofrecer por defecto a
 * quien no encaja en ninguna de las dos. Son las mismas tres direcciones
 * mirando desde dos sitios distintos, y escribir ese objeto a mano veinte
 * veces es exactamente la clase de repetición donde un día una de las
 * copias se queda desincronizada sin que nada avise.
 *
 * `path` va sin el prefijo `/en` — es la ruta española, la que existe en
 * `LOCALIZED_PATHS` — y esta función construye las dos direcciones a
 * partir de ella. `x-default` apunta siempre a la española: es el
 * mercado principal, y es la versión que corresponde a quien llega sin
 * que el idioma se pueda determinar.
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
 * Los tres datos estructurados que describen el SITIO —no una página—:
 * la aplicación, quién la publica y el sitio web en sí.
 *
 * ── Por qué ya no viven en el layout ──────────────────────────────────
 * Estaban escritos en `layout.tsx`, que es único y raíz, así que los tres
 * viajaban en las 155 páginas del sitio. Dos consecuencias:
 *
 *  · **Decían el idioma equivocado.** El texto era español fijo, y 76 de
 *    esas 155 páginas están en inglés. Un buscador leía «Diario narrativo
 *    con anotaciones por operación» bajo una página cuyo `lang` es `en`,
 *    que es exactamente la señal contradictoria que el `hreflang` de este
 *    mismo módulo existe para evitar.
 *  · **Pesaban 155 veces.** Son ~2 KB de JSON por página; describir el
 *    sitio entero una vez por página es repetir la misma declaración en
 *    cada hoja del libro.
 *
 * Ahora los emiten sólo las dos portadas, cada una en su idioma, que es
 * donde Google espera encontrar `WebSite` y `Organization`.
 *
 * `soporte` se pasa desde fuera en vez de importarse: este módulo
 * describe la identidad del sitio y no debe depender del módulo de
 * formularios, que arrastra consigo el cliente del formulario de espera.
 */
export function esquemasGlobales(
  lang: "es" | "en",
  { soporte }: { soporte: string },
): Record<string, unknown>[] {
  const es = lang === "es";
  const inicio = siteUrl(es ? "/" : "/en/");

  const descripcionApp = es
    ? "El diario de trading profesional, nativo de Windows. Explora una demo interactiva con métricas institucionales, disciplina y datos 100 % locales."
    : "The professional trading journal, native to Windows. Explore an interactive demo with institutional metrics, discipline and 100 % local data.";

  const funciones = es
    ? [
        "Métricas institucionales (Sharpe, Profit Factor, Expectancy, R-multiple)",
        "Curva de equity y drawdown en tiempo real",
        "Guardián de disciplina: frenos antes de operar fuera de reglas",
        "Datos 100 % locales, sin nube, sin suscripciones",
        "Playbooks y plantillas de trading",
        "Calendario de P&L y heatmap por día/hora",
        "Diario narrativo con anotaciones por operación",
        "Multi-cuenta y multi-activo (acciones, futuros, forex, crypto)",
        "Exportación a CSV/JSON y backups locales",
      ]
    : [
        "Institutional metrics (Sharpe, Profit Factor, Expectancy, R-multiple)",
        "Real-time equity curve and drawdown",
        "Discipline guardian: brakes before trading outside your rules",
        "100 % local data, no cloud, no subscriptions",
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
      /* Capturas reales de la aplicación, que Google admite en
         `SoftwareApplication`.

         Durante un tiempo esto fue el único sitio del proyecto que las
         enseñaba, y las enseñaba MAL: la página tapaba por CSS la barra
         de título —con el nombre anterior al renombrado— y la de estado
         —con el sello «Compilación de desarrollo»—, pero aquí viajaban
         los ficheros enteros, sin recortar, desde las 155 páginas. Un
         recorte que sólo existe en la hoja de estilos no protege nada de
         lo que se sirve.

         Ya no hay recorte que se pueda olvidar: los ficheros de
         `public/img/` están recortados en disco (`scripts/capturas.py`),
         así que lo que se declara aquí y lo que se ve en la página son la
         misma imagen. */
      screenshot: [
        `${SITE_URL}/img/app-resumen.webp`,
        `${SITE_URL}/img/app-curva.webp`,
        `${SITE_URL}/img/app-operaciones.webp`,
      ],
      featureList: funciones,
      // Sin `aggregateRating` a propósito: no hay reseñas reales todavía.
      // Aquí se emitía 4,8/47 inventado. Las directrices de datos
      // estructurados de Google exigen que la valoración proceda de
      // usuarios reales, así que publicarla era arriesgar una acción
      // manual además de engañar a quien la viera en el buscador. Se
      // vuelve a poner cuando haya reseñas verificables (G2/Capterra/
      // Trustpilot), tomando el valor de esa plataforma.
      publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      /* `ImageObject` en vez de la dirección suelta: Google prefiere el
         objeto porque así puede validar las dimensiones sin descargar la
         imagen. */
      logo: { "@type": "ImageObject", url: LOGO_URL, width: 512, height: 512 },
      description: es
        ? "El diario de trading profesional, nativo de Windows. Explora el producto antes de instalarlo: métricas institucionales, disciplina y datos locales."
        : "The professional trading journal, native to Windows. Explore the product before installing it: institutional metrics, discipline and local data.",
      foundingDate: "2024",
      /* Sólo el repositorio, que es el único perfil que existe de verdad.
         Los iconos de X, YouTube y Discord se retiraron del pie por
         apuntar a ninguna parte; añadirlos aquí sería el mismo error en
         otro sitio. */
      sameAs: ["https://github.com/mmortexx/CountPipsWeb"],
      /* Faltaba, y es lo que permite que un buscador sepa a dónde
         escribir. La dirección sale de la misma constante que usan el
         formulario y las cinco pantallas donde aparece. */
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: soporte,
        availableLanguage: ["Spanish", "English"],
      },
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
      /* El buscador que se declara aquí EXISTE y funciona: la FAQ lee el
         parámetro `q` de la dirección y filtra en vivo — es el mismo
         mecanismo que usa la página de error 404 para rescatar a quien se
         pierde. No se anuncia nada que no esté construido. */
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
 * El `BreadcrumbList` de una página, a partir de sus escalones.
 *
 * ── Por qué existe ────────────────────────────────────────────────────
 * El objeto se escribía a mano en cada página: veinte copias de la misma
 * forma con el mismo `"@context"`, el mismo `"@type"` y la misma cuenta de
 * posiciones. Y donde hay veinte copias escritas a mano hay huecos: `/beta`
 * emitía sólo un `WebPage` sin migas, y las dos páginas de `/traders` no
 * emitían NINGÚN dato estructurado — las cuatro llevan migas visibles en su
 * cabecera, así que le estábamos enseñando al visitante una jerarquía que
 * al buscador le ocultábamos.
 *
 * `escalones` va sin la raíz: se añade sola, con el nombre y la dirección
 * que corresponden al idioma. Las rutas se dan como el sitio las escribe
 * (con su barra final) y sin el prefijo `/en`, que lo pone esta función.
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
 * Los datos estructurados de las dos páginas de perfil de trader.
 *
 * Las cuatro (dos perfiles × dos idiomas) no emitían ninguno: ni `WebPage`
 * ni migas, aunque las cuatro enseñan «Inicio / Operativa manual» en su
 * cabecera. Vive aquí y no junto al componente porque `TraderProfilePage`
 * es de cliente —usa el idioma en vivo— y esto tiene que renderizarse en
 * el servidor para que el rastreador lo encuentre en el HTML.
 */
export function esquemasTrader(
  lang: "es" | "en",
  /* El mismo identificador que usa `TraderProfileBody`, no uno paralelo:
     el segmento de la URL se deriva de él. Dos nombres para el mismo
     perfil es cómo se acaban desincronizando la página y su esquema. */
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
      prop: "Riesgo visible, reglas y track record para traders de prop firms.",
    },
    en: {
      manual: "Metrics, playbooks and trade review for manual traders.",
      prop: "Visible risk, rules and track record for prop-firm traders.",
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
