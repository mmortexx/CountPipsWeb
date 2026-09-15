import { tarjetaSocial } from "@/lib/tarjeta-social";

// Literales en cada fichero: Next las lee del texto y no sigue reexportaciones.
export const runtime = "nodejs";
export const dynamic = "force-static";
export const alt = "About — CountPips";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return tarjetaSocial({
    lang: "en",
    antetitulo: "About",
    titulo: "Built for the serious manual trader.",
    subtitulo: "Why CountPips exists, who it's for and how it evolves.",
  });
}
