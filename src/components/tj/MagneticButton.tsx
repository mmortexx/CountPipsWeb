import type { ReactNode } from "react";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  /** Se acepta por compatibilidad con las cuatro llamadas que existen.
   *  Ya no hace nada: no hay atracción que graduar. */
  strength?: number;
  onClick?: () => void;
  href?: string;
  /** Anchor-only: open in a new tab/window. */
  target?: string;
  /** Anchor-only: rel attribute (use "noopener noreferrer" with target="_blank"). */
  rel?: string;
  /** Accessible label (forwarded to aria-label on the underlying element). */
  ariaLabel?: string;
  /** Button-only: type attribute, defaults to "button". */
  type?: "button" | "submit" | "reset";
}

/**
 * Un botón o enlace con un realce sobrio al pasar por encima.
 *
 * ── Lo que era y por qué se fue ───────────────────────────────────────
 * Se llamaba «magnético» porque el elemento se desplazaba hacia el
 * cursor: `useMotionValue` + `useSpring` de framer-motion, con un tope
 * de 6 px y un muelle para volver al origen. Un efecto de escaparate.
 *
 * Se retira por dos motivos independientes, y cualquiera de los dos
 * bastaría:
 *
 *  1. **Lo rechazó el cliente**, y con razón: un elemento que persigue
 *     al ratón llama la atención sobre el puntero justo cuando el
 *     visitante debería estar leyendo lo que pone el botón. Es la misma
 *     decisión que retiró el foco de luz que seguía al cursor.
 *
 *  2. **Costaba 344 KB en las 155 páginas del sitio.** Éste era el
 *     único punto por el que `framer-motion` seguía entrando en el
 *     paquete común: el pie lo importa, el pie está en el layout, y el
 *     layout se sirve en todas partes. Se encontró recorriendo el grafo
 *     de importaciones desde `layout.tsx` — cinco componentes del layout
 *     ya se habían convertido a CSS sin que el peso bajara ni un
 *     kilobyte, porque bastaba con que quedase uno.
 *
 * ── Lo que hace ahora ─────────────────────────────────────────────────
 * Un `<a>` o un `<button>`, con el realce en CSS (`.tj-realza`): sube
 * dos píxeles al pasar por encima y se hunde un poco al pulsar. Sobrio,
 * de una sola línea, y sin biblioteca.
 *
 * Se conserva el nombre y la firma para no tocar sus cuatro llamadas —
 * renombrarlo sería un cambio mecánico sin ninguna ganancia—, y
 * `touchAction: manipulation` se queda: quita el retardo de 300 ms del
 * doble toque, que es lo único de aquel «premium» que se notaba de
 * verdad, y se nota en móvil, donde nunca hubo atracción magnética.
 */
export function MagneticButton({
  children,
  className = "",
  onClick,
  href,
  target,
  rel,
  ariaLabel,
  type = "button",
}: MagneticButtonProps) {
  const comun = {
    "aria-label": ariaLabel,
    className: `tj-realza ${className}`,
    style: { touchAction: "manipulation" as const },
  };

  if (href) {
    return (
      <a href={href} target={target} rel={rel} {...comun}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} {...comun}>
      {children}
    </button>
  );
}
