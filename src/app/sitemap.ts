import type { MetadataRoute } from "next";
import { SITE_URL, hreflangDe } from "@/lib/site";
import { TERMINOS } from "@/lib/glosario";
import { HERRAMIENTAS } from "@/lib/herramientas";
import { ULTIMA_ACTUALIZACION } from "@/lib/fechas";
import { LOCALIZED_PATHS } from "@/lib/locale";

export const dynamic = "force-static";


// Per-page SEO metadata. Priority is a hint to crawlers about relative
// importance within the site (0.0–1.0); changeFrequency is a hint about
// how often the page tends to be updated. Both are advisory — Google
// may ignore them — but they're useful for non-Google crawlers and for
// communicating intent.
type PageMeta = {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
};

const PAGES: PageMeta[] = [
  // The marketing landing — changes whenever a section is added/updated.
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  // Top-of-funnel discovery pages — updated when features/pricing shift.
  { path: "/features", priority: 0.9, changeFrequency: "weekly" },
  // Feature deep-dive sub-routes (Opción A architecture).
  { path: "/features/metricas", priority: 0.85, changeFrequency: "weekly" },
  { path: "/features/disciplina", priority: 0.85, changeFrequency: "weekly" },
  { path: "/features/seguridad", priority: 0.85, changeFrequency: "weekly" },
  { path: "/pricing", priority: 0.9, changeFrequency: "monthly" },
  /* ── /demo baja de 1.0 a 0.9 ──────────────────────────────────────
     La prioridad es RELATIVA dentro del sitio: sirve para decir cuál es
     la página más importante. Con la portada y la demo empatadas a 1.0
     no se decía eso, se decía "estas dos son igual de importantes", que
     es lo mismo que no decir nada — y con `/en/` y `/en/demo/` heredando
     el valor, el mapa declaraba CUATRO máximos de cuatro.

     La demo es la conversión principal del sitio y merece ir por encima
     de precios y de características, pero la portada es la puerta: es la
     que debe salir cuando alguien busca la marca. 0.9 la deja en cabeza
     del pelotón sin discutirle el primer puesto a la raíz. */
  { path: "/demo", priority: 0.9, changeFrequency: "monthly" },
  /* El diagnóstico. Prioridad alta pese a no vender nada directamente:
     es la página que más gente comparte y por la que más se entra, porque
     se sale de ella con una cifra propia. */
  { path: "/test", priority: 0.8, changeFrequency: "monthly" },
  // Lower-velocity editorial / trust pages.
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.7, changeFrequency: "monthly" },
  { path: "/beta", priority: 0.5, changeFrequency: "monthly" },
  { path: "/traders/manual", priority: 0.85, changeFrequency: "monthly" },
  { path: "/traders/prop-firms", priority: 0.85, changeFrequency: "monthly" },
  /* Páginas legales. Prioridad baja porque nadie las busca, pero van en el
     mapa igualmente: que existan y sean localizables es una señal de
     confianza, y las pasarelas de pago las exigen accesibles antes de
     aprobar una cuenta. Cambian una vez al año como mucho. */
  { path: "/privacidad", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terminos", priority: 0.3, changeFrequency: "yearly" },
  { path: "/cookies", priority: 0.3, changeFrequency: "yearly" },
  { path: "/aviso-legal", priority: 0.3, changeFrequency: "yearly" },

  /* ── Secciones generadas ──────────────────────────────────────────
     El glosario y las herramientas se derivan de sus propios datos en
     lugar de escribirse aquí a mano. El motivo es simple: son 51 + 6
     direcciones, y una lista copiada se desincroniza el primer día que
     alguien añada un término. Si mañana el glosario crece, el mapa del
     sitio crece con él sin que nadie se acuerde de tocarlo. */
  { path: "/glosario", priority: 0.7, changeFrequency: "monthly" },
  ...TERMINOS.map((t) => ({
    path: `/glosario/${t.slug}`,
    /* Baja por página, y es lo correcto: ninguna definición suelta
       compite con la portada. El valor está en el conjunto. */
    priority: 0.5,
    changeFrequency: "yearly" as const,
  })),
  { path: "/herramientas", priority: 0.8, changeFrequency: "monthly" },
  ...HERRAMIENTAS.map((h) => ({
    path: `/herramientas/${h.slug}`,
    /* Más alta que las del glosario: una calculadora resuelve algo, y es
       la clase de página que la gente enlaza y comparte. */
    priority: 0.7,
    changeFrequency: "monthly" as const,
  })),
];

/* La fecha sale del último commit, no de una constante escrita a mano.
   Aquí había `2025-01-01` congelada, y la razón para congelarla era buena
   —con la hora del sistema, cada compilación produciría un mapa distinto
   aunque no cambiara nada— pero el efecto era que el sitio afirmaba llevar
   más de año y medio sin tocarse, publicara lo que publicara.
   Ver `src/lib/fechas.ts`. */

export default function sitemap(): MetadataRoute.Sitemap {
  const paginasEs = PAGES.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path === "/" ? "/" : `${path}/`}`,
    lastModified: ULTIMA_ACTUALIZACION,
    changeFrequency,
    priority,
    /* Sólo en las diez rutas que existen en los dos idiomas —las mismas
       de `LOCALIZED_PATHS`—: las etiquetas hreflang recíprocas, para que
       el buscador entienda que la versión en español y la inglesa son
       la MISMA página en dos idiomas y no dos páginas distintas con
       contenido parecido. */
    ...(LOCALIZED_PATHS.includes(path) ? { alternates: { languages: hreflangDe(path) } } : {}),
  }));

  /* Las direcciones `/en/...`: la MISMA lista de páginas base, con su
     propia prioridad —una idea, dos idiomas, la misma importancia
     relativa entre ellas— y las mismas etiquetas recíprocas, vistas
     desde el otro lado. El glosario y las herramientas SÍ aparecen aquí:
     `LOCALIZED_PATHS` deriva sus 51 + 6 rutas de `TERMINOS`/
     `HERRAMIENTAS`, así que este filtro las incluye solo con que exista
     su página en `app/en/glosario/[termino]` / `app/en/herramientas/
     [herramienta]` — no hace falta tocar este fichero para eso. */
  const paginasEn = PAGES.filter((p) => LOCALIZED_PATHS.includes(p.path)).map(
    ({ path, priority, changeFrequency }) => ({
      url: path === "/" ? `${SITE_URL}/en/` : `${SITE_URL}/en${path}/`,
      lastModified: ULTIMA_ACTUALIZACION,
      changeFrequency,
      priority,
      alternates: { languages: hreflangDe(path) },
    }),
  );

  return [...paginasEs, ...paginasEn];
}
