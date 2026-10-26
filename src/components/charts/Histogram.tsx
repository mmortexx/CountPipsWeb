"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";

interface HistogramProps {
  data: { x: number | string; count: number }[];
  height?: number;
  colorize?: "pos-neg" | "accent";
  className?: string;
  formatX?: (x: number | string) => string;
}

const HUECO_BARRAS = 4; // `gap-1` de la fila de barras
const AIRE_ROTULOS = 8;

/**
 * Cada cuántas columnas se pinta un rótulo del eje para que entre dos visibles
 * queden al menos 8 px. Los del centro van centrados en su columna; el primero
 * y el último, anclados a su canto, piden algo más de sitio a su vecino.
 */
export function saltoRotulos(n: number, anchoFila: number, rotuloMax: number): number {
  if (n < 2 || anchoFila <= 0 || rotuloMax <= 0) return 1;
  const paso = (anchoFila - HUECO_BARRAS * (n - 1)) / n + HUECO_BARRAS;
  const centrados = Math.ceil((rotuloMax + AIRE_ROTULOS) / paso);
  const juntoAlCanto = Math.ceil((1.5 * rotuloMax + AIRE_ROTULOS + HUECO_BARRAS / 2) / paso - 0.5);
  return Math.max(1, centrados, juntoAlCanto);
}

/** El primero y el último se pintan siempre: el eje dice dónde empieza y acaba. */
export function rotuloCallado(i: number, n: number, salto: number): boolean {
  if (i === 0 || i === n - 1) return false;
  return i % salto !== 0 || n - 1 - i < salto;
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

  /* Truncar los rótulos los dejaría ilegibles: se callan los que no caben. Con
     la fila medida, el salto sale de su ancho y del rótulo más largo
     (`saltoRotulos`); antes de medir (lo que pinta el servidor), uno de cada dos
     o de cada cuatro según los caracteres, solo por debajo de `sm`. */
  const denso = data.length > 8;
  const largoMax = useMemo(
    () => Math.max(...data.map((d) => formatX(d.x).length), 0),
    [data, formatX]
  );
  const filaRef = useRef<HTMLDivElement>(null);
  const [medida, setMedida] = useState<{ ancho: number; rotulo: number } | null>(null);
  useEffect(() => {
    const fila = filaRef.current;
    if (!fila || typeof ResizeObserver === "undefined") return;
    const medir = () => {
      let rotulo = 0;
      for (const r of fila.querySelectorAll("[data-rotulo]")) {
        const rango = document.createRange();
        rango.selectNodeContents(r);
        rotulo = Math.max(rotulo, rango.getBoundingClientRect().width);
      }
      const ancho = fila.clientWidth;
      if (ancho > 0 && rotulo > 0)
        setMedida((m) => (m && Math.abs(m.ancho - ancho) < 0.5 && Math.abs(m.rotulo - rotulo) < 0.5 ? m : { ancho, rotulo }));
    };
    const ro = new ResizeObserver(medir);
    ro.observe(fila);
    document.fonts?.ready.then(medir);
    return () => ro.disconnect();
  }, [data, largoMax, lang]);
  const salto = medida ? saltoRotulos(data.length, medida.ancho, medida.rotulo) : denso ? (largoMax > 6 ? 4 : 2) : 1;
  const callado = (i: number) =>
    medida ? rotuloCallado(i, data.length, salto) : salto > 1 && i % salto !== 0 && i !== data.length - 1;

  const containerRef = useRef<HTMLDivElement>(null);
  // Barra señalada: índice y punto de anclaje (px, relativo al contenedor).
  const [hovered, setHovered] = useState<{ i: number; x: number; y: number } | null>(null);

  return (
    <div
      data-entra
      className={`tj-realce relative tj-paper rounded-[4px] border border-[rgb(var(--divider)/0.13)] px-2 pt-2 pb-1 ${className}`}
      ref={containerRef}
      role="img"
      aria-label={lang === "es"
        ? `Histograma con ${data.length} categorías`
        : `Histogram with ${data.length} categories`}
      style={{ transformOrigin: "center" }}
    >
      <div ref={filaRef} className="flex items-end gap-1" style={{ height }}>
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
                data-rotulo
                className={`mt-1 whitespace-nowrap text-[11px] tnum text-tertiary ${
                  i === 0
                    ? "w-max self-start"
                    : i === data.length - 1
                      ? "w-max self-end"
                      : "w-full text-center"
                } ${
                  // Invisible y no fuera del flujo: sin su renglón, la barra bajaba
                  // hasta el fondo y cruzaba los rótulos de las vecinas.
                  callado(i) ? (medida ? "invisible" : "invisible sm:visible") : ""
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
          <div className="text-tertiary text-[11px]">
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
