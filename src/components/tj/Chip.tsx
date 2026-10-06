import type { ReactNode } from "react";

interface ChipProps {
  children: ReactNode;
  variant?: "default" | "pos" | "neg" | "warn" | "accent" | "neutral" | "stat" | "count" | "selection";
  className?: string;
  /** Tamaño del texto: `"default"` 0.72rem; `sm`/`xs` para etiquetas más pequeñas. */
  size?: "default" | "sm" | "xs";
  /** Radio de esquina: `"default"` 4px; `sm` 2px, como la ventana de la app. */
  rounded?: "default" | "sm";
  /** `"button"` pinta un botón de 44 px con anillo de foco, para chips de
   *  filtro; `"span"` (por defecto) es la insignia estática. */
  as?: "span" | "button";
  /** Solo botones. */
  onClick?: () => void;
  /** Solo botones: estado de `aria-pressed`. */
  pressed?: boolean;
  /** Solo botones. */
  ariaLabel?: string;
  /** Solo botones; por defecto "button". */
  type?: "button" | "submit" | "reset";
  /** Solo botones. */
  disabled?: boolean;
}

/** Etiqueta compacta de dirección o estado. La variante interactiva
 *  (`as="button"`) es un botón de 44 px con anillo de foco; el `span`
 *  por defecto es la insignia estática. */
export function Chip({
  children,
  variant = "default",
  className = "",
  size = "default",
  rounded = "default",
  as = "span",
  onClick,
  pressed,
  ariaLabel,
  type = "button",
  disabled = false,
}: ChipProps) {
  const styles: Record<string, string> = {
    default: "bg-[rgb(var(--divider)/0.08)] text-secondary border border-[rgb(var(--divider)/0.10)]",
    pos: "bg-pnl-pos/15 text-pnl-pos border border-pnl-pos/25",
    neg: "bg-pnl-neg/15 text-pnl-neg border border-pnl-neg/25",
    warn: "bg-pnl-warn/15 text-pnl-warn border border-pnl-warn/25",
    accent: "bg-[rgb(var(--divider)/0.08)] text-primary border border-[rgb(var(--divider)/0.20)]",
    neutral: "bg-[rgb(var(--divider)/0.05)] text-tertiary border border-[rgb(var(--divider)/0.08)]",
    // Tonos de las páginas de demo, con opacidades algo distintas de default/neutral/accent.
    stat: "bg-[rgb(var(--divider)/0.08)] text-tertiary border border-[rgb(var(--divider)/0.12)]",
    count: "bg-[rgb(var(--divider)/0.05)] text-tertiary border border-[rgb(var(--divider)/0.1)]",
    selection: "bg-[rgb(var(--accent-base)/0.15)] text-primary border border-[rgb(var(--accent-base)/0.35)]",
  };
  const sizes: Record<string, string> = {
    default: "text-[0.72rem]",
    sm: "text-[11px]",
    xs: "text-[10px]",
  };
  const radii: Record<string, string> = {
    default: "rounded-[4px]",
    sm: "rounded-[2px]",
  };
  const cls = `inline-flex items-center gap-[0.35rem] ${radii[rounded]} px-[0.55rem] py-[0.15rem] ${sizes[size]} font-semibold leading-[1.4] ${styles[variant]} ${className}`;

  if (as === "button") {
    return (
      <button
        type={type}
        onClick={onClick}
        aria-pressed={pressed}
        aria-label={ariaLabel}
        disabled={disabled}
        className={`inline-flex items-center justify-center min-h-[44px] py-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] focus-visible:ring-offset-1 focus-visible:ring-offset-[rgb(var(--bg))] ${cls}`}
      >
        {children}
      </button>
    );
  }
  return <span className={cls}>{children}</span>;
}
