import { tarjetaSocial } from "@/lib/tarjeta-social";

// Literales en cada fichero: Next las lee del texto y no sigue reexportaciones.
export const runtime = "nodejs";
export const dynamic = "force-static";
export const alt = "Demo en vivo — CountPips";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return tarjetaSocial({
    antetitulo: "Demo en vivo",
    titulo: "Explóralo antes de instalarlo.",
    subtitulo: "El recorrido esencial con datos de muestra, sin registro ni instalación.",
  });
}
