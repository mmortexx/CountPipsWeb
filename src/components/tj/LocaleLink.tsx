"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";
import { useLang } from "@/lib/i18n";
import { withLocale } from "@/lib/locale";

/**
 * Sustituto de `next/link` con la misma API que respeta el idioma activo: el
 * idioma se deriva de la dirección (`/en/...`) y un `<Link href="/features">`
 * a mano sacaría al visitante del inglés. Los enlaces internos deben usar este
 * `Link` y no `next/link`.
 */
export function Link({ href, ...resto }: ComponentProps<typeof NextLink>) {
  const { lang } = useLang();
  const destino = typeof href === "string" ? withLocale(href, lang) : href;
  return <NextLink href={destino} {...resto} />;
}
