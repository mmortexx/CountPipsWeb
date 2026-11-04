"use client";

import { memo, useMemo, useRef, useState } from "react";
import type { Trade } from "@/lib/trading/data";
import { heatmap, WEEKDAYS_SHORT } from "@/lib/trading/data";
import { useLang } from "@/lib/i18n";
import type { Lang } from "@/lib/locale";
import { fmtCifraCorta, fmtInt, fmtMoney, LOCALE_FECHA } from "@/lib/trading/format";

interface HeatmapProps {
  trades: Trade[];
  className?: string;
}

const HOUR_LABELS = ["00–04", "04–08", "08–12", "12–16", "16–20", "20–24"];

/** Lo que dice el mapa a quien no lo ve: su mejor y su peor franja, entre las que tienen operaciones. */
function rotuloMapa(grid: number[][], cuenta: number[][], lang: Lang): string {
  const es = lang === "es";
  const titulo = es
    ? "Mapa de calor de rentabilidad por día de la semana y franja horaria"
    : "Heatmap of profitability by weekday and time band";
  // El 1 de enero de 2024 fue lunes: la fila r es el día 1 + r.
  const dia = (r: number) =>
    new Intl.DateTimeFormat(LOCALE_FECHA[lang], { weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 1 + r)));
  const franja = (r: number, c: number) => `${dia(r)} ${HOUR_LABELS[c]}, ${fmtMoney(grid[r][c], lang, { sign: true, decimals: 0 })}`;

  let mejor: [number, number] | null = null;
  let peor: [number, number] | null = null;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (cuenta[r][c] === 0) continue;
      if (!mejor || grid[r][c] > grid[mejor[0]][mejor[1]]) mejor = [r, c];
      if (!peor || grid[r][c] < grid[peor[0]][peor[1]]) peor = [r, c];
    }
  }
  if (!mejor || !peor) return `${titulo}. ${es ? "Sin operaciones." : "No trades."}`;
  if (mejor[0] === peor[0] && mejor[1] === peor[1]) {
    return `${titulo}. ${es ? "Solo hay operaciones en" : "Trades only in"} ${franja(...mejor)}.`;
  }
  return es
    ? `${titulo}. Mejor franja: ${franja(...mejor)}. Peor franja: ${franja(...peor)}.`
    : `${titulo}. Best band: ${franja(...mejor)}. Worst band: ${franja(...peor)}.`;
}

/** Mapa de calor de P&L por día y franja horaria: verde positivo, rojo negativo, intensidad por magnitud. */
export const Heatmap = memo(function Heatmap({ trades, className = "" }: HeatmapProps) {
  const { lang } = useLang();
  const grid = useMemo(() => heatmap(trades), [trades]);

  // Operaciones por celda, con la misma partición que el mapa (lun–vie, franjas de 4 h).
  const countGrid = useMemo(() => {
    const out = Array.from({ length: 5 }, () => Array(6).fill(0));
    for (const t of trades) {
      /* En UTC, como `heatmap()`: con husos distintos el recuento de una celda
         no sería el de su cifra. */
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

  const rotulo = useMemo(() => rotuloMapa(grid, countGrid, lang), [grid, countGrid, lang]);

  const containerRef = useRef<HTMLDivElement>(null);
  // Celda señalada: coordenadas y punto de anclaje (px, relativo al contenedor).
  const [hovered, setHovered] = useState<{ r: number; c: number; x: number; y: number } | null>(null);

  return (
    <div
      data-entra
      className={`tj-realce relative tj-paper rounded-[4px] border border-[rgb(var(--divider)/0.13)] ${className}`}
      ref={containerRef}
      role="img"
      aria-label={rotulo}
      style={{ transformOrigin: "center" }}
    >
      <div className="flex gap-1.5">
        <div className="flex flex-col gap-1 justify-around pr-1">
          {WEEKDAYS_SHORT.map((d) => (
            <div key={d} className="text-[11px] text-tertiary font-medium h-8 flex items-center">{d}</div>
          ))}
        </div>
        <div className="flex-1 grid grid-rows-5 gap-1">
          {grid.map((row, r) => (
            <div key={r} className="grid grid-cols-6 gap-1">
              {row.map((v, c) => {
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
            <div className="text-tertiary text-[11px] mt-0.5 tnum">
              {fmtInt(countGrid[hovered.r][hovered.c], lang)} {lang === "es" ? "ops" : "trades"}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
