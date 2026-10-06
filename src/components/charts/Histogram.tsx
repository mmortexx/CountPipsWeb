"use client";

import { memo, useMemo, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";

interface HistogramProps {
  data: { x: number | string; count: number }[];
  height?: number;
  colorize?: "pos-neg" | "accent";
  className?: string;
  formatX?: (x: number | string) => string;
}

/** Histograma de barras genérico y animado. */
export const Histogram = memo(function Histogram({
  data,
  height = 140,
  colorize = "accent",
  className = "",
  formatX = (x) => String(x),
}: HistogramProps) {
  const { lang } = useLang();

  const maxCount = useMemo(() => Math.max(...data.map((d) => d.count), 1), [data]);

  /* Con muchas barras, un rótulo sí y otro no (solo por debajo de `sm`): truncar
     todos los dejaría ilegibles. El salto depende del rótulo más largo: hasta
     seis caracteres, uno de cada dos; por encima, uno de cada cuatro. El último
     se pinta siempre para que el eje diga dónde acaba. */
  const denso = data.length > 8;
  const largoMax = useMemo(
    () => Math.max(...data.map((d) => formatX(d.x).length), 0),
    [data, formatX]
  );
  const salto = denso ? (largoMax > 6 ? 4 : 2) : 1;

  const containerRef = useRef<HTMLDivElement>(null);
  // Barra señalada: índice y punto de anclaje (px, relativo al contenedor).
  const [hovered, setHovered] = useState<{ i: number; x: number; y: number } | null>(null);

  return (
    <div
      data-entra
      className={`tj-realce relative tj-paper rounded-[4px] border border-[rgb(var(--divider)/0.13)] ${className}`}
      ref={containerRef}
      role="img"
      aria-label={lang === "es"
        ? `Histograma con ${data.length} categorías`
        : `Histogram with ${data.length} categories`}
      style={{ transformOrigin: "center" }}
    >
      <div className="flex items-end gap-1" style={{ height }}>
        {data.map((d, i) => {
          const h = (d.count / maxCount) * (height - 24);
          const isNeg = typeof d.x === "number" && d.x < 0;
          const color =
            colorize === "pos-neg"
              ? isNeg
                ? "rgb(var(--pnl-neg))"
                : "rgb(var(--pnl-pos))"
              : "rgb(var(--accent-base))";
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center justify-end h-full group relative"
              onMouseEnter={(e) => {
                const bar = (e.currentTarget as HTMLElement).getBoundingClientRect();
                const cont = containerRef.current?.getBoundingClientRect();
                if (!cont) return;
                setHovered({
                  i,
                  x: bar.left - cont.left + bar.width / 2,
                  y: bar.top - cont.top,
                });
              }}
              onMouseLeave={() => setHovered(null)}
            >
              <div
                data-entra="ciclo"
                className="w-full rounded-t-sm relative transition-opacity"
                style={{
                  height: Math.max(2, h),
                  transformOrigin: "bottom",
                  backgroundColor: color,
                  opacity: hovered && hovered.i === i ? 1 : 0.9,
                }}
              />
              {/* Los dos extremos se anclan a su canto con una caja del tamaño del
                  contenido (`w-max`): el rótulo centrado es más ancho que la
                  columna y en la última sobresale de la tarjeta (`overflow-hidden`);
                  `text-align` no lo arregla si el texto es más ancho que su caja. */}
              <div
                className={`mt-1 whitespace-nowrap text-[9.5px] tnum text-tertiary ${
                  i === 0
                    ? "w-max self-start"
                    : i === data.length - 1
                      ? "w-max self-end"
                      : "w-full text-center"
                } ${
                  salto > 1 && i % salto !== 0 && i !== data.length - 1
                    ? "hidden sm:block"
                    : ""
                }`}
              >
                {formatX(d.x)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tooltip: rango del tramo y recuento. */}
      {hovered && data[hovered.i] && (
        <div
          className="absolute pointer-events-none tj-paper tj-paper-dense rounded-[4px] border border-[rgb(var(--divider)/0.16)] px-3 py-2 text-xs whitespace-nowrap z-10"
          style={{
            left: `clamp(72px, ${hovered.x}px, calc(100% - 72px))`,
            top: hovered.y - 6,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="text-tertiary text-[10px]">
            {formatX(data[hovered.i].x)}
          </div>
          <div className="font-semibold tnum mt-0.5 text-primary">
            {data[hovered.i].count} {lang === "es" ? "ops" : "trades"}
          </div>
        </div>
      )}
    </div>
  );
});
