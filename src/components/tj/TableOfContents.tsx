"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { irASeccion } from "@/lib/scroll";

/**
 * Índice lateral fijo de la página. Al montar escanea los `h2` de las
 * `section` con `[id]` y marca el activo con un `IntersectionObserver`. Solo
 * desde 2xl (1536 px): por debajo no hay margen para el panel de 200 px sin
 * tapar texto. Si hay menos de 2 secciones, no se pinta.
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
    // Los anclas las pone cada sección: mutar aquí un encabezado renderizado
    // en servidor daría un desajuste de hidratación. Se excluye la sección de
    // navegación entre páginas (FeaturePageNav), que se detecta por su texto.
    const allSections = Array.from(document.querySelectorAll("section"));
    const contentSections = allSections.filter((sec) => {
      const txt = sec.textContent || "";
      if (txt.includes("Sigue explorando") || txt.includes("Keep exploring")) return false;
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
      const target: HTMLElement | null = h.closest("[id]") as HTMLElement | null;
      let id = target?.id;
      // El id debe servir de ancla: React reparte ids del estilo `S:1` y los
      // dos puntos no valen en un `href="#..."` sin escapar. Si no vale, se
      // descarta; no se parchea el DOM tras SSR.
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

  if (items.length < 2) return null;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    // Los saltos pueden ser largos: ver `src/lib/scroll.ts`.
    if (!irASeccion(id)) return;
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <nav
      aria-label={es ? "Índice de la página" : "On this page"}
      className="fixed right-[22px] top-1/2 z-30 hidden -translate-y-1/2 2xl:block"
    >
      <div className="tj-paper tj-paper-dense rounded-[4px] border border-[rgb(var(--divider)/0.16)] p-3.5 max-w-[200px]">
        <span className="eyebrow block mb-2.5 px-1">
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
                  className={`group flex items-start gap-2 rounded-[4px] px-2 py-1.5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.6)] focus-visible:ring-offset-1 focus-visible:ring-offset-transparent ${
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
                    className={`text-[12px] leading-[1.4] transition-colors duration-150 ${
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
