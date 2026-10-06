import type { ReactNode } from "react";

interface EyebrowProps {
  children: ReactNode;
  className?: string;
  /** Marca inicial: `"line"` (filete de 6×1 px), `"dot"` (punto de 4 px con el
   *  acento) o `"none"` (por defecto). */
  mark?: "line" | "dot" | "none";
}

/**
 * Rótulo pequeño sobre una sección: minúscula normal, sin espaciado, 13 px,
 * tinta terciaria (`.eyebrow` en globals.css).
 */
export function Eyebrow({ children, className = "", mark = "none" }: EyebrowProps) {
  return (
    <div className={`eyebrow inline-flex items-center gap-2 ${className}`}>
      {mark === "line" && (
        <span className="w-6 h-px bg-[rgb(var(--divider))] opacity-60" aria-hidden="true" />
      )}
      {mark === "dot" && (
        <span
          className="inline-block w-1 h-1 rounded-[1px]"
          style={{ background: "rgb(var(--accent-base))" }}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}
