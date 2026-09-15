import { tarjetaSocial } from "@/lib/tarjeta-social";

// Literales en cada fichero: Next las lee del texto y no sigue reexportaciones.
export const runtime = "nodejs";
export const dynamic = "force-static";
export const alt = "CountPips — Trade like an institutional desk.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return tarjetaSocial({
    lang: "en",
    antetitulo: "Trading journal for Windows",
    titulo: "Trade like an institutional desk.",
    subtitulo: "40+ metrics, a discipline guardian and your data on your machine.",
  });
}
