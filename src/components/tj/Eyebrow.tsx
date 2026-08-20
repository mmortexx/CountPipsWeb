import type { ReactNode } from "react";

interface EyebrowProps {
  children: ReactNode;
  className?: string;
  /**
   * Leading mark. Defaults to `"line"` (a 6×1px hairline). `"dot"` renders a
   * 4px filled dot in the accent color — useful when the eyebrow sits on a
   * tight cluster where a hairline would compete with surrounding dividers.
   * `"none"` omits the mark entirely. Backward-compatible: callers that
   * don't pass `mark` keep the original hairline.
   */
  mark?: "line" | "dot" | "none";
}

/**
 * Eyebrow — small uppercase label used as a section header.
 *
 * Visual spec (P5 polish): tracking 0.2em (set globally via `.eyebrow` in
 * globals.css for the clasico palette), 11px font, ink-3 / txt-tertiary
 * color. The leading mark is a 6×1px hairline at 60% opacity by default —
 * a whisper, not a rule. Mark variants let callers swap to a dot or omit
 * the mark without losing the consistent typography.
 */
export function Eyebrow({ children, className = "", mark = "line" }: EyebrowProps) {
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
