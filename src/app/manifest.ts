import type { MetadataRoute } from "next";

export const dynamic = "force-static";

/**
 * Next NO prefija con el basePath el contenido del manifiesto (sí lo hace
 * con los iconos de archivo tipo `app/favicon.ico`, pero no con lo que
 * devuelve esta función). Así que las rutas de aquí se construyen a mano
 * con el basePath que expone next.config.ts. Sin esto, `start_url: "/"`
 * apuntaba a la raíz de github.io —otro sitio, no este— y la app instalada
 * abría una página ajena.
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
    // Los dos colores son `--bg` del tema oscuro del estilo vivo
    // (globals.css, bloque [data-palette="clasico"]). Antes decían
    // #0b0c0d, que era el `--bg` de :root y no el del estilo que se
    // aplica de verdad, así que la barra del navegador quedaba a un
    // paso del fondo real de la página.
    background_color: "#0c1116",
    theme_color: "#0c1116",
    lang: "es",
    icons: [
      {
        // El logotipo REAL de la aplicación de escritorio: el mismo icono
        // que su ejecutable y su bandeja, generado desde la misma geometría
        // por scripts/generate-brand.py.
        src: `${BASE}/logo.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
