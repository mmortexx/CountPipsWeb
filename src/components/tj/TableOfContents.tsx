"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { irASeccion } from "@/lib/scroll";

/**
 * TableOfContents — sticky sidebar TOC for feature subpages.
 *
 * Renders a vertical list of the page's main section headings (h2 inside
 * `section`/`[id]`), tracks the active one via a single
 * IntersectionObserver (rootMargin clears the sticky navbar at 60px + a
 * 45% band), and smooth-scrolls on click (respecting reduced-motion).
 *
 * - Desktop-only (hidden below 2xl / 1536px) to avoid cluttering mobile
 *   and to guarantee the TOC never overlaps the page content (which is
 *   capped at max-w-page=1200px; below 1536px there isn't enough right
 *   margin to float the 200px panel without covering text).
 * - Sits at `right-[22px]` mirroring the BackToTop pattern but lower on the
 *   page (top-1/2) and only on feature subpages.
 * - Active item gets an accent left-border + filled dot; inactive items
 *   get a hollow dot that fills on hover.
 * - Theme-aware via --divider, --accent-base, text-tertiary/secondary/primary.
 *
 * The component scans the DOM on mount for `[id] h2` headings (the
 * canonical section-heading pattern in this project) and builds the list
 * from their text + parent id. If fewer than 2 sections are found, the
 * TOC hides itself (no point showing a single-entry nav).
 */
interface TocItem {
  id: string;
  text: string;
}

export function TableOfContents() {
  const { lang } = useLang();
  const es = lang === "es";
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // Scan for the page's main content headings. We look for h2 elements
    // inside <section> tags, but EXCLUDE the last section (FinalCTA) and
    // the FeaturePageNav section (they're not content the reader wants
    // to jump to). For each h2, we find the closest element with an id
    // (the section wrapper, e.g. #guardian, #metrics). Anchors are
    // authored by their owning section; mutating a server-rendered
    // heading here would create a hydration mismatch in React.
    const allSections = Array.from(document.querySelectorAll("section"));
    // Drop the last 2 sections: FinalCTANew + the FeaturePageNav section.
    // (FeaturePageNav has class bg-veil and contains "Sigue explorando" /
    // "Keep exploring" text — we detect it by that signature.)
    const contentSections = allSections.filter((sec) => {
      const txt = sec.textContent || "";
      if (txt.includes("Sigue explorando") || txt.includes("Keep exploring")) return false;
      // Legacy CTAs can still appear in archived sections.
      if (txt.includes("Empieza hoy") || txt.includes("Start today")) return false;
      return true;
    });

    const headings: HTMLHeadingElement[] = [];
    contentSections.forEach((sec) => {
      const h2s = sec.querySelectorAll("h2");
      h2s.forEach((h) => headings.push(h as HTMLHeadingElement));
    });

    const found: TocItem[] = [];
    const seenIds = new Set<string>();
    headings.forEach((h) => {
      // Find closest element with a real id (not main-content).
      const target: HTMLElement | null = h.closest("[id]") as HTMLElement | null;
      let id = target?.id;
      /* Un id existente no basta: tiene que servir de ANCLA. React reparte
         ids propios a algunos contenedores —del estilo `S:1`— y los dos
         puntos no son válidos en un `href="#..."` sin escapar, así que el
         enlace del índice apuntaba a un destino inexistente y al pulsarlo
         no ocurría nada. Se coló porque el id SÍ estaba en el DOM: la
         comprobación de "existe" pasaba y la de "funciona" no la hacía
         nadie. Aquí se veía en el índice de `/about`, con la misma lámina
         dos veces, una con su slug y otra con el id de React.

         Si el id no vale como ancla, se descarta. El componente no debe
         parchear el DOM después de SSR para inventar destinos. */
      if (id && !/^[A-Za-z][\w-]*$/.test(id)) id = undefined;
      if (!id || id === "main-content") return;
      if (seenIds.has(id)) return;
      seenIds.add(id);
      const text = (h.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60);
      if (text) found.push({ id, text });
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect -- DOM scan on mount is the canonical pattern for IntersectionObserver setup; this runs once and the state drives the TOC list render.
    setItems(found.slice(0, 8));
    if (found[0]) {
      setActiveId(found[0].id);
    }

    if (found.length < 2) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -50% 0px", threshold: [0, 0.15, 0.3, 0.5, 1] }
    );

    found.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Don't render if there aren't enough sections to justify a TOC.
  if (items.length < 2) return null;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    /* El índice de una página legal salta entre epígrafes que pueden
       estar a media docena de pantallas: mismo motivo que en el raíl de
       la portada. Ver `src/lib/scroll.ts`. */
    if (!irASeccion(id)) return;
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <nav
      aria-label={es ? "Índice de la página" : "On this page"}
      className="fixed right-[22px] top-1/2 z-30 hidden -translate-y-1/2 2xl:block"
    >
      <div className="tj-paper tj-paper-dense rounded-[2px] border border-[rgb(var(--divider)/0.16)] p-3.5 max-w-[200px] border border-[rgb(var(--divider)/0.1)]">
        <span className="tnum block text-[9.5px] uppercase tracking-[0.18em] text-tertiary font-semibold mb-2.5 px-1">
          {es ? "En esta página" : "On this page"}
        </span>
        <ul className="flex flex-col gap-0.5">
          {items.map((item) => {
            const active = item.id === activeId;
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => handleClick(e, item.id)}
                  aria-current={active ? "location" : undefined}
                  className={`group flex items-start gap-2 rounded-[2px] px-2 py-1.5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.6)] focus-visible:ring-offset-1 focus-visible:ring-offset-transparent ${
                    active ? "bg-[rgb(var(--divider)/0.06)]" : "hover:bg-[rgb(var(--divider)/0.03)]"
                  }`}
                >
                  <span
                    aria-hidden
                    className="mt-[5px] flex-none w-1.5 h-1.5 rounded-[1px] transition-[background-color,border-color] duration-200"
                    style={{
                      background: active ? "rgb(var(--accent-base))" : "transparent",
                      border: active
                        ? "none"
                        : "1px solid rgb(var(--divider) / 0.55)",
                    }}
                  />
                  <span
                    className={`text-[11px] leading-[1.4] transition-colors duration-150 ${
                      active
                        ? "text-primary font-medium"
                        : "text-tertiary group-hover:text-secondary"
                    }`}
                  >
                    {item.text}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
