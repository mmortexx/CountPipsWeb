"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/lib/theme";
import { LanguageProvider } from "@/lib/i18n";
import { PostHog } from "@/components/analytics/PostHog";

export function Providers({ children }: { children: ReactNode }) {
  return (
    // La curva vive en `--ease-suave` y `prefers-reduced-motion` lo aplica la
    // hoja de estilos (globals.css), no un proveedor.
    <ThemeProvider>
      <LanguageProvider>
        {children}
        <PostHog />
      </LanguageProvider>
    </ThemeProvider>
  );
}
