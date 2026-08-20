import type { ReactNode } from "react";

interface ChipProps {
  children: ReactNode;
  variant?: "default" | "pos" | "neg" | "warn" | "accent" | "neutral";
  className?: string;
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
  };
  const cls = `pill ${styles[variant]} ${className}`;

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
