"use client";

import { memo, useMemo, useRef, useState } from "react";
import type { Trade } from "@/lib/trading/data";
import { dailyPnlForMonth } from "@/lib/trading/data";
import { useLang } from "@/lib/i18n";
import { fmtMoney } from "@/lib/trading/format";

interface MiniCalendarProps {
  trades: Trade[];
  className?: string;
}

const WEEKDAY_HEADERS_ES = ["L", "M", "X", "J", "V", "S", "D"];
const WEEKDAY_HEADERS_EN = ["M", "T", "W", "T", "F", "S", "S"];
const MONTHS_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** P&L calendar for the most recent active month. */
export const MiniCalendar = memo(function MiniCalendar({ trades, className = "" }: MiniCalendarProps) {
  const { lang } = useLang();
  const [offset, setOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  // Hovered day: day-of-month + anchor point (px, relative to container).
  const [hovered, setHovered] = useState<{ day: number; x: number; y: number } | null>(null);

  const { year, month, days, dailyPnl, maxAbs } = useMemo(() => {
    // Find the most recent month with trades
    if (!trades.length) return { year: 2026, month: 6, days: 30, dailyPnl: new Map(), maxAbs: 1 };
    const sorted = [...trades].sort((a, b) => b.closedAt.getTime() - a.closedAt.getTime());
    const latest = sorted[0].closedAt;
    /* Todo el calendario se calcula en UTC, que es el huso en el que
       `data.ts` fecha las operaciones. Mezclarlo con la hora local movía
       el mes de arranque —y con él la rejilla entera— según desde dónde
       se mirara la página. */
    const targetMonth = new Date(
      Date.UTC(latest.getUTCFullYear(), latest.getUTCMonth() + offset, 1)
    );
    const y = targetMonth.getUTCFullYear();
    const mo = targetMonth.getUTCMonth();
    const d = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
    const dp = dailyPnlForMonth(trades, y, mo);
    let ma = 0;
    dp.forEach((v) => { ma = Math.max(ma, Math.abs(v)); });
    return { year: y, month: mo, days: d, dailyPnl: dp, maxAbs: ma || 1 };
  }, [trades, offset]);

  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay(); // 0 Dom .. 6 Sáb
  // Convert Sunday=0 to Monday=0 based
  const leadingBlanks = (firstWeekday + 6) % 7;
  const monthName = lang === "es" ? MONTHS_ES[month] : MONTHS_EN[month];
  const weekdayHeaders = lang === "es" ? WEEKDAY_HEADERS_ES : WEEKDAY_HEADERS_EN;

  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthPnl = Array.from(dailyPnl.values()).reduce((s, v) => s + v, 0);

  return (
    <div
      data-entra
      className={`tj-realce relative tj-paper rounded-[2px] border border-[rgb(var(--divider)/0.13)] p-4 md:p-5 ${className}`}
      ref={containerRef}
      style={{ transformOrigin: "center" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="t-h4 text-primary">{monthName} {year}</div>
          <div className={`text-xs tnum mt-0.5 ${monthPnl >= 0 ? "text-pnl-pos" : "text-pnl-neg"}`}>
            {fmtMoney(monthPnl, lang, { sign: true, decimals: 0 })}
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setOffset((o) => o - 1)}
            className="w-11 h-11 sm:w-7 sm:h-7 rounded-[2px] flex items-center justify-center text-tertiary hover:text-primary hover:bg-[rgb(var(--divider)/0.08)] transition-colors"
            aria-label={lang === "es" ? "Mes anterior" : "Previous month"}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button
            onClick={() => setOffset((o) => o + 1)}
            className="w-11 h-11 sm:w-7 sm:h-7 rounded-[2px] flex items-center justify-center text-tertiary hover:text-primary hover:bg-[rgb(var(--divider)/0.08)] transition-colors"
            aria-label={lang === "es" ? "Mes siguiente" : "Next month"}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekdayHeaders.map((d, idx) => (
          <div key={`${d}-${idx}`} className="text-[9.5px] text-tertiary text-center font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const pnl = dailyPnl.get(String(day));
          const intensity = pnl !== undefined ? Math.abs(pnl) / maxAbs : 0;
          const pos = (pnl ?? 0) >= 0;
          const bg =
            pnl === undefined
              ? "transparent"
              : pos
              ? `rgb(var(--pnl-pos) / calc(0.08 + ${intensity} * var(--cal-tint-max, 0.5)))`
              : `rgb(var(--pnl-neg) / calc(0.08 + ${intensity} * var(--cal-tint-max, 0.5)))`;
          return (
            <div
              data-entra="sello"
              key={i}
              className="tj-realce aspect-square rounded-sm flex flex-col items-center justify-center text-[10px] tnum cursor-default relative group"
              style={{ backgroundColor: bg, border: pnl !== undefined ? "1px solid rgb(var(--divider) / 0.06)" : "1px solid transparent" }}
              onMouseEnter={(e) => {
                const cell = (e.currentTarget as HTMLElement).getBoundingClientRect();
                const cont = containerRef.current?.getBoundingClientRect();
                if (!cont) return;
                setHovered({
                  day: day as number,
                  x: cell.left - cont.left + cell.width / 2,
                  y: cell.top - cont.top,
                });
              }}
              onMouseLeave={() => setHovered(null)}
            >
              <span className={pnl !== undefined ? "cal-day-num" : "text-tertiary"}>{day}</span>
              {pnl !== undefined && intensity > 0.25 && (
                /* El importe va con la clase `cal-day-pnl`, no con el token
                   de P&L directamente. Motivo: en una celda TINTADA del
                   color del resultado, escribir el importe en ese MISMO
                   color es contraste imposible por construcción — verde
                   sobre verde. En oscuro funciona porque el verde del texto
                   es neón (#00F5A0) y el tinte es casi negro; en claro los
                   dos son el mismo #1E7A4C y el número caía a 2,2:1. La
                   clase deja el color del token en oscuro y pasa a texto
                   primario en claro, donde el signo lo sigue dando el fondo
                   de la celda (y el + / − escrito). */
                <span className="text-[9.5px] leading-none cal-day-pnl" data-neg={!pos}>
                  {pos ? "+" : "−"}{Math.abs(pnl) >= 1000 ? `${(Math.abs(pnl) / 1000).toFixed(1)}k` : Math.round(Math.abs(pnl))}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Tooltip flotante sobre papel denso above the day cell */}
      {hovered && (
        <div
          className="absolute pointer-events-none tj-paper tj-paper-dense rounded-[2px] border border-[rgb(var(--divider)/0.16)] px-3 py-2 text-xs whitespace-nowrap z-10"
          style={{
            left: `clamp(80px, ${hovered.x}px, calc(100% - 80px))`,
            top: hovered.y - 6,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="text-tertiary text-[10px]">
            {hovered.day} {monthName} {year}
          </div>
          {dailyPnl.get(String(hovered.day)) !== undefined ? (
            <div
              className={`font-semibold tnum mt-0.5 ${
                (dailyPnl.get(String(hovered.day)) ?? 0) >= 0 ? "text-pnl-pos" : "text-pnl-neg"
              }`}
            >
              {fmtMoney(dailyPnl.get(String(hovered.day)) ?? 0, lang, { sign: true })}
            </div>
          ) : (
            <div className="text-tertiary mt-0.5">
              {lang === "es" ? "Sin operaciones" : "No trades"}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
