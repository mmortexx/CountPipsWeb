"use client";

import { useLang } from "@/lib/i18n";

/**
 * SkipLink — accessibility "skip to main content" bypass.
 *
 * Lives as the first focusable element on every page (rendered in
 * app/layout.tsx before <Navbar /> / <CommandPalette /> / etc.). Visually
 * hidden via Tailwind's `sr-only` utility until it receives keyboard
 * focus, at which point `focus:not-sr-only` swaps it to a visible,
 * fixed-position accent-green pill at the top-left of the viewport so a
 * keyboard user can bypass the navbar + footer and jump straight into
 * the main content area (`<main id="main-content">`).
 *
 * The href is "#main-content" — matching the id of the <main> element in
 * the root layout. The visible styling (`focus:fixed focus:top-4
 * focus:left-4 focus:z-[200]`) sits above every other surface on the page
 * (the navbar is z-50, the cookie banner z-50, the command palette z-100,
 * the mobile drawer z-[60]; z-[200] clears all of them) so the link
 * can't be visually obscured when it surfaces.
 *
 * Copy is bilingual via `useLang()` so the visible label matches the
 * site's active language (the html lang attribute defaults to "es").
 */
export function SkipLink() {
  const { t } = useLang();
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:rounded-[2px] focus:bg-[rgb(var(--accent-base))] focus:text-[rgb(var(--accent-ink))] focus:text-sm focus:font-semibold"
    >
      {t("skipToContent")}
    </a>
  );
}
