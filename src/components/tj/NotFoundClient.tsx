"use client";

import dynamicImport from "next/dynamic";
import { useState } from "react";
import { Link } from "@/components/tj/LocaleLink";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { withLocale } from "@/lib/locale";

/* El grabado de la 404 comparte módulo con `EngravedAtlas` (sus
   primitivas de trazo), y ese trozo no debe entrar en el paquete que
   sirven las páginas que sí existen: se trae bajo demanda, como hace
   `BackgroundFX` con el propio atlas. */
const Grabado404 = dynamicImport(
  () => import("./Grabado404").then((m) => ({ default: m.Grabado404 })),
  { ssr: false },
);

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
 * Fondo: `Grabado404` — una lámina del atlas que se graba sola al
 * cargar («el folio que no está»: un registro cuyos renglones se cortan
 * y una lente que amplía el hueco). Sustituye a las velas desplazándose
 * y a la constelación de puntos con las que esta página dibujaba su
 * fondo: los dos clichés animados del sector, y el único rincón del
 * sitio que aún hablaba ese idioma en vez del papel entintado.
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
      {/* La lámina grabada — se dibuja sola al cargar, como el arranque
          del atlas, y su bucle se para al converger. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <Grabado404 />
      </div>

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
              /* `rounded-[2px]` y `h-12`: el radio de control del sitio —
                 aquí convivían `rounded-md` y `rounded-[5px]` — y el alto
                 que deja al botón interior sus 44 px de objetivo táctil
                 con su propio aire (era `h-11` con un botón de 32 px). */
              className="w-full bg-[rgb(var(--divider)/0.05)] border border-[rgb(var(--divider)/0.1)] rounded-[2px] h-12 pl-10 pr-28 text-sm text-primary placeholder:text-tertiary outline-none transition-colors hover:border-[rgb(var(--divider)/0.25)] focus-visible:border-[rgb(var(--divider)/0.3)]"
            />
            <div
              className="tj-alza absolute right-1.5 top-1/2 -translate-y-1/2"
            >
              <button
                type="submit"
                className="inline-flex h-11 items-center rounded-[2px] bg-[rgb(var(--accent-base))] px-4 text-xs font-semibold text-[rgb(var(--accent-ink))] transition-colors hover:bg-[rgb(var(--accent-hover))]"
              >
                {es ? "Buscar" : "Search"}
              </button>
            </div>
          </div>
        </form>

        <ol
          style={{ animationDelay: "0.4s" }}
          className="tj-alza mt-7 m-0 overflow-hidden rounded-[2px] border border-[rgb(var(--divider)/0.13)] p-0 text-left"
        >
          {tiles.map((tile, i) => (
            <li
              key={tile.href}
              className="border-b border-[rgb(var(--divider)/0.08)] last:border-b-0"
            >
              <Link
                href={tile.href}
                className="group grid min-h-[56px] grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[color-mix(in_srgb,var(--ink)_4%,transparent)]"
              >
                <span
                  className="tnum text-[11px] font-semibold"
                  style={{ color: "rgb(var(--accent-base))" }}
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
              className="group inline-flex min-h-[44px] items-center rounded-[2px] bg-[rgb(var(--accent-base))] px-6 text-sm font-semibold text-[rgb(var(--accent-ink))] transition-colors hover:bg-[rgb(var(--accent-hover))]"
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
