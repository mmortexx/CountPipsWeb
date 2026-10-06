import type { MetadataRoute } from "next";

export const dynamic = "force-static";

/**
 * Next no prefija con el basePath lo que devuelve esta función (sí los iconos
 * de archivo como `app/favicon.ico`), así que las rutas se construyen a mano
 * con el basePath de next.config.ts. Si no, `start_url: "/"` apuntaría a la
 * raíz de github.io y la app instalada abriría otro sitio.
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CountPips",
    short_name: "CountPips",
    description:
      "El diario de trading profesional, nativo de Windows. Demo interactiva, métricas institucionales, disciplina y tus datos en tu equipo.",
    start_url: `${BASE}/`,
    display: "standalone",
    // Los dos colores son `--bg` del tema oscuro (globals.css,
    // [data-palette="clasico"]); `viewport.themeColor` en layout.tsx debe coincidir.
    background_color: "#0c1116",
    theme_color: "#0c1116",
    lang: "es",
    icons: [
      {
        // El logotipo de la app de escritorio, de scripts/generate-brand.py.
        src: `${BASE}/logo.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
