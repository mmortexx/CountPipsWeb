"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { irASeccion } from "@/lib/scroll";

/**
 * SideRail — raíl lateral fijo (solo home, ≥1100 px) que indexa ÚNICAMENTE
 * las secciones anchables de esta página. No es un índice del sitio: las
 * 9 rutas reales (/features, /features/metricas, /features/disciplina,
 * /features/seguridad, /pricing, /demo, /about, /faq) ya viven en el
 * megamenú del Navbar, en el Footer, en el CommandPalette (⌘K) y en los
 * atajos `g`+letra de GlobalShortcuts. Duplicarlas aquí era justo lo que
 * generaba la sensación de "índice con secciones que no existen".
 *
 * Anclas locales:
 *   01 · Inicio    (#top)      → Hero
 *   02 · Métricas  (#metrics)  → MetricsShowcaseNew
 *   03 · Guardián  (#guardian) → GuardianNew
 *   04 · Principios(#values)   → Values
 *
 * Antes había un ancla `#overview` apuntando a la sección del mockup de
 * la aplicación. Esa sección salió de la home —junto con la demo, que
 * ahora vive solo en /demo—, así que el ancla apuntaba a un id
 * inexistente: el raíl se quedaba con un punto muerto que nunca se
 * activaba. Se sustituye por las tres secciones reales que sí quedan.
 *
 * La ruta /demo NO se indexa aquí a propósito: este raíl lista tramos de
 * ESTA página, no destinos del sitio. Mezclar ambas cosas era lo que
 * generaba la sensación de "índice con secciones que no existen".
 *
 * Oculto por debajo de 1420 px (ancho del breakpoint `min-[1420px]:flex`
 * del JSX de abajo) para no pisar el contenido en pantallas estrechas.
 * El umbral real es 1420 px, no 1100 px como decía aquí antes: a 1100 px
 * la mancha centrada (max 1080 px) deja solo ~10 px de margen a cada
 * lado y el raíl, anclado a `left-[22px]`, se solapa con el contenido.
 * 1420 px deja ~170 px de margen a cada lado, suficiente para que el
 * raíl respire sin invadir la mancha. El comentario anterior quedó
 * desactualizado cuando el umbral se subió para limpiar el solape en
 * 1280 px; lo alineo aquí para que el próximo que lo lea entienda por
 * qué es 1420 y no 1100.
 */
const ANCHORS = [
  { id: "top", num: "01", es: "Inicio", en: "Home" },
  { id: "metrics", num: "02", es: "Métricas", en: "Metrics" },
  { id: "guardian", num: "03", es: "Guardián", en: "Guardian" },
  { id: "values", num: "04", es: "Principios", en: "Principles" },
] as const;

export function SideRail() {
  const { lang } = useLang();
  const es = lang === "es";
  const [activeId, setActiveId] = useState<string>("top");

  useEffect(() => {
    const elements = ANCHORS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null
    );
    if (elements.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-120px 0px -55% 0px", threshold: [0, 0.15, 0.3, 0.5, 1] }
    );
    elements.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const go = (id: string) => {
    /* `irASeccion` en vez de `scrollIntoView`: el raíl salta de la
       primera ancla a la última de una página larga, y ese recorrido
       animado enseñaba el contenido entero pasando de largo. Respeta el
       `scroll-margin-top` igual que hacía `scrollIntoView`. */
    if (!irASeccion(id)) return;
    history.replaceState(null, "", `#${id}`);
  };

  // Inactive label/dot use --ink-2 (not --ink-3) at opacity 0.75 (not 0.6)
  // so contrast stays ≥ WCAG AA for 10.5 px text in light theme, where
  // --ink-3 (#797d80) at 60 % over white falls below the 4.5:1 threshold.
  const labelStyle = (on: boolean) =>
    ({
      fontSize: 10.5,
      letterSpacing: "0.08em",
      color: on ? "var(--ink)" : "var(--ink-2)",
      fontWeight: on ? 600 : 400,
      opacity: on ? 1 : 0.75,
    }) as const;

  return (
    <nav
      aria-label={es ? "Secciones de esta página" : "Sections on this page"}
      className="fixed left-[22px] top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-[3px] min-[1420px]:flex"
    >
      {ANCHORS.map((s) => {
        const on = s.id === activeId;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => go(s.id)}
            className="group flex cursor-pointer items-center gap-[9px] border-0 bg-transparent p-0 py-[5px] text-left"
          >
            <span
              aria-hidden
              className="h-[7px] w-[7px] flex-none rounded-full transition-[background,border-color,transform] duration-250"
              style={{
                border: `1.5px solid ${on ? "rgb(var(--accent-base))" : "var(--ink-2)"}`,
                background: on ? "rgb(var(--accent-base))" : "transparent",
                transform: on ? "scale(1.3)" : "scale(1)",
              }}
            />
            <span
              className="tnum whitespace-nowrap transition-opacity duration-200 group-hover:opacity-100"
              style={labelStyle(on)}
            >
              {s.num} · {es ? s.es : s.en}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
