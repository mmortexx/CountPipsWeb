import { tarjetaSocial } from "@/lib/tarjeta-social";

// Literales en cada fichero: Next las lee del texto y no sigue reexportaciones.
export const runtime = "nodejs";
export const dynamic = "force-static";
export const alt = "Métricas — CountPips";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return tarjetaSocial({
    antetitulo: "Métricas",
    titulo: "Las cifras que usan los que viven de esto.",
    subtitulo: "40+ ratios calculados de tus operaciones: Sharpe, Sortino, Calmar y expectancy en R.",
  });
}
