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
       las animaciones CSS —y desde que es el defecto de las transiciones
       de Tailwind, de donde la lee todo lo demás—. Y el respeto por la
       preferencia del visitante lo aplica cada bloque `@media
       (prefers-reduced-motion: reduce)` de la hoja de estilos, que
       además llega a sitios donde `MotionConfig` no llegaba nunca: el
       las entradas de sección y las transiciones entre páginas.

       CON UNA EXCEPCIÓN, y esta frase estuvo mintiendo hasta que se
       midió: lo que anima framer-motion NO lo toca ningún `@media`,
       porque lo anima en JavaScript. Eso vive sólo dentro de la demo, y
       por eso el `MotionConfig` está ahora en `AppDemo.tsx` — donde
       cuesta lo que ya costaba y no en las 155 páginas. */
    <ThemeProvider>
      <LanguageProvider>
        {children}
        <PostHog />
      </LanguageProvider>
    </ThemeProvider>
  );
}
