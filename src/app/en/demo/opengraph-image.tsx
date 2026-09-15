import { tarjetaSocial } from "@/lib/tarjeta-social";

// Literales en cada fichero: Next las lee del texto y no sigue reexportaciones.
export const runtime = "nodejs";
export const dynamic = "force-static";
export const alt = "Live demo — CountPips";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return tarjetaSocial({
    lang: "en",
    antetitulo: "Live demo",
    titulo: "Explore it before you install it.",
    subtitulo: "The essential walkthrough with sample data, no sign-up and no install.",
  });
}
