"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Cuántas veces se recoloca el ancla tras cargar, y cada cuánto.
 *
 * Seis intentos cada 220 ms cubren algo más de un segundo: el tiempo que
 * tardan en asentarse las tipografías web, los trozos de JavaScript que
 * se cargan bajo demanda y las secciones que sólo se dibujan al
 * acercarse. Es una corrección barata (leer una posición y, casi
 * siempre, no hacer nada) y se interrumpe en cuanto el visitante mueve
 * la página por su cuenta.
 */
const SETTLE_WINDOW_MS = 2500;

/** Desvío que se tolera antes de recolocar, en píxeles. */
const TOLERANCE_PX = 4;

/**
 * Gestor de posición de scroll en cada navegación.
 *
 * Hace dos cosas distintas según haya ancla o no:
 *
 *  · SIN ancla — sube arriba del todo. Next.js restaura el scroll en
 *    atrás/adelante, pero en una navegación nueva conserva la posición
 *    anterior; en un sitio de varias páginas eso se vive como un fallo.
 *
 *  · CON ancla (`/pricing#waitlist`) — lleva a la sección y VUELVE A
 *    COMPROBARLO durante el segundo siguiente. Este es el arreglo de
 *    verdad: el navegador salta al ancla con la altura que la página
 *    tiene en ese instante, pero la página sigue creciendo después
 *    (fuentes, trozos cargados bajo demanda, secciones que se dibujan
 *    al entrar en pantalla). El resultado medido en `/pricing#waitlist`
 *    era aterrizar a 1.583 px por encima de la sección: el visitante
 *    caía en una franja vacía y tenía que buscar a mano lo que acababa
 *    de pedir. Antes, además, esta misma función mandaba la página
 *    arriba del todo ignorando el ancla por completo.
 *
 * Usa `scrollIntoView` en vez de `scrollTo` a propósito: respeta el
 * `scroll-margin-top` de cada sección, que es lo que evita que la barra
 * de navegación fija tape el titular al llegar.
 *
 * No pinta nada: es sólo efecto.
 */
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    const hash = decodeURIComponent(window.location.hash.replace("#", ""));

    if (!hash) {
      // `auto` evita pelearse con la restauración nativa del navegador,
      // que si no anima desde la posición antigua.
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }

    let cancelled = false;

    /**
     * Recoloca si la sección se ha desviado más de `TOLERANCE_PX`.
     *
     * Se calcula a mano en vez de llamar a `scrollIntoView` en bucle
     * porque hace falta SABER si hace falta moverse: reposicionar cada
     * fotograma cancelaría cualquier scroll suave y pelearía con el
     * navegador. `scrollMarginTop` se lee del propio elemento, así que
     * cada sección sigue decidiendo cuánto aire deja bajo la barra fija.
     */
    /* El margen de la sección se lee UNA vez y se recuerda. Esto corre en
       cada fotograma durante dos segundos y medio, justo encima de la
       hidratación, y `getComputedStyle` es de las llamadas que obligan al
       navegador a resolver el estilo en ese instante. El valor no cambia
       entre fotogramas: es una regla CSS de la sección, no algo que se
       mueva con el scroll. */
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

    // En cuanto el visitante toma el control, dejamos de recolocar: nada
    // molesta más que una página que te devuelve donde ella quiere.
    const surrender = () => {
      cancelled = true;
      cleanup();
    };
    const opts = { passive: true, once: true } as const;
    window.addEventListener("wheel", surrender, opts);
    window.addEventListener("touchstart", surrender, opts);
    window.addEventListener("keydown", surrender, { once: true });

    // Se vigila la POSICIÓN de la sección, fotograma a fotograma, no el
    // alto del documento. Medido en `/pricing#waitlist`: mientras una
    // sección de arriba crecía 80 px otra de abajo encogía otros tantos,
    // el documento conservaba su altura total y un `ResizeObserver` no se
    // enteraba — pero el ancla ya se había desplazado. Vigilar el objetivo
    // en sí no se puede engañar. Son ~2,5 s de una comparación por
    // fotograma: nada, y se corta al primer gesto del visitante.
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
