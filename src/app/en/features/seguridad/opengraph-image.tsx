import { tarjetaSocial } from "@/lib/tarjeta-social";

// Literales en cada fichero: Next las lee del texto y no sigue reexportaciones.
export const runtime = "nodejs";
export const dynamic = "force-static";
export const alt = "Security — CountPips";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return tarjetaSocial({
    lang: "en",
    antetitulo: "Security",
    titulo: "Your data, on your machine.",
    subtitulo: "No account, no telemetry and no CountPips servers.",
  });
}
