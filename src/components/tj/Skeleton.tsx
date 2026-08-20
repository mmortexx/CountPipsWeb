import type { CSSProperties, ReactNode } from "react";

/**
 * Skeleton primitives for loading placeholders.
 *
 * The base `Skeleton` matches the spec exactly (a pulse-breathing rounded
 * block) and accepts an optional `shimmer` flag that layers an accent-tinted
 * gradient sweep on top — the premium "polish" used by `SkeletonCard` and the
 * demo's loading state. The sweep is driven by the `.tj-shimmer` utility in
 * globals.css so it stays in sync with the active accent palette.
 *
 * No hooks → safe to render from Server or Client components.
 */

interface SkeletonProps {
  className?: string;
  /** When true, adds an accent-tinted gradient sweep overlay. */
  shimmer?: boolean;
  style?: CSSProperties;
}

export function Skeleton({ className = "", shimmer = false, style }: SkeletonProps) {
  if (!shimmer) {
    return (
      <div
        aria-hidden="true"
        style={style}
        className={`animate-pulse rounded-[2px] bg-[rgb(var(--divider)/0.05)] ${className}`}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      style={style}
      className={`relative overflow-hidden rounded-[2px] bg-[rgb(var(--divider)/0.05)] animate-pulse ${className}`}
    >
      <div className="tj-shimmer absolute inset-0" />
    </div>
  );
}

/**
 * A few skeleton lines of varying width — mimics a paragraph or title block.
 * Widths are pre-baked Tailwind arbitrary classes so the component stays
 * hook-free and SSR-stable.
 */
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

/**
 * A glass card with skeleton content inside — the canonical loading block
 * for any dashboard tile. Includes a shimmering title bar, a few text lines,
 * and a larger chart-ish block. Children can override the default content.
 */
interface SkeletonCardProps {
  className?: string;
  children?: ReactNode;
  /** Show the shimmering title bar at the top of the card. */
  showTitle?: boolean;
  /** Show the bottom "chart area" skeleton block. */
  showChart?: boolean;
}

export function SkeletonCard({
  className = "",
  children,
  showTitle = true,
  showChart = true,
}: SkeletonCardProps) {
  return (
    <div className={`tj-paper rounded-[2px] border border-[rgb(var(--divider)/0.13)] p-5 ${className}`} aria-hidden="true">
      {children ?? (
        <>
          {showTitle && <Skeleton shimmer className="h-4 w-1/3 mb-4" />}
          <SkeletonText lines={3} className="mb-4" />
          {showChart && <Skeleton shimmer className="h-28 w-full" />}
        </>
      )}
    </div>
  );
}
