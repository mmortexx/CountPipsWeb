import { tarjetaSocial } from "@/lib/tarjeta-social";

// Literales en cada fichero: Next las lee del texto y no sigue reexportaciones.
export const runtime = "nodejs";
export const dynamic = "force-static";
export const alt = "Precios — CountPips";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return tarjetaSocial({
    antetitulo: "Precios",
    titulo: "Dos planes: Core y Pro.",
    subtitulo: "Precios de lanzamiento previstos: Core $149 · Pro $249.",
  });
}
