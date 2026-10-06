import type { ReactNode } from "react";

/**
 * A diferencia de `layout.tsx`, `template.tsx` se remonta en cada navegación,
 * así que `.page-enter` (globals.css) se repite en cada cambio de ruta. Solo
 * actúa en navegadores sin view transitions; en el resto anima
 * `TransicionPagina`. Componente de servidor.
 */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
