import type { ReactNode } from "react";

interface ChipProps {
  children: ReactNode;
  variant?: "default" | "pos" | "neg" | "warn" | "accent" | "neutral" | "stat" | "count" | "selection";
  className?: string;
  /** Tamaño del texto. `"default"` (0.72rem) es el histórico; `sm`/`xs`
   *  cubren las etiquetas más pequeñas de las páginas de demo. */
  size?: "default" | "sm" | "xs";
  /** Radio de esquina. `"default"` (4px) es el histórico; `sm` (2px)
   *  replica el canto de la ventana de la app de escritorio. */
  rounded?: "default" | "sm";
  /**
   * When `as="button"`, the chip renders as a `<button>` with the same
   * etiqueta styling, a 44px minimum touch target, and focus-visible ring —
   * for filter / toggle chips the visitor can press. Default `"span"` keeps
   * the legacy non-interactive badge behavior. Backward-compatible.
   */
  as?: "span" | "button";
  /** Button-only: forwarded to the underlying <button>. */
  onClick?: () => void;
  /** Button-only: pressed state for aria-pressed toggle chips. */
  pressed?: boolean;
  /** Button-only: forwarded to the underlying <button>. */
  ariaLabel?: string;
  /** Button-only: type attribute, defaults to "button". */
  type?: "button" | "submit" | "reset";
  /** Button-only: disabled state. */
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
    // Tonos usados solo en páginas de demo (AnalyticsPage, JournalPage,
    // TradeDetailPage, TradesPage): opacidades ligeramente distintas de
    // "default"/"neutral"/"accent" que ya existían ahí antes de centralizar.
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
        // 44px min touch target + focus-visible ring for keyboard users.
        className={`inline-flex items-center justify-center min-h-[44px] py-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] focus-visible:ring-offset-1 focus-visible:ring-offset-[rgb(var(--bg))] ${cls}`}
      >
        {children}
      </button>
    );
  }
  return <span className={cls}>{children}</span>;
}
