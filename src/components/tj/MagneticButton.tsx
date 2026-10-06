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
  /** Solo enlaces: abrir en otra pestaña. */
  target?: string;
  /** Solo enlaces: `rel` (con `noopener noreferrer` si `target="_blank"`). */
  rel?: string;
  /** Se reenvía como `aria-label`. */
  ariaLabel?: string;
  /** Solo botones; por defecto "button". */
  type?: "button" | "submit" | "reset";
}

/**
 * Botón o enlace con un realce sobrio en CSS (`.tj-realza`): sube 2 px al pasar
 * y se hunde al pulsar. Conserva el nombre y la firma por sus llamadas;
 * `touchAction: manipulation` quita el retardo de 300 ms del doble toque.
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

  // Una ruta interna no puede salir por un `<a>` crudo: con el sitio en un
  // subdirectorio (`/CountPipsWeb/`) `href="/beta"` apuntaría a la raíz del
  // dominio (404) y perdería el idioma. El `Link` de la casa pone ambos. Los
  // externos sí van por ancla. Lo vigila `tests/prefijo-despliegue.test.ts`.
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
