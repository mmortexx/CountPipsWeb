import type { CSSProperties } from "react";

/**
 * Marcadores de carga. `Skeleton` es un bloque que pulsa; con `shimmer` añade
 * el barrido de `.tj-shimmer` (globals.css). Sin hooks: valen en servidor y
 * en cliente.
 */

interface SkeletonProps {
  className?: string;
  /** Añade el barrido de degradado con el acento. */
  shimmer?: boolean;
  style?: CSSProperties;
}

export function Skeleton({ className = "", shimmer = false, style }: SkeletonProps) {
  if (!shimmer) {
    return (
      <div
        aria-hidden="true"
        style={style}
        className={`animate-pulse rounded-[4px] bg-[rgb(var(--divider)/0.05)] ${className}`}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      style={style}
      className={`relative overflow-hidden rounded-[4px] bg-[rgb(var(--divider)/0.05)] animate-pulse ${className}`}
    >
      <div className="tj-shimmer absolute inset-0" />
    </div>
  );
}

// Anchos fijos en clases de Tailwind, para que sea estable en SSR y sin hooks.
const TEXT_WIDTHS = ["w-full", "w-[92%]", "w-[78%]", "w-[88%]", "w-[65%]", "w-[95%]", "w-[70%]"];

interface SkeletonTextProps {
  lines?: number;
  className?: string;
  lineHeight?: string;
}

export function SkeletonText({
  lines = 3,
  className = "",
  lineHeight = "h-3.5",
}: SkeletonTextProps) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`${lineHeight} ${TEXT_WIDTHS[i % TEXT_WIDTHS.length]}`} />
      ))}
    </div>
  );
}
