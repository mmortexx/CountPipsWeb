"use client";

import { memo, useMemo, useRef, useState } from "react";
import type { Trade } from "@/lib/trading/data";
import { diasCortos, filaDeDia, heatmap } from "@/lib/trading/data";
import { useLang } from "@/lib/i18n";
import { fmtCifraCorta, fmtInt, fmtMoney } from "@/lib/trading/format";
interface HeatmapProps {
  trades: Trade[];
  className?: string;
}

const HOUR_LABELS = ["00–04", "04–08", "08–12", "12–16", "16–20", "20–24"];

/** Mapa de calor de P&L por día y franja horaria: verde positivo, rojo negativo, intensidad por magnitud. */
export const Heatmap = memo(function Heatmap({ trades, className = "" }: HeatmapProps) {
  const { lang } = useLang();
  const grid = useMemo(() => heatmap(trades), [trades]);

  // Operaciones por celda, con la misma partición que el mapa. En UTC, como
  // `heatmap()`: con husos distintos el recuento de una celda no sería el de su cifra.
  const countGrid = useMemo(() => {
    const out: number[][] = Array.from({ length: 7 }, () => Array(6).fill(0));
    for (const t of trades) out[filaDeDia(t.closedAt)][Math.floor(t.closedAt.getUTCHours() / 4)] += 1;
    return out;
  }, [trades]);

  // Sábado y domingo solo aparecen si se operó en ellos (cripto): un mercado que cierra no necesita dos filas vacías.
  const filas = useMemo(
    () => [0, 1, 2, 3, 4, 5, 6].filter((d) => d < 5 || countGrid[d].some((n) => n > 0)),
    [countGrid]
  );
  const dias = diasCortos(lang);

  const maxAbs = useMemo(() => {
    let m = 0;
    for (const row of grid) for (const v of row) m = Math.max(m, Math.abs(v));
    return m || 1;
  }, [grid]);

  const containerRef = useRef<HTMLDivElement>(null);
  // Celda señalada: coordenadas y punto de anclaje (px, relativo al contenedor).
  const [hovered, setHovered] = useState<{ r: number; c: number; x: number; y: number } | null>(null);

  return (
    <div
      data-entra
      className={`tj-realce relative tj-paper rounded-[4px] border border-[rgb(var(--divider)/0.13)] ${className}`}
      ref={containerRef}
      role="img"
      aria-label={lang === "es"
        ? "Mapa de calor de rentabilidad por día de la semana y franja horaria"
        : "Heatmap of profitability by weekday and time band"}
      style={{ transformOrigin: "center" }}
    >
      <div className="flex gap-1.5">
        <div className="flex flex-col gap-1 justify-around pr-1">
          {filas.map((d) => (
            <div key={d} className="text-[11px] text-tertiary font-medium h-8 flex items-center">{dias[d]}</div>
          ))}
        </div>
        <div className="flex-1 grid gap-1">
          {filas.map((r) => (
            <div key={r} className="grid grid-cols-6 gap-1">
              {grid[r].map((v, c) => {
                const intensity = Math.abs(v) / maxAbs;
                const pos = v >= 0;
                // Tinte con tope de 0,30: la cifra es texto de 9 px (pide 4,5:1) y
                // en el peor caso (tinta sobre positivo, tema oscuro) el tinte
                // deja de bastar a partir de 0,33.
                const bg = v === 0
                  ? "rgb(var(--divider) / 0.04)"
                  : pos
                  ? `rgb(var(--pnl-pos) / ${0.12 + intensity * 0.18})`
                  : `rgb(var(--pnl-neg) / ${0.12 + intensity * 0.18})`;
                return (
                  <div
                    data-entra="sello"
                    key={c}
                    className="tj-realce h-8 rounded-[4px] flex items-center justify-center text-[11px] font-semibold tnum cursor-default relative overflow-hidden group"
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
                      // Tinta del sistema, no el color de ganancia/pérdida: la celda
                      // ya está teñida con él y el texto no contrastaría.
                      <span className="relative z-10 text-primary">
                        {fmtCifraCorta(v, lang)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-1 mt-1 ml-7">
        {HOUR_LABELS.map((h) => (
          <div key={h} className="flex-1 text-[11px] text-tertiary text-center">{h}</div>
        ))}
      </div>

      {/* Tooltip: día y franja, P&L y recuento. */}
      {hovered && (
        <div
          className="absolute pointer-events-none tj-paper tj-paper-dense rounded-[4px] border border-[rgb(var(--divider)/0.16)] px-3 py-2 text-xs whitespace-nowrap z-10"
          style={{
            left: `clamp(92px, ${hovered.x}px, calc(100% - 92px))`,
            top: hovered.y - 6,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="text-tertiary text-[11px]">
            {dias[hovered.r]} · {HOUR_LABELS[hovered.c]}
          </div>
          <div
            className={`font-semibold tnum mt-0.5 ${
              grid[hovered.r][hovered.c] >= 0 ? "text-pnl-pos" : "text-pnl-neg"
            }`}
          >
            {fmtMoney(grid[hovered.r][hovered.c], lang, { sign: true, decimals: 0 })}
          </div>
          {countGrid[hovered.r][hovered.c] > 0 && (
            <div className="text-tertiary text-[11px] mt-0.5 tnum">
              {fmtInt(countGrid[hovered.r][hovered.c], lang)} {lang === "es" ? "ops" : "trades"}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
