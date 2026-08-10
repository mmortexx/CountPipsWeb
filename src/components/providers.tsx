"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/lib/theme";
import { LanguageProvider } from "@/lib/i18n";
import { PostHog } from "@/components/analytics/PostHog";

export function Providers({ children }: { children: ReactNode }) {
  return (
    /* Aquí envolvía un `MotionConfig` de framer-motion, y con él la
       biblioteca entera entraba en el paquete común de las 155 páginas
       —unos 344 KB— para declarar dos ajustes: respetar
       `prefers-reduced-motion` y usar la curva del proyecto.

       Los dos siguen vigentes, resueltos donde corresponde. La curva
       vive en `--ease-suave` (globals.css), que es de donde ya la leían
       las animaciones CSS. Y el respeto por la preferencia del
       visitante lo aplica cada bloque `@media (prefers-reduced-motion:
       reduce)` de la hoja de estilos, que además llega a sitios donde
       `MotionConfig` no llegaba nunca: el fondo grabado, las entradas
       de sección y las transiciones entre páginas. */
    <ThemeProvider>
      <LanguageProvider>
        {children}
        <PostHog />
      </LanguageProvider>
    </ThemeProvider>
  );
}
