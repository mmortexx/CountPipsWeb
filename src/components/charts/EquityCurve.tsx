"use client";

import { memo, useMemo, useState, type CSSProperties } from "react";
import type { Metrics } from "@/lib/trading/data";
import { useLang } from "@/lib/i18n";

interface EquityCurveProps {
  metrics: Metrics;
  height?: number;
  showAxis?: boolean;
  showDrawdown?: boolean;
  className?: string;
}

/** SVG equity curve with drawdown shading, animated draw-in, hover tooltip. */
export const EquityCurve = memo(function EquityCurve({
  metrics,
  height = 220,
  showAxis = true,
  showDrawdown = true,
  className = "",
}: EquityCurveProps) {
  const { lang } = useLang();
  const { equityCurve, drawdownCeiling } = metrics;
  // Hover state: data index + pointer X (px) + rendered width & height (px)
  // for clamping the tooltip and converting viewBox Y → pixel Y. Both mouse
  // and touch handlers write into this state so the tooltip works on every
  // pointer modality (the SVG auto-scales via aspect-ratio, so we must track
  // the live rendered height to position the tooltip above the marker).
  const [hover, setHover] = useState<{
    idx: number;
    mx: number;
    width: number;
    height: number;
  } | null>(null);

  const W = 800;
  const H = height;
  const padL = showAxis ? 56 : 8;
  const padR = 12;
  const padT = 12;
  const padB = showAxis ? 24 : 8;

  const { linePath, areaPath, ddPath, points, minBal, maxBal } = useMemo(() => {
    if (!equityCurve.length) {
      return {
        linePath: "",
        areaPath: "",
        ddPath: "",
        points: [] as { x: number; y: number; date: Date; balance: number; perf: number; ceiling: number }[],
        minBal: 0,
        maxBal: 0,
      };
    }
    const balances = equityCurve.map((e) => e.balance);
    const minBal = Math.min(...balances);
    const maxBal = Math.max(...balances);
    const range = maxBal - minBal || 1;

    const pts = equityCurve.map((e, i) => {
      const x = padL + (i / (equityCurve.length - 1)) * (W - padL - padR);
      const y = padT + (1 - (e.balance - minBal) / range) * (H - padT - padB);
      return { x, y, ...e, ceiling: drawdownCeiling[i] };
    });

    const linePath = pts
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(" ");
    const areaPath = `${linePath} L${pts[pts.length - 1].x.toFixed(1)},${H - padB} L${pts[0].x.toFixed(1)},${H - padB} Z`;

    const ddPath = pts
      .map((p, i) => {
        const ceilY = padT + (1 - (p.ceiling - minBal) / range) * (H - padT - padB);
        return `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${ceilY.toFixed(1)} L${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join(" ");

    return { linePath, areaPath, ddPath, points: pts, minBal, maxBal };
  }, [equityCurve, drawdownCeiling, padL, padR, padT, padB, H]);

  if (!equityCurve.length) {
    return <div className={`text-tertiary text-sm ${className}`} style={{ height }}>Sin datos</div>;
  }

  /** Shared pointer→hover resolver used by both mousemove and touch handlers.
   * Converts a viewport-space clientX into the nearest data-point index and
   * records the rendered SVG rect so the tooltip can be positioned in pixels
   * (not viewBox units — the chart auto-scales to its container width). */
  const updateHover = (clientX: number, target: SVGElement) => {
    const rect = target.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const svgX = ((clientX - rect.left) / rect.width) * W;
    const idx = Math.round(((svgX - padL) / (W - padL - padR)) * (points.length - 1));
    if (idx >= 0 && idx < points.length) {
      setHover({ idx, mx: clientX - rect.left, width: rect.width, height: rect.height });
    }
  };

  const locale = lang === "es" ? "es-ES" : "en-US";
  const hoverPoint = hover && points[hover.idx];

  // Tooltip X follows the pointer, clamped so it never overflows left/right edges.
  // ~180px tooltip → 90px half-width kept clear of the edges.
  const TOOLTIP_HALF = 92;
  let tooltipLeft: number | null = null;
  let tooltipTop = 6;
  let tooltipTransform = "translateX(-50%)";
  if (hover && hoverPoint) {
    const w = hover.width || W;
    tooltipLeft = Math.max(TOOLTIP_HALF, Math.min(w - TOOLTIP_HALF, hover.mx));
    // The SVG auto-scales to its container via aspect-ratio, so the marker's
    // viewBox Y (0–H) must be multiplied by the live scale factor to get its
    // pixel position inside the rendered chart. Without this the tooltip would
    // drift away from the marker on any non-1:1 render (e.g. mobile).
    const markerYPx = hoverPoint.y * (hover.height / H);
    // Place the tooltip just above the marker dot; flip below if too close to the top.
    if (markerYPx < 92) {
      tooltipTop = markerYPx + 14;
      tooltipTransform = "translateX(-50%)";
    } else {
      tooltipTop = markerYPx - 10;
      tooltipTransform = "translate(-50%, -100%)";
    }
  }

  // Drawdown from the running peak at this point.
  const drawdown = hoverPoint ? hoverPoint.ceiling - hoverPoint.balance : 0;

  return (
    <div
      data-entra
      className={`tj-realce relative tj-paper rounded-[2px] border border-[rgb(var(--divider)/0.13)] ${className}`}
      style={{ transformOrigin: "center" }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto sm:h-[var(--eq-h)]"
        // Responsive sizing: on mobile (`h-auto`) the SVG derives its height
        // from the viewBox aspect ratio, so the chart fills the card width
        // with zero letterboxing (a 375px-wide card previously left ~140px
        // of empty space above/below because `height:240` + `meet` scaled
        // the chart down to ~100px and centered it). On sm+ we keep the
        // fixed `height` prop via `sm:h-[var(--eq-h)]` so the desktop grid
        // layout (where MiniCalendar uses `h-full` to match this card's
        // height) is preserved exactly. `touch-action: pan-y` lets the page
        // scroll vertically through the chart while letting us capture
        // horizontal touch-drags for tooltip scrubbing on mobile.
        style={{
          "--eq-h": `${height}px`,
          aspectRatio: `${W} / ${H}`,
          touchAction: "pan-y",
        } as CSSProperties}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={lang === "es"
          ? `Curva de capital desde $${Math.round(minBal).toLocaleString()} hasta $${Math.round(maxBal).toLocaleString()}`
          : `Equity curve from $${Math.round(minBal).toLocaleString()} to $${Math.round(maxBal).toLocaleString()}`}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => updateHover(e.clientX, e.currentTarget as SVGElement)}
        onTouchStart={(e) => {
          const t = e.touches[0];
          if (t) updateHover(t.clientX, e.currentTarget as SVGElement);
        }}
        onTouchMove={(e) => {
          const t = e.touches[0];
          if (t) updateHover(t.clientX, e.currentTarget as SVGElement);
        }}
        onTouchEnd={() => setHover(null)}
        onTouchCancel={() => setHover(null)}
      >
        <defs>
          <linearGradient id="eq-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--accent-base))" stopOpacity="0.15" />
            <stop offset="100%" stopColor="rgb(var(--accent-base))" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="eq-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgb(var(--accent-base))" />
            <stop offset="100%" stopColor="rgb(var(--accent-hover))" />
          </linearGradient>
        </defs>

        {/* Grid lines — always visible (decorative). */}
        {showAxis &&
          [0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = padT + t * (H - padT - padB);
            return (
              <line key={t} x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgb(var(--divider) / 0.06)" strokeWidth="1" />
            );
          })}

        {/* Y-axis labels — hidden on mobile. SVG <text> font-size is
            interpreted in user-units (viewBox 0 0 800 240), so text-[10px]
            renders at ~3.7px on a 295px-wide mobile card — unreadable.
            The chart itself stays; only the numeric Y-axis labels hide. */}
        {showAxis && (
          <g className="hidden sm:block">
            {[0, 0.25, 0.5, 0.75, 1].map((t) => {
              const y = padT + t * (H - padT - padB);
              const val = maxBal - t * (maxBal - minBal);
              return (
                <text key={t} x={padL - 8} y={y + 3} textAnchor="end" className="text-[10px] tnum" fill="rgb(var(--txt-tertiary))">
                  ${Math.round(val).toLocaleString()}
                </text>
              );
            })}
          </g>
        )}

        {/* Drawdown shading */}
        {showDrawdown && (
          <path d={ddPath} fill="rgb(var(--pnl-neg) / 0.10)" stroke="none" />
        )}

        {/* Area + line */}
        <path
          data-entra="5"
          d={areaPath}
          fill="url(#eq-area)"
        />
        <path
          data-entra
          d={linePath}
          fill="none"
          stroke="url(#eq-line)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Hover crosshair + pulsing marker */}
        {hoverPoint && (
          <g>
            {/* Vertical crosshair */}
            <line
              x1={hoverPoint.x}
              y1={padT}
              x2={hoverPoint.x}
              y2={H - padB}
              stroke="rgb(var(--accent-base))"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.4"
            />
            {/* Horizontal crosshair at the hover point */}
            <line
              x1={padL}
              y1={hoverPoint.y}
              x2={W - padR}
              y2={hoverPoint.y}
              stroke="rgb(var(--accent-base))"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.4"
            />
            {/* Hover indicator dot — static (no infinite ping). */}
            <circle
              cx={hoverPoint.x}
              cy={hoverPoint.y}
              r="6"
              fill="none"
              stroke="rgb(var(--accent-base))"
              strokeWidth="1"
              opacity="0.4"
            />
            {/* Inner solid dot */}
            <circle
              cx={hoverPoint.x}
              cy={hoverPoint.y}
              r="4"
              fill="rgb(var(--accent-base))"
              stroke="rgb(var(--txt-primary))"
              strokeWidth="1.5"
            />
          </g>
        )}
      </svg>

      {/* Tooltip de detalle sobre papel denso — date, balance, P&L since start, drawdown from peak */}
      {hoverPoint && tooltipLeft !== null && (
        <div
          className="absolute pointer-events-none tj-paper tj-paper-dense rounded-[2px] border border-[rgb(var(--divider)/0.16)] px-3 py-2 text-xs whitespace-nowrap z-10"
          style={{
            left: tooltipLeft,
            top: tooltipTop,
            transform: tooltipTransform,
          }}
        >
          <div className="text-tertiary text-[10px]">
            {/* `timeZone: "UTC"` — la operación está fechada en UTC (ver
                la cabecera de `data.ts`). Sin fijarlo, quien mira desde
                América vería en el globo un día y en la etiqueta el
                anterior, para el mismo punto de la curva. */}
            {hoverPoint.date.toLocaleDateString(locale, {
              day: "2-digit",
              month: "short",
              year: "numeric",
              timeZone: "UTC",
            })}
          </div>
          <div className="font-semibold tnum text-primary text-[13px] mt-0.5">
            ${hoverPoint.balance.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="flex items-center justify-between gap-3 mt-1 text-[11px]">
            <span className="text-tertiary">{lang === "es" ? "Desde inicio" : "Since start"}</span>
            <span className={`tnum font-medium ${hoverPoint.perf >= 0 ? "text-pnl-pos" : "text-pnl-neg"}`}>
              {hoverPoint.perf >= 0 ? "+" : "−"}${Math.abs(hoverPoint.perf).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-[11px]">
            <span className="text-tertiary">{lang === "es" ? "Desde pico" : "From peak"}</span>
            <span className={`tnum font-medium ${drawdown > 0 ? "text-pnl-neg" : "text-tertiary"}`}>
              {drawdown > 0
                ? `−${drawdown.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                : "0"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});
