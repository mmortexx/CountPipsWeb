"use client";

import { useLayoutEffect, useRef } from "react";
import { curva, duracion } from "@/lib/motion";

/**
 * Una pieza que viaja de una opción a otra en vez de apagarse y encenderse: la
 * píldora de un selector, la barrita de la pestaña activa. Técnica FLIP: la
 * pieza vieja apunta dónde estaba al irse y la nueva nace en su sitio y se
 * anima desde allí.
 *
 * Solo hay viaje si la vieja se fue en el mismo cambio en que nace la nueva
 * (`VIGENCIA` ms); sin límite, la píldora llegaría desde donde estuvo un
 * minuto antes.
 */
const VIGENCIA = 120;
const ultimas = new Map<string, { caja: Caja; t: number }>();

export type Caja = { left: number; top: number; width: number; height: number };

/** El salto que hay que deshacer, o `null` si no hay nada que animar. */
export function saltoViaje(desde: Caja, hasta: Caja): string | null {
  if (!hasta.width || !hasta.height) return null;
  const dx = desde.left - hasta.left;
  const dy = desde.top - hasta.top;
  const sx = desde.width / hasta.width;
  const sy = desde.height / hasta.height;
  if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) return null;
  return `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
}

/** Viaja con el tiempo y la curva de lo que se abre a petición (`--dur-abre`, `--ease-suave`). */
export function useViaje<T extends HTMLElement>(clave: string) {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const previa = ultimas.get(clave);
    ultimas.delete(clave);
    if (previa && performance.now() - previa.t < VIGENCIA && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const salto = saltoViaje(previa.caja, el.getBoundingClientRect());
      if (salto)
        el.animate([{ transformOrigin: "0 0", transform: salto }, { transformOrigin: "0 0", transform: "none" }], {
          duration: duracion("--dur-abre"),
          easing: curva("--ease-suave"),
        });
    }
    // React limpia el efecto antes de quitar el nodo: la caja medida es la de la pieza aún en su sitio.
    return () => {
      const { left, top, width, height } = el.getBoundingClientRect();
      ultimas.set(clave, { caja: { left, top, width, height }, t: performance.now() });
    };
  }, [clave]);
  return ref;
}
