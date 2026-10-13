import type { MetadataRoute } from "next";
import { SITE_URL, hreflangDe } from "@/lib/site";
import { TERMINOS } from "@/lib/glosario";
import { HERRAMIENTAS } from "@/lib/herramientas";
import { ULTIMA_ACTUALIZACION } from "@/lib/fechas";

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

import { TABLA_IDIOMAS, tieneVersion } from "@/lib/locale";

export default function sitemap(): MetadataRoute.Sitemap {
  const paginasEs = PAGES.map(({ path, priority, changeFrequency }) => {
    const tieneAlt = TABLA_IDIOMAS.some((i) => i.codigo !== "es" && tieneVersion(path, i.codigo));
    return {
      url: `${SITE_URL}${path === "/" ? "/" : `${path}/`}`,
      lastModified: ULTIMA_ACTUALIZACION,
      changeFrequency,
      priority,
      ...(tieneAlt ? { alternates: { languages: hreflangDe(path) } } : {}),
    };
  });

  // Rutas de otros idiomas (`/en/...`, `/pt/...`, etc.): se generan a partir
  // de la tabla canónica de idiomas declarando cada idioma solo en las rutas que lo tienen.
  const paginasOtras = TABLA_IDIOMAS.filter((i) => i.codigo !== "es").flatMap((idioma) =>
    PAGES.filter((p) => tieneVersion(p.path, idioma.codigo)).map(
      ({ path, priority, changeFrequency }) => ({
        url:
          path === "/"
            ? `${SITE_URL}${idioma.prefijo}/`
            : `${SITE_URL}${idioma.prefijo}${path}/`,
        lastModified: ULTIMA_ACTUALIZACION,
        changeFrequency,
        priority,
        alternates: { languages: hreflangDe(path) },
      }),
    ),
  );

  return [...paginasEs, ...paginasOtras];
}
