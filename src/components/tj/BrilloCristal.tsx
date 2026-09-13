"use client";

import { useEffect } from "react";

/**
 * El reflejo de los cristales sigue al puntero, como la luz sobre el Liquid
 * Glass al inclinar el teléfono. Un único oyente para toda la página: marca
 * el cristal que hay bajo el ratón y le pasa la posición en `--brillo-x/y`.
 * Sin ratón (táctil) o con movimiento reducido no hace nada y el reflejo se
 * queda fijo arriba a la izquierda.
 */
export function BrilloCristal() {
  useEffect(() => {
    const puede = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    if (!puede.matches) return;
    let activo: HTMLElement | null = null;
    let marco = 0;
    let ultimo: PointerEvent | null = null;

    const soltar = () => {
      if (!activo) return;
      delete activo.dataset.brillo;
      activo.style.removeProperty("--brillo-x");
      activo.style.removeProperty("--brillo-y");
      activo = null;
    };

    const pintar = () => {
      marco = 0;
      const e = ultimo;
      if (!e) return;
      const cristal = (e.target instanceof Element ? e.target.closest<HTMLElement>(".tj-cristal") : null) ?? null;
      if (cristal !== activo) soltar();
      if (!cristal) return;
      const r = cristal.getBoundingClientRect();
      cristal.style.setProperty("--brillo-x", `${(e.clientX - r.left).toFixed(0)}px`);
      cristal.style.setProperty("--brillo-y", `${(e.clientY - r.top).toFixed(0)}px`);
      cristal.dataset.brillo = "true";
      activo = cristal;
    };

    const mover = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      ultimo = e;
      if (!marco) marco = requestAnimationFrame(pintar);
    };

    document.addEventListener("pointermove", mover, { passive: true });
    document.documentElement.addEventListener("pointerleave", soltar);
    return () => {
      document.removeEventListener("pointermove", mover);
      document.documentElement.removeEventListener("pointerleave", soltar);
      if (marco) cancelAnimationFrame(marco);
      soltar();
    };
  }, []);

  return null;
}
