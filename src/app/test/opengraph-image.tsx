import { tarjetaSocial } from "@/lib/tarjeta-social";

// Literales en cada fichero: Next las lee del texto y no sigue reexportaciones.
export const runtime = "nodejs";
export const dynamic = "force-static";
export const alt = "Test de disciplina — CountPips";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return tarjetaSocial({
    antetitulo: "Test de disciplina",
    titulo: "Mídete en cinco ejes.",
    subtitulo: "Riesgo, plan, registro, temple y constancia. Tu perfil y por dónde empezar.",
  });
}
