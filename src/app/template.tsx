import type { ReactNode } from "react";

/**
 * Template — wraps every routed page in a subtle fade/slide-in on
 * navigation. In Next.js App Router, `template.tsx` (unlike
 * `layout.tsx`) is re-mounted on every navigation, so the
 * `.page-enter` CSS animation re-runs each time the user moves
 * between routes — giving the multi-page site a soft, premium
 * transition feel without the cost of a client-side transition
 * library.
 *
 * The animation itself is defined in globals.css (`@keyframes
 * page-enter` + `.page-enter`) and respects
 * `prefers-reduced-motion`. It only runs in browsers without view
 * transitions; elsewhere `TransicionPagina` already animates the swap.
 *
 * This is a Server Component — no hooks, no client JS.
 */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
