"use client";

import { useLang } from "@/lib/i18n";

/**
 * Enlace «saltar al contenido»: primer elemento enfocable de cada página
 * (layout.tsx), oculto con `sr-only` hasta recibir foco. Apunta a
 * `#main-content` y se muestra con `z-[200]`, por encima de la barra, el aviso
 * de cookies, las ventanas y el cajón móvil.
 */
export function SkipLink() {
  const { t } = useLang();
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:rounded-[4px] focus:bg-[rgb(var(--accent-base))] focus:text-[rgb(var(--accent-ink))] focus:text-sm focus:font-semibold"
    >
      {t("skipToContent")}
    </a>
  );
}
