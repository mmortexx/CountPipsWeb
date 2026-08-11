"use client";

import { memo, useMemo, useRef, useState } from "react";
import type { Trade } from "@/lib/trading/data";
import { heatmap, WEEKDAYS_SHORT } from "@/lib/trading/data";
import { useLang } from "@/lib/i18n";
import { fmtMoney } from "@/lib/trading/format";
interface HeatmapProps {
  trades: Trade[];
  className?: string;
}

const HOUR_LABELS = ["00–04", "04–08", "08–12", "12–16", "16–20", "20–24"];

/** Day × hour P&L heatmap. Green = positive, red = negative, intensity by magnitude. */
export const Heatmap = memo(function Heatmap({ trades, className = "" }: HeatmapProps) {
  const { lang } = useLang();
  const grid = useMemo(() => heatmap(trades), [trades]);

  // Trade counts per cell — matches the heatmap bucketing (Mon–Fri, 4-hour columns).
  const countGrid = useMemo(() => {
    const out = Array.from({ length: 5 }, () => Array(6).fill(0));
    for (const t of trades) {
      /* En UTC, igual que `heatmap()`: si las dos rejillas se contaran en
         husos distintos, el número de operaciones de una celda no sería
         el de la cifra que esa misma celda enseña. */
      const d = t.closedAt.getUTCDay();
      if (d === 0 || d === 6) continue;
      const row = d - 1;
      const col = Math.min(5, Math.floor(t.closedAt.getUTCHours() / 4));
      out[row][col] += 1;
    }
    return out;
  }, [trades]);

  const maxAbs = useMemo(() => {
    let m = 0;
    for (const row of grid) for (const v of row) m = Math.max(m, Math.abs(v));
    return m || 1;
  }, [grid]);

  const containerRef = useRef<HTMLDivElement>(null);
  // Hovered cell: grid coords + anchor point (px, relative to container).
  const [hovered, setHovered] = useState<{ r: number; c: number; x: number; y: number } | null>(null);

  return (
    <div
      data-entra
      className={`tj-realce relative tj-paper rounded-[2px] border border-[rgb(var(--divider)/0.13)] ${className}`}
      ref={containerRef}
      role="img"
      aria-label={lang === "es"
        ? "Mapa de calor de rentabilidad por día de la semana y franja horaria"
        : "Heatmap of profitability by weekday and time band"}
      style={{ transformOrigin: "center" }}
    >
      <div className="flex gap-1.5">
        {/* Day labels */}
        <div className="flex flex-col gap-1 justify-around pr-1">
          {WEEKDAYS_SHORT.map((d) => (
            <div key={d} className="text-[10px] text-tertiary font-medium h-8 flex items-center">{d}</div>
          ))}
        </div>
        {/* Grid */}
        <div className="flex-1 grid grid-rows-5 gap-1">
          {grid.map((row, r) => (
            <div key={r} className="grid grid-cols-6 gap-1">
              {row.map((v, c) => {
                const intensity = Math.abs(v) / maxAbs;
                const pos = v >= 0;
                // Tope a 0,30 de pico (antes 0,72). La cifra de la celda es
                // texto de 9px — pide 4,5:1, no 3:1 — y en el peor de los
                // cuatro casos (tinta sobre positivo, tema oscuro) el tinte
                // deja de bastar a partir de 0,33. Medido con el fondo real
                // de la tarjeta, en los dos temas y las dos direcciones.
                const bg = v === 0
                  ? "rgb(var(--divider) / 0.04)"
                  : pos
                  ? `rgb(var(--pnl-pos) / ${0.12 + intensity * 0.18})`
                  : `rgb(var(--pnl-neg) / ${0.12 + intensity * 0.18})`;
                return (
                  <div
                    data-entra="sello"
                    key={c}
                    className="tj-realce h-8 rounded-sm flex items-center justify-center text-[9.5px] font-semibold tnum cursor-default relative overflow-hidden group"
                    style={{ backgroundColor: bg }}
                    onMouseEnter={(e) => {
                      const cell = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      const cont = containerRef.current?.getBoundingClientRect();
                      if (!cont) return;
                      setHovered({
                        r,
                        c,
                        x: cell.left - cont.left + cell.width / 2,
                        y: cell.top - cont.top,
                      });
                    }}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {intensity > 0.4 && (
                      // Tinta del sistema, no el color de ganancia/pérdida: la
                      // celda ya está teñida con ese mismo color, así que
                      // escribir en él es tinta sobre su propio tinte. El
                      // filtro `brightness` que había antes lo intentaba
                      // arreglar sin tocar el color y se quedaba corto en
                      // celdas intensas (hasta 1,87:1). El resultado ya lo
                      // dicen el tinte y la posición de la celda; la cifra
                      // sólo tiene que leerse.
                      <span className="relative z-10 text-primary">
                        {v >= 0 ? "+" : "−"}{Math.abs(v) >= 1000 ? `${(Math.abs(v) / 1000).toFixed(1)}k` : Math.round(Math.abs(v))}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {/* Hour labels */}
      <div className="flex gap-1 mt-1 ml-7">
        {HOUR_LABELS.map((h) => (
          <div key={h} className="flex-1 text-[9.5px] text-tertiary text-center">{h}</div>
        ))}
      </div>

      {/* Tooltip flotante sobre papel denso — day · hour, P&L, trade count */}
      {hovered && (
        <div
          className="absolute pointer-events-none tj-paper tj-paper-dense rounded-[2px] border border-[rgb(var(--divider)/0.16)] px-3 py-2 text-xs whitespace-nowrap z-10"
          style={{
            left: `clamp(92px, ${hovered.x}px, calc(100% - 92px))`,
            top: hovered.y - 6,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="text-tertiary text-[10px]">
            {WEEKDAYS_SHORT[hovered.r]} · {HOUR_LABELS[hovered.c]}
          </div>
          <div
            className={`font-semibold tnum mt-0.5 ${
              grid[hovered.r][hovered.c] >= 0 ? "text-pnl-pos" : "text-pnl-neg"
            }`}
          >
            {fmtMoney(grid[hovered.r][hovered.c], lang, { sign: true, decimals: 0 })}
          </div>
          {countGrid[hovered.r][hovered.c] > 0 && (
            <div className="text-tertiary text-[10px] mt-0.5 tnum">
              {countGrid[hovered.r][hovered.c]} {lang === "es" ? "ops" : "trades"}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
