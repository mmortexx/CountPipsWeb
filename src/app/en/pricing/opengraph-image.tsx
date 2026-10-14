import { tarjetaSocial } from "@/lib/tarjeta-social";
import { PRECIO_CORE, PRECIO_PRO } from "@/lib/precios";
import { fmtMoney } from "@/lib/trading/format";

// Literales en cada fichero: Next las lee del texto y no sigue reexportaciones.
export const runtime = "nodejs";
export const dynamic = "force-static";
export const alt = "Pricing — CountPips";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return tarjetaSocial({
    lang: "en",
    antetitulo: "Pricing",
    titulo: "Two plans: Core and Pro.",
    subtitulo: `Planned launch prices: Core ${fmtMoney(PRECIO_CORE, "en", { decimals: 0 })} · Pro ${fmtMoney(PRECIO_PRO, "en", { decimals: 0 })}.`,
  });
}
