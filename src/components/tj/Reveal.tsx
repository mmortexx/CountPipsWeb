import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Orden dentro de su grupo: se traduce a uno de los cinco escalones del CSS. */
  delay?: number;
  /** Se acepta por compatibilidad; el recorrido lo fija el CSS. */
  y?: number;
  /** Ídem; el timeline de scroll es reversible por naturaleza. */
  once?: boolean;
}

/**
 * Entrada de un bloque al asomar en pantalla. Es un `<div>` con `data-entra`
 * (componente de servidor): la animación vive en el CSS, atada a
 * `animation-timeline: view()` (bloque «ENTRADA DE SECCIÓN» de globals.css).
 * El HTML sale a plena opacidad, así que sin JavaScript nada queda invisible.
 * `delay` (segundos) se agrupa en cinco escalones.
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

