import { tarjetaSocial } from "@/lib/tarjeta-social";

// Literales en cada fichero: Next las lee del texto y no sigue reexportaciones.
export const runtime = "nodejs";
export const dynamic = "force-static";
export const alt = "Acerca de — CountPips";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return tarjetaSocial({
    antetitulo: "Acerca de",
    titulo: "Hecho para el trader manual serio.",
    subtitulo: "Por qué existe CountPips, para quién es y cómo evoluciona.",
  });
}
