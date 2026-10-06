"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { Skeleton } from "@/components/tj/Skeleton";
import { trackEvent } from "@/lib/analytics";

/**
 * Punto de entrada de la demo en el cliente. `next/dynamic({ ssr: false })` no
 * puede llamarse desde un Server Component, así que este envoltorio aloja el
 * import dinámico: el bundle de la demo no viaja en el HTML inicial y se
 * hidrata al llegar a la sección. El esqueleto reserva la altura completa de
 * la ventana para evitar saltos de maquetación.
 */
const AppDemo = dynamic(
  () => import("@/components/demo/AppDemo").then((m) => ({ default: m.AppDemo })),
  {
    ssr: false,
    loading: () => <DemoSkeleton />,
  }
);

/**
 * Esqueleto con la silueta de la ventana de la demo mientras se hidrata: barra
 * de título, pestañas, y un panel con 4 tarjetas de KPI, un gráfico y una tabla.
 *
 * La altura reservada debe coincidir con la real en cada breakpoint:
 *   barra de título h-11 (44) móvil / h-10 (40) sm+ + pestañas h-[46px]
 *   + panel h-[560px] (hasta md) / h-[640px] (md+) + barra de estado h-7 (28)
 *   = 678 móvil, 674 sm, 754 md+.
 * Si cambia el panel o cualquiera de las barras, cambia esta reserva.
 */
function DemoSkeleton() {
  return (
    <div
      // La misma sombra que la ventana real (AppDemo.tsx).
      className="rounded-[2px] overflow-hidden border border-[rgb(var(--divider)/0.1)] shadow-[var(--cristal-sombra-flota)] h-[678px] sm:h-[674px] md:h-[754px]"
      aria-hidden="true"
    >
      <div className="tj-paper tj-paper-dense rounded-[2px] overflow-hidden h-full flex flex-col">
        {/* Barra de título: sigue la distribución de WindowChrome. */}
        <div className="tj-paper tj-paper-dense border-b border-[rgb(var(--divider)/0.1)] flex items-center justify-between h-11 sm:h-10 shrink-0">
          <div className="flex items-center px-3 min-w-0">
            <span className="w-4 h-4 rounded-[2px] bg-[rgb(var(--divider)/0.1)] shrink-0" />
            <Skeleton className="h-3 w-28 ml-2 hidden sm:block" />
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-2">
            <Skeleton className="h-5 w-24 rounded-[2px]" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="flex items-stretch h-full">
            <div className="hidden sm:flex items-center gap-1.5 px-3">
              <Skeleton className="h-2 w-2 rounded-[1px]" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="w-11 sm:w-[46px] h-full flex items-center justify-center">
              <Skeleton className="h-2.5 w-2.5" />
            </div>
            <div className="w-11 sm:w-[46px] h-full flex items-center justify-center">
              <Skeleton className="h-2.5 w-2.5" />
            </div>
            <div className="w-11 sm:w-[46px] h-full flex items-center justify-center">
              <Skeleton className="h-2.5 w-2.5" />
            </div>
          </div>
        </div>

        {/* Pestañas: las cuatro páginas que muestra el TopNav. */}
        <div className="tj-paper tj-paper-dense border-b border-[rgb(var(--divider)/0.1)] grid grid-cols-[auto_minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch h-[46px] shrink-0">
          <div aria-hidden="true" />
          <div className="flex items-center gap-0.5 sm:gap-1 px-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`h-9 px-3 sm:px-4 rounded-[2px] flex items-center gap-2 ${
                  i === 0 ? "bg-[rgb(var(--divider)/0.05)] border border-[rgb(var(--divider)/0.1)]" : ""
                }`}
              >
                <Skeleton className="h-3.5 w-3.5 rounded-[2px]" />
                <Skeleton className="h-3 w-14 hidden sm:block" />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-0.5 pr-1.5 sm:pr-2">
            <Skeleton className="h-8 w-8 rounded-[2px] hidden sm:block" />
            <Skeleton className="h-8 w-8 rounded-[2px]" />
            <Skeleton className="h-8 w-9 rounded-[2px]" />
          </div>
        </div>

        <div className="relative overflow-hidden h-[560px] md:h-[640px] p-5 md:p-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-[2px] border border-[rgb(var(--divider)/0.1)] bg-[rgb(var(--divider)/0.03)] p-4 space-y-2"
              >
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-2 w-20 opacity-70" />
              </div>
            ))}
          </div>
          <div className="rounded-[2px] border border-[rgb(var(--divider)/0.1)] bg-[rgb(var(--divider)/0.03)] p-4 h-[180px] md:h-[220px] flex items-end gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton
                key={i}
                className="flex-1 rounded-[2px]"
                style={{ height: `${30 + ((i * 37) % 60)}%` }}
              />
            ))}
          </div>
          <div className="rounded-[2px] border border-[rgb(var(--divider)/0.1)] bg-[rgb(var(--divider)/0.03)] p-4 space-y-2">
            <div className="flex gap-4 pb-2 border-b border-[rgb(var(--divider)/0.05)]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-2.5 flex-1 max-w-[80px]" />
              ))}
            </div>
            {Array.from({ length: 4 }).map((_, r) => (
              <div key={r} className="flex gap-4">
                {Array.from({ length: 5 }).map((_, c) => (
                  <Skeleton key={c} className="h-3 flex-1 max-w-[80px]" />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="tj-paper tj-paper-dense border-t border-[rgb(var(--divider)/0.1)] flex items-center justify-between px-3 sm:px-4 h-7 shrink-0 mt-auto">
          <Skeleton className="h-2.5 w-32" />
          <Skeleton className="h-2.5 w-40 hidden sm:block" />
          <Skeleton className="h-2.5 w-16" />
        </div>

        {/* Filos de luz superior e inferior, para que la hidratación no parpadee. */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 right-0 h-px bg-gradient-to-b from-[rgb(var(--divider)/0.18)] to-transparent pointer-events-none z-10"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-t from-[rgb(var(--divider)/0.07)] to-transparent pointer-events-none z-10"
        />
      </div>
    </div>
  );
}

export function AppDemoClient({ hideHeader = false }: { hideHeader?: boolean } = {}) {
  useEffect(() => {
    trackEvent("demo_viewed");
  }, []);
  return <AppDemo hideHeader={hideHeader} />;
}
