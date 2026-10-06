import type { Metadata } from "next";
import { NotFoundClient } from "@/components/tj/NotFoundClient";

/**
 * Servidor separado del cliente (`NotFoundClient`) porque una directiva
 * `"use client"` impide exportar `metadata`, y la 404 no debe heredar el del
 * layout (robots, canónica y tarjeta de compartir de la portada).
 * `alternates.canonical: undefined` anula lo heredado. Next emite además su
 * propio `noindex` en toda 404 exportada; el de aquí se suma sin contradecirlo.
 */
export const metadata: Metadata = {
  title: "404",
  description:
    "Esta página no existe, se ha movido o nunca estuvo publicada.",
  robots: { index: false, follow: true },
  alternates: { canonical: undefined },
  // Idioma con el que se compila `404.html`: lo lee `LanguageProvider` al
  // hidratar. Va en <head> porque el cuerpo aún puede estar a medio leer.
  other: { "tj-idioma-compilado": "es" },
  openGraph: {
    title: "Página no encontrada — CountPips",
    description: "Esta dirección no existe, se ha movido o nunca estuvo publicada.",
    url: undefined,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Página no encontrada — CountPips",
    description: "Esta dirección no existe, se ha movido o nunca estuvo publicada.",
  },
};

export default function NotFound() {
  return <NotFoundClient />;
}
