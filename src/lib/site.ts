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
