import { tarjetaSocial } from "@/lib/tarjeta-social";

// Literales en cada fichero: Next las lee del texto y no sigue reexportaciones.
export const runtime = "nodejs";
export const dynamic = "force-static";
export const alt = "CountPips — Opera como una mesa institucional.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return tarjetaSocial({
    antetitulo: "Diario de trading para Windows",
    titulo: "Opera como una mesa institucional.",
    subtitulo: "40+ métricas, un guardián de disciplina y tus datos en tu equipo.",
  });
}
