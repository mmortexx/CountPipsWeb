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
     `sm`: de ahi para arriba caben todos.

     Y uno de cada dos no siempre basta. Con nueve barras en 237 px —el
     ancho del panel de la demo a 390— cinco rotulos de «431 US$» suman
     176 px y se quedan a 4 px unos de otros, que se lee como un solo
     renglon corrido. El salto se decide por lo LARGO que sea el rotulo
     mas largo, que es el dato que gobierna si caben: hasta seis
     caracteres, uno de cada dos; por encima, uno de cada cuatro. El
     ultimo se pinta siempre, porque un eje sin su extremo derecho no
     dice donde acaba. */
  const denso = data.length > 8;
  const largoMax = useMemo(
    () => Math.max(...data.map((d) => formatX(d.x).length), 0),
    [data, formatX]
  );
  const salto = denso ? (largoMax > 6 ? 4 : 2) : 1;

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
              {/* ── LOS DOS EXTREMOS SE ALINEAN CON SU CANTO ──────────
                  El rótulo va centrado en una columna que a 390 px mide
                  23 px, y «431 US$» pide 36: sobra por los dos lados. En
                  las columnas de en medio eso no importa —el vecino está
                  oculto y el hueco está libre—, pero en la ÚLTIMA la
                  sobra cae fuera de la tarjeta, que lleva
                  `overflow-hidden`, y la cifra se corta contra el canto.
                  Medido en el histograma de P&L de la Analítica de la
                  demo a 390 px: 13 px de «431 US$» por fuera del borde
                  derecho. Y `text-align` no basta: cuando el texto es MÁS
                  ancho que su caja, la línea arranca igual en el canto
                  izquierdo y la sobra sigue saliendo por la derecha
                  (medido: los mismos 13 px). Los dos extremos pasan a
                  caja del tamaño de su contenido, anclada a su propio
                  lado, que es como se rotula cualquier eje: la sobra se
                  va hacia dentro, donde hay sitio. */}
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
