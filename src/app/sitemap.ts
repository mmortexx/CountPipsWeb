import type { MetadataRoute } from "next";
import { SITE_URL, hreflangDe } from "@/lib/site";
import { TERMINOS } from "@/lib/glosario";
import { HERRAMIENTAS } from "@/lib/herramientas";
import { ULTIMA_ACTUALIZACION } from "@/lib/fechas";
import { LOCALIZED_PATHS } from "@/lib/rutas-en";

export const dynamic = "force-static";


// `priority` y `changeFrequency` son orientativos para los rastreadores.
type PageMeta = {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
};

const PAGES: PageMeta[] = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/features", priority: 0.9, changeFrequency: "weekly" },
  { path: "/features/metricas", priority: 0.85, changeFrequency: "weekly" },
  { path: "/features/disciplina", priority: 0.85, changeFrequency: "weekly" },
  { path: "/features/seguridad", priority: 0.85, changeFrequency: "weekly" },
  { path: "/pricing", priority: 0.9, changeFrequency: "monthly" },
  // La prioridad es relativa: la portada es la única en 1.0 y la demo, la
  // conversión principal, va justo debajo.
  { path: "/demo", priority: 0.9, changeFrequency: "monthly" },
  // El diagnóstico se comparte mucho: prioridad alta aunque no venda.
  { path: "/test", priority: 0.8, changeFrequency: "monthly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.7, changeFrequency: "monthly" },
  { path: "/beta", priority: 0.5, changeFrequency: "monthly" },
  { path: "/traders/manual", priority: 0.85, changeFrequency: "monthly" },
  { path: "/traders/prop-firms", priority: 0.85, changeFrequency: "monthly" },
  // Legales: prioridad baja, pero van en el mapa (las pasarelas de pago las exigen accesibles).
  { path: "/privacidad", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terminos", priority: 0.3, changeFrequency: "yearly" },
  { path: "/cookies", priority: 0.3, changeFrequency: "yearly" },
  { path: "/aviso-legal", priority: 0.3, changeFrequency: "yearly" },

  // Glosario y herramientas se derivan de sus datos, no se listan a mano.
  { path: "/glosario", priority: 0.7, changeFrequency: "monthly" },
  ...TERMINOS.map((t) => ({
    path: `/glosario/${t.slug}`,
    priority: 0.5,
    changeFrequency: "yearly" as const,
  })),
  { path: "/herramientas", priority: 0.8, changeFrequency: "monthly" },
  ...HERRAMIENTAS.map((h) => ({
    path: `/herramientas/${h.slug}`,
    // Más alta que el glosario: una calculadora se enlaza y se comparte.
    priority: 0.7,
    changeFrequency: "monthly" as const,
  })),
];

// La fecha sale del último commit (`src/lib/fechas.ts`): estable entre compilaciones sin cambios.

export default function sitemap(): MetadataRoute.Sitemap {
  const paginasEs = PAGES.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path === "/" ? "/" : `${path}/`}`,
    lastModified: ULTIMA_ACTUALIZACION,
    changeFrequency,
    priority,
    // hreflang recíproco solo en las rutas de `LOCALIZED_PATHS`.
    ...(LOCALIZED_PATHS.includes(path) ? { alternates: { languages: hreflangDe(path) } } : {}),
  }));

  // Rutas `/en/...`: las mismas páginas base con las mismas prioridades.
  // `LOCALIZED_PATHS` deriva de `TERMINOS`/`HERRAMIENTAS`, así que glosario y
  // herramientas entran solo con que exista su página bajo `app/en`.
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
