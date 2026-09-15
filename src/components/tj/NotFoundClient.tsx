"use client";

import { useState } from "react";
import { Link } from "@/components/tj/LocaleLink";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { withLocale } from "@/lib/locale";
import { Escritorio } from "@/components/tj/Escritorio";

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
 * Copy:
 *  - Trading-themed headline: "stopped out like a bad stop loss".
 *  - Bilingual subhead explaining the page is missing.
 *  - Índice numerado a las tres destinos principales (Características,
 *    Demo, Precios) más el CTA de inicio.
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
        ? "Métricas, disciplina y datos en tu equipo."
        : "Metrics, discipline and data on your machine.",
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
        ? "Core 149\u00a0$ · Pro 249\u00a0$ como precios de lanzamiento previstos."
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
      data-tj-404={lang}
      className="relative min-h-screen flex items-center justify-center overflow-clip px-5 py-20"
    >

      <Escritorio />
      <div className="relative text-center max-w-xl mx-auto">
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

        <form
          style={{ animationDelay: "0.32s" }}
          onSubmit={onSubmitSearch}
          className="tj-alza mt-8 mx-auto max-w-md"
          role="search"
          aria-label={es ? "Buscar en la web" : "Search the site"}
        >
          <div className="tj-cristal relative rounded-[4px]">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-tertiary pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={
                es
                  ? "Busca una métrica o una pregunta…"
                  : "Search a metric or a question…"
              }
              aria-label={es ? "Buscar" : "Search"}
              className="w-full h-14 rounded-[8px] bg-transparent pl-11 pr-28 text-[15px] text-primary placeholder:text-tertiary outline-none focus-visible:outline-none"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-10 items-center rounded-[4px] bg-[rgb(var(--accent-base))] px-5 text-[13px] font-semibold text-[rgb(var(--accent-ink))] transition-colors hover:bg-[rgb(var(--accent-hover))]"
            >
              {es ? "Buscar" : "Search"}
            </button>
          </div>
        </form>

        <ol
          style={{ animationDelay: "0.4s" }}
          className="tj-alza mt-8 m-0 list-none p-0 text-left"
        >
          {tiles.map((tile, i) => (
            <li key={tile.href}>
              <Link
                href={tile.href}
                className="group grid min-h-[56px] grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3 rounded-[4px] px-4 py-3.5 transition-colors hover:bg-[color-mix(in_srgb,var(--ink)_4%,transparent)]"
              >
                <span
                  className="tnum text-[12px] font-medium text-tertiary"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-primary">
                    {tile.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-secondary leading-snug">
                    {tile.desc}
                  </span>
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
              </Link>
            </li>
          ))}
        </ol>

        <div
          style={{ animationDelay: "0.48s" }}
          className="tj-alza mt-9"
        >
          <div
            className="tj-alza inline-flex"
          >
            <Link
              href="/"
              /* `group` + `inline-flex` + `min-h-[44px]`: la flecha llevaba
                 `group-hover` sin padre `group` — nunca se movía —, y con
                 `py-2` el enlace medía ~36 px, bajo el objetivo táctil de
                 44 px que rige el resto de controles del sitio. */
              className="group cta cta--secundario"
            >
              {es ? "Volver al inicio" : "Back to home"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
