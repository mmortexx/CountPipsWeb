import type { ReactNode } from "react";
import { Link } from "@/components/tj/LocaleLink";

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

  /* ── UNA RUTA DEL SITIO NO PUEDE SALIR POR UN `<a>` CRUDO ────────────
     Esto pintaba siempre un ancla suelta, y a un ancla suelta el `href`
     le llega tal cual. Con el sitio publicado en un subdirectorio
     —`usuario.github.io/CountPipsWeb/`— eso significa que `href="/beta"`
     apunta a la RAÍZ DEL DOMINIO y da 404.

     No es teoría: era el botón «Solicitar acceso anticipado» de los dos
     planes de la página de precios, en español y en inglés. El último
     clic del embudo, el que pulsa quien ya ha decidido, llevaba a una
     página que no existe. Y no se ve en local, porque en local el
     prefijo es la cadena vacía y `/beta` es la ruta correcta.

     Encima faltaba el idioma: desde `/en/pricing/` ese mismo botón
     llevaba a la página española.

     Las dos cosas las resuelve el `Link` de la casa, que añade el idioma
     y deja que Next ponga el prefijo. Los enlaces EXTERNOS —los cinco
     iconos del pie— siguen saliendo por un ancla: ahí `href` es una
     dirección completa y no hay nada que prefijar.

     La regla la vigila `tests/prefijo-despliegue.test.ts` sobre el HTML
     ya compilado, para toda la familia y no sólo para este componente. */
  if (href) {
    const interno = href.startsWith("/") && !href.startsWith("//");
    if (interno) {
      return (
        <Link href={href} {...comun}>
          {children}
        </Link>
      );
    }
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
