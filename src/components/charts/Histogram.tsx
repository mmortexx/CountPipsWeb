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

/** Generic animated bar histogram. */
export const Histogram = memo(function Histogram({
  data,
  height = 140,
  colorize = "accent",
  className = "",
  formatX = (x) => String(x),
}: HistogramProps) {
  const { lang } = useLang();

  const maxCount = useMemo(() => Math.max(...data.map((d) => d.count), 1), [data]);

  /* ── CON MUCHAS BARRAS, UN ROTULO SI Y OTRO NO ─────────────────────
     El rotulo del eje llevaba `truncate`, asi que a 320 px —donde cada
     columna mide unos 20 px y «−1,5R» pide 29— se cortaban TODOS: el eje
     entero quedaba ilegible.

     Truncar reparte el dano entre todos; saltarse uno de cada dos lo
     concentra en la mitad y deja la otra mitad entera, que es como se
     comporta cualquier eje de verdad cuando no cabe. Solo por debajo de
     `sm`: de ahi para arriba caben todos. */
  const denso = data.length > 8;

  const containerRef = useRef<HTMLDivElement>(null);
  // Hovered bar: index + anchor point (px, relative to container).
  const [hovered, setHovered] = useState<{ i: number; x: number; y: number } | null>(null);

  return (
    <div
      data-entra
      className={`tj-realce relative tj-paper rounded-[2px] border border-[rgb(var(--divider)/0.13)] ${className}`}
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
              <div
                className={`mt-1 w-full whitespace-nowrap text-center text-[9.5px] tnum text-tertiary ${
                  denso && i % 2 === 1 ? "hidden sm:block" : ""
                }`}
              >
                {formatX(d.x)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tooltip flotante sobre papel denso — bucket range + count */}
      {hovered && data[hovered.i] && (
        <div
          className="absolute pointer-events-none tj-paper tj-paper-dense rounded-[2px] border border-[rgb(var(--divider)/0.16)] px-3 py-2 text-xs whitespace-nowrap z-10"
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
