import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Orden dentro de su grupo. Se traduce a uno de los cinco escalones
   *  del CSS; el valor exacto en segundos ya no significa nada. */
  delay?: number;
  /** Se acepta por compatibilidad con los 106 usos que ya existen. El
   *  recorrido lo fija ahora el CSS (14 px), igual para todo el sitio. */
  y?: number;
  /** Ídem. El timeline de scroll es reversible por naturaleza: lo que
   *  sale por abajo vuelve a entrar al subir, que es el comportamiento
   *  que se quería y que `once` no podía dar. */
  once?: boolean;
}

/**
 * Reveal — la entrada de un bloque al asomar en pantalla.
 *
 * ── El fallo que tenía, y por qué era grave ───────────────────────────
 * Estaba hecho con `framer-motion` y `initial="hidden"`. Eso significa
 * que el bloque se RENDERIZA con opacidad 0 —en el HTML que sale del
 * servidor— y sólo sube a 1 cuando React hidrata y el observador de
 * viewport dispara.
 *
 * Las consecuencias:
 *
 *  · **Sin JavaScript, la web está en blanco.** No en sentido figurado:
 *    106 usos de este componente en 31 ficheros, incluidos los
 *    titulares de casi todas las páginas. El verificador lo venía
 *    avisando en ocho rutas —«el h1 se mide como no visible»— y se
 *    estaba tratando como un artefacto de la medición.
 *  · **Con JavaScript, la primera pantalla parpadea.** El contenido de
 *    arriba está a 0 hasta que hidrata; en una página con trozos en
 *    diferido eso es más de dos segundos con la cabecera vacía.
 *  · **Y costaba lo que cuesta.** Cada `Reveal` era un componente de
 *    cliente que arrastraba `framer-motion` al árbol.
 *
 * ── Lo que hace ahora ─────────────────────────────────────────────────
 * Un `<div>` con un atributo. La animación entera vive en el CSS (ver
 * el bloque «ENTRADA DE SECCIÓN» de globals.css), atada al progreso del
 * elemento por la ventana con `animation-timeline: view()`.
 *
 * Eso cambia las tres cosas de arriba a la vez: el HTML sale con el
 * contenido a plena tinta —quien no soporte el timeline simplemente lo
 * ve, sin animación y sin nada que esperar—, no hay hidratación en el
 * camino crítico, y este fichero ya no importa una biblioteca de
 * animación. No queda ni `"use client"`: es un componente de servidor.
 *
 * ── Sobre los cinco escalones ─────────────────────────────────────────
 * El `delay` en segundos se traduce a uno de cinco tramos. Los 106 usos
 * pasan valores entre 0 y 0,3 con una precisión que nunca fue real —la
 * diferencia entre 0,06 y 0,08 no la ve nadie—, y un escalonado
 * discreto se puede expresar en CSS sin generar una regla por valor.
 */
function escalon(delay: number): 1 | 2 | 3 | 4 | 5 {
  if (delay <= 0.02) return 1;
  if (delay <= 0.07) return 2;
  if (delay <= 0.13) return 3;
  if (delay <= 0.19) return 4;
  return 5;
}

export function Reveal({ children, className = "", delay = 0 }: RevealProps) {
  return (
    <div className={className} data-entra={escalon(delay)}>
      {children}
    </div>
  );
}

/* Los dos valores de la familia de movimiento siguen exportados: hay
   componentes que animan por su cuenta (la barra, el cajón, los globos
   de los gráficos) y deben moverse con la misma curva y la misma
   duración que las entradas, o la página parece hecha por dos manos. */
export const REVEAL_EASE = [0.22, 1, 0.36, 1] as const;
export const REVEAL_DURATION = 0.55;
