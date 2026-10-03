"use client";

import { useState } from "react";
import { Link } from "@/components/tj/LocaleLink";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { withLocale } from "@/lib/locale";

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
        ? "Core 149\u00a0$ y Pro 249\u00a0$, precios de lanzamiento previstos."
        : "Core $149 and Pro $249, planned launch prices.",
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
    <>
    {/* `404.html` sale en español; bajo `/en/…` React lo pasa a inglés justo
        tras hidratar (ver `langHidratacion` en i18n.tsx) y esta hoja se va
        con el español. Mientras tanto la página no se pinta; si el
        JavaScript no llega, se muestra igual al segundo y medio. Vive aquí
        y no en globals.css porque como `html:has(...)` obligaba a revisar
        el estilo de todo el documento en cada nodo insertado, en todas las
        páginas inglesas. */}
    {es && (
      <style>{`html[lang="en"] body{visibility:hidden;animation:tj-404-espera 0s 1.5s forwards}@keyframes tj-404-espera{to{visibility:visible}}`}</style>
    )}
    <section
      aria-labelledby="not-found-heading"
      className="relative min-h-screen flex items-center justify-center overflow-clip px-5 pt-28 pb-20 md:pt-32"
    >
      <div className="relative text-center max-w-xl mx-auto">
        <div
          className="tj-alza font-serif font-normal tracking-[-0.03em] leading-[0.9] [font-variant-numeric:lining-nums]"
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
            ? "Esta página no existe."
            : "This page does not exist."}
        </h1>

        <p
          style={{ animationDelay: "0.25s" }}
          className="tj-alza mt-4 t-entradilla text-secondary"
        >
          {es
            ? "La dirección se ha movido o nunca existió. Busca una métrica o sigue por una de estas páginas."
            : "The address has moved or never existed. Search for a metric or carry on from one of these pages."}
        </p>

        <form
          style={{ animationDelay: "0.32s" }}
          onSubmit={onSubmitSearch}
          className="tj-alza mt-8 mx-auto max-w-md"
          role="search"
          aria-label={es ? "Buscar en la web" : "Search the site"}
        >
          <div className="tj-campo relative">
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
                  ? "Métrica o pregunta…"
                  : "Metric or question…"
              }
              aria-label={es ? "Buscar" : "Search"}
              /* El relleno derecho es el botón (≈ 92 px) más su aire: con
                 `pr-28` a 390 px el texto de ayuda se cortaba a media palabra. */
              className="w-full h-14 rounded-[4px] bg-transparent pl-11 pr-[6.25rem] text-[15px] text-primary placeholder:text-tertiary outline-none focus-visible:outline-none"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-10 items-center rounded-[4px] bg-[rgb(var(--accent-base))] px-5 text-[13px] font-semibold text-[rgb(var(--accent-ink))] transition-colors hover:bg-[rgb(var(--accent-hover))]"
            >
              {es ? "Buscar" : "Search"}
            </button>
          </div>
        </form>

        {/* Sin 01/02/03: tres destinos no son una secuencia. Mismo ancho que
            el buscador de encima para que los dos bloques compartan cantos. */}
        <ul
          style={{ animationDelay: "0.4s" }}
          className="tj-alza mx-auto mt-8 mb-0 max-w-md list-none p-0 text-left"
        >
          {tiles.map((tile) => (
            <li key={tile.href}>
              <Link
                href={tile.href}
                className="link-underline-host block min-h-[56px] py-3.5"
              >
                <span className="block text-sm font-semibold text-primary">
                  <span className="link-underline">{tile.label}</span>
                </span>
                <span className="mt-1 block text-sm text-secondary leading-snug">
                  {tile.desc}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div
          style={{ animationDelay: "0.48s" }}
          className="tj-alza mt-9"
        >
          <div
            className="tj-alza inline-flex"
          >
            <Link
              href="/"
              className="cta cta--secundario"
            >
              {es ? "Volver al inicio" : "Back to home"}
            </Link>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
