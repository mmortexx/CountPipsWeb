import { tarjetaSocial } from "@/lib/tarjeta-social";

// Literales en cada fichero: Next las lee del texto y no sigue reexportaciones.
export const runtime = "nodejs";
export const dynamic = "force-static";
export const alt = "Calculadoras de trading gratis — CountPips";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return tarjetaSocial({
    antetitulo: "Calculadoras gratis",
    titulo: "Haz la cuenta antes de operar.",
    subtitulo: "Riesgo, drawdown, Monte Carlo, comisiones y más. En tu navegador y sin registro.",
  });
}
