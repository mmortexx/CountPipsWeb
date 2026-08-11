"use client";

import { useState } from "react";
import { Link } from "@/components/tj/LocaleLink";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { withLocale } from "@/lib/locale";
import { MarketBackground } from "@/components/tj/MarketBackground";
import { ParticleField } from "@/components/tj/ParticleField";

/**
 * Custom 404 — full-screen premium error page.
 *
 * Vive en su propio fichero de cliente porque `src/app/not-found.tsx`
 * pasó a ser un componente de servidor: es el único sitio del árbol de
 * rutas donde `metadata` tiene que declararse a mano —con `robots:
 * noindex` y sin la canónica que hereda el layout, que apuntaba a la
 * portada— y una directiva `"use client"` en ese fichero lo habría
 * impedido.
 *
 * Premium motion layer:
 *  - Subtle scrolling candlestick backdrop (MarketBackground @ 0.06).
 *  - Particle constellation overlay (@ 0.2).
 *  - Ambient accent orb for depth.
 *
 * Copy:
 *  - Trading-themed headline: "stopped out like a bad stop loss".
 *  - Bilingual subhead explaining the page is missing.
 *  - Quick-link tiles to the three primary destinations (Features, Demo,
 *    Pricing) plus the home CTA.
 *  - Inline search box that routes to the FAQ page with the query as the
 *    `q` search param (the FAQ's real-time search picks it up on load) so
 *    users can find what they were looking for in one keystroke.
 */
export function NotFoundClient() {
  const { lang } = useLang();
  const es = lang === "es";
  const router = useRouter();
  const [q, setQ] = useState("");

  const tiles = [
    {
      href: "/features",
      label: es ? "Características" : "Features",
      desc: es
        ? "Métricas, disciplina y local-first."
        : "Metrics, discipline and local-first.",
    },
    {
      href: "/demo",
      label: es ? "Demo" : "Demo",
      desc: es
        ? "La app, en tu navegador."
        : "The app, in your browser.",
    },
    {
      href: "/pricing",
      label: es ? "Precios" : "Pricing",
      desc: es
        ? "Core $149 · Pro $249 como precios de lanzamiento previstos."
        : "Core $149 · Pro $249 as planned launch prices.",
    },
  ];

  function onSubmitSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    // No query → just land on FAQ; otherwise pre-fill the search box.
    // `withLocale` para que quien busca desde una 404 en inglés aterrice
    // en `/en/faq`, no en la FAQ española con el buscador en el idioma
    // que no pidió. `router.push` no pasa por `LocaleLink`, así que aquí
    // hay que aplicarlo a mano.
    router.push(withLocale(term ? `/faq?q=${encodeURIComponent(term)}` : "/faq", lang));
  }

  return (
    <section
      aria-labelledby="not-found-heading"
      className="relative min-h-screen flex items-center justify-center overflow-clip px-5 py-20"
    >
      {/* Subtle scrolling candlestick backdrop */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <MarketBackground density={60} speed={1.2} opacity={0.06} showEquityLine={false} />
      </div>
      {/* Constellation overlay */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <ParticleField count={36} opacity={0.2} linkDistance={130} />
      </div>
      {/* Ambient accent orb for depth */}
      <div
        className="absolute top-1/4 -left-32 w-[440px] h-[440px] rounded-full blur-[130px] pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgb(var(--accent-base)), transparent 70%)",
          opacity: 0.18,
        }}
        aria-hidden="true"
      />

      <div className="relative z-[2] text-center max-w-xl mx-auto">
        <div
          className="tj-alza font-semibold tracking-[-0.04em] leading-[0.9] text-gradient tnum"
          style={{ fontSize: "clamp(6rem, 18vw, 12rem)" }}
        >
          404
        </div>

        <h1
          style={{ animationDelay: "0.15s" }}
          id="not-found-heading"
          className="tj-alza mt-6 text-2xl md:text-3xl font-semibold tracking-tight text-primary text-balance"
        >
          {es
            ? "Esta página se detuvo como un mal stop loss."
            : "This page stopped out like a bad stop loss."}
        </h1>

        <p
          style={{ animationDelay: "0.25s" }}
          className="tj-alza mt-4 text-base md:text-lg text-secondary leading-relaxed"
        >
          {es
            ? "La URL que buscas no existe, se ha movido o nunca estuvo en tu watchlist."
            : "The URL you're after doesn't exist, has moved, or was never on your watchlist."}
        </p>

        {/* Inline search suggestion — pre-fills the FAQ search on submit.
            The border-[rgb(var(--divider)/0.13)] border brightens to the accent on hover/focus,
            matching the keyboard-first pattern the rest of the site uses
            (the command palette opens on `/`). */}
        <form
          style={{ animationDelay: "0.32s" }}
          onSubmit={onSubmitSearch}
          className="tj-alza mt-7 mx-auto max-w-md"
          role="search"
          aria-label={es ? "Buscar en la web" : "Search the site"}
        >
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-tertiary pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={
                es
                  ? "Busca una característica, métrica o pregunta…"
                  : "Search a feature, metric or question…"
              }
              aria-label={es ? "Buscar" : "Search"}
              className="w-full bg-[rgb(var(--divider)/0.05)] border border-[rgb(var(--divider)/0.1)] rounded-md h-11 pl-10 pr-24 text-sm text-primary placeholder:text-tertiary outline-none transition-colors hover:border-[rgb(var(--divider)/0.25)] focus-visible:border-[rgb(var(--divider)/0.3)]"
            />
            <div
              className="tj-alza absolute right-1.5 top-1/2 -translate-y-1/2"
            >
              <button
                type="submit"
                className="h-8 px-3 rounded-[5px] bg-[rgb(var(--accent-base))] text-[rgb(var(--accent-ink))] text-xs font-semibold hover:bg-[rgb(var(--accent-hover))] transition-colors"
              >
                {es ? "Buscar" : "Search"}
              </button>
            </div>
          </div>
        </form>

        {/* Quick-link tiles — Features, Demo, Pricing.
            Each tile uses the tj-paper utility so it sits cohesively with
            the rest of the site's surfaces. */}
        <div
          style={{ animationDelay: "0.4s" }}
          className="tj-alza mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          {tiles.map((tile) => (
            <div
              key={tile.href}
              className="tj-alza h-full"
            >
              <Link
                href={tile.href}
                className="group tj-paper rounded-[2px] border border-[rgb(var(--divider)/0.13)] p-4 text-left transition-colors hover:border-[rgb(var(--divider)/0.25)] block h-full"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary">
                    {tile.label}
                  </span>
                  <svg
                    className="size-3.5 text-tertiary transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 8h9M8 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="mt-1 text-xs text-secondary leading-snug">
                  {tile.desc}
                </p>
              </Link>
            </div>
          ))}
        </div>

        <div
          style={{ animationDelay: "0.48s" }}
          className="tj-alza mt-9"
        >
          <div
            className="tj-alza inline-flex"
          >
            <Link
              href="/"
              className="bg-[rgb(var(--accent-base))] text-[rgb(var(--accent-ink))] px-6 py-2 rounded-[2px] text-sm font-semibold hover:bg-[rgb(var(--accent-hover))] transition-[background-color,box-shadow] hover:shadow-[0_12px_32px_-8px_rgb(var(--accent-base)/0.7)]"
            >
              {es ? "Volver al inicio" : "Back to home"}
              <svg
                className="ml-2 transition-transform group-hover:translate-x-0.5"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 8h9M8 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
