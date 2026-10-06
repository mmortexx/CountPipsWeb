"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Ventana (ms) durante la que se recoloca el ancla, hasta que la página se asienta. */
const SETTLE_WINDOW_MS = 2500;

/** Desvío que se tolera antes de recolocar, en píxeles. */
const TOLERANCE_PX = 4;

/**
 * Posición de scroll en cada navegación. Sin ancla sube arriba del todo (Next
 * conserva la posición anterior en navegaciones nuevas). Con ancla
 * (`/pricing#waitlist`) lleva a la sección y la vuelve a comprobar durante
 * `SETTLE_WINDOW_MS`: la página sigue creciendo tras el salto (fuentes, trozos
 * bajo demanda, secciones diferidas) y el ancla se desplazaría. Respeta el
 * `scroll-margin-top` de cada sección. No pinta nada.
 */
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    const hash = decodeURIComponent(window.location.hash.replace("#", ""));

    if (!hash) {
      // `auto` evita pelear con la restauración nativa del navegador.
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }

    let cancelled = false;

    // Recoloca solo si la sección se desvió más de `TOLERANCE_PX`: reposicionar
    // en cada fotograma pelearía con el navegador. El margen se lee una vez
    // porque `getComputedStyle` fuerza resolver el estilo y esto corre cada fotograma.
    let margenCache: number | null = null;
    let margenDe: string | null = null;

    const align = () => {
      if (cancelled) return;
      const el = document.getElementById(hash);
      if (!el) return;
      if (margenCache === null || margenDe !== hash) {
        margenCache = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
        margenDe = hash;
      }
      const margin = margenCache;
      const target = Math.max(
        0,
        Math.round(el.getBoundingClientRect().top + window.scrollY - margin)
      );
      if (Math.abs(target - window.scrollY) > TOLERANCE_PX) {
        window.scrollTo({ top: target, left: 0, behavior: "auto" });
      }
    };

    // En cuanto el visitante toma el control, se deja de recolocar.
    const surrender = () => {
      cancelled = true;
      cleanup();
    };
    const opts = { passive: true, once: true } as const;
    window.addEventListener("wheel", surrender, opts);
    window.addEventListener("touchstart", surrender, opts);
    window.addEventListener("keydown", surrender, { once: true });

    // Se vigila la posición de la sección, no el alto del documento: una
    // sección puede crecer y otra encoger sin cambiar el total, y un
    // `ResizeObserver` no lo vería.
    let raf = 0;
    const start = performance.now();
    const watch = (now: number) => {
      if (cancelled) return;
      align();
      if (now - start < SETTLE_WINDOW_MS) raf = requestAnimationFrame(watch);
      else cleanup();
    };
    raf = requestAnimationFrame(watch);

    function cleanup() {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", surrender);
      window.removeEventListener("touchstart", surrender);
      window.removeEventListener("keydown", surrender);
    }

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [pathname]);

  return null;
}
